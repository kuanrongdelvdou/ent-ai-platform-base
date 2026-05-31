import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiHubService } from './ai-hub.service';
import {
  CreateKnowledgeBaseDto,
  DocumentListDto,
  IngestionLogsDto,
  KnowledgeBaseListDto,
  MetadataSummaryDto,
  SearchDto,
  UpdateDocumentsMetadataDto,
  UpdateDocumentDto,
  UpdateDocumentStatusDto,
  UpdateKnowledgeBaseDto,
  UpdateMetadataConfigDto,
} from './dto/knowledge.dto';
import { KnowledgeAccessService } from './knowledge-access.service';
import { RagflowApiService } from './ragflow-api.service';

type CurrentUserRef = { userId: string };

@Injectable()
export class KnowledgeService {
  private readonly log = new AppLoggerService('KnowledgeService');
  private readonly maxUploadBatchCount = 32;
  private readonly maxUploadBatchTotalBytes = 1024 * 1024 * 1024;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragflow: RagflowApiService,
    private readonly access: KnowledgeAccessService,
    private readonly aiHub: AiHubService,
  ) {}

  private getKnowledgeBaseFieldSet() {
    const model = Prisma.dmmf.datamodel.models.find(item => item.name === 'KnowledgeBase');
    return new Set(model?.fields.map(item => item.name) ?? []);
  }

  async getList(params: KnowledgeBaseListDto & { userId?: string }) {
    this.log.debug('查询知识库列表', params);
    const current = params.current ?? 1;
    const size = params.size ?? 10;
    const where: Record<string, unknown> = {};

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
        deptId: (item as any).deptId ?? null,
        ownerId: (item as any).ownerId ?? null,
        visibility: (item as any).visibility ?? null,
        embeddingModelId: (item as any).embeddingModelId ?? null,
        parseType: (item as any).parseType ?? null,
        chunkMethod: item.chunkMethod,
        pipelineId: (item as any).pipelineId ?? null,
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
    }>();

    if (!result.success) {
      throw new BadRequestException(`获取 RAGFlow pipeline 失败：${result.error || '未知错误'}`);
    }

    return (result.data?.canvas ?? [])
      .map((item) => ({
        id: item.id,
        name: item.title ?? item.name ?? item.id,
      }))
      .filter((item): item is { id: string; name: string } => Boolean(item.id));
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

    const datasetId = String((ragflowResult.data as any).dataset_id ?? (ragflowResult.data as any).id ?? '');
    if (!datasetId) throw new BadRequestException('RAGFlow 未返回 datasetId');

    try {
      const deptId = dto.deptId ?? await this.access.getDefaultDeptId(user.userId);
      const fieldSet = this.getKnowledgeBaseFieldSet();
      const createData: Record<string, unknown> = {
        name: dto.name,
        description: dto.description,
        datasetId,
        status: Number(dto.status ?? 1),
        owner: { connect: { id: user.userId } },
        ...(deptId ? { dept: { connect: { id: deptId } } } : {}),
        knowledgeBaseRoles: {
          create: (dto.roleIds ?? []).map((roleId) => ({ roleId })),
        },
      };

      if (fieldSet.has('visibility')) createData.visibility = dto.visibility ?? 'dept';
      if (fieldSet.has('embeddingModelId')) createData.embeddingModelId = embeddingModel;
      if (fieldSet.has('parseType')) createData.parseType = parseType;
      if (fieldSet.has('chunkMethod')) createData.chunkMethod = parseType === 1 ? dto.chunkMethod : null;
      if (fieldSet.has('pipelineId')) createData.pipelineId = parseType === 2 ? dto.pipelineId : null;
      if (fieldSet.has('parserConfig')) createData.parserConfig = dto.parserConfig as Prisma.InputJsonValue;

      const kb = await this.prisma.knowledgeBase.create({ data: createData as any });
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

    const fieldSet = this.getKnowledgeBaseFieldSet();
    await this.prisma.$transaction(async (tx) => {
      await tx.knowledgeBaseRole.deleteMany({ where: { kbId: id } });
      const updateData: Record<string, unknown> = {
        name: dto.name,
        description: dto.description,
        status: dto.status === undefined ? undefined : Number(dto.status),
        ...(dto.deptId === undefined
          ? {}
          : { dept: dto.deptId ? { connect: { id: dto.deptId } } : { disconnect: true } }),
        knowledgeBaseRoles: {
          create: (dto.roleIds ?? []).map((roleId) => ({ roleId })),
        },
      };

      if (fieldSet.has('visibility')) updateData.visibility = dto.visibility;
      if (fieldSet.has('embeddingModelId')) updateData.embeddingModelId = dto.embeddingModel;
      if (fieldSet.has('parseType')) updateData.parseType = dto.parseType;
      if (fieldSet.has('chunkMethod')) updateData.chunkMethod = parseType === 1 ? dto.chunkMethod : null;
      if (fieldSet.has('pipelineId')) updateData.pipelineId = parseType === 2 ? dto.pipelineId : null;
      if (fieldSet.has('parserConfig')) updateData.parserConfig = dto.parserConfig as Prisma.InputJsonValue;

      await tx.knowledgeBase.update({
        where: { id },
        data: updateData as any,
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
    const result = await this.ragflow.listDocuments(kb.datasetId!, {
      page: dto.page,
      page_size: dto.page_size,
      keywords: dto.keywords,
      run_status: dto.run_status?.length ? dto.run_status : dto.run,
      suffix: dto.suffix,
      metadata: dto.metadata,
      return_empty_metadata: dto.return_empty_metadata,
    });
    if (!result.success) throw new BadRequestException(`获取文档列表失败：${result.error}`);
    return this.normalizeRagflowList(result.data, kb.chunkMethod ?? 'naive');
  }

  async getDocumentFilters(kbId: string, dto: { keywords?: string }, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.listDocuments(kb.datasetId!, { type: 'filter', keywords: dto.keywords });
    if (!result.success) throw new BadRequestException(`获取文档筛选项失败：${result.error}`);
    return result.data ?? { total: 0, filter: {} };
  }

  async uploadDocuments(
    kbId: string,
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
    user: CurrentUserRef,
  ) {
    if (!files.length) {
      throw new BadRequestException('上传文件失败：请至少选择一个文件');
    }

    if (files.length > this.maxUploadBatchCount) {
      throw new BadRequestException(`上传文件失败：单次最多上传 ${this.maxUploadBatchCount} 个文件`);
    }

    const totalBytes = files.reduce((sum, file) => sum + (file?.buffer?.length ?? 0), 0);
    if (totalBytes > this.maxUploadBatchTotalBytes) {
      throw new BadRequestException('上传文件失败：单次上传总大小不能超过 1GB，请分批上传');
    }

    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.uploadDocuments(kb.datasetId!, files);
    if (!result.success) throw new BadRequestException(`上传文档失败：${result.error}`);

    await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    this.log.info('上传文档成功', {
      kbId,
      fileCount: files.length,
      totalBytes,
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

  async runDocuments(
    kbId: string,
    payload: { ids: string[]; run: 1 | 2; delete?: boolean; applyKb?: boolean },
    user: CurrentUserRef,
  ) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.ingestDocuments({
      doc_ids: payload.ids,
      run: payload.run,
      delete: payload.delete,
      apply_kb: payload.applyKb,
    });

    if (!result.success) throw new BadRequestException(`文档解析任务执行失败：${result.error}`);

    if (payload.run === 1) {
      await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    }

    this.log.info('执行文档解析任务成功', {
      kbId,
      ids: payload.ids,
      run: payload.run,
      delete: payload.delete ?? false,
      applyKb: payload.applyKb ?? false,
      userId: user.userId,
    });
    return result.data ?? null;
  }

  async parseDocuments(
    kbId: string,
    ids: string[],
    user: CurrentUserRef,
    options?: { delete?: boolean; applyKb?: boolean },
  ) {
    return this.runDocuments(
      kbId,
      { ids, run: 1, delete: options?.delete, applyKb: options?.applyKb },
      user,
    );
  }

  async stopParsing(kbId: string, ids: string[], user: CurrentUserRef) {
    return this.runDocuments(kbId, { ids, run: 2 }, user);
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

  async previewDocument(kbId: string, docId: string, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.previewDocument(docId);
    if (!result.success || !result.data) {
      throw new BadRequestException(`预览文档失败：${result.error || '未知错误'}`);
    }
    this.log.info('预览文档成功', { kbId, docId, datasetId: kb.datasetId, userId: user.userId });
    return result.data;
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

  async getMetadataSummary(kbId: string, dto: MetadataSummaryDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.getMetadataSummary(kb.datasetId!, dto.docIds);
    if (!result.success) throw new BadRequestException(`获取元数据摘要失败：${result.error}`);
    const payload = (result.data ?? {}) as Record<string, unknown>;
    const summary = payload.summary && typeof payload.summary === 'object' ? payload.summary : {};
    return { summary };
  }

  async updateDocumentsMetadata(kbId: string, dto: UpdateDocumentsMetadataDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const updates = Array.isArray(dto.updates) ? dto.updates : [];
    const deletes = Array.isArray(dto.deletes) ? dto.deletes : [];
    if (!updates.length && !deletes.length) {
      throw new BadRequestException('更新元数据失败：updates 和 deletes 不能同时为空');
    }

    const payload = {
      selector: dto.selector,
      updates: updates.map(item => ({
        key: item.key,
        value: item.value,
        match: item.match,
        valueType: item.valueType,
      })),
      deletes: deletes.map(item => ({
        key: item.key,
        value: item.value,
      })),
    };

    const result = await this.ragflow.updateDocumentsMetadata(kb.datasetId!, payload);
    if (!result.success) throw new BadRequestException(`更新元数据失败：${result.error}`);
    return result.data ?? null;
  }

  async getMetadataConfig(kbId: string, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const result = await this.ragflow.getMetadataConfig(kb.datasetId!);
    if (!result.success) throw new BadRequestException(`获取元数据配置失败：${result.error}`);

    const payload = (result.data ?? {}) as Record<string, unknown>;
    const metadata = Array.isArray(payload.metadata) ? payload.metadata : [];
    const builtInMetadata = Array.isArray(payload.built_in_metadata)
      ? payload.built_in_metadata
      : Array.isArray(payload.builtInMetadata)
        ? payload.builtInMetadata
        : [];

    return {
      metadata,
      builtInMetadata,
      built_in_metadata: builtInMetadata,
    };
  }

  async updateMetadataConfig(kbId: string, dto: UpdateMetadataConfigDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const payload = this.buildMetadataConfigPayload(dto);
    const result = await this.ragflow.updateMetadataConfig(kb.datasetId!, payload);
    if (!result.success) throw new BadRequestException(`更新元数据配置失败：${result.error}`);
    return result.data ?? null;
  }

  async updateDocumentMetadataConfig(kbId: string, docId: string, dto: UpdateMetadataConfigDto, user: CurrentUserRef) {
    const kb = await this.access.assertCanAccessKnowledgeBase(kbId, user.userId);
    const payload = this.buildMetadataConfigPayload(dto);
    const result = await this.ragflow.updateDocumentMetadataConfig(kb.datasetId!, docId, payload);
    if (!result.success) throw new BadRequestException(`更新文档元数据配置失败：${result.error}`);
    return result.data ?? null;
  }

  private buildMetadataConfigPayload(dto: UpdateMetadataConfigDto) {
    const normalize = (fields?: Array<{ key: string; type: string; description?: string; enum?: string[] }>) =>
      (fields ?? [])
        .map(field => ({
          key: field.key?.trim(),
          type: field.type,
          description: field.description?.trim() || undefined,
          enum: Array.isArray(field.enum)
            ? field.enum.map(item => item.trim()).filter(Boolean)
            : undefined,
        }))
        .filter(field => field.key);

    return {
      metadata: normalize(dto.metadata),
      built_in_metadata: normalize(dto.builtInMetadata),
    };
  }

  private normalizeRagflowList(data: unknown, fallbackChunkMethod: string) {
    const normalizeItems = (items: unknown[]) =>
      items.map((item) => this.normalizeRagflowDocument(item, fallbackChunkMethod));

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
    const processDurationRaw = Number(item.process_duration ?? item.process_duation ?? 0);
    const processDuration = Number.isFinite(processDurationRaw) ? processDurationRaw : 0;
    const progressMsg = String(item.progress_msg ?? item.progressMsg ?? '').trim();
    const suffix = String(item.suffix ?? '').trim();
    const nickname = String(item.nickname ?? '').trim();
    const createDate = String(item.create_date ?? item.createDate ?? '').trim();
    const processBeginAt = String(item.process_begin_at ?? item.processBeginAt ?? '').trim();

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
      createDate,
      suffix,
      nickname,
      processBeginAt,
      processDuration,
      progressMsg,
      chunk_method: chunkMethod,
      pipeline_id: pipelineId,
      pipeline_name: pipelineName,
      meta_fields: (item.meta_fields ?? item.metaFields ?? {}) as Record<string, unknown>,
      process_begin_at: processBeginAt,
      process_duration: processDuration,
      progress_msg: progressMsg,
      create_date: createDate,
    };
  }
}
