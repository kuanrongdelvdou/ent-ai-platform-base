import { Logger } from '@nestjs/common';

export class AppLoggerService {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  info(message: string, data?: unknown): void {
    this.logger.log(data !== undefined ? `${message} ${JSON.stringify(data)}` : message);
  }

  warn(message: string, data?: unknown): void {
    this.logger.warn(data !== undefined ? `${message} ${JSON.stringify(data)}` : message);
  }

  debug(message: string, data?: unknown): void {
    this.logger.debug(data !== undefined ? `${message} ${JSON.stringify(data)}` : message);
  }

  error(message: string, error?: unknown): void {
    const stack = error instanceof Error ? error.stack : String(error ?? '');
    this.logger.error(message, stack);
  }
}
