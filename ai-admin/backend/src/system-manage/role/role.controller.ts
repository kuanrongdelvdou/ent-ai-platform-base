import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, RoleSearchDto } from './role.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OperationLog } from '../../common/decorators/operation-log.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('角色管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systemManage')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get('getRoleList')
  getList(@Query() dto: RoleSearchDto) {
    return this.roleService.getList(dto);
  }

  @Get('getAllRoles')
  getAllRoles() {
    return this.roleService.getAllRoles();
  }

  @Permissions('role:add')
  @OperationLog('角色管理', '新增角色')
  @Post('addRole')
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Permissions('role:edit')
  @OperationLog('角色管理', '编辑角色')
  @Put('updateRole/:id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Permissions('role:delete')
  @OperationLog('角色管理', '删除角色')
  @Delete('deleteRole/:id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}
