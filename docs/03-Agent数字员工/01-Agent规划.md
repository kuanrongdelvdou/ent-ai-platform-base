# Agent 数字员工规划

## 目标

创建可配置的 AI Agent，挂载到业务场景中，作为"数字员工"参与企业日常工作。

## 核心引擎

**Phase 3 使用 RAGFlow Agent**，后续复杂场景升级为 LangGraph.js。

---

## 功能模块

### 1. Agent 管理
- Agent CRUD（名称、描述、头像、角色定位）
- 配置 Agent 使用的 LLM 模型
- 配置 Agent 关联的知识库
- 配置 Agent 的系统提示词（System Prompt）
- Agent 权限（哪些用户/部门可以使用）

### 2. Agent 对话界面
- 独立对话页面（全屏聊天）
- 嵌入式对话（挂载在业务页面旁边，参考 NocoBase 数字员工风格）
- 流式输出（SSE）
- 对话历史记录

### 3. 内置 Agent 场景
- **公文提取 Agent**：上传公文，自动提取标题、日期、主要内容、办理要求
- **公文起草 Agent**：根据要求生成公文草稿
- **政策问答 Agent**：基于知识库回答政策相关问题
- **文案生成 Agent**：根据要求生成各类文案

### 4. Agent 与权限体系打通
- Agent 有独立角色，字段级权限
- 操作日志记录 Agent 调用记录

---

## 架构

```
前端（嵌入式 Chat 组件 + 独立对话页）
  ↓
NestJS（代理 RAGFlow Agent API，记录调用日志）
  ↓
RAGFlow Agent API（Agent 执行、流式输出）
  ↓
RAGFlow 知识库（Agent 检索上下文）
```

---

## Phase 3 → Phase 后续升级路径

```
Phase 3：RAGFlow Agent（快速上线，零开发量）
    ↓
后续：复杂 Agent 用 LangGraph.js 在 NestJS 层自研
      RAGFlow 退化为纯向量检索工具
```

---

## 完成标准

- [ ] Agent 可以创建、配置、删除
- [ ] Agent 对话界面正常工作（流式输出）
- [ ] 至少 3 个内置场景 Agent 上线
- [ ] Agent 调用有日志记录
- [ ] Agent 可嵌入业务页面旁边
