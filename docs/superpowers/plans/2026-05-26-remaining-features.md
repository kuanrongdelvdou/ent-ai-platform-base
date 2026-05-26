# 剩余功能实现计划

## 2026-05-26 审核修订

执行范围调整为当前真正缺口：

- 操作日志：新增全局 Interceptor 和 `@OperationLog` 装饰器，只记录 POST/PUT/DELETE。
- RBAC：新增 `@Permissions` 和 `PermissionsGuard`，`super` 角色放行；普通角色按 type=3 菜单的 `permission` 判断。
- 种子数据：补充按钮权限菜单，但不强制重置数据库。
- 前端权限：新增 `v-permission`，同时对 TSX 表格操作按钮用 `hasAuth()` 条件渲染。
- Swagger：先实现 `/api-docs` 可访问、Bearer 鉴权、Controller 分组；DTO 字段级详细描述后续再补，不阻塞本阶段。

不执行的内容：

- 不创建新认证体系。
- 不引入 Redis 权限缓存。
- 不做租户/数据权限扩展。
- 不在此计划内重构所有页面 UI。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Admin 系统剩余 3 项功能：操作日志自动记录、RBAC 按钮级权限控制（前后端）、Swagger API 文档

**Architecture:** 操作日志通过 NestJS Interceptor 全局拦截写操作自动记录；RBAC 通过自定义 @Permissions 装饰器 + PermissionsGuard 实现后端接口保护，前端通过 v-permission 指令控制按钮显隐；Swagger 通过 @nestjs/swagger 自动生成

**Tech Stack:** NestJS, Prisma 7, Vue 3 custom directive, @nestjs/swagger

---

## 当前状态

- `OperationLog` 模型已存在（Prisma schema）
- `log.service.ts` 已有查询接口（getOperationLogList / getLoginLogList）
- `TransformInterceptor` 已存在，可参照其模式
- `getUserInfo` 已返回 `buttons: string[]`（从 Menu type=3 的 permission 字段提取）
- 前端 `useAuth().hasAuth(codes)` 已存在，可直接使用
- 前端无 v-permission 指令

---

## Task 1: 操作日志 Interceptor

**Files:**
- Create: `ai-admin/backend/src/common/interceptors/operation-log.interceptor.ts`
- Modify: `ai-admin/backend/src/app.module.ts`（全局注册）

**设计决策：**
- 只记录写操作（POST/PUT/DELETE），GET 不记录
- 通过 Interceptor 在响应后异步写入，不阻塞主请求
- 从 JWT payload 获取 userId/username
- module 和 action 通过自定义装饰器 @OperationLog('模块', '操作') 标注

---

- [ ] **Step 1: 创建 @OperationLog 装饰器**

```typescript
// ai-admin/backend/src/common/decorators/operation-log.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const OPERATION_LOG_KEY = 'operation_log';

export interface OperationLogMeta {
  module: string;
  action: string;
}

export const OperationLog = (module: string, action: string) =>
  SetMetadata(OPERATION_LOG_KEY, { module, action } as OperationLogMeta);
```

- [ ] **Step 2: 创建 OperationLogInterceptor**

```typescript
// ai-admin/backend/src/common/interceptors/operation-log.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { OPERATION_LOG_KEY, OperationLogMeta } from '../decorators/operation-log.decorator';
import { AppLoggerService } from '../logger/app-logger.service';

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  private readonly log = new AppLoggerService('OperationLog');

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // 只记录写操作
    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return next.handle();
    }

    const meta = this.reflector.get<OperationLogMeta>(
      OPERATION_LOG_KEY,
      context.getHandler(),
    );

    // 没有 @OperationLog 装饰器的接口不记录
    if (!meta) {
      return next.handle();
    }

    const startTime = Date.now();
    const user = request.user;
    const ip = request.ip || request.headers['x-forwarded-for'] || '';

    return next.handle().pipe(
      tap({
        next: () => {
          this.saveLog(meta, user, request, ip, 200, startTime);
        },
        error: (err) => {
          const code = err?.status || 500;
          this.saveLog(meta, user, request, ip, code, startTime);
        },
      }),
    );
  }

  private saveLog(
    meta: OperationLogMeta,
    user: any,
    request: any,
    ip: string,
    responseCode: number,
    startTime: number,
  ) {
    const duration = Date.now() - startTime;
    this.prisma.operationLog
      .create({
        data: {
          userId: user?.userId || null,
          username: user?.username || null,
          module: meta.module,
          action: meta.action,
          method: request.method,
          url: request.url,
          ip,
          requestBody: request.body || null,
          responseCode,
          duration,
        },
      })
      .then(() => {
        this.log.debug('操作日志已记录', { module: meta.module, action: meta.action });
      })
      .catch((err) => {
        this.log.error('操作日志记录失败', err);
      });
  }
}
```

- [ ] **Step 3: 全局注册 Interceptor**

在 `app.module.ts` 中添加：

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';

@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: OperationLogInterceptor },
  ],
})
```

- [ ] **Step 4: 在 Controller 上添加 @OperationLog 装饰器**

示例（user.controller.ts）：
```typescript
@OperationLog('用户管理', '新增用户')
@Post('addUser')
addUser(@Body() dto: AddUserDto) { ... }

@OperationLog('用户管理', '更新用户')
@Put('updateUser/:id')
updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) { ... }

@OperationLog('用户管理', '删除用户')
@Delete('deleteUser/:id')
deleteUser(@Param('id') id: string) { ... }
```

对所有写操作接口添加（用户/角色/菜单/部门/字典/参数）。

- [ ] **Step 5: 验证**

```bash
# 登录后执行一次新增用户操作
# 然后查询操作日志
curl -s "http://localhost:3000/systemManage/getOperationLogList?current=1&size=10" \
  -H "Authorization: Bearer $TOKEN"
```

预期：返回刚才的操作记录，包含 module="用户管理", action="新增用户"

---

## Task 2: RBAC 按钮级权限 — 后端

**Files:**
- Create: `ai-admin/backend/src/common/decorators/permissions.decorator.ts`
- Create: `ai-admin/backend/src/common/guards/permissions.guard.ts`
- Modify: `ai-admin/backend/src/auth/auth.service.ts`（getUserInfo 已返回 buttons）
- Modify: 各 Controller（添加 @Permissions 装饰器）

**设计决策：**
- 权限标识格式：`模块:操作`（如 `user:add`, `user:edit`, `user:delete`）
- Guard 从 JWT 获取 userId → 查询用户权限集合 → 判断是否包含所需权限
- super 角色拥有所有权限（跳过检查）

---

- [ ] **Step 1: 创建 @Permissions 装饰器**

```typescript
// ai-admin/backend/src/common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

- [ ] **Step 2: 创建 PermissionsGuard**

```typescript
// ai-admin/backend/src/common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    // 没有 @Permissions 装饰器，放行
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) return false;

    // 查询用户角色
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    // super 角色拥有所有权限
    if (userRoles.some((ur) => ur.role.code === 'super')) {
      return true;
    }

    // 查询用户所有按钮权限
    const roleIds = userRoles.map((ur) => ur.roleId);
    const menus = await this.prisma.menu.findMany({
      where: {
        type: 3,
        status: 1,
        roleMenus: { some: { roleId: { in: roleIds } } },
      },
      select: { permission: true },
    });

    const userPermissions = menus
      .map((m) => m.permission)
      .filter(Boolean) as string[];

    return requiredPermissions.every((p) => userPermissions.includes(p));
  }
}
```

- [ ] **Step 3: 全局注册 PermissionsGuard**

在 `app.module.ts` 中添加：

```typescript
import { APP_GUARD } from '@nestjs/core';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
```

- [ ] **Step 4: 在 Controller 上添加 @Permissions**

```typescript
// user controller
@Permissions('user:add')
@Post('addUser')

@Permissions('user:edit')
@Put('updateUser/:id')

@Permissions('user:delete')
@Delete('deleteUser/:id')

// role controller
@Permissions('role:add')
@Post('addRole')

@Permissions('role:edit')
@Put('updateRole/:id')

@Permissions('role:delete')
@Delete('deleteRole/:id')

// menu controller
@Permissions('menu:add')
@Post('addMenu')

@Permissions('menu:edit')
@Put('updateMenu/:id')

@Permissions('menu:delete')
@Delete('deleteMenu/:id')

// dept controller
@Permissions('dept:add')
@Post('addDept')

@Permissions('dept:edit')
@Put('updateDept/:id')

@Permissions('dept:delete')
@Delete('deleteDept/:id')

// dict controller
@Permissions('dict:add')
@Post('addDictType')

@Permissions('dict:edit')
@Put('updateDictType/:id')

@Permissions('dict:delete')
@Delete('deleteDictType/:id')

// config controller
@Permissions('config:add')
@Post('addConfig')

@Permissions('config:edit')
@Put('updateConfig/:id')

@Permissions('config:delete')
@Delete('deleteConfig/:id')
```

- [ ] **Step 5: 在种子数据中添加按钮权限菜单**

在 `seed.ts` 中为每个管理页面添加 type=3 的按钮权限记录：

```typescript
// 用户管理下的按钮权限
await prisma.menu.createMany({
  data: [
    { parentId: userMenuId, name: 'user_add', type: 3, permission: 'user:add', sort: 1, status: 1 },
    { parentId: userMenuId, name: 'user_edit', type: 3, permission: 'user:edit', sort: 2, status: 1 },
    { parentId: userMenuId, name: 'user_delete', type: 3, permission: 'user:delete', sort: 3, status: 1 },
  ],
});
// 角色、菜单、部门、字典、参数同理
```

- [ ] **Step 6: 验证后端权限**

```bash
# 用 super 角色登录 — 应该能正常操作
# 创建一个无权限的测试角色 — 操作应返回 403
```

---

## Task 3: RBAC 按钮级权限 — 前端

**Files:**
- Create: `ai-admin/frontend/src/directives/permission.ts`
- Modify: `ai-admin/frontend/src/plugins/app.ts`（注册指令）
- Modify: 各管理页面（在按钮上添加 v-permission）

**设计决策：**
- 使用 Vue 自定义指令 `v-permission`
- 指令值为权限标识字符串或数组
- 无权限时移除 DOM 元素（而非隐藏）
- 已有 `useAuth().hasAuth()` 可直接复用

---

- [ ] **Step 1: 创建 v-permission 指令**

```typescript
// ai-admin/frontend/src/directives/permission.ts
import type { App, Directive } from 'vue';
import { useAuth } from '@/hooks/business/auth';

const permissionDirective: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const { hasAuth } = useAuth();
    if (!hasAuth(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  },
};

export function setupPermissionDirective(app: App) {
  app.directive('permission', permissionDirective);
}
```

- [ ] **Step 2: 注册指令**

在 `plugins/app.ts` 中：

```typescript
import { setupPermissionDirective } from '@/directives/permission';

export function setupAppPlugins(app: App) {
  // ... existing plugins
  setupPermissionDirective(app);
}
```

- [ ] **Step 3: 在管理页面按钮上使用**

```vue
<!-- user/index.vue -->
<NButton v-permission="'user:add'" @click="handleAdd">新增</NButton>
<NButton v-permission="'user:edit'" @click="handleEdit(row)">编辑</NButton>
<NPopconfirm v-permission="'user:delete'" @positive-click="handleDelete(row.id)">
  <template #trigger><NButton>删除</NButton></template>
</NPopconfirm>
```

对所有管理页面的新增/编辑/删除按钮添加对应权限指令。

- [ ] **Step 4: 验证前端权限**

1. 用 super 角色登录 — 所有按钮可见
2. 创建一个只有查看权限的角色 — 新增/编辑/删除按钮不可见

---

## Task 4: Swagger API 文档

**Files:**
- Modify: `ai-admin/backend/src/main.ts`（配置 Swagger）
- Modify: `ai-admin/backend/package.json`（添加依赖）
- Modify: 各 Controller（添加 @ApiTags）
- Modify: 各 DTO（添加 @ApiProperty）

---

- [ ] **Step 1: 安装依赖**

```bash
cd ai-admin/backend
npm install @nestjs/swagger
```

- [ ] **Step 2: 在 main.ts 配置 Swagger**

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// 在 app.listen() 之前
const config = new DocumentBuilder()
  .setTitle('企业 AI 平台 Admin API')
  .setDescription('Admin 管理后台接口文档')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

访问：`http://localhost:3000/api-docs`

- [ ] **Step 3: 为 Controller 添加 @ApiTags**

```typescript
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('认证')
@Controller('auth')
export class AuthController { ... }

@ApiTags('路由')
@Controller('route')
export class RouteController { ... }

@ApiTags('用户管理')
@Controller('systemManage')
export class UserController { ... }

// 角色、菜单、部门、字典、参数、日志同理
```

- [ ] **Step 4: 为 DTO 添加 @ApiProperty**

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'soybean' })
  userName: string;

  @ApiProperty({ description: '密码', example: 'soybean123' })
  password: string;
}
```

对所有 DTO 文件添加 @ApiProperty 注解。

- [ ] **Step 5: 验证**

启动后端，访问 `http://localhost:3000/api-docs`，确认：
- 所有接口按模块分组显示
- 可以通过 Authorize 按钮输入 Bearer token
- 可以直接在页面上测试接口

---

## 权限标识完整列表

| 模块 | 权限标识 | 说明 |
|------|---------|------|
| 用户 | `user:add` | 新增用户 |
| 用户 | `user:edit` | 编辑用户 |
| 用户 | `user:delete` | 删除用户 |
| 角色 | `role:add` | 新增角色 |
| 角色 | `role:edit` | 编辑角色 |
| 角色 | `role:delete` | 删除角色 |
| 菜单 | `menu:add` | 新增菜单 |
| 菜单 | `menu:edit` | 编辑菜单 |
| 菜单 | `menu:delete` | 删除菜单 |
| 部门 | `dept:add` | 新增部门 |
| 部门 | `dept:edit` | 编辑部门 |
| 部门 | `dept:delete` | 删除部门 |
| 字典 | `dict:add` | 新增字典 |
| 字典 | `dict:edit` | 编辑字典 |
| 字典 | `dict:delete` | 删除字典 |
| 参数 | `config:add` | 新增参数 |
| 参数 | `config:edit` | 编辑参数 |
| 参数 | `config:delete` | 删除参数 |
