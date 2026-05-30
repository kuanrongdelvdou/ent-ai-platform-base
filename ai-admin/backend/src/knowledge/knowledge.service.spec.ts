import { BadRequestException } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

describe('KnowledgeService', () => {
  it('filters knowledge bases by current user roles', async () => {
    const prisma = {
      knowledgeBase: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const access = {
      buildAccessibleKnowledgeBaseWhere: jest.fn().mockResolvedValue({
        OR: [
          { ownerId: 'user-1' },
          { knowledgeBaseRoles: { some: { roleId: { in: ['role-1'] } } } },
        ],
      }),
    };
    const service = new KnowledgeService(prisma as any, {} as any, access as any, {} as any);

    await service.getList({ current: 1, size: 10, userId: 'user-1' });

    expect(access.buildAccessibleKnowledgeBaseWhere).toHaveBeenCalledWith('user-1');
    expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { ownerId: 'user-1' },
            { knowledgeBaseRoles: { some: { roleId: { in: ['role-1'] } } } },
          ]),
        }),
      }),
    );
  });

  it('checks AI readiness before creating a knowledge base', async () => {
    const prisma = {
      knowledgeBase: {
        create: jest.fn(),
      },
    };
    const ragflow = {
      createDataset: jest.fn(),
    };
    const access = {
      getDefaultDeptId: jest.fn().mockResolvedValue(null),
    };
    const aiHub = {
      getReadiness: jest.fn().mockResolvedValue({
        status: 'NOT_CONFIGURED',
        missing: ['llm', 'embedding'],
      }),
      assertReady: jest.fn().mockRejectedValue(new BadRequestException('AI_MODEL_NOT_READY：AI 能力尚未初始化，请联系管理员')),
    };
    const service = new KnowledgeService(prisma as any, ragflow as any, access as any, aiHub as any);

    await expect(
      service.create(
        {
          name: '政策库',
          deptId: 'dept-1',
        },
        { userId: 'user-1' },
      ),
    ).rejects.toThrow(BadRequestException);

    expect(ragflow.createDataset).not.toHaveBeenCalled();
    expect(prisma.knowledgeBase.create).not.toHaveBeenCalled();
  });

  it('creates a RAGFlow dataset with official embedding and chunk fields while keeping local access fields', async () => {
    const prisma = {
      knowledgeBase: {
        create: jest.fn().mockResolvedValue({ id: 'kb-1' }),
      },
    };
    const ragflow = {
      createDataset: jest.fn().mockResolvedValue({ success: true, data: { id: 'dataset-1' } }),
    };
    const access = {
      getDefaultDeptId: jest.fn(),
    };
    const aiHub = {
      assertReady: jest.fn().mockResolvedValue({
        defaultModels: {
          embedding: { id: 'default-embedding@OpenAI', name: 'default-embedding@OpenAI' },
        },
      }),
    };
    const service = new KnowledgeService(prisma as any, ragflow as any, access as any, aiHub as any);

    await service.create(
      {
        name: '政策库',
        embeddingModel: 'text-embedding-v4@Tongyi-Qianwen',
        parseType: 1,
        chunkMethod: 'laws',
        deptId: 'dept-1',
        visibility: 'custom',
        roleIds: ['role-1'],
      },
      { userId: 'user-1' },
    );

    expect(ragflow.createDataset).toHaveBeenCalledWith({
      name: '政策库',
      description: undefined,
      embedding_model: 'text-embedding-v4@Tongyi-Qianwen',
      parse_type: 1,
      chunk_method: 'laws',
      pipeline_id: undefined,
      parser_config: undefined,
    });
    expect(prisma.knowledgeBase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          datasetId: 'dataset-1',
          dept: { connect: { id: 'dept-1' } },
          owner: { connect: { id: 'user-1' } },
          visibility: 'custom',
          embeddingModelId: 'text-embedding-v4@Tongyi-Qianwen',
          parseType: 1,
          chunkMethod: 'laws',
          pipelineId: null,
          knowledgeBaseRoles: { create: [{ roleId: 'role-1' }] },
        }),
      }),
    );
  });

  it('creates a RAGFlow dataset with pipeline when parse type selects pipeline', async () => {
    const prisma = {
      knowledgeBase: {
        create: jest.fn().mockResolvedValue({ id: 'kb-1' }),
      },
    };
    const ragflow = {
      createDataset: jest.fn().mockResolvedValue({ success: true, data: { dataset_id: 'dataset-1' } }),
    };
    const access = {
      getDefaultDeptId: jest.fn().mockResolvedValue(null),
    };
    const aiHub = {
      assertReady: jest.fn().mockResolvedValue({
        defaultModels: {
          embedding: { id: 'default-embedding@OpenAI', name: 'default-embedding@OpenAI' },
        },
      }),
    };
    const service = new KnowledgeService(prisma as any, ragflow as any, access as any, aiHub as any);

    await service.create(
      {
        name: 'Pipeline 库',
        parseType: 2,
        pipelineId: '12345678901234567890123456789012',
      },
      { userId: 'user-1' },
    );

    expect(ragflow.createDataset).toHaveBeenCalledWith(
      expect.objectContaining({
        embedding_model: 'default-embedding@OpenAI',
        parse_type: 2,
        chunk_method: undefined,
        pipeline_id: '12345678901234567890123456789012',
      }),
    );
    expect(prisma.knowledgeBase.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parseType: 2,
          chunkMethod: null,
          pipelineId: '12345678901234567890123456789012',
          owner: { connect: { id: 'user-1' } },
        }),
      }),
    );
    expect(prisma.knowledgeBase.create.mock.calls[0][0].data).not.toHaveProperty('deptId');
    expect(prisma.knowledgeBase.create.mock.calls[0][0].data).not.toHaveProperty('dept');
  });

  it('checks access before listing documents', async () => {
    const prisma = {};
    const ragflow = {
      listDocuments: jest.fn().mockResolvedValue({ success: true, data: [] }),
    };
    const access = {
      assertCanAccessKnowledgeBase: jest.fn().mockResolvedValue({
        id: 'kb-1',
        datasetId: 'dataset-1',
      }),
    };
    const aiHub = {
      getReadiness: jest.fn(),
    };
    const service = new KnowledgeService(prisma as any, ragflow as any, access as any, aiHub as any);

    await service.getDocumentList('kb-1', { page: 1, page_size: 10 }, { userId: 'user-1' });

    expect(access.assertCanAccessKnowledgeBase).toHaveBeenCalledWith('kb-1', 'user-1');
    expect(ragflow.listDocuments).toHaveBeenCalledWith('dataset-1', { page: 1, page_size: 10 });
  });
});
