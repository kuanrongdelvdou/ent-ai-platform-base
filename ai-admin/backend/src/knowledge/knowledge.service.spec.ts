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

  it('loads dataset document count from RAGFlow for knowledge base cards', async () => {
    const prisma = {
      knowledgeBase: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'kb-1',
            name: '政策库',
            description: null,
            datasetId: 'dataset-1',
            chunkMethod: 'naive',
            parserConfig: null,
            status: 1,
            createdAt: new Date('2026-05-31T08:00:00.000Z'),
            updatedAt: new Date('2026-05-31T08:10:00.000Z'),
            knowledgeBaseRoles: []
          }
        ]),
        count: jest.fn().mockResolvedValue(1)
      }
    };
    const ragflow = {
      listDocuments: jest.fn().mockResolvedValue({ success: true, data: { total: 7, docs: [] } })
    };
    const access = {
      buildAccessibleKnowledgeBaseWhere: jest.fn().mockResolvedValue({})
    };
    const service = new KnowledgeService(prisma as any, ragflow as any, access as any, {} as any);

    const result = await service.getList({ current: 1, size: 10, userId: 'user-1' });

    expect(ragflow.listDocuments).toHaveBeenCalledWith('dataset-1', { page: 1, page_size: 1 });
    expect(result.records[0].documentCount).toBe(7);
    expect(result.records[0].docNum).toBe(7);
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

  it('normalizes document parser and run fields from RAGFlow list response', async () => {
    const prisma = {};
    const ragflow = {
      listDocuments: jest.fn().mockResolvedValue({
        success: true,
        data: {
          docs: [
            {
              id: 'doc-1',
              name: '招商引资需求.xlsx',
              dataset_id: 'dataset-1',
              chunk_method: 'naive',
              chunk_count: 3,
              token_count: 42,
              progress: 0.67,
              run: 'RUNNING',
              status: '1',
              meta_fields: { source: 'excel' },
              parser_config: { auto_keywords: 0 },
              create_time: '1780223352463',
              update_time: '1780223352463'
            }
          ],
          total: 1
        }
      })
    };
    const access = {
      assertCanAccessKnowledgeBase: jest.fn().mockResolvedValue({
        id: 'kb-1',
        datasetId: 'dataset-1',
        chunkMethod: 'laws'
      })
    };
    const service = new KnowledgeService(prisma as any, ragflow as any, access as any, {} as any);

    const result = await service.getDocumentList('kb-1', { page: 1, page_size: 10 }, { userId: 'user-1' });

    expect(result.total).toBe(1);
    expect(result.records[0]).toEqual(
      expect.objectContaining({
        id: 'doc-1',
        name: '招商引资需求.xlsx',
        run: 'RUNNING',
        chunkMethod: 'naive',
        parseMethod: 'naive',
        chunk_method: 'naive',
        chunkNum: 3,
        tokenNum: 42,
        createTime: '2026-05-31T10:29:12.463Z',
        updateTime: '2026-05-31T10:29:12.463Z'
      })
    );
  });

  it('falls back to knowledge base chunk method when document parser fields are missing', async () => {
    const prisma = {};
    const ragflow = {
      listDocuments: jest.fn().mockResolvedValue({
        success: true,
        data: {
          docs: [
            {
              id: 'doc-2',
              name: '政策解读.docx',
              dataset_id: 'dataset-1',
              run: 'UNSTART',
              status: '1'
            }
          ],
          total: 1
        }
      })
    };
    const access = {
      assertCanAccessKnowledgeBase: jest.fn().mockResolvedValue({
        id: 'kb-1',
        datasetId: 'dataset-1',
        chunkMethod: 'presentation'
      })
    };
    const service = new KnowledgeService(prisma as any, ragflow as any, access as any, {} as any);

    const result = await service.getDocumentList('kb-1', { page: 1, page_size: 10 }, { userId: 'user-1' });

    expect(result.records[0]).toEqual(
      expect.objectContaining({
        id: 'doc-2',
        run: 'UNSTART',
        chunkMethod: 'presentation',
        parseMethod: 'presentation',
        chunk_method: 'presentation'
      })
    );
  });
});
