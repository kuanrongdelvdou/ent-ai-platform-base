import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, RoleSearchDto } from './role.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class RoleService {
  private readonly log = new AppLoggerService('RoleService');

  constructor(private prisma: PrismaService) {}

  async getList(dto: RoleSearchDto) {
    this.log.debug('getList', dto);
    const { current = 1, size = 10, roleName, roleCode, status } = dto;
    const skip = (current - 1) * size;
    const where: any = {};
    if (roleName) where.name = { contains: roleName };
    if (roleCode) where.code = { contains: roleCode };
    if (status) where.status = status === '1' ? 1 : 2;

    const [total, list] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } }),
    ]);

    const records = list.map((r) => ({
      id: r.id,
      roleName: r.name,
      roleCode: r.code,
      roleDesc: r.remark,
      status: r.status === 1 ? '1' : '2',
      createTime: r.createdAt.toISOString(),
      updateTime: r.updatedAt.toISOString(),
      createBy: '',
      updateBy: '',
    }));

    return { current, size, total, records };
  }

  async getAllRoles() {
    const roles = await this.prisma.role.findMany({
      where: { status: 1 },
      select: { id: true, name: true, code: true },
    });
    return roles.map((r) => ({ id: r.id, roleName: r.name, roleCode: r.code }));
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({ where: { code: dto.roleCode } });
    if (exists) {
      this.log.warn('create role failed - code exists', { roleCode: dto.roleCode });
      throw new ConflictException('角色编码已存在');
    }
    const role = await this.prisma.role.create({
      data: { name: dto.roleName, code: dto.roleCode, remark: dto.roleDesc, status: dto.status === '2' ? 2 : 1 },
    });
    this.log.info('create role success', { id: role.id, roleCode: dto.roleCode });
    return null;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      this.log.warn('update role failed - not found', { id });
      throw new NotFoundException('角色不存在');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: { name: dto.roleName, remark: dto.roleDesc, status: dto.status === '2' ? 2 : 1 },
      });
      if (dto.menuIds !== undefined) {
        await tx.roleMenu.deleteMany({ where: { roleId: id } });
        if (dto.menuIds.length) {
          await tx.roleMenu.createMany({
            data: dto.menuIds.map((menuId) => ({ roleId: id, menuId })),
          });
        }
      }
    });
    this.log.info('update role success', { id, menuCount: dto.menuIds?.length });
    return null;
  }

  async remove(id: string) {
    await this.prisma.roleMenu.deleteMany({ where: { roleId: id } });
    await this.prisma.userRole.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });
    this.log.info('remove role success', { id });
    return null;
  }
}
