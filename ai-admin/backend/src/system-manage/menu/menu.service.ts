import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuDto, UpdateMenuDto } from './menu.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class MenuService {
  private readonly log = new AppLoggerService('MenuService');

  constructor(private prisma: PrismaService) {}

  async getList() {
    const menus = await this.prisma.menu.findMany({ orderBy: [{ parentId: 'asc' }, { sort: 'asc' }] });
    const total = menus.length;
    const records = menus.map((m) => this.toDto(m));
    return { current: 1, size: total, total, records };
  }

  async getMenuTree() {
    const menus = await this.prisma.menu.findMany({
      where: { status: 1 },
      orderBy: [{ parentId: 'asc' }, { sort: 'asc' }],
    });
    return this.buildTree(menus, null);
  }

  async getAllPages() {
    const menus = await this.prisma.menu.findMany({ where: { type: 2, status: 1 } });
    return menus.map((m) => m.name);
  }

  async create(dto: CreateMenuDto) {
    const menu = await this.prisma.menu.create({
      data: {
        parentId: dto.parentId ?? null,
        type: dto.menuType === '2' ? 2 : 1,
        name: dto.menuName,
        path: dto.routePath,
        component: dto.component,
        icon: dto.icon,
        sort: dto.order ?? 0,
        status: dto.status === '2' ? 2 : 1,
      },
    });
    this.log.info('create menu success', { id: menu.id, name: dto.menuName });
    return null;
  }

  async update(id: string, dto: UpdateMenuDto) {
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      this.log.warn('update menu failed - not found', { id });
      throw new NotFoundException('菜单不存在');
    }
    await this.prisma.menu.update({
      where: { id },
      data: {
        parentId: dto.parentId ?? null,
        type: dto.menuType === '2' ? 2 : 1,
        name: dto.menuName,
        path: dto.routePath,
        component: dto.component,
        icon: dto.icon,
        sort: dto.order ?? 0,
        status: dto.status === '2' ? 2 : 1,
      },
    });
    this.log.info('update menu success', { id });
    return null;
  }

  async remove(id: string) {
    await this.prisma.roleMenu.deleteMany({ where: { menuId: id } });
    await this.prisma.menu.delete({ where: { id } });
    this.log.info('remove menu success', { id });
    return null;
  }

  private toDto(m: any) {
    return {
      id: m.id,
      parentId: m.parentId,
      menuType: m.type === 2 ? '2' : '1',
      menuName: m.name,
      routeName: m.name,
      routePath: m.path ?? '',
      component: m.component ?? '',
      icon: m.icon ?? '',
      iconType: '1',
      order: m.sort,
      status: m.status === 1 ? '1' : '2',
      createTime: m.createdAt.toISOString(),
      updateTime: m.updatedAt.toISOString(),
      createBy: '',
      updateBy: '',
      buttons: null,
      children: null,
    };
  }

  private buildTree(menus: any[], parentId: string | null): any[] {
    return menus
      .filter((m) => m.parentId === parentId)
      .map((m) => ({
        id: m.id,
        label: m.name,
        pId: m.parentId,
        children: this.buildTree(menus, m.id),
      }));
  }
}
