import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';
import { RagflowApiService } from './ragflow-api.service';
import {
  CreateKnowledgeBaseDto,
  DocumentListDto,
  KnowledgeBaseListDto,
  SearchDto,
  UpdateKnowledgeBaseDto,
} from './dto/knowledge.dto';

@Injectable()
export class KnowledgeService {
  private readonly log = new AppLoggerService('KnowledgeService');

  constructor(
    private prisma: PrismaService,
    private ragflow: RagflowApiService,
  ) {}

  async getList(params: KnowledgeBaseListDto & { userId?: string }) {
    this.log.debug('查询知识库列表', params);
    const current = params.current ?? 1;
    const size = params.size ?? 10;
    const where: Prisma.KnowledgeBaseWhereInput = {};

    if (params.name) where.name = { contains: params.name };
    if (params.status) where.status = Number(params.status);

    if (params.userId) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId: params.userId },
        include: { role: true },
      });
      const isSuper = userRoles.some((item) => item.role.code === 'super');
      if (!isSuper) {
        const roleIds = userRoles.map((item) => item.roleId);
        if (!roleIds.length) return { current, size, total: 0, records: [] };
        where.knowledgeBaseRoles = { some: { roleId: { in: roleIds } } };
      }
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
        chunkMethod: item.chunkMethod,
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

  async create(dto: CreateKnowledgeBaseDto) {
    this.log.info('创建知识库', { name: dto.name });
    const ragflowResult = await this.ragflow.createDataset({
      name: dto.name,
      description: dto.description,
      chunk_method: dto.chunkMethod,
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
      const kb = await this.prisma.knowledgeBase.create({
        data: {
          name: dto.name,
          description: dto.description,
          datasetId,
          chunkMethod: dto.chunkMethod,
          parserConfig: dto.parserConfig as Prisma.InputJsonValue,
          status: Number(dto.status ?? 1),
          knowledgeBaseRoles: {
            create: (dto.roleIds ?? []).map((roleId) => ({ roleId })),
          },
        },
      });
      this.log.info('创建知识库成功', { id: kb.id, datasetId });
      return null;
    } catch (error) {
      await this.ragflow.deleteDataset(datasetId);
      throw error;
    }
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id } });
    if (!kb?.datasetId) throw new NotFoundException('知识库不存在');

    const ragflowResult = await this.ragflow.updateDataset(kb.datasetId, {
      name: dto.name,
      description: dto.description,
      chunk_method: dto.chunkMethod,
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
          chunkMethod: dto.chunkMethod,
          parserConfig: dto.parserConfig as Prisma.InputJsonValue,
          status: dto.status === undefined ? undefined : Number(dto.status),
          knowledgeBaseRoles: {
            create: (dto.roleIds ?? []).map((roleId) => ({ roleId })),
          },
        },
      });
    });
    this.log.info('更新知识库成功', { id });
    return null;
  }

  async remove(id: string) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id } });
    if (!kb?.datasetId) throw new NotFoundException('知识库不存在');

    const ragflowResult = await this.ragflow.deleteDataset(kb.datasetId);
    if (!ragflowResult.success) {
      throw new BadRequestException(`删除 RAGFlow 知识库失败：${ragflowResult.error || '未知错误'}`);
    }

    await this.prisma.knowledgeBase.delete({ where: { id } });
    this.log.info('删除知识库成功', { id });
    return null;
  }

  async getDocumentList(kbId: string, dto: DocumentListDto) {
    const kb = await this.getKnowledgeBaseOrThrow(kbId);
    const result = await this.ragflow.listDocuments(kb.datasetId!, dto);
    if (!result.success) throw new BadRequestException(`获取文档列表失败：${result.error}`);
    return this.normalizeRagflowList(result.data);
  }

  async uploadDocument(kbId: string, file: { buffer: Buffer; originalname: string; mimetype: string }) {
    const kb = await this.getKnowledgeBaseOrThrow(kbId);
    const result = await this.ragflow.uploadDocument(kb.datasetId!, file);
    if (!result.success) throw new BadRequestException(`上传文档失败：${result.error}`);
    await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    this.log.info('上传文档成功', { kbId, filename: file.originalname });
    return result.data;
  }

  async deleteDocuments(kbId: string, ids: string[]) {
    const kb = await this.getKnowledgeBaseOrThrow(kbId);
    const result = await this.ragflow.deleteDocuments(kb.datasetId!, ids);
    if (!result.success) throw new BadRequestException(`删除文档失败：${result.error}`);
    this.log.info('删除文档成功', { kbId, ids });
    return null;
  }

  async parseDocuments(kbId: string, ids: string[]) {
    const kb = await this.getKnowledgeBaseOrThrow(kbId);
    const result = await this.ragflow.parseDocuments(kb.datasetId!, ids);
    if (!result.success) throw new BadRequestException(`解析文档失败：${result.error}`);
    await this.prisma.knowledgeBase.update({ where: { id: kbId }, data: { status: 1 } });
    this.log.info('启动文档解析成功', { kbId, ids });
    return result.data ?? null;
  }

  async stopParsing(kbId: string, ids: string[]) {
    const kb = await this.getKnowledgeBaseOrThrow(kbId);
    const result = await this.ragflow.stopParsing(kb.datasetId!, ids);
    if (!result.success) throw new BadRequestException(`停止解析失败：${result.error}`);
    this.log.info('停止文档解析成功', { kbId, ids });
    return result.data ?? null;
  }

  async search(kbId: string, dto: SearchDto) {
    const kb = await this.getKnowledgeBaseOrThrow(kbId);
    const result = await this.ragflow.search(kb.datasetId!, dto);
    if (!result.success) throw new BadRequestException(`检索失败：${result.error}`);
    return result.data;
  }

  private async getKnowledgeBaseOrThrow(kbId: string) {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb?.datasetId) throw new NotFoundException('知识库不存在');
    return kb;
  }

  private normalizeRagflowList(data: unknown) {
    if (Array.isArray(data)) return { records: data, total: data.length };
    if (data && typeof data === 'object') {
      const payload = data as Record<string, any>;
      const records = payload.docs ?? payload.documents ?? payload.records ?? payload.items ?? [];
      return { ...payload, records, total: payload.total ?? records.length };
    }
    return { records: [], total: 0 };
  }
}
