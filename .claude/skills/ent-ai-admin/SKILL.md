---
name: ent-ai-admin
description: Use when developing the Enterprise AI Platform Admin system (NestJS + Soybean Admin). Covers backend/frontend architecture, logging discipline, OOP conventions, and Soybean-first UI rules.
---

# ent-ai-admin: 企业 AI 平台 Admin 系统开发规范

## 项目概览

企业 AI 平台 Phase 1 — Admin 管理后台。

- **后端**：`ai-admin/backend/` — NestJS 11 + Prisma 7 + PostgreSQL
- **前端**：`ai-admin/frontend/` — Soybean Admin (Vue 3 + Naive UI)
- **前端参考**：`ai-admin/frontend-example/src/views/manage/` — 官方示例，页面组件的唯一参考来源
- **计划文档**：`docs/superpowers/plans/`
- **需求文档**：`docs/`

---

## 核心工程原则（每次开发前必读，违反即返工）

### 原则 1：需求驱动，每项决定自解释

每一个接口、字段、组件的存在，必须能直接对应到需求文档或用户明确说明的功能。不得自行添加"可能有用"的字段或接口。

**自解释检查：** 每项决定必须能用一句话说清楚"为什么存在"。如果说不清楚，就不该存在。

| ❌ 不合格 | ✅ 合格 |
|-----------|--------|
| 「加个 status 字段，以后可能有用」 | 「User 表的 status 字段用于启用/禁用账号，对应需求文档第 3 节」 |
| 「加个 type 字段区分不同类型」 | 不加——需求没说需要分类，YAGNI |
| 「这个接口加个排序参数吧」 | 不加——当前需求无排序诉求，有需求再加 |

### 原则 2：所有关键请求必须有日志（维护调试用）

每个**对外暴露的接口**中，关键路径必须记录日志。日志是生产排查的唯一依据。

**每条日志必须包含"谁 + 做了什么 + 结果"：**

| 级别 | 方法 | 什么时候用 |
|------|------|-----------|
| `log.info()` | 操作成功、流程完成 | 创建成功、更新成功、登录成功 |
| `log.warn()` | 预期内的失败、业务校验拒绝 | 参数校验失败、记录不存在、密码错误、账号禁用 |
| `log.debug()` | 入参、中间值、查询条件 | 查询参数、分页信息、循环进度 |
| `log.error()` | 未预期的异常 | 数据库连接失败、第三方服务异常、抛异常前 |

**必须打日志的关键路径：**

```
请求进入 Controller → log.debug("收到请求", { params })
  ↓
Service 开始处理 → log.debug("开始处理", { bizId })
  ├─ 操作成功 → log.info("xxx 成功", { id, key })
  ├─ 业务拒绝 → log.warn("xxx 失败，原因", { id, reason })
  └─ 系统异常 → log.error("xxx 异常", error)
```

**禁止行为：**
- 关键路径无日志 — 生产无法排查故障
- 日志消息写代码行为而非业务含义 — ❌ `执行了 create 方法` → ✅ `创建知识库成功`
- 敏感信息进日志 — 密码、token 在任何日志中均不得出现
- 拼接字符串传参 — ❌ `` `创建用户 ${name}` `` → ✅ `log.info('创建用户成功', { name })`

### 原则 3：面向对象，杜绝上帝文件

每层只做自己的事，禁止跨层越权。

**后端分层：**

```
src/<module>/
  <module>.controller.ts    ← 只做路由映射、参数接收、调用 service。不写业务逻辑。
  <module>.service.ts       ← 只写业务逻辑。不操作 HTTP 上下文（req/res）。
  dto/<module>.dto.ts       ← 只定义入参结构 + 校验规则。每个模块独立文件。
  <module>.module.ts        ← 注册本模块的 controller / service / 依赖。
```

**前端分层：**

```
views/<module>/
  index.vue                 ← 列表页：数据编排 + 组件组合。不超过 50 行业务逻辑。
  modules/
    <module>-search.vue     ← 搜索栏：只管理搜索参数和搜索触发。
    <module>-operate-drawer.vue  ← 新增/编辑表单：只管理表单逻辑和提交。
service/api/<module>.ts     ← API 函数：只做 request 封装，不写界面逻辑。
typings/api/<module>.d.ts   ← 类型声明：只做类型定义，不写运行时逻辑。
```

**禁止行为：**
- Controller 里出现 `prisma.xxx.findMany()` 或 `this.ragflow.xxx()`
- Service 里操作 `req` / `res` / `@Req()` 装饰器
- 一个文件超过 200 行 — 拆
- 多个模块的类型塞进同一个文件 — 各模块独立 typings 文件
- index.vue 超过 50 行业务逻辑 — 提取到 modules/ 或 composables

**公共能力抽象到 `src/common/`：**
- `AppLoggerService` — 日志（不要每个 service 自己 console.log）
- `PrismaService` — 数据库
- `TransformInterceptor` — 统一响应格式
- `PermissionsGuard` — RBAC
- `OperationLogInterceptor` — 操作记录

### 原则 4：Soybean 生态优先，禁止随意造轮子

UI 组件选择优先级（从高到低）：

| 优先级 | 来源 | 例子 |
|--------|------|------|
| P0 | Soybean Admin 内置组件 | `useAuth`, `v-permission`, `useBoolean`, `$t()` |
| P1 | Naive UI 组件 | `NButton`, `NModal`, `NDataTable`, `NForm`, `NInput` |
| P2 | 前端 example 参考 | `frontend-example/src/views/manage/` 的页面结构 |
| P3 | Soybean 官方扩展 | `@sa/hooks`, `@sa/utils`, `icon-*` 图标 |
| P4 | 自研组件 | 以上均无法满足时才考虑 |

**造轮子前必须问自己：** Naive UI 真的没有这个组件吗？example 里真的没有这个模式吗？如果只是样式差异，NButton 的 type 和 style 属性能否解决？

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
| Knowledge | `GET /knowledge/getKnowledgeBaseList` | 知识库分页 |
| Knowledge | `POST /knowledge/createKnowledgeBase` | 创建知识库 |
| Knowledge | `PUT /knowledge/updateKnowledgeBase/:id` | 更新知识库 |
| Knowledge | `DELETE /knowledge/deleteKnowledgeBase/:id` | 删除知识库 |
| Knowledge | `GET /knowledge/getDocumentList/:kbId` | 文档列表 |
| Knowledge | `POST /knowledge/uploadDocument/:kbId` | 上传文档 |
| Knowledge | `DELETE /knowledge/deleteDocument/:kbId/:docId` | 删除文档 |
| Knowledge | `POST /knowledge/parseDocument/:kbId` | 解析文档 |
| Knowledge | `POST /knowledge/search/:kbId` | 语义检索 |

---

## 数据库 Schema

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
KnowledgeBase: id(uuid), name, description, datasetId, chunkMethod, parserConfig(JSON), status, createdAt, updatedAt
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
VITE_SERVICE_SUCCESS_CODE=200
VITE_AUTH_ROUTE_MODE=dynamic
```

Vite proxy 开启（`VITE_HTTP_PROXY=Y`），请求走 `/proxy-default/` 前缀转发到后端。
开发环境后端地址：`http://localhost:3000`

---

## 常见违规与红线

| 违规行为 | 为什么是红线 |
|----------|------------|
| Controller 里写数据库查询 | Service 层职责被绕过，无法复用 |
| 接口缺少日志 | 生产出问题无法排查 |
| 加了需求没提的字段/参数 | 增加维护负担，没有对应测试 |
| 自己写组件代替 Naive UI | 引入无谓的维护成本 |
| 一个文件超过 200 行 | 难以单文件阅读和理解 |
| 日志拼字符串传参 | 无法结构化检索 |
| 强行造轮子做已有组件的事 | Soybean 和 Naive UI 已经覆盖 95% 场景 |

---

## 当前进度

查看 `docs/superpowers/plans/` 获取最新任务状态和计划文档。
