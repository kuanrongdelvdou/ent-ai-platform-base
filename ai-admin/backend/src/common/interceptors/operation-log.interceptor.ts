import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { OPERATION_LOG_KEY, OperationLogMeta } from '../decorators/operation-log.decorator';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  private readonly log = new AppLoggerService('OperationLogInterceptor');

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return next.handle();
    }

    const meta = this.reflector.get<OperationLogMeta>(OPERATION_LOG_KEY, context.getHandler());
    if (!meta) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.saveLog(meta, request, 200, startTime),
        error: (error) => this.saveLog(meta, request, error?.status || 500, startTime),
      }),
    );
  }

  private saveLog(meta: OperationLogMeta, request: any, responseCode: number, startTime: number) {
    const user = request.user;
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor || request.ip || '';

    this.prisma.operationLog
      .create({
        data: {
          userId: user?.userId || null,
          username: user?.username || null,
          module: meta.module,
          action: meta.action,
          method: request.method,
          url: request.originalUrl || request.url,
          ip,
          requestBody: request.body || null,
          responseCode,
          duration: Date.now() - startTime,
        },
      })
      .catch((error) => this.log.error('save operation log failed', error));
  }
}
