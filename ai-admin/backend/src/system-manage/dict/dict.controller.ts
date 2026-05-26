import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DictService } from './dict.service';
import { CreateDictTypeDto, UpdateDictTypeDto, CreateDictItemDto, UpdateDictItemDto } from './dict.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OperationLog } from '../../common/decorators/operation-log.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('字典管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systemManage')
export class DictController {
  constructor(private dictService: DictService) {}

  @Get('getDictTypeList')
  getDictTypeList() {
    return this.dictService.getTypeList();
  }

  @Permissions('dict:add')
  @OperationLog('字典管理', '新增字典类型')
  @Post('addDictType')
  addDictType(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto);
  }

  @Permissions('dict:edit')
  @OperationLog('字典管理', '编辑字典类型')
  @Put('updateDictType/:id')
  updateDictType(@Param('id') id: string, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(id, dto);
  }

  @Permissions('dict:delete')
  @OperationLog('字典管理', '删除字典类型')
  @Delete('deleteDictType/:id')
  deleteDictType(@Param('id') id: string) {
    return this.dictService.removeType(id);
  }

  @Get('getDictItemList')
  getDictItemList(@Query('dictTypeId') dictTypeId: string) {
    return this.dictService.getItemList(dictTypeId);
  }

  @Permissions('dict:add')
  @OperationLog('字典管理', '新增字典数据')
  @Post('addDictItem')
  addDictItem(@Body() dto: CreateDictItemDto) {
    return this.dictService.createItem(dto);
  }

  @Permissions('dict:edit')
  @OperationLog('字典管理', '编辑字典数据')
  @Put('updateDictItem/:id')
  updateDictItem(@Param('id') id: string, @Body() dto: UpdateDictItemDto) {
    return this.dictService.updateItem(id, dto);
  }

  @Permissions('dict:delete')
  @OperationLog('字典管理', '删除字典数据')
  @Delete('deleteDictItem/:id')
  deleteDictItem(@Param('id') id: string) {
    return this.dictService.removeItem(id);
  }
}
