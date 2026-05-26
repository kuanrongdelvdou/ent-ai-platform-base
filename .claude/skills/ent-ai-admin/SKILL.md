# ent-ai-admin: 企业 AI 平台 Admin 系统开发规范

## 项目概览

企业 AI 平台 Phase 1 — Admin 管理后台。

- **后端**：`ai-admin/backend/` — NestJS + Prisma 7 + PostgreSQL
- **前端**：`ai-admin/frontend/` — Soybean Admin (Vue 3 + Naive UI)
- **前端参考**：`ai-admin/frontend-example/` — 官方示例，页面组件的唯一参考来源
- **计划文档**：`docs/superpowers/plans/2026-05-25-admin-system.md`

---

## 核心工程原则（每次开发前必读，违反即返工）

### 原则 1：百分之百符合需求，每项决定自解释

- 每一个接口、字段、组件的存在，必须能直接对应到需求文档或用户明确说明的功能
- 不得自行添加"可能有用"的字段或接口
- 命名必须直接反映业务含义：`getUserList` 而非 `query`，`DeptService` 而非 `Service1`
- 如果一个决定无法用一句话解释清楚它为什么存在，就不应该存在

### 原则 2：结构化工程，禁止代码堆砌

后端分层规则（每层只做自己的事）：

```
Controller  → 只做参数接收、路由映射、调用 Service，不写业务逻辑
Service     → 只写业务逻辑，不直接操作 HTTP 上下文
DTO         → 每个模块独立文件，定义入参结构和校验规则
Module      → 注册本模块的 Controller、Service、依赖
```

前端分层规则：

```
views/<module>/index.vue          → 列表页，只做数据编排和组件组合
views/<module>/modules/           → 子组件目录
  <module>-search.vue             → 搜索栏，只管搜索参数
  <module>-operate-drawer.vue     → 新增/编辑表单，只管表单逻辑
service/api/<module>.ts           → API 函数，只做请求封装
typings/api/<module>.d.ts         → 类型声明，只做类型定义
```

**禁止行为**：
- 在 Controller 里写 `prisma.xxx.findMany()`
- 在 index.vue 里写超过 50 行的业务逻辑
- 把多个模块的类型塞进同一个文件

### 原则 3：面向对象，职责单一

- 每个 Service 类只负责一个业务实体（`UserService` 只管用户，不管角色）
- 公共能力抽象为独立类：`AppLoggerService`、`PrismaService`、`TransformInterceptor`
- 不在业务代码里重复造轮子，公共逻辑放 `src/common/`

### 原则 4：可扩展性

- 新增模块只需新建 `src/system-manage/<module>/` 目录，在 `system-manage.module.ts` 注册，不改其他文件
- 前端新增页面只需新建 `views/<module>/`，在路由种子数据里加一条记录
- 枚举值（状态 1/2、菜单类型 1/2）集中定义，不散落在业务代码里

---

## 日志规范（关键代码必须有日志，使用中文）

使用 `AppLoggerService`（`src/common/logger/app-logger.service.ts`）。

### 日志级别与使用场景

| 级别 | 方法 | 使用场景 | 示例 |
|------|------|---------|------|
| INFO | `log.info()` | 操作成功完成 | `用户登录成功: soybean` |
| WARN | `log.warn()` | 业务校验失败、预期内的错误 | `登录失败，密码错误: soybean` |
| DEBUG | `log.debug()` | 查询参数、中间状态（生产可关闭） | `查询用户列表参数: {...}` |
| ERROR | `log.error()` | 未预期异常、5xx 错误 | `创建用户异常` + error stack |

### 必须有日志的位置

```typescript
// 登录流程
log.debug('用户尝试登录', { userName });
log.warn('登录失败，用户不存在', { userName });
log.warn('登录失败，密码错误', { userName });
log.warn('登录失败，账号已禁用', { userName });
log.info('用户登录成功', { userName, userId });

// CRUD 操作
log.debug('查询列表', dto);
log.warn('记录不存在，无法更新', { id });
log.warn('唯一键冲突，创建失败', { key: dto.xxx });
log.info('创建成功', { id: result.id });
log.info('更新成功', { id });
log.info('删除成功', { id });

// 异常处理（AllExceptionsFilter）
log.error('服务器异常', error);   // 5xx
log.warn('请求异常', error);      // 4xx
```

### 日志格式要求

- **使用中文**，便于运维人员直接阅读
- 日志消息描述动作结果，不描述代码行为（`用户登录成功` 而非 `执行了 login 方法`）
- 敏感信息不进日志：密码、token 不得出现在任何日志中
- data 参数传结构化对象，不拼接字符串

---

## 前端页面组件规范

**严格参照 `ai-admin/frontend-example/src/views/manage/` 的结构**，不得自创不存在的组件。

可用的 example 参考文件：
- `frontend-example/src/views/manage/user/` — 用户管理（3 文件）
- `frontend-example/src/views/manage/role/` — 角色管理（5 文件）
- `frontend-example/src/views/manage/menu/` — 菜单管理（3 文件）

---

## 启动命令

```bash
# 后端（ai-admin/backend/）
npm run start:dev        # 开发模式（热重载）
npm run build            # 构建
npx prisma db push --force-reset && npx ts-node prisma/seed.ts  # 重置数据库

# 前端（ai-admin/frontend/）
npm run dev              # 开发模式，访问 http://localhost:9527
```

账号：`soybean` / `soybean123`

---

## API 契约速查

所有响应格式：`{ code: 200, msg: "ok", data: T }`

| 模块 | 接口 | 说明 |
|------|------|------|
| Auth | `POST /auth/login` | `{userName,password}` → `{token,refreshToken}` |
| Auth | `GET /auth/getUserInfo` | Bearer → `{userId,userName,roles[],buttons[]}` |
| Route | `GET /route/getUserRoutes` | JWT → `{routes[],home}` |
| Route | `GET /route/isRouteExist` | `?routeName=` → `boolean` |
| User | `GET /systemManage/getUserList` | 分页查询 |
| User | `POST /systemManage/addUser` | 新增 |
| User | `PUT /systemManage/updateUser/:id` | 更新 |
| User | `DELETE /systemManage/deleteUser/:id` | 删除 |
| Role | `GET /systemManage/getRoleList` | 分页查询 |
| Role | `GET /systemManage/getAllRoles` | 全部启用角色（下拉用） |
| Role | `POST /systemManage/addRole` | 新增 |
| Role | `PUT /systemManage/updateRole/:id` | 更新（含 menuIds） |
| Role | `DELETE /systemManage/deleteRole/:id` | 删除 |
| Menu | `GET /systemManage/getMenuList` | 全部菜单列表 |
| Menu | `GET /systemManage/getMenuTree` | 菜单树（权限分配用） |
| Menu | `GET /systemManage/getAllPages` | 全部页面名称（菜单编辑用） |
| Menu | `POST /systemManage/addMenu` | 新增 |
| Menu | `PUT /systemManage/updateMenu/:id` | 更新 |
| Menu | `DELETE /systemManage/deleteMenu/:id` | 删除 |
| Dept | `GET /systemManage/getDeptTree` | 部门树 |
| Dept | `GET /systemManage/getDeptList` | 部门列表 |
| Dept | `POST /systemManage/addDept` | 新增 |
| Dept | `PUT /systemManage/updateDept/:id` | 更新 |
| Dept | `DELETE /systemManage/deleteDept/:id` | 删除 |
| Dict | `GET /systemManage/getDictTypeList` | 字典类型分页 |
| Dict | `POST /systemManage/addDictType` | 新增类型 |
| Dict | `PUT /systemManage/updateDictType/:id` | 更新类型 |
| Dict | `DELETE /systemManage/deleteDictType/:id` | 删除类型（级联删除项） |
| Dict | `GET /systemManage/getDictItemList` | `?dictTypeId=` 字典项列表 |
| Dict | `POST /systemManage/addDictItem` | 新增字典项 |
| Dict | `PUT /systemManage/updateDictItem/:id` | 更新字典项 |
| Dict | `DELETE /systemManage/deleteDictItem/:id` | 删除字典项 |
| Config | `GET /systemManage/getConfigList` | 系统参数分页 |
| Config | `POST /systemManage/addConfig` | 新增 |
| Config | `PUT /systemManage/updateConfig/:id` | 更新 |
| Config | `DELETE /systemManage/deleteConfig/:id` | 删除 |
| Log | `GET /systemManage/getOperationLogList` | 操作日志分页 |
| Log | `GET /systemManage/getLoginLogList` | 登录日志分页 |

---

## 数据库 Schema 关键字段

```
User: id(uuid), username, password(bcrypt), realName, email, phone, status(1/2)
Role: id(uuid), name, code(unique), status(1/2), remark
Menu: id(uuid), parentId(uuid|null), name, type(1=目录/2=页面), path, component, icon, sort, status
Dept: id(uuid), parentId(uuid|null), name, sort, leaderId, status
DictType: id(uuid), name, code(unique), status
DictItem: id(uuid), dictTypeId, label, value, sort, status
SysConfig: id(uuid), key(unique), value, remark
OperationLog: id(uuid), username, module, action, method, ip, requestBody, responseCode, duration, createdAt
LoginLog: id(uuid), username, ip, status(1=成功/2=失败), message, createdAt
UserRole: userId + roleId (复合主键)
RoleMenu: roleId + menuId (复合主键)
```

菜单 component 格式：
- 目录：`layout.base`
- 页面：`layout.base$view.<route_name>`（如 `layout.base$view.system_user`）

---

## Prisma 7 注意事项

Prisma 7 不支持在 schema 中配置 datasource URL，必须使用 driver adapter：

```typescript
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
super({ adapter } as any);
```

seed.ts 也需要同样的 adapter 初始化方式。

---

## 前端环境配置

```bash
# .env
VITE_SERVICE_SUCCESS_CODE=200
VITE_AUTH_ROUTE_MODE=dynamic

# .env.test
VITE_SERVICE_BASE_URL=http://localhost:3000
```

Vite proxy 开启（`VITE_HTTP_PROXY=Y`），请求走 `/proxy-default/` 前缀转发到后端。

---

## 当前进度

查看 `docs/superpowers/plans/2026-05-25-admin-system.md` 获取最新任务状态。
