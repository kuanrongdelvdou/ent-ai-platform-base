import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RouteService {
  constructor(private prisma: PrismaService) {}

  getConstantRoutes() {
    return [
      { id: '1', name: 'login', path: '/login', component: 'layout.blank$view.login', meta: { title: '登录', constant: true, hideInMenu: true } },
      { id: '2', name: '403', path: '/403', component: 'layout.blank$view.403', meta: { title: '无权限', constant: true, hideInMenu: true } },
      { id: '3', name: '404', path: '/404', component: 'layout.blank$view.404', meta: { title: '页面不存在', constant: true, hideInMenu: true } },
      { id: '4', name: '500', path: '/500', component: 'layout.blank$view.500', meta: { title: '服务器错误', constant: true, hideInMenu: true } },
    ];
  }

  async isRouteExist(routeName: string): Promise<boolean> {
    const menu = await this.prisma.menu.findFirst({ where: { name: routeName, status: 1 } });
    return menu !== null;
  }

  async getUserRoutes(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { select: { roleId: true } } },
    });

    const roleIds = user?.userRoles.map((ur) => ur.roleId) ?? [];

    const menus = await this.prisma.menu.findMany({
      where: {
        type: { in: [1, 2] },
        status: 1,
        roleMenus: { some: { roleId: { in: roleIds } } },
      },
      orderBy: { sort: 'asc' },
    });

    const routes = this.buildRoutes(menus, null);

    return { routes, home: 'home' };
  }

  private buildRoutes(menus: any[], parentId: string | null): any[] {
    return menus
      .filter((m) => m.parentId === parentId)
      .map((m) => {
        const children = this.buildRoutes(menus, m.id);
        const route: any = {
          id: m.id,
          name: m.name,
          path: m.path ?? '',
          component: this.normalizeComponent(m.component ?? '', parentId),
          meta: {
            title: m.name,
            i18nKey: `route.${this.getI18nRouteName(m.name)}`,
            icon: m.icon ?? undefined,
            order: m.sort,
            hideInMenu: false,
          },
        };

        if (children.length) {
          route.children = children;
        }

        return route;
      });
  }

  private normalizeComponent(component: string, parentId: string | null) {
    if (!parentId || !component.includes('$')) {
      return component;
    }

    return component.split('$').at(-1) ?? component;
  }

  private getI18nRouteName(name: string) {
    const names: Record<string, string> = {
      monitor_operation_log: 'monitor_operation-log',
      monitor_login_log: 'monitor_login-log',
    };

    return names[name] ?? name;
  }
}
