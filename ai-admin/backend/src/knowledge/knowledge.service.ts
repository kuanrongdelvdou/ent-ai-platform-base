import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { RagflowApiService } from './ragflow-api.service';
import {
  CreateKnowledgeBaseDto,
  DocumentListDto,
  IngestionLogsDto,
  KnowledgeBaseListDto,
  SearchDto,
  UpdateDocumentDto,
  UpdateDocumentStatusDto,
  UpdateKnowledgeBaseDto,
} from './dto/knowledge.dto';
import { AiHubService } from './ai-hub.service';
import { KnowledgeAccessService } from './knowledge-access.service';

type CurrentUserRef = { userId: string };

@Injectable()
export class KnowledgeService {
  private readonly log = new AppLoggerService('KnowledgeService');

  constructor(
    private prisma: PrismaService,
    private ragflow: RagflowApiService,
    private access: KnowledgeAccessService,
    private aiHub: AiHubService,
  ) {}

  async getList(params: KnowledgeBaseListDto & { userId?: string }) {
    this.log.debug('查询知识库列表', params);
    const current = params.current ?? 1;
    const size = params.size ?? 10;
    const where: Record<string, any> = {};

    if (params.name) where.name = { contains: params.name };
    if (params.status) where.status = Number(params.status);
    if (params.deptId) where.deptId = params.deptId;

    if (params.userId) {
      Object.assign(where, await this.access.buildAccessibleKnowledgeBaseWhere(params.userId));
    }

    const [total, list] = await Promise.all([
      this.prisma.knowledgeBase.count({ where }),
      this.prisma.knowledgeBase.findMany({
        where,
        skip: (current - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: { knowledgeBaseRoles: { include: { role: true } } },
      }),
    ]);

    return {
      current,
      size,
      total,
      records: list.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        datasetId: item.datasetId,
        deptId: (item as any).deptId,
        ownerId: (item as any).ownerId,
        visibility: (item as any).visibility,
        embeddingModelId: (item as any).embeddingModelId,
        parseType: (item as any).parseType,
        chunkMethod: item.chunkMethod,
        pipelineId: (item as any).pipelineId,
        parserConfig: item.parserConfig,
        status: String(item.status),
        roleIds: item.knowledgeBaseRoles.map((role) => role.roleId),
        roles: item.knowledgeBaseRoles.map((role) => ({
          id: role.role.id,
          roleName: role.role.name,
          roleCode: role.role.code,
        })),
        createTime: item.createdAt.toISOString(),
        updateTime: item.updatedAt.toISOString(),
      })),
    };
  }

  async getDataPipelines() {
    const result = await this.ragflow.listDataPipelines<{
      canvas?: Array<{ id?: string; title?: string; name?: string }>;
      total?: number;
    }>();
    if (!result.success) {
      throw new BadRequestException(`获取 RAGFlow pipeline 失败：${result.error || '未知错误'}`);
    }

    return (result.data?.canvas ?? []).map((item) => ({
      id: item.id,
      name: item.title ?? item.name ?? item.id,
    })).filter((item) => item.id);
  }

  async create(dto: CreateKnowledgeBaseDto, user: CurrentUserRef) {
    this.log.info('创建知识库', { name: dto.name, userId: user.userId, deptId: dto.deptId });
    const readiness = await this.aiHub.assertReady();
    const parseType = dto.parseType ?? 1;
    const embeddingModel = dto.embeddingModel ?? readiness.defaultModels.embedding?.id;

    if (!embeddingModel) {
      throw new BadRequestException('创建知识库失败：请选择嵌入模型');
    }
    if (parseType === 1 && !dto.chunkMethod) {
      throw new BadRequestException('创建知识库失败：请选择内置分块方法');
    }
    if (parseType === 2 && !dto.pipelineId) {
      throw new BadRequestException('创建知识库失败：请选择 pipeline');
    }

    const ragflowResult = await this.ragflow.createDataset({
      name: dto.name,
      description: dto.description,
      embedding_model: embeddingModel,
      parse_type: parseType,
      chunk_method: parseType === 1 ? dto.chunkMethod : undefined,
      pipeline_id: parseType === 2 ? dto.pipelineId : undefined,
      parser_config: dto.parserConfig,
    });

    if (!ragflowResult.success || !ragflowResult.data) {
      throw new BadRequestException(`创建 RAGFlow 知识库失败：${ragflowResult.error || '未知错误'}`);
    }

    const datasetId = String(
      (ragflowResult.data as any).dataset_id ?? (ragflowResult.data as any).id ?? '',
    );
    if (!datasetId) throw new BadRequestException('RAGFlow 未返回 datasetId');

    try {
      const deptId = dto.deptId ?? await this.access.getDefaultDeptId(user.userId);
      const kb = await this.prisma.knowledgeBase.create({
        data: {
          name: dto.name,
          description: dto.description,
          datasetId,
          visibility: dto.visibility ?? 'dept',
          embeddingModelId: embeddingModel,
          parseType,
          chunkMethod: parseType === 1 ? dto.chunkMethod : null,
          pipelineId: parseType === 2 ? dto.pipelineId : null,
          parserConfig: dto.parserConfig as Prisma.InputJsonValue,
          status: Number(dto.status ?? 1),
          owner: { connect: { id: user.userId } },
          ...(deptId ? { dept: { connect: { id: deptId } } } : {}),
          knowledgeBaseRoles: {
            create: (dto.roleIds ?? []).map((roleId) => ({ roleId })),
          },
        } as any,
      });
      this.log.info('创建知识库成功', { id: kb.id, datasetId, userId: user.userId, deptId });
      return null;
    } catch (error) {
      await this.ragflow.deleteDataset(datasetId);
      throw error;
    }
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(id, user.userId);
    const parseType = dto.parseType ?? (kb as any).parseType ?? 1;

    if (parseType === 1 && dto.chunkMethod === '') {
      throw new BadRequestException('更新知识库失败：请选择内置分块方法');
    }
    if (parseType === 2 && dto.pipelineId === '') {
      throw new BadRequestException('更新知识库失败：请选择 pipeline');
    }

    const ragflowResult = await this.ragflow.updateDataset(kb.datasetId, {
      name: dto.name,
      description: dto.description,
      embedding_model: dto.embeddingModel,
      parse_type: dto.parseType,
      chunk_method: parseType === 1 ? dto.chunkMethod : undefined,
      pipeline_id: parseType === 2 ? dto.pipelineId : undefined,
      parser_config: dto.parserConfig,
    });
    if (!ragflowResult.success) {
      throw new BadRequestException(`更新 RAGFlow 知识库失败：${ragflowResult.error || '未知错误'}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.knowledgeBaseRole.deleteMany({ where: { kbId: id } });
      await tx.knowledgeBase.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          visibility: dto.visibility,
          embeddingModelId: dto.embeddingModel,
          parseType: dto.parseType,
          chunkMethod: parseType === 1 ? dto.chunkMethod : null,
          pipelineId: parseType === 2 ? dto.pipelineId : null,
          parserConfig: dto.parserConfig as Prisma.InputJsonValue,
          status: dto.status === undefined ? undefined : Number(dto.status),
          ...(dto.deptId === undefined
            ? {}
            : { dept: dto.deptId ? { connect: { id: dto.deptId } } : { disconnect: true } }),
          knowledgeBaseRoles: {
            create: (dto.roleIds ?? []).map((roleId) => ({ roleId })),
          },
        } as any,
      });
    });
    this.log.info('更新知识库成功', { id, userId: user.userId });
    return null;
  }

  async remove(id: string, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(id, user.userId);

    const ragflowResult = await this.ragflow.deleteDataset(kb.datasetId);
    if (!ragflowResult.success) {
      throw new BadRequestException(`删除 RAGFlow 知识库失败：${ragflowResult.error || '未知错误'}`);
    }

    await this.prisma.knowledgeBase.delete({ where: { id } });
    this.log.info('删除知识库成功', { id, userId: user.userId });
    return null;
  }

  async getDocumentList(kbId: string, dto: DocumentListDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.listDocuments(kb.datasetId!, dto);
    if (!result.success) throw new BadRequestException(`获取文档列表失败：${result.error}`);
    return this.normalizeRagflowList(result.data, kb.chunkMethod ?? 'naive');
  }

  async uploadDocuments(
    kbId: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
    user: CurrentUserRef,
  ) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.uploadDocuments(kb.datasetId!, files);
    if (!result.success) throw new BadRequestException(`上传文档失败：${result.error}`);
    await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    this.log.info('上传文档成功', {
      kbId,
      fileCount: files.length,
      filenames: files.map((item) => item.originalname),
      userId: user.userId,
    });
    return result.data;
  }

  async createEmptyDocument(kbId: string, name: string, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const filename = String(name ?? '').trim();
    if (!filename) {
      throw new BadRequestException('新增空白文档失败：文档名称不能为空');
    }
    const result = await this.ragflow.createEmptyDocument(kb.datasetId!, filename);
    if (!result.success) throw new BadRequestException(`新增空白文档失败：${result.error}`);
    this.log.info('新增空白文档成功', { kbId, datasetId: kb.datasetId, name: filename, userId: user.userId });
    return result.data ?? null;
  }

  async deleteDocuments(kbId: string, ids: string[], user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.deleteDocuments(kb.datasetId!, ids);
    if (!result.success) throw new BadRequestException(`删除文档失败：${result.error}`);
    this.log.info('删除文档成功', { kbId, ids, userId: user.userId });
    return null;
  }

  async parseDocuments(kbId: string, ids: string[], user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.parseDocuments(kb.datasetId!, ids);
    if (!result.success) throw new BadRequestException(`解析文档失败：${result.error}`);
    await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    this.log.info('启动文档解析成功', { kbId, ids, userId: user.userId });
    return result.data ?? null;
  }

  async stopParsing(kbId: string, ids: string[], user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.stopParsing(kb.datasetId!, ids);
    if (!result.success) throw new BadRequestException(`停止解析失败：${result.error}`);
    this.log.info('停止文档解析成功', { kbId, ids, userId: user.userId });
    return result.data ?? null;
  }

  async updateDocument(kbId: string, docId: string, dto: UpdateDocumentDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const payload: Record<string, unknown> = {};

    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.chunkMethod !== undefined) payload.chunk_method = dto.chunkMethod;
    if (dto.pipelineId !== undefined) payload.pipeline_id = dto.pipelineId;
    if (dto.parserConfig !== undefined) payload.parser_config = dto.parserConfig;

    if (!Object.keys(payload).length) {
      throw new BadRequestException('更新文档失败：缺少可更新字段');
    }

    const result = await this.ragflow.updateDocument(kb.datasetId!, docId, payload);
    if (!result.success) throw new BadRequestException(`更新文档失败：${result.error}`);
    this.log.info('更新文档成功', { kbId, docId, userId: user.userId, fields: Object.keys(payload) });
    return result.data ?? null;
  }

  async updateDocumentStatus(kbId: string, dto: UpdateDocumentStatusDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.batchUpdateDocumentStatus(kb.datasetId!, dto.docIds, dto.status as 0 | 1);
    if (!result.success) throw new BadRequestException(`更新文档状态失败：${result.error}`);
    this.log.info('更新文档状态成功', { kbId, docIds: dto.docIds, status: dto.status, userId: user.userId });
    return result.data ?? null;
  }

  async downloadDocument(kbId: string, docId: string, ext: string | undefined, user: CurrentUserRef) {
    await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.downloadDocument(docId, ext);
    if (!result.success || !result.data) {
      throw new BadRequestException(`下载文档失败：${result.error || '未知错误'}`);
    }
    return result.data;
  }

  async search(kbId: string, dto: SearchDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.search(kb.datasetId!, dto);
    if (!result.success) throw new BadRequestException(`检索失败：${result.error}`);
    return result.data;
  }

  async getIngestionSummary(kbId: string, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.getIngestionSummary(kb.datasetId!);
    if (!result.success) throw new BadRequestException(`获取解析概览失败：${result.error}`);
    return result.data ?? {};
  }

  async getIngestionLogs(kbId: string, dto: IngestionLogsDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.getIngestionLogs(kb.datasetId!, dto);
    if (!result.success) throw new BadRequestException(`获取解析日志失败：${result.error}`);
    return result.data ?? { total: 0, logs: [] };
  }

  async getIngestionLog(kbId: string, logId: string, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.getIngestionLog(kb.datasetId!, logId);
    if (!result.success) throw new BadRequestException(`获取日志详情失败：${result.error}`);
    return result.data ?? {};
  }

  private normalizeRagflowList(data: unknown, fallbackChunkMethod: string) {
    const normalizeItems = (items: unknown[]) => items.map((item) => this.normalizeRagflowDocument(item, fallbackChunkMethod));

    if (Array.isArray(data)) {
      return { records: normalizeItems(data), total: data.length };
    }

    if (data && typeof data === 'object') {
      const payload = data as Record<string, any>;
      const rawRecords = payload.docs ?? payload.documents ?? payload.records ?? payload.items ?? [];
      const records = Array.isArray(rawRecords) ? normalizeItems(rawRecords) : [];
      return {
        current: payload.current ?? payload.page ?? 1,
        size: payload.size ?? payload.page_size ?? records.length,
        records,
        total: payload.total ?? payload.total_count ?? records.length,
      };
    }

    return { current: 1, size: 10, records: [], total: 0 };
  }

  private normalizeRagflowDocument(input: unknown, fallbackChunkMethod: string) {
    const item = (input ?? {}) as Record<string, unknown>;
    const rawRun = String(item.run ?? item.run_status ?? 'UNSTART').toUpperCase();
    const runMap: Record<string, string> = {
      '0': 'UNSTART',
      '1': 'RUNNING',
      '2': 'CANCEL',
      '3': 'DONE',
      '4': 'FAIL',
      '5': 'SCHEDULE',
    };

    const run = runMap[rawRun] ?? rawRun;
    const chunkMethod = String(
      item.chunk_method ?? item.chunkMethod ?? item.parser_id ?? fallbackChunkMethod ?? 'naive',
    ).toLowerCase();

    const pipelineId = String(item.pipeline_id ?? item.pipelineId ?? '').trim() || null;
    const pipelineName = String(item.pipeline_name ?? item.pipelineName ?? '').trim() || null;

    return {
      id: String(item.id ?? ''),
      name: String(item.name ?? '-'),
      datasetId: String(item.dataset_id ?? item.datasetId ?? ''),
      type: item.type ?? null,
      size: Number(item.size ?? 0),
      chunkNum: Number(item.chunk_count ?? item.chunk_num ?? item.chunkNum ?? 0),
      tokenNum: Number(item.token_count ?? item.token_num ?? item.tokenNum ?? 0),
      progress: Number(item.progress ?? 0),
      run,
      status: String(item.status ?? '1'),
      chunkMethod,
      parseMethod: chunkMethod,
      pipelineId,
      pipelineName,
      parserConfig: (item.parser_config ?? item.parserConfig ?? null) as Record<string, unknown> | null,
      metaFields: (item.meta_fields ?? item.metaFields ?? {}) as Record<string, unknown>,
      createTime: String(item.create_time ?? item.created_at ?? item.createTime ?? ''),
      updateTime: String(item.update_time ?? item.updated_at ?? item.updateTime ?? ''),
      chunk_method: chunkMethod,
      pipeline_id: pipelineId,
      pipeline_name: pipelineName,
      meta_fields: (item.meta_fields ?? item.metaFields ?? {}) as Record<string, unknown>,
    };
  }
}
