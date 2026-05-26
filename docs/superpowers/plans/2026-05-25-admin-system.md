# 企业 AI 平台 Admin 系统实现计划

## 2026-05-26 审核修订

这份计划已经不是从零执行计划。当前代码中，用户、角色、菜单、部门、字典、系统参数、操作日志、登录日志的前后端基础文件均已存在。

需要修正的点：

- 不再执行 `prisma db push --force-reset`，该命令会清空数据库，不适合作为常规实施步骤。
- 启动和依赖管理统一使用 `pnpm`，不再混用 `npm` / `npx`。
- 菜单接口需要同时支持 `/systemManage/getMenuList`，前端不应依赖旧的 `/getMenuList/v2`。
- 动态路由必须返回树形结构和 `meta.i18nKey`，否则左侧菜单会显示 `system_user` 这类技术 key。
- 前端页面中不能在 template 的 `:columns` 内直接写 TSX，列定义应放到 `<script setup lang="tsx">` 中。
- 本计划中已经完成的页面搭建部分不重复执行，后续以 `2026-05-26-remaining-features.md` 为主。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成企业 AI 平台 Phase 1 的 Admin 管理后台，包括后端结构化日志、前端 8 个系统管理页面（用户/角色/菜单/部门/字典/系统参数/操作日志/登录日志），页面组件严格参照 `ai-admin/frontend-example/src/views/manage/` 的结构和模式。

**Architecture:** 后端 NestJS + Prisma 7 + PostgreSQL，使用 `@nestjs/common` Logger 实现分级日志（INFO/WARN/DEBUG/ERROR）；前端 Soybean Admin (Vue 3 + Naive UI)，每个页面拆分为 index.vue + modules/ 子组件，与 frontend-example 保持一致的文件结构。

**Tech Stack:** NestJS, Prisma 7, PostgreSQL, Vue 3, Naive UI, TypeScript, Pinia, Vite

---

## 重要约束

1. **前端页面模板**：严格参照 `ai-admin/frontend-example/src/views/manage/` 的组件结构，不得自创不存在的组件
2. **后端日志**：使用 NestJS 内置 `Logger`，分 INFO/WARN/DEBUG/ERROR 级别，关键操作（登录、CRUD、异常）必须有日志
3. **代码结构**：每个页面拆分为 index.vue + modules/（search、operate-drawer/modal），后端每个 service 方法有入参/出参日志
4. **类型声明**：直接复用 `frontend-example/src/typings/api/system-manage.d.ts` 的类型结构

---

## 当前状态

### 已完成 ✅

**后端（`ai-admin/backend/`）**
- Prisma schema：User, Role, Menu, UserRole, RoleMenu 等全部模型
- `PrismaService`：使用 `@prisma/adapter-pg`（Prisma 7 要求）
- `AuthModule`：JWT 登录、getUserInfo、refreshToken
- `RouteModule`：getConstantRoutes、getUserRoutes
- `SystemManageModule`：User/Role/Menu CRUD
- 全局响应包装 `TransformInterceptor`：`{code:200,msg:"ok",data:...}`
- 全局异常过滤器 `AllExceptionsFilter`：`{code:status,msg:...,data:null}`
- CORS：`app.enableCors({ origin: true, credentials: true })`
- 种子数据：用户 `soybean/soybean123`，角色 `super`，基础菜单

**前端（`ai-admin/frontend/`）**
- `.env`：`VITE_SERVICE_SUCCESS_CODE=200`，`VITE_AUTH_ROUTE_MODE=dynamic`
- `.env.test`：`VITE_SERVICE_BASE_URL=http://localhost:3000`
- Auth store 与后端 API 契约匹配

### 待完成 ⏳

全部完成 ✅

### 已完成 ✅

**后端（`ai-admin/backend/`）**
- Prisma schema：User, Role, Menu, Dept, DictType/DictItem, Config, OperationLog, LoginLog
- `PrismaService`：使用 `@prisma/adapter-pg`（Prisma 7 要求）
- `AuthModule`：JWT 登录、getUserInfo、refreshToken（含结构化日志）
- `RouteModule`：getConstantRoutes、getUserRoutes
- `SystemManageModule`：User/Role/Menu/Dept/Dict/Config/Log CRUD
- `AppLoggerService`：INFO/WARN/DEBUG/ERROR 分级日志
- 全局响应包装 `TransformInterceptor`：`{code:200,msg:"ok",data:...}`
- 全局异常过滤器 `AllExceptionsFilter`：含日志输出
- CORS：`app.enableCors({ origin: true, credentials: true })`
- 种子数据：3 个目录（系统管理/系统监控/系统工具）+ 8 个子菜单，component 格式正确

**前端（`ai-admin/frontend/`）**
- `src/typings/api/system-manage.d.ts`：全部模块类型（UUID string id）
- `src/service/api/system-manage.ts`：全部模块 API 函数
- `src/views/system/user/`：用户管理（index + search + operate-drawer）
- `src/views/system/role/`：角色管理（index + operate-drawer + menu-auth-modal）
- `src/views/system/menu/`：菜单管理（index + operate-modal + shared.ts）
- `src/views/system/dept/`：部门管理（index + operate-modal）
- `src/views/tool/dict/`：字典管理（index + type-modal + item-modal）
- `src/views/tool/config/`：系统参数（index + config-modal）
- `src/views/monitor/operation-log/`：操作日志（只读）
- `src/views/monitor/login-log/`：登录日志（只读）

---

## API 契约

所有接口响应：`{ code: 200, msg: "ok", data: T }`

| Method | Path | 说明 |
|--------|------|------|
| POST | `/auth/login` | `{userName,password}` → `{token,refreshToken}` |
| GET | `/auth/getUserInfo` | Bearer → `{userId,userName,roles[],buttons[]}` |
| POST | `/auth/refreshToken` | `{refreshToken}` → `{token,refreshToken}` |
| GET | `/route/getConstantRoutes` | 公开常量路由 |
| GET | `/route/getUserRoutes` | JWT → `{routes[],home}` |
| GET | `/systemManage/getUserList` | `{current,size,...}` → `PaginatingQueryRecord<User>` |
| POST | `/systemManage/addUser` | — |
| PUT | `/systemManage/updateUser/:id` | — |
| DELETE | `/systemManage/deleteUser/:id` | — |
| GET | `/systemManage/getRoleList` | `{current,size,...}` → `PaginatingQueryRecord<Role>` |
| GET | `/systemManage/getAllRoles` | → `AllRole[]` |
| POST | `/systemManage/addRole` | — |
| PUT | `/systemManage/updateRole/:id` | — |
| DELETE | `/systemManage/deleteRole/:id` | — |
| GET | `/systemManage/getMenuList` | → `PaginatingQueryRecord<Menu>` |
| GET | `/systemManage/getMenuTree` | → `MenuTree[]` |
| GET | `/systemManage/getAllPages` | → `string[]` |
| POST | `/systemManage/addMenu` | — |
| PUT | `/systemManage/updateMenu/:id` | — |
| DELETE | `/systemManage/deleteMenu/:id` | — |

---

## 文件结构

### 新建文件
```
ai-admin/backend/src/common/logger/
  app-logger.service.ts          # 封装 NestJS Logger，提供 info/warn/debug/error

ai-admin/frontend/src/
  typings/api/system-manage.d.ts # 类型声明（复用 example）
  service/api/system-manage.ts   # API 函数（复用 example）
  views/system/
    user/
      index.vue                  # 用户列表页（参照 manage/user/index.vue）
      modules/
        user-search.vue          # 搜索栏（参照 manage/user/modules/user-search.vue）
        user-operate-drawer.vue  # 新增/编辑抽屉（参照 manage/user/modules/user-operate-drawer.vue）
    role/
      index.vue                  # 角色列表页（参照 manage/role/index.vue）
      modules/
        role-search.vue          # 搜索栏（参照 manage/role/modules/role-search.vue）
        role-operate-drawer.vue  # 新增/编辑抽屉（参照 manage/role/modules/role-operate-drawer.vue）
        menu-auth-modal.vue      # 菜单权限弹窗（参照 manage/role/modules/menu-auth-modal.vue）
    menu/
      index.vue                  # 菜单列表页（参照 manage/menu/index.vue）
      modules/
        menu-operate-modal.vue   # 新增/编辑弹窗（参照 manage/menu/modules/menu-operate-modal.vue）
```

### 修改文件
```
ai-admin/backend/src/
  auth/auth.service.ts           # 添加登录日志
  system-manage/user/user.service.ts   # 添加 CRUD 日志
  system-manage/role/role.service.ts   # 添加 CRUD 日志
  system-manage/menu/menu.service.ts   # 添加 CRUD 日志
  common/filters/all-exceptions.filter.ts  # 添加 ERROR 日志
  prisma/seed.ts                 # 修正 component 字段

ai-admin/frontend/src/
  service/api/index.ts           # 导出 system-manage
```

---

---

## Task 1: 后端结构化日志

**Files:**
- Create: `ai-admin/backend/src/common/logger/app-logger.service.ts`
- Modify: `ai-admin/backend/src/auth/auth.service.ts`
- Modify: `ai-admin/backend/src/system-manage/user/user.service.ts`
- Modify: `ai-admin/backend/src/system-manage/role/role.service.ts`
- Modify: `ai-admin/backend/src/system-manage/menu/menu.service.ts`
- Modify: `ai-admin/backend/src/common/filters/all-exceptions.filter.ts`

- [ ] **Step 1: 创建 AppLoggerService**

```typescript
// ai-admin/backend/src/common/logger/app-logger.service.ts
import { Logger } from '@nestjs/common';

export class AppLoggerService {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  info(message: string, data?: unknown) {
    this.logger.log(data !== undefined ? `${message} ${JSON.stringify(data)}` : message);
  }

  warn(message: string, data?: unknown) {
    this.logger.warn(data !== undefined ? `${message} ${JSON.stringify(data)}` : message);
  }

  debug(message: string, data?: unknown) {
    this.logger.debug(data !== undefined ? `${message} ${JSON.stringify(data)}` : message);
  }

  error(message: string, error?: unknown) {
    const stack = error instanceof Error ? error.stack : String(error ?? '');
    this.logger.error(message, stack);
  }
}
```

- [ ] **Step 2: 在 auth.service.ts 添加日志**

在 AuthService 顶部加：
```typescript
private readonly log = new AppLoggerService('AuthService');
```

login 方法中：
```typescript
this.log.info('login attempt', { userName });
// 失败时：
this.log.warn('login failed - invalid credentials', { userName });
// 成功时：
this.log.info('login success', { userId: user.id, userName });
```

- [ ] **Step 3: 在 user/role/menu service 添加日志**

每个 service 顶部加 `private readonly log = new AppLoggerService('UserService');`（对应改名）

各方法加入：
- `getList`：`this.log.debug('getList', params)`
- `create`：`this.log.info('create success', { id: result.id })`（密码字段不记录）
- `update`：`this.log.info('update', { id })`
- `remove`：`this.log.info('remove', { id })`

- [ ] **Step 4: 在 AllExceptionsFilter 添加日志**

```typescript
private readonly log = new AppLoggerService('ExceptionFilter');

// catch 方法中，response.status() 之前：
if (status >= 500) {
  this.log.error(`${request.method} ${request.url} → ${status}`, exception);
} else {
  this.log.warn(`${request.method} ${request.url} → ${status} ${message}`);
}
```

- [ ] **Step 5: 重新构建验证**

```bash
cd ai-admin/backend && npm run start:dev
```

登录时控制台应看到：`[AuthService] login attempt {"userName":"soybean"}`

---

## Task 2: 修正种子数据 component 字段

**Files:**
- Modify: `ai-admin/backend/prisma/seed.ts`

- [ ] **Step 1: 修改菜单 component 字段**

将菜单创建部分的 component 改为 Soybean Admin 动态路由格式：
- 系统管理目录：`component: 'layout.base'`
- 用户管理页面：`component: 'layout.base$view.system_user'`
- 角色管理页面：`component: 'layout.base$view.system_role'`
- 菜单管理页面：`component: 'layout.base$view.system_menu'`

同时将菜单 name 改为路由名称：`system`、`system_user`、`system_role`、`system_menu`

- [ ] **Step 2: 重置数据库并重新 seed**

```bash
cd ai-admin/backend
pnpm seed
```

预期输出：`Seed 完成`

- [ ] **Step 3: 验证路由接口**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"userName\":\"soybean\",\"password\":\"soybean123\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
curl -s http://localhost:3000/route/getUserRoutes -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

预期：routes 中包含 `"component": "layout.base$view.system_user"`

---

## Task 3: 前端类型声明

**Files:**
- Create: `ai-admin/frontend/src/typings/api/system-manage.d.ts`
- Modify: `ai-admin/frontend/src/typings/api/common.d.ts`

- [ ] **Step 1: 将 common.d.ts 的 id 改为 string**

```typescript
type CommonRecord<T = any> = {
  id: string;  // 原为 number，改为 string（后端用 UUID）
  createBy: string;
  createTime: string;
  updateBy: string;
  updateTime: string;
  status: EnableStatus | null;
} & T;
```

- [ ] **Step 2: 创建 system-manage.d.ts**

复用 `frontend-example/src/typings/api/system-manage.d.ts`，修改：
- `Menu.parentId`：`number` → `string | null`
- `MenuTree.id`：`number` → `string`
- `MenuTree.pId`：`number` → `string | null`

---

## Task 4: 前端 API service

**Files:**
- Create: `ai-admin/frontend/src/service/api/system-manage.ts`
- Modify: `ai-admin/frontend/src/service/api/index.ts`

- [ ] **Step 1: 创建 system-manage.ts**

复用 `frontend-example/src/service/api/system-manage.ts`，补充 add/update/delete 方法（见 API 契约表）。

- [ ] **Step 2: 更新 index.ts**

```typescript
export * from './auth';
export * from './route';
export * from './system-manage';
```

---

## Task 5: 用户管理页面

参照 `frontend-example/src/views/manage/user/` 结构，路径改为 `system/user/`。

**Files:**
- Create: `ai-admin/frontend/src/views/system/user/index.vue`
- Create: `ai-admin/frontend/src/views/system/user/modules/user-search.vue`
- Create: `ai-admin/frontend/src/views/system/user/modules/user-operate-drawer.vue`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p ai-admin/frontend/src/views/system/user/modules
```

- [ ] **Step 2: user-search.vue**

复制 `frontend-example/src/views/manage/user/modules/user-search.vue`，去掉 `userGender` 字段。

- [ ] **Step 3: user-operate-drawer.vue**

复制 `frontend-example/src/views/manage/user/modules/user-operate-drawer.vue`，handleSubmit 改为调用真实 API：

```typescript
async function handleSubmit() {
  await validate();
  if (props.operateType === 'add') {
    const { error } = await fetchAddUser({ ...model.value, password: 'soybean123' });
    if (error) return;
  } else {
    const { error } = await fetchUpdateUser(props.rowData!.id, model.value);
    if (error) return;
  }
  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}
```

- [ ] **Step 4: index.vue**

复制 `frontend-example/src/views/manage/user/index.vue`，handleDelete 改为：

```typescript
async function handleDelete(id: string) {
  const { error } = await fetchDeleteUser(id);
  if (!error) onDeleted();
}
```

- [ ] **Step 5: 验证**

访问 `http://localhost:9527/system/user`，显示用户列表，能新增/编辑/删除。

---

## Task 6: 角色管理页面

参照 `frontend-example/src/views/manage/role/` 结构，路径改为 `system/role/`。

**Files:**
- Create: `ai-admin/frontend/src/views/system/role/index.vue`
- Create: `ai-admin/frontend/src/views/system/role/modules/role-search.vue`
- Create: `ai-admin/frontend/src/views/system/role/modules/role-operate-drawer.vue`
- Create: `ai-admin/frontend/src/views/system/role/modules/menu-auth-modal.vue`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p ai-admin/frontend/src/views/system/role/modules
```

- [ ] **Step 2: role-search.vue**

复制 `frontend-example/src/views/manage/role/modules/role-search.vue`。

- [ ] **Step 3: role-operate-drawer.vue**

复制 `frontend-example/src/views/manage/role/modules/role-operate-drawer.vue`，handleSubmit 调用真实 API。

- [ ] **Step 4: menu-auth-modal.vue**

调用 `fetchGetMenuTree()` 获取菜单树，用 `NTree` 展示，保存时调用 `fetchUpdateRole(roleId, { menuIds })`。

- [ ] **Step 5: index.vue**

复制 `frontend-example/src/views/manage/role/index.vue`，handleDelete 调用真实 API。

- [ ] **Step 6: 验证**

访问 `http://localhost:9527/system/role`，显示角色列表，编辑时能分配菜单权限。

---

## Task 7: 菜单管理页面

参照 `frontend-example/src/views/manage/menu/` 结构，路径改为 `system/menu/`。

**Files:**
- Create: `ai-admin/frontend/src/views/system/menu/index.vue`
- Create: `ai-admin/frontend/src/views/system/menu/modules/menu-operate-modal.vue`

- [ ] **Step 1: 创建目录**

```bash
mkdir -p ai-admin/frontend/src/views/system/menu/modules
```

- [ ] **Step 2: menu-operate-modal.vue**

复制 `frontend-example/src/views/manage/menu/modules/menu-operate-modal.vue`，handleSubmit 调用真实 API。

- [ ] **Step 3: index.vue**

复制 `frontend-example/src/views/manage/menu/index.vue`，handleDelete 调用真实 API。

- [ ] **Step 4: 验证**

访问 `http://localhost:9527/system/menu`，显示菜单列表，能新增子菜单/编辑/删除。

---

## 启动命令

```bash
# 后端（ai-admin/backend/）
pnpm start:dev

# 前端（ai-admin/frontend/）
npm run dev
```

访问：http://localhost:9527
账号：soybean / soybean123
