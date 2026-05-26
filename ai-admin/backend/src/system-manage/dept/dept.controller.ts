import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeptService } from './dept.service';
import { CreateDeptDto, UpdateDeptDto } from './dept.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OperationLog } from '../../common/decorators/operation-log.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('部门管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systemManage')
export class DeptController {
  constructor(private deptService: DeptService) {}

  @Get('getDeptTree')
  getDeptTree() {
    return this.deptService.getTree();
  }

  @Get('getDeptList')
  getDeptList() {
    return this.deptService.getList();
  }

  @Permissions('dept:add')
  @OperationLog('部门管理', '新增部门')
  @Post('addDept')
  addDept(@Body() dto: CreateDeptDto) {
    return this.deptService.create(dto);
  }

  @Permissions('dept:edit')
  @OperationLog('部门管理', '编辑部门')
  @Put('updateDept/:id')
  updateDept(@Param('id') id: string, @Body() dto: UpdateDeptDto) {
    return this.deptService.update(id, dto);
  }

  @Permissions('dept:delete')
  @OperationLog('部门管理', '删除部门')
  @Delete('deleteDept/:id')
  deleteDept(@Param('id') id: string) {
    return this.deptService.remove(id);
  }
}
