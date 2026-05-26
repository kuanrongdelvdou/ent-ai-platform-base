import { Module } from '@nestjs/common';
import { UserService } from './user/user.service';
import { UserController } from './user/user.controller';
import { RoleService } from './role/role.service';
import { RoleController } from './role/role.controller';
import { MenuService } from './menu/menu.service';
import { MenuController } from './menu/menu.controller';
import { DeptService } from './dept/dept.service';
import { DeptController } from './dept/dept.controller';
import { DictService } from './dict/dict.service';
import { DictController } from './dict/dict.controller';
import { SysConfigService } from './config/config.service';
import { SysConfigController } from './config/config.controller';
import { LogService } from './log/log.service';
import { LogController } from './log/log.controller';

@Module({
  providers: [UserService, RoleService, MenuService, DeptService, DictService, SysConfigService, LogService],
  controllers: [UserController, RoleController, MenuController, DeptController, DictController, SysConfigController, LogController],
})
export class SystemManageModule {}
