import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto } from './menu.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OperationLog } from '../../common/decorators/operation-log.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('菜单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('systemManage')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get('getMenuList')
  @Get('getMenuList/v2')
  getList() {
    return this.menuService.getList();
  }

  @Get('getMenuTree')
  getMenuTree() {
    return this.menuService.getMenuTree();
  }

  @Get('getAllPages')
  getAllPages() {
    return this.menuService.getAllPages();
  }

  @Permissions('menu:add')
  @OperationLog('菜单管理', '新增菜单')
  @Post('addMenu')
  create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  @Permissions('menu:edit')
  @OperationLog('菜单管理', '编辑菜单')
  @Put('updateMenu/:id')
  update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menuService.update(id, dto);
  }

  @Permissions('menu:delete')
  @OperationLog('菜单管理', '删除菜单')
  @Delete('deleteMenu/:id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
