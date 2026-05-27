# RAGFlow 完整功能梳理 — ent-ai-admin 实现规划

> **版本:** RAGFlow v0.25.5（Docker 部署，Python/Quart）
> **目的:** 系统性梳理 RAGFlow 所有功能，评估哪些需要在 ent-ai-admin 中实现，按优先级分阶段落地。
> **原则:** 需求驱动，不实现"可能有用"的功能；关键路径必须有日志；面向对象分层；Soybean 生态优先。

---

## 目录

1. [API 概览与架构](#1-api-概览与架构)
2. [完整 API 端点清单](#2-完整-api-端点清单)
   - 2.1 Dataset（知识库）
   - 2.2 Document（文档）
   - 2.3 Chunk（切片管理）
   - 2.4 File（文件存储层）
   - 2.5 Search / Retrieval（检索）
   - 2.6 Chat（对话助手）
   - 2.7 Agent（智能体）
   - 2.8 Memory（记忆系统）
   - 2.9 User & Auth（用户与鉴权）
   - 2.10 LLM 配置
   - 2.11 Web Crawl（网页抓取）
   - 2.12 管理/监控
3. [功能分类与实施路线图](#3-功能分类与实施路线图)
4. [架构建议](#4-架构建议)
5. [当前计划 vs 完整功能覆盖对比](#5-当前计划-vs-完整功能覆盖对比)

---

## 1. API 概览与架构

### RAGFlow 服务拓扑

```
┌─────────────────────────────────────────────────────┐
│                   RAGFlow Docker                    │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  HTTP API    │  │  Admin API   │                 │
│  │  :9380       │  │  :9381       │                 │
│  │  (Python)    │  │  (Python)    │                 │
│  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                         │
│  ┌──────┴───────┐  ┌──────┴───────┐                 │
│  │  Go Service  │  │  MCP Server  │                 │
│  │  :9384       │  │  :9382       │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                     │
│  ┌──────────┐  ┌───────┐  ┌──────────────────┐     │
│  │  MySQL   │  │ Redis │  │  Elasticsearch   │     │
│  │  :3306   │  │ :6380 │  │  :1200           │     │
│  └──────────┘  └───────┘  └──────────────────┘     │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  MinIO (:9000)                               │   │
│  │  → 文档原始文件存储                            │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
         ▲
         │ Bearer Token
         │
┌────────┴────────────────────────────────────────────┐
│              ent-ai-admin (NestJS)                   │
│                                                      │
│  KnowledgeModule (anti-corruption layer)             │
│  ┌──────────────────────────────────────────────┐   │
│  │  RagflowApiService  ←  HTTP 封装层            │   │
│  │  KnowledgeService   ←  Prisma + 业务编排       │   │
│  │  KnowledgeController ← REST 端点              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Each new RAGFlow feature → new sub-module:          │
│  ChatApiService, AgentApiService, etc.               │
└─────────────────────────────────────────────────────┘
```

### API 基础信息

| 项目 | 值 |
|------|-----|
| Base URL | `http://localhost:9380/api/v1` |
| 鉴权 | `Authorization: Bearer <API_TOKEN>` |
| 响应格式 | `{ code: 0, message: "ok", data: ... }` |
| 成功码 | `code === 0` |
| 流式响应 | SSE (text/event-stream)，用于 Chat/Agent completions |

---

## 2. 完整 API 端点清单

### 2.1 Dataset（知识库）

**基础路径:** `/api/v1/datasets`

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| D1 | `POST` | `/api/v1/datasets` | 创建知识库 | ✅ `createDataset()` | ✅ |
| D2 | `GET` | `/api/v1/datasets` | 知识库列表（分页） | ✅ `listDatasets()` | ✅ |
| D3 | `GET` | `/api/v1/datasets/{id}` | 知识库详情 | ❌ 未实现 | ❌ |
| D4 | `PUT` | `/api/v1/datasets/{id}` | 更新知识库 | ✅ `updateDataset()` | ✅ |
| D5 | `DELETE` | `/api/v1/datasets` | 批量删除（body: `{ids: [...]}`） | ✅ `deleteDatasets()` | ✅ |

**创建参数:**

```
name          : string (required, max 128 chars)
description?  : string
chunk_method? : naive | qa | table | paper | book | laws | presentation | picture | one | knowledge-graph
parser_config?: { chunk_token_count?, layout_recognize?, delimiter?, ... }
embedding_model? : string (format: "model_name@factory")
permission?   : "me" | "team"
language?     : "Chinese" | "English"
```

**D3 未实现的后果:** 无法在 ent-ai-admin 中查看 RAGFlow 侧知识库的完整配置（如 embedding_model、permission 等）。当前通过 Prisma 的 KnowledgeBase 表维护元数据，但 RAGFlow 侧的一些配置无法展示。

---

### 2.2 Document（文档）

**基础路径:** `/api/v1/datasets/{dataset_id}/documents`

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| DO1 | `POST` | `/{dataset_id}/documents` | 上传文档（multipart） | ✅ `uploadDocument()` | ✅ |
| DO2 | `GET` | `/{dataset_id}/documents` | 文档列表（分页） | ✅ `listDocuments()` | ✅ |
| DO3 | `DELETE` | `/{dataset_id}/documents` | 批量删除（body: `{ids: [...]}`） | ✅ `deleteDocuments()` | ✅ |
| DO4 | `GET` | `/{dataset_id}/documents/{doc_id}` | 文档详情 | ❌ | ❌ |
| DO5 | `PUT` | `/{dataset_id}/documents/{doc_id}` | 更新文档元数据 | ❌ | ❌ |
| DO6 | `POST` | `/{dataset_id}/documents/{doc_id}/chunk` | 解析/切片单文档 | ❌ | ❌ |
| DO7 | `POST` | `/{dataset_id}/documents/parse` | 批量开始解析 | ✅ `parseDocuments()` | ✅ |
| DO8 | `POST` | `/{dataset_id}/documents/stop` | 停止解析 | ❌ | ❌ |

**DO4 未实现的后果:** 无法查看单文档的完整元数据（chunk_count、token_count、process_begin_at、process_duration 等）。

**DO5 未实现的后果:** 无法单独更新文档的元数据（如修改文档名称、更换 parser_config）。

**DO6 未实现的后果:** 不能对单个文档触发解析，只能全部一起解析。

**DO8 未实现的后果:** 对长时间解析中的文档无法在 UI 上停止。

---

### 2.3 Chunk（切片管理）

**基础路径:** `/api/v1/datasets/{dataset_id}/chunks`

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| C1 | `GET` | `/{dataset_id}/chunks` | 获取切片列表 | ❌ | ❌ |
| C2 | `PUT` | `/{dataset_id}/chunks` | 批量更新切片 | ❌ | ❌ |
| C3 | `DELETE` | `/{dataset_id}/chunks` | 删除切片 | ❌ | ❌ |
| C4 | `POST` | `/{dataset_id}/chunks/search` | 切片级别检索 | ❌ | ❌ |

**说明:** Chunk API 提供的是文档切片级别的细粒度管理。当前搜索走的是 Dataset 级别的 `/search` 端点或全局的 `/searches`。
Chunk 管理属于高级功能，**Phase 2 评估**。

---

### 2.4 File（文件存储层）

**基础路径:** `/api/v1/documents`

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| F1 | `POST` | `/api/v1/documents/upload` | 上传文件到存储层（multipart 或 `?url=`） | ❌ | ❌ |
| F2 | `GET` | `/api/v1/documents/{doc_id}/download` | 下载文件 | ❌ | ❌ |
| F3 | `GET` | `/api/v1/documents/{doc_id}/preview` | 预览文件 | ❌ | ❌ |

**说明:** File API 和 Document API 是两层：
- **File API** → 物理存储层（MinIO），与 Dataset 无关
- **Document API** → 逻辑文档层，关联到 Dataset

当前我们通过 Document API 上传文件（自动同时创建 File 记录），所以 F1 暂不需要。
**F2/F3（下载/预览）** 是 Phase 2 需求，当前需求文档无此要求。

---

### 2.5 Search / Retrieval（检索）

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| S1 | `POST` | `/api/v1/datasets/{id}/search` | 在单个知识库内检索 | ✅ `searchDataset()` | ✅ |
| S2 | `POST` | `/api/v1/searches` | 跨知识库检索 | ❌ | ❌ |
| S3 | `POST` | `/api/v1/retrieval` | Retrieval API（通用） | ❌ | ❌ |
| S4 | `POST` | `/api/v1/dify/retrieval` | Dify 兼容检索端点 | ❌（不需要） | ❌ |

**S2 未实现的后果:** 无法在搜索时跨知识库一次搜索所有内容。当前只支持在单个 KB 内搜索。

**S3 说明:** Retrieval API 是 RAGFlow 的底层检索接口，支持更细粒度的检索参数（如 `similarity_threshold`, `top_k` 等）。当前我们通过 Dataset 的 search 端点实现，`retrieval` 端点是更通用的替代。

---

### 2.6 Chat（对话助手）

**基础路径:** `/api/v1/chats`

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| CH1 | `POST` | `/api/v1/chats` | 创建聊天助手 | ❌ | ❌ |
| CH2 | `GET` | `/api/v1/chats` | 聊天助手列表 | ❌ | ❌ |
| CH3 | `PUT` | `/api/v1/chats/{chat_id}` | 更新助手配置 | ❌ | ❌ |
| CH4 | `DELETE` | `/api/v1/chats/{chat_id}` | 删除助手 | ❌ | ❌ |
| CH5 | `POST` | `/api/v1/chats/{chat_id}/sessions` | 创建会话 | ❌ | ❌ |
| CH6 | `GET` | `/api/v1/chats/{chat_id}/sessions` | 会话列表 | ❌ | ❌ |
| CH7 | `PUT` | `/api/v1/chats/{chat_id}/sessions/{session_id}` | 更新会话 | ❌ | ❌ |
| CH8 | `DELETE` | `/api/v1/chats/{chat_id}/sessions/{session_id}` | 删除会话 | ❌ | ❌ |
| CH9 | `POST` | `/api/v1/chats/{chat_id}/completions` | 对话补全（SSE 流式） | ❌ | ❌ |
| CH10 | `POST` | `/api/v1/chats_openai/{chat_id}/chat/completions` | OpenAI 兼容补全 | ❌ | ❌ |

**说明:** Chat 是 RAGFlow 的核心交互功能。一个 Chat 绑定一个或多个 Dataset，用户提问后 RAGFlow 检索相关文档片段并生成回答。

**是否需要实现:** 当前需求文档（01-知识库规划.md）的范围限定在"上传、管理、语义检索、权限隔离"，没有包含对话能力。但是 RAGFlow 最核心的价值就是 RAG（检索增强生成），**如果只管理不对话，等于只用了一半功能**。

**实施建议:** Phase 2 核心功能。

---

### 2.7 Agent（智能体）

**基础路径:** `/api/v1/agents`

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| A1 | `POST` | `/api/v1/agents` | 创建智能体 | ❌ | ❌ |
| A2 | `GET` | `/api/v1/agents` | 智能体列表 | ❌ | ❌ |
| A3 | `GET` | `/api/v1/agents/{agent_id}` | 智能体详情（含 DSL） | ❌ | ❌ |
| A4 | `PUT` | `/api/v1/agents/{agent_id}` | 更新智能体配置 | ❌ | ❌ |
| A5 | `DELETE` | `/api/v1/agents/{agent_id}` | 删除智能体 | ❌ | ❌ |
| A6 | `GET` | `/api/v1/agents/templates` | 模板列表 | ❌ | ❌ |
| A7 | `POST` | `/api/v1/agents/{agent_id}/sessions` | 创建会话 | ❌ | ❌ |
| A8 | `GET` | `/api/v1/agents/{agent_id}/sessions` | 会话列表 | ❌ | ❌ |
| A9 | `POST` | `/api/v1/agents/{agent_id}/completions` | Agent 执行（SSE 流式） | ❌ | ❌ |
| A10 | `POST` | `/api/v1/agents_openai/{agent_id}/chat/completions` | OpenAI 兼容执行 | ❌ | ❌ |

**说明:** Agent 是 RAGFlow 的画布式工作流引擎，支持多步骤、多工具的工作流编排（类似 LangGraph）。
Agent 有 DSL 定义（JSON 格式的画布流程），包含节点（LLM、检索、代码执行等）和边。

**是否需要实现:** Agent 功能强大但复杂，需要 DSL 编辑器前端。当前 Soybean Admin 不适合直接嵌入画布编辑器。

**实施建议:** Phase 3 评估。可以考虑仅实现 Agent 的查看和管理（列表、启用/禁用），复杂的画布编辑直接在 RAGFlow 原生 UI 中操作。

---

### 2.8 Memory（记忆系统）

**基础路径:** `/api/v1/memories`

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| M1 | `POST` | `/api/v1/memories` | 创建记忆 | ❌ | ❌ |
| M2 | `GET` | `/api/v1/memories` | 记忆列表 | ❌ | ❌ |
| M3 | `GET` | `/api/v1/memories/{memory_id}` | 记忆消息（支持关键词过滤） | ❌ | ❌ |
| M4 | `PUT` | `/api/v1/memories/{memory_id}` | 更新记忆配置 | ❌ | ❌ |
| M5 | `DELETE` | `/api/v1/memories/{memory_id}` | 删除记忆 | ❌ | ❌ |

**说明:** 记忆系统管理 Chat/Agent 的对话历史记忆。类型包括 raw、semantic、episodic。
Memory 是 Chat 和 Agent 的内部依赖，一般不直接暴露给最终用户。

**是否需要实现:** 这是 Chat/Agent 的内部基础设施，**不需要** 在 ent-ai-admin 中独立实现。

---

### 2.9 User & Auth（用户与鉴权）

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| U1 | `POST` | `/v1/user/register` | 注册用户（RSA 加密密码） | ❌ | ❌ |
| U2 | `POST` | `/login` | 登录（生成 access_token） | ❌ | ❌ |
| U3 | `GET` | `/api/v1/users` | 用户列表（admin 权限） | ❌ | ❌ |
| U4 | `POST` | `/api/v1/users` | 创建用户 | ❌ | ❌ |
| U5 | `PUT` | `/api/v1/users/{user_id}` | 更新用户 | ❌ | ❌ |
| U6 | `DELETE` | `/api/v1/users/{user_id}` | 删除用户 | ❌ | ❌ |

**是否需要实现:** ent-ai-admin 有自己的用户系统和 JWT 鉴权，与 RAGFlow 的用户体系是独立的。
RAGFlow 的用户管理仅在以下场景需要：
1. 需要在 ent-ai-admin 中管理 RAGFlow 自身用户 → 需要实现 U3-U6
2. 需要让 ent-ai-admin 用户自动映射到 RAGFlow 用户 → 不需要这些 API，而是设计同步机制

**实施建议:** 当前不需要。ent-ai-admin 使用自己的用户体系，通过 API Token 访问 RAGFlow，不操作 RAGFlow 用户。

---

### 2.10 LLM 配置

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| L1 | `POST` | `/api/v1/llm/set_api_key` | 设置 LLM 厂商 API Key | ❌ | ❌ |
| L2 | `POST` | `/api/v1/llm/add_llm` | 添加/更新 LLM 模型配置 | ❌ | ❌ |
| L3 | `GET` | `/api/v1/llm/my_llms` | 当前租户已配置的 LLM 列表 | ❌ | ❌ |

**说明:** 这些端点管理 RAGFlow 使用的 LLM 配置（模型厂商、API Key、模型列表）。

**是否需要实现:** 在 RAGFlow 初始化时配置一次即可，后续很少修改。
如果 ent-ai-admin 需要让用户选择不同的模型，则需要 L3 来获取可用模型列表。

**实施建议:** Phase 3 评估，作为系统设置的一部分。

---

### 2.11 Web Crawl（网页抓取）

| # | 方法 | 路径 | 说明 | NestJS 封装 | 当前支持 |
|---|------|------|------|-------------|---------|
| W1 | `POST` | `/web_crawl` | 抓取 URL 并转为 PDF 文档 | ❌ | ❌ |

**是否需要实现:** 当前需求文档无此要求。**不需要**。

---

### 2.12 管理/监控

RAGFlow 还提供以下管理能力（主要在 Go 服务和 Admin 端）：

| 功能 | 端口 | 说明 |
|------|------|------|
| Go 服务状态 | `:9384` | 健康检查、任务状态 |
| Admin API | `:9381` | 管理操作 |
| MCP Server | `:9382` | MCP 协议交互 |

**是否需要实现:** 这些是 RAGFlow 的内部基础设施，**不需要** 在 ent-ai-admin 中实现。

---

## 3. 功能分类与实施路线图

### Phase 1 — 当前计划（正在实现）

聚焦需求文档范围：上传、管理、语义检索、权限隔离。

| 功能点 | 对应 API | 复杂度 |
|--------|----------|--------|
| 知识库 CRUD | D1, D2, D4, D5 | ⭐⭐ |
| 文档上传（含批量） | DO1, DO7 | ⭐⭐ |
| 文档列表/删除 | DO2, DO3 | ⭐ |
| 解析状态查看 | DO2 状态字段 | ⭐ |
| 语义检索 | S1 | ⭐⭐⭐ |
| 权限隔离（KnowledgeBaseRole） | — (Prisma 层) | ⭐⭐ |

**完成标准见** [知识库规划](../01-知识库规划.md)

---

### Phase 2 — 对话能力

在知识库管理基础上增加对话交互。建议在 Phase 1 完成后启动。

| 功能点 | 对应 API | 复杂度 | 说明 |
|--------|----------|--------|------|
| 聊天助手管理（列表/CRUD） | CH1-CH4 | ⭐⭐ | 类似于 Chat 的管理后台 |
| 对话会话管理 | CH5-CH8 | ⭐⭐ | 会话列表、删除 |
| 对话交互界面 | CH9 | ⭐⭐⭐⭐ | SSE 流式对话 UI（重大前端工作） |
| 文档下载/预览 | F2, F3 | ⭐ | 二进制流代理 |

**Phase 2 的关键决策:**

- **流式对话 UI**: Soybean Admin 中没有现成的流式对话组件。需要自研或集成。
  - 选项 A：在 ent-ai-admin 内实现简易对话面板（自研）
  - 选项 B：嵌入 RAGFlow 原生 Chat UI（iframe）
  - 选项 C：暂不实现对话 UI，仅管理 Chat 配置

- **技术挑战**: SSE 流式处理在 NestJS 中需要转发流（作为代理），前端需要处理 ReadableStream。

---

### Phase 3 — 进阶功能

高阶功能，需要更多评估：

| 功能点 | 对应 API | 复杂度 | 优先度 |
|--------|----------|--------|--------|
| 知识库详情查看（RAGFlow 侧完整配置） | D3 | ⭐ | **高** — Phase 1 就应该有，作为补充 |
| 切片管理（查看/编辑/删除） | C1-C4 | ⭐⭐⭐ | 中 |
| 跨知识库检索 | S2 | ⭐⭐ | 中 — 全局搜索 |
| 智能体管理（列表/启用/禁用） | A1-A5 | ⭐⭐ | 低 |
| 智能体执行 | A9 | ⭐⭐⭐⭐ | 低 |
| LLM 配置管理 | L1-L3 | ⭐ | 低 — 系统设置 |
| 文档元数据编辑 | DO5 | ⭐ | 中 |
| 单文档解析触发 | DO6 | ⭐ | **高** — 区分于全部解析 |
| 停止解析 | DO8 | ⭐ | 中 |

---

### 不计划实现的功能

| 功能 | 原因 |
|------|------|
| Memory API（M1-M5） | Chat/Agent 内部依赖，不暴露给最终用户 |
| User/Auth API（U1-U6） | ent-ai-admin 使用自有的用户体系 |
| Dify 兼容检索（S4） | 兼容端点，无业务价值 |
| Web Crawl（W1） | 需求无此要求 |
| Agent 画布编辑器 | 复杂度高，直接在 RAGFlow UI 操作 |
| OpenAI 兼容补全（CH10, A10） | 兼容端点，NestJS 层不需要 |
| 管理/监控 API | RAGFlow 内部基础设施 |

---

## 4. 架构建议

### 4.1 模块拆分策略

当前 `RagflowApiService` 是一个 monolith 类，随着 API 增加会膨胀。

**建议:** 按领域拆分为独立的 Service 文件：

```
src/knowledge/
  ├── ragflow/
  │   ├── ragflow-base.service.ts      # 公共 HTTP 方法（get/post/put/delete）
  │   ├── ragflow-dataset.service.ts    # Dataset API 封装
  │   ├── ragflow-document.service.ts   # Document API 封装
  │   ├── ragflow-chunk.service.ts      # Chunk API 封装（Phase 3）
  │   ├── ragflow-file.service.ts       # File API 封装（Phase 2）
  │   ├── ragflow-chat.service.ts       # Chat API 封装（Phase 2）
  │   └── ragflow-search.service.ts     # Search/Retrieval 封装
  ├── dto/
  ├── knowledge.service.ts
  ├── knowledge.controller.ts
  └── knowledge.module.ts
```

**拆分时机:** 当 Phase 2 启动时拆分，Phase 1 保持 monolith（YAGNI）。

### 4.2 SSE 流式转发架构（Phase 2）

```
Client (Vue)                    NestJS                           RAGFlow
    │                             │                                │
    │  POST /chat/completions     │                                │
    │ ──────────────────────────► │  POST /api/v1/chats/{id}/completions
    │                             │ ───────────────────────────────► │
    │                             │    SSE stream (text/event-stream)
    │                             │ ◄─────────────────────────────── │
    │  SSE stream (passthrough)   │                                │
    │ ◄────────────────────────── │                                │
    │                             │                                │
```

**NestJS 端实现要点:**
- Controller 返回 `Observable` 或 `StreamableFile`
- 使用 `@Sse()` 装饰器或手动 pipe 流
- 转发过程中统一处理错误码和鉴权

### 4.3 关于"跨知识库搜索"的实现

当前 Phase 1 搜索是限定在单个 KB 内的。如果要实现全局搜索：

```
POST /api/v1/searches
Body: {
  "question": "xxx",
  "dataset_ids": ["id1", "id2", ...]  // 可选，为空时搜索所有有权限的 KB
}
```

**NestJS 实现:**
1. Controller 端接收请求
2. Service 层从 JWT 获取用户角色
3. 查询 KnowledgeBaseRole 获取用户有权限的 KB ID 列表
4. 传入 `dataset_ids` 到 RAGFlow API

---

## 5. 当前计划 vs 完整功能覆盖对比

| API 组 | 总数 | 已实现 | Phase 1 | Phase 2 | Phase 3 | 不实现 |
|--------|------|--------|---------|---------|---------|--------|
| Dataset | 5 | 4 | — | — | D3 | — |
| Document | 8 | 4 | — | — | DO4, DO5, DO6, DO8 | — |
| Chunk | 4 | 0 | — | — | C1-C4 | — |
| File | 3 | 0 | — | F2, F3 | — | F1 |
| Search | 4 | 1 | S1 | S2 | — | S3, S4 |
| Chat | 10 | 0 | — | CH1-CH9 | — | CH10 |
| Agent | 10 | 0 | — | — | A1-A9 | A10 |
| Memory | 5 | 0 | — | — | — | M1-M5 |
| User/Auth | 6 | 0 | — | — | — | U1-U6 |
| LLM Config | 3 | 0 | — | — | L1-L3 | — |
| Web Crawl | 1 | 0 | — | — | — | W1 |
| **合计** | **59** | **9** | **9** | **~12** | **~14** | **~15** |

**覆盖现状:** 当前 Phase 1 计划覆盖了 59 个端点中的 9 个（15%）。
如果需要完整覆盖 RAGFlow 功能，至少还需要 3 个 Phase。

---

## 附录 A: 需求文档对照

当前需求文档 [01-知识库规划.md](../01-知识库规划.md) 列出的功能范围：

| 需求 | 对应 API | 当前状态 | 阶段 |
|------|----------|----------|------|
| 知识库 CRUD | D1, D2, D4, D5 | ✅ Phase 1 | Phase 1 |
| 知识库与权限绑定 | KnowledgeBaseRole | ✅ Phase 1 | Phase 1 |
| 知识库状态 | DO2 状态字段 | ✅ Phase 1 | Phase 1 |
| 文件上传（批量） | DO1, DO7 | ✅ Phase 1 | Phase 1 |
| 文件列表/搜索/过滤 | DO2 | ✅ Phase 1 | Phase 1 |
| 解析状态查看 | DO2 状态字段 | ✅ Phase 1 | Phase 1 |
| 文件删除 | DO3 | ✅ Phase 1 | Phase 1 |
| 关键词检索 | S1 + keyword 参数 | ✅ Phase 1 | Phase 1 |
| 语义检索 | S1 | ✅ Phase 1 | Phase 1 |
| 检索结果高亮 | S1 响应 | ✅ Phase 1 | Phase 1 |
| **超出需求文档的功能** | | | |
| 对话助手 | CH1-CH9 | ❌ | Phase 2 |
| 文档下载/预览 | F2, F3 | ❌ | Phase 2 |
| 切片管理 | C1-C4 | ❌ | Phase 3 |
| 智能体 | A1-A9 | ❌ | Phase 3 |
| LLM 配置 | L1-L3 | ❌ | Phase 3 |

---

## 附录 B: 关键决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| Chat UI 方案 | Phase 2 确定 | Phase 1 重心在知识库管理 |
| 跨库搜索 | Phase 2 | 当前需求无明确要求 |
| 切片管理 | Phase 3 | 高阶功能，需要 RAGFlow 理解 |
| RAGFlow 用户同步 | 暂不实现 | ent-ai-admin 自身用户体系已满足 |
| RagflowApiService 拆分 | Phase 2 启动时 | YAGNI — 当前 monolith 够用 |
| Agent 画布编辑 | 不实现 | 复杂度高，建议直接用 RAGFlow UI |
