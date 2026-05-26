import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeptDto, UpdateDeptDto } from './dept.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class DeptService {
  private readonly log = new AppLoggerService('DeptService');

  constructor(private prisma: PrismaService) {}

  async getTree() {
    this.log.debug('getTree');
    const depts = await this.prisma.department.findMany({
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
    return this.buildTree(depts, null);
  }

  async getList() {
    const depts = await this.prisma.department.findMany({
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
    return depts.map((d) => this.toDto(d));
  }

  async create(dto: CreateDeptDto) {
    const dept = await this.prisma.department.create({
      data: {
        parentId: dto.parentId ?? null,
        name: dto.name,
        sort: dto.sort ?? 0,
        leaderId: dto.leaderId ?? null,
        status: dto.status === '2' ? 2 : 1,
      },
    });
    this.log.info('create dept success', { id: dept.id, name: dto.name });
    return null;
  }

  async update(id: string, dto: UpdateDeptDto) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      this.log.warn('update dept failed - not found', { id });
      throw new NotFoundException('部门不存在');
    }
    await this.prisma.department.update({
      where: { id },
      data: {
        parentId: dto.parentId ?? null,
        name: dto.name,
        sort: dto.sort ?? 0,
        leaderId: dto.leaderId ?? null,
        status: dto.status === '2' ? 2 : 1,
      },
    });
    this.log.info('update dept success', { id });
    return null;
  }

  async remove(id: string) {
    await this.prisma.department.delete({ where: { id } });
    this.log.info('remove dept success', { id });
    return null;
  }

  private toDto(d: any) {
    return {
      id: d.id,
      parentId: d.parentId,
      name: d.name,
      sort: d.sort,
      leaderId: d.leaderId,
      status: d.status === 1 ? '1' : '2',
      createTime: d.createdAt.toISOString(),
      updateTime: d.updatedAt.toISOString(),
    };
  }

  private buildTree(depts: any[], parentId: string | null): any[] {
    return depts
      .filter((d) => d.parentId === parentId)
      .map((d) => ({ ...this.toDto(d), children: this.buildTree(depts, d.id) }));
  }
}
