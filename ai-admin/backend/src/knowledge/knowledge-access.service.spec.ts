import { ForbiddenException } from '@nestjs/common';
import { KnowledgeAccessService } from './knowledge-access.service';

describe('KnowledgeAccessService', () => {
  it('rejects users without owner, department, role, or public access', async () => {
    const prisma = {
      knowledgeBase: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'kb-1',
          datasetId: 'dataset-1',
          ownerId: 'owner-1',
          deptId: 'dept-a',
          visibility: 'private',
          knowledgeBaseRoles: [{ roleId: 'role-a' }],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          deptId: 'dept-b',
          userRoles: [{ roleId: 'role-b', role: { code: 'operator' } }],
        }),
      },
      department: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new KnowledgeAccessService(prisma as any);

    await expect(service.assertCanAccessKnowledgeBase('kb-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('allows super users to access any knowledge base', async () => {
    const prisma = {
      knowledgeBase: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'kb-1',
          datasetId: 'dataset-1',
          ownerId: 'owner-1',
          deptId: 'dept-a',
          visibility: 'private',
          knowledgeBaseRoles: [],
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          deptId: 'dept-b',
          userRoles: [{ roleId: 'role-b', role: { code: 'super' } }],
        }),
      },
      department: {
        findMany: jest.fn(),
      },
    };
    const service = new KnowledgeAccessService(prisma as any);

    await expect(service.assertCanAccessKnowledgeBase('kb-1', 'user-1')).resolves.toEqual(
      expect.objectContaining({ id: 'kb-1' }),
    );
  });
}
);
