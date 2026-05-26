import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AppLoggerService } from '../common/logger/app-logger.service';

@Injectable()
export class AuthService {
  private readonly log = new AppLoggerService('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(userName: string, password: string) {
    this.log.info('login attempt', { userName });
    const user = await this.prisma.user.findUnique({ where: { username: userName } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      this.log.warn('login failed - invalid credentials', { userName });
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== 1) {
      this.log.warn('login failed - account disabled', { userName });
      throw new UnauthorizedException('账号已被禁用');
    }
    this.log.info('login success', { userId: user.id, userName });
    return this.generateTokens(user.id, user.username);
  }

  async getUserInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new UnauthorizedException('用户不存在');

    const roles = user.userRoles.map((ur) => ur.role.code);
    const roleIds = user.userRoles.map((ur) => ur.roleId);

    const buttonMenus = await this.prisma.menu.findMany({
      where: {
        type: 3,
        roleMenus: { some: { roleId: { in: roleIds } } },
      },
    });
    const buttons = buttonMenus.map((m) => m.permission).filter(Boolean) as string[];

    return { userId: user.id, userName: user.username, roles, buttons };
  }

  async refreshToken(token: string) {
    try {
      const secret = this.config.get<string>('JWT_REFRESH_SECRET') || this.config.get<string>('JWT_SECRET');
      const payload = this.jwt.verify(token, { secret });
      this.log.debug('refreshToken success', { userId: payload.sub });
      return this.generateTokens(payload.sub, payload.username);
    } catch (err) {
      this.log.warn('refreshToken failed', { error: String(err) });
      throw new UnauthorizedException('refreshToken 无效或已过期');
    }
  }

  private generateTokens(userId: string, username: string) {
    const payload = { sub: userId, username };
    const secret = this.config.get<string>('JWT_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') || secret;

    return {
      token: this.jwt.sign(payload, {
        secret,
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') || '7d') as any,
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: refreshSecret,
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '30d') as any,
      }),
    };
  }
}
