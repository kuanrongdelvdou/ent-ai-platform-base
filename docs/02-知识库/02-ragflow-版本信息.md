# RAGFlow 版本信息

> 本文档记录 RAGFlow 当前版本的关键信息，升级 RAGFlow 后需对照本文档逐项检查兼容性。

## 版本号

| 项目 | 值 |
|------|-----|
| 版本 | **0.25.5** |
| Git 精确版本 | `v0.25.5-33-g1ece1c81d` |
| pyproject.toml version | `0.25.5` |
| Docker 镜像 | `registry.cn-hangzhou.aliyuncs.com/infiniflow/ragflow:v0.25.5` |
| 备用镜像 | `swr.cn-north-4.myhuaweicloud.com/infiniflow/ragflow:v0.25.5` |

## 部署架构

```
docker compose -f docker/docker-compose.yml up -d
```

| 服务 | 端口 | 说明 |
|------|------|------|
| RAGFlow HTTP API | `9380` | 主 API 服务（Python/Quart） |
| RAGFlow Admin API | `9381` | 管理 API |
| RAGFlow MCP | `9382` | MCP 协议端口 |
| Go 服务 HTTP | `9384` | Go 辅助服务 |
| Go 服务 Admin | `9383` | Go 服务管理端口 |
| MySQL | `3306` | 元数据库 |
| Redis | `6380` | 缓存/会话 |
| MinIO API | `9000` | 对象存储 |
| MinIO Console | `9001` | 对象存储控制台 |
| Elasticsearch | `1200` | 向量/文档检索引擎（默认） |

API 代理模式：`API_PROXY_SCHEME=python`（纯 Python 部署，非 hybrid）

## API 基本信息

| 项目 | 值 |
|------|-----|
| API 版本 | `v1` |
| API 前缀 | `/api/v1/` |
| API 鉴权方式 | Bearer token（JWT access_token 或 APIToken） |
| 鉴权逻辑文件 | `api/apps/__init__.py` → `_load_user()` |
| 响应格式 | `{ "code": 0, "message": "ok", "data": ... }` |
| 错误码定义 | `common/constants.py` → `RetCode` |
| API 框架 | Quart（async Flask） |

### 鉴权细节

`_load_user()` 按以下顺序尝试鉴权：

1. 请求头无 `Authorization` → 回退 session cookie
2. `Authorization: Bearer <jwt>` → JWT 解密得到 access_token → 查 `users` 表
3. JWT 失败 → 作为 API Token 查 `api_tokens` 表
4. 都失败 → 回退 session cookie

**NestJS 集成要点：** 使用 API Token（在 RAGFlow 后台生成），不走 JWT 路径，放 `Authorization` 头即可（可不带 `Bearer` 前缀走第 3 步）。

## NestJS 依赖的 RAGFlow API

以下是我们 NestJS 层需要调用的 RAGFlow REST API 端点：

### Dataset（知识库）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/datasets` | 创建知识库 |
| `GET` | `/api/v1/datasets` | 列表查询（`?page=&page_size=&orderby=&desc=`） |
| `DELETE` | `/api/v1/datasets` | 批量删除（body: `{"ids": [...]}`） |
| `PUT` | `/api/v1/datasets/<dataset_id>` | 更新知识库 |
| `POST` | `/api/v1/datasets/<dataset_id>/search` | 在知识库内检索 |
| `POST` | `/api/v1/datasets/search` | 跨知识库检索 |

创建参数：`name`, `description?`, `chunk_method?`, `parser_config?`, `embedding_model?`, `permission?`

### Document（文档）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/datasets/<dataset_id>/documents` | 上传文档（multipart） |
| `GET` | `/api/v1/datasets/<dataset_id>/documents` | 文档列表（分页） |
| `DELETE` | `/api/v1/datasets/<dataset_id>/documents` | 批量删除文档（body: `{"ids": [...]}`） |
| `POST` | `/api/v1/datasets/<dataset_id>/documents/parse` | 开始解析 |
| `POST` | `/api/v1/datasets/<dataset_id>/documents/stop` | 停止解析 |
| `PATCH` | `/api/v1/datasets/<dataset_id>/documents/<document_id>` | 更新文档元数据 |

### 文件管理

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/documents/upload` | 上传文件（multipart 或 `?url=`） |
| `GET` | `/api/v1/documents/<doc_id>/download` | 下载文件 |
| `GET` | `/api/v1/documents/<doc_id>/preview` | 预览文件 |

### 检索

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/searches` | 语义检索 |

## 关键配置

```yaml
# docker/service_conf.yaml.template 关键项
ragflow:
  http_port: 9380
mysql:
  name: rag_flow
  host: mysql
  port: 3306
minio:
  host: minio:9000
redis:
  host: redis:6379
  db: 1
```

## 技术栈

| 层面 | 技术 |
|------|------|
| Python 版本 | `>=3.13, <3.15` |
| Web 框架 | Quart（async Flask） |
| 数据库 | MySQL（元数据）, Elasticsearch/Infinity/OceanBase（文档检索引擎） |
| 缓存 | Redis |
| 对象存储 | MinIO（默认）/ S3 / OSS / Azure |
| 文档解析 | deepdoc（内置） |
| 嵌入模型 | TEI（Text Embeddings Inference），模型 `Qwen/Qwen3-Embedding-0.6B`（默认） |
| 前端 | React/TypeScript + Vite + shadcn/ui + Zustand |
| 包管理 | uv（Python）, npm（前端） |

## 升级兼容性检查清单

升级 RAGFlow 到新版本时，逐项确认：

- [ ] **Docker 镜像版本号** — `docker/.env` 中 `RAGFLOW_IMAGE` 是否更新
- [ ] **API 版本** — `api/constants.py` 中 `API_VERSION` 是否仍为 `"v1"`，如变更需更新 NestJS 中所有请求路径
- [ ] **API 端点路径** — 对照 `api/apps/restful_apis/` 下文件，确认我们调用的路径是否变化（路径、参数名、请求体字段）
- [ ] **鉴权方式** — `api/apps/__init__.py` 中 `_load_user()` 逻辑是否变化，API Token 机制是否仍然可用
- [ ] **响应格式** — `common/constants.py` 中 `RetCode` 定义是否变化，响应 `{code, message, data}` 结构是否一致
- [ ] **Dataset API 参数** — 创建/更新知识库的参数名、类型、可选字段是否有增删
- [ ] **Document API 参数** — 上传、解析的参数是否有变化
- [ ] **Python 版本要求** — `pyproject.toml` 中 `requires-python` 是否有变化（当前 `>=3.13,<3.15`）
- [ ] **服务端口** — HTTP 端口、Admin 端口是否有变化
- [ ] **依赖服务** — MySQL/Redis/MinIO/ES 版本要求是否有变化
- [ ] **对象存储配置** — `service_conf.yaml` 结构是否有变化
- [ ] **环境变量** — `docker/.env` 中是否有新增的必需变量或废弃的变量
- [ ] **Prisma KnowledgeBase 模型** — `datasetId` 字段映射是否仍然正确，是否需要新增字段（如 RAGFlow 新增了知识库级别的配置项）
- [ ] **NestJS RAGFlow API Service** — `ai-admin/backend/src/knowledge/ragflow-api.service.ts` 中的所有 HTTP 调用是否仍有效

## 关键源码文件索引

升级后优先检查以下文件的 diff：

```
ragflow/
├── api/
│   ├── __init__.py              # app 入口、鉴权
│   ├── apps/
│   │   ├── restful_apis/
│   │   │   ├── dataset_api.py   # 知识库 CRUD + 检索
│   │   │   ├── document_api.py  # 文档上传/管理/解析
│   │   │   ├── file_api.py      # 文件上传/下载/预览
│   │   │   └── search_api.py    # 检索
│   │   └── backward_compat.py   # 废弃 API 兼容路由
│   └── constants.py             # API_VERSION, RTX_ERR 等常量
├── common/
│   ├── constants.py             # 状态码、业务常量
│   └── versions.py              # 版本获取逻辑
├── docker/
│   ├── .env                     # Docker 环境变量（镜像、端口、密码）
│   ├── service_conf.yaml.template  # 服务配置模板
│   └── docker-compose.yml       # 容器编排
├── pyproject.toml               # Python 依赖、版本号
└── web/                         # RAGFlow 前端（React）
```
