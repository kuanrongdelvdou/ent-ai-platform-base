import { KnowledgeService } from './knowledge.service';

describe('KnowledgeService', () => {
  it('filters knowledge bases by current user roles', async () => {
    const prisma = {
      userRole: {
        findMany: jest.fn().mockResolvedValue([{ roleId: 'role-1', role: { code: 'operator' } }]),
      },
      knowledgeBase: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = new KnowledgeService(prisma as any, {} as any);

    await service.getList({ current: 1, size: 10, userId: 'user-1' });

    expect(prisma.knowledgeBase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          knowledgeBaseRoles: { some: { roleId: { in: ['role-1'] } } },
        }),
      }),
    );
  });
});
