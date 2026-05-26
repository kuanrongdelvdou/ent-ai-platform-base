import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new AppLoggerService('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      if (Array.isArray(message)) message = message[0];
    }

    if (status >= 500) {
      this.log.error(`${request.method} ${request.url} → ${status}`, exception);
    } else {
      this.log.warn(`${request.method} ${request.url} → ${status} ${message}`);
    }

    response.status(status).json({
      code: status,
      msg: message,
      data: null,
    });
  }
}
