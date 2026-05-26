import { SetMetadata } from '@nestjs/common';

export const OPERATION_LOG_KEY = 'operation_log';

export interface OperationLogMeta {
  module: string;
  action: string;
}

export const OperationLog = (module: string, action: string) =>
  SetMetadata(OPERATION_LOG_KEY, { module, action } satisfies OperationLogMeta);
