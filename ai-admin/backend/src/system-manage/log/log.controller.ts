import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LogService } from './log.service';
import { OperationLogSearchDto, LoginLogSearchDto } from './log.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@ApiTags('日志管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systemManage')
export class LogController {
  constructor(private logService: LogService) {}

  @Get('getOperationLogList')
  getOperationLogList(@Query() dto: OperationLogSearchDto) {
    return this.logService.getOperationLogList(dto);
  }

  @Get('getLoginLogList')
  getLoginLogList(@Query() dto: LoginLogSearchDto) {
    return this.logService.getLoginLogList(dto);
  }
}
