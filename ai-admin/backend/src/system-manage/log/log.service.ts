import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationLogSearchDto, LoginLogSearchDto } from './log.dto';
import { AppLoggerService } from '../../common/logger/app-logger.service';

@Injectable()
export class LogService {
  private readonly log = new AppLoggerService('LogService');

  constructor(private prisma: PrismaService) {}

  async getOperationLogList(dto: OperationLogSearchDto) {
    const { current = 1, size = 20, username, module } = dto;
    this.log.debug('getOperationLogList', { current, size });
    const skip = (current - 1) * size;
    const where: any = {};
    if (username) where.username = { contains: username };
    if (module) where.module = { contains: module };

    const [total, list] = await Promise.all([
      this.prisma.operationLog.count({ where }),
      this.prisma.operationLog.findMany({
        where, skip, take: size, orderBy: { createdAt: 'desc' },
      }),
    ]);

    const records = list.map((l) => ({
      id: l.id, userId: l.userId, username: l.username, module: l.module,
      action: l.action, method: l.method, url: l.url, ip: l.ip,
      responseCode: l.responseCode, duration: l.duration,
      createTime: l.createdAt.toISOString(),
    }));
    return { current, size, total, records };
  }

  async getLoginLogList(dto: LoginLogSearchDto) {
    const { current = 1, size = 20, username, status } = dto;
    this.log.debug('getLoginLogList', { current, size });
    const skip = (current - 1) * size;
    const where: any = {};
    if (username) where.username = { contains: username };
    if (status) where.status = status === '1' ? 1 : 0;

    const [total, list] = await Promise.all([
      this.prisma.loginLog.count({ where }),
      this.prisma.loginLog.findMany({
        where, skip, take: size, orderBy: { createdAt: 'desc' },
      }),
    ]);

    const records = list.map((l) => ({
      id: l.id, userId: l.userId, username: l.username, ip: l.ip,
      userAgent: l.userAgent, status: l.status === 1 ? '1' : '0',
      message: l.message, createTime: l.createdAt.toISOString(),
    }));
    return { current, size, total, records };
  }
}
