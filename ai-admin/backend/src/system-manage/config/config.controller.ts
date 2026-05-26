import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SysConfigService } from './config.service';
import { CreateConfigDto, UpdateConfigDto } from './config.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OperationLog } from '../../common/decorators/operation-log.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('系统参数')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systemManage')
export class SysConfigController {
  constructor(private configService: SysConfigService) {}

  @Get('getConfigList')
  getConfigList() {
    return this.configService.getList();
  }

  @Permissions('config:add')
  @OperationLog('系统参数', '新增参数')
  @Post('addConfig')
  addConfig(@Body() dto: CreateConfigDto) {
    return this.configService.create(dto);
  }

  @Permissions('config:edit')
  @OperationLog('系统参数', '编辑参数')
  @Put('updateConfig/:id')
  updateConfig(@Param('id') id: string, @Body() dto: UpdateConfigDto) {
    return this.configService.update(id, dto);
  }

  @Permissions('config:delete')
  @OperationLog('系统参数', '删除参数')
  @Delete('deleteConfig/:id')
  deleteConfig(@Param('id') id: string) {
    return this.configService.remove(id);
  }
}
