import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';

type AccessUser = {
  id: string;
  deptId: string | null;
  userRoles: Array<{ roleId: string; role: { code: string } }>;
};

type KnowledgeBaseWithRoles = {
  id: string;
  datasetId: string;
  ownerId?: string | null;
  deptId?: string | null;
  visibility?: string | null;
  chunkMethod?: string | null;
  knowledgeBaseRoles: Array<{ roleId: string }>;
};

@Injectable()
export class KnowledgeAccessService {
  private readonly log = new AppLoggerService('KnowledgeAccessService');

  constructor(private readonly prisma: PrismaService) {}

  async buildAccessibleKnowledgeBaseWhere(userId: string) {
    const user = await this.getAccessUser(userId);
    if (this.isSuperUser(user)) return {};

    const roleIds = user.userRoles.map((item) => item.roleId);
    const deptIds = user.deptId ? await this.getDeptAndDescendantIds(user.deptId) : [];

    return {
      OR: [
        { ownerId: userId },
        { visibility: 'public' },
        ...(deptIds.length ? [{ visibility: 'dept', deptId: { in: deptIds } }] : []),
        ...(roleIds.length ? [{ knowledgeBaseRoles: { some: { roleId: { in: roleIds } } } }] : []),
      ],
    };
  }

  async assertCanAccessKnowledgeBase(kbId: string, userId: string) {
    const [kb, user] = await Promise.all([
      this.getKnowledgeBase(kbId),
      this.getAccessUser(userId),
    ]);

    if (await this.canAccess(kb, user)) {
      this.log.debug('知识库访问校验通过', { kbId, userId });
      return kb;
    }

    this.log.warn('知识库访问校验拒绝', {
      kbId,
      userId,
      deptId: user.deptId,
      visibility: kb.visibility,
    });
    throw new ForbiddenException('无权访问该知识库');
  }

  async getDefaultDeptId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { deptId: true },
    });
    return user?.deptId ?? null;
  }

  private async getKnowledgeBase(kbId: string): Promise<KnowledgeBaseWithRoles> {
    const kb = await this.prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: { knowledgeBaseRoles: true },
    } as any);

    if (!kb?.datasetId) {
      this.log.warn('知识库不存在或未绑定 RAGFlow dataset', { kbId });
      throw new NotFoundException('知识库不存在');
    }

    return kb as unknown as KnowledgeBaseWithRoles;
  }

  private async getAccessUser(userId: string): Promise<AccessUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      this.log.warn('知识库访问校验失败，用户不存在', { userId });
      throw new ForbiddenException('无权访问该知识库');
    }

    return user as AccessUser;
  }

  private async canAccess(kb: KnowledgeBaseWithRoles, user: AccessUser) {
    if (this.isSuperUser(user)) return true;
    if (kb.ownerId === user.id) return true;
    if (kb.visibility === 'public') return true;
    if (this.hasGrantedRole(kb, user)) return true;
    if (kb.visibility === 'dept' && kb.deptId && user.deptId) {
      const visibleDeptIds = await this.getDeptAndDescendantIds(user.deptId);
      return visibleDeptIds.includes(kb.deptId);
    }
    return false;
  }

  private hasGrantedRole(kb: KnowledgeBaseWithRoles, user: AccessUser) {
    const userRoleIds = new Set(user.userRoles.map((item) => item.roleId));
    return kb.knowledgeBaseRoles.some((item) => userRoleIds.has(item.roleId));
  }

  private isSuperUser(user: AccessUser) {
    return user.userRoles.some((item) => item.role.code === 'super');
  }

  private async getDeptAndDescendantIds(rootDeptId: string) {
    const depts = await this.prisma.department.findMany({
      select: { id: true, parentId: true },
    });
    const result = new Set<string>([rootDeptId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const dept of depts) {
        if (dept.parentId && result.has(dept.parentId) && !result.has(dept.id)) {
          result.add(dept.id);
          changed = true;
        }
      }
    }

    return [...result];
  }
}
