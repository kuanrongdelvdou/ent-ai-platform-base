# 企业 AI 平台通用底座

这是企业 AI 平台的前后端通用底座版本，后续业务应用基于该版本继续开发。

## 当前内容

- `ai-admin/backend`: NestJS + Prisma 后端基础服务，包含认证、动态路由、用户、角色、菜单、部门、字典、配置、登录日志、操作日志、Swagger 等基础能力。
- `ai-admin/frontend`: Soybean Admin/Vue3 前端底座，已接入后端登录、动态路由、系统管理、监控管理、工具管理等基础页面。
- `ai-admin/frontend-example`: Soybean Admin 原始参考工程，用于后续对照模板能力和示例实现。
- `docs`: 项目规划、后台管理系统、知识库、Agent、工作流、协作等文档。
- `docker-compose.yml`: 本地 PostgreSQL 开发依赖。

`ragflow/` 是独立上游项目，不纳入本仓库提交。

## 本地启动

### 数据库

```bash
docker compose up -d
```

### 后端

```bash
cd ai-admin/backend
pnpm install
cp .env.example .env
pnpm prisma generate
pnpm prisma db push
pnpm seed
pnpm start:dev
```

后端默认地址: `http://localhost:3000`

Swagger: `http://localhost:3000/api-docs`

### 前端

```bash
cd ai-admin/frontend
pnpm install
cp .env.example .env
pnpm dev
```

前端默认地址: `http://localhost:9527`

默认账号: `admin / 123456`

## 提交约定

不要提交以下内容:

- `ragflow/`
- `node_modules/`
- `dist/`
- 真实 `.env`
- 本地 IDE、日志、缓存文件
