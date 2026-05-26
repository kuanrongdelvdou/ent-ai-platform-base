import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user ?? this.getUserFromToken(request);
    if (user && !request.user) {
      request.user = user;
    }

    const userId = user?.userId;
    if (!userId) return false;

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    if (userRoles.some((item) => item.role.code === 'super')) {
      return true;
    }

    const roleIds = userRoles.map((item) => item.roleId);
    const menus = await this.prisma.menu.findMany({
      where: {
        type: 3,
        status: 1,
        roleMenus: { some: { roleId: { in: roleIds } } },
      },
      select: { permission: true },
    });

    const permissions = menus.map((item) => item.permission).filter(Boolean) as string[];
    return required.every((item) => permissions.includes(item));
  }

  private getUserFromToken(request: any) {
    const auth = request.headers?.authorization || '';
    const [, token] = auth.split(' ');
    if (!token) return null;

    try {
      const payload = this.jwt.verify(token, { secret: this.config.get<string>('JWT_SECRET') });
      return { userId: payload.sub, username: payload.username };
    } catch {
      return null;
    }
  }
}
