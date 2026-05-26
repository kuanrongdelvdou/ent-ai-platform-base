import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserSearchDto } from './user.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OperationLog } from '../../common/decorators/operation-log.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('用户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systemManage')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('getUserList')
  getList(@Query() dto: UserSearchDto) {
    return this.userService.getList(dto);
  }

  @Permissions('user:add')
  @OperationLog('用户管理', '新增用户')
  @Post('addUser')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Permissions('user:edit')
  @OperationLog('用户管理', '编辑用户')
  @Put('updateUser/:id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Permissions('user:delete')
  @OperationLog('用户管理', '删除用户')
  @Delete('deleteUser/:id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
