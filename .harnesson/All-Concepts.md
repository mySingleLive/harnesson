# Concepts: Harnesson

> Total concepts: 136
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0
> Modules: server-generated, server-lib, server-routes, shared-types, web-chat, web-graph, web-layout, web-projects, web-hooks, web-lib, web-pages, web-stores

---

## CONC-001: Prisma Generated Database Layer

- **Type:** domain
- **Module:** server-generated (→ [summaries/server-generated.md](architecture/summaries/server-generated.md))
- **Summary:** Prisma ORM 自动生成的数据库访问层，提供类型安全的数据模型和 CRUD 操作能力。
- **References:** [CONC-044 Agent Types], [CONC-045 Project Types]
- **Source files:** apps/server/src/generated/**/*.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-002: Project Model

- **Type:** entity
- **Module:** server-generated (→ [summaries/server-generated.md](architecture/summaries/server-generated.md))
- **Summary:** 项目数据实体，存储项目名称、路径、描述、来源（local/clone/create）等信息。
- **References:**
- **Source files:** apps/server/src/generated/models/Project.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-003: AgentSession Model

- **Type:** entity
- **Module:** server-generated (→ [summaries/server-generated.md](architecture/summaries/server-generated.md))
- **Summary:** Agent 会话数据实体，记录会话状态、工作目录、模型选择、权限模式、配置和错误信息。
- **References:** [CONC-044 Agent Types]
- **Source files:** apps/server/src/generated/models/AgentSession.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-004: Message Model

- **Type:** entity
- **Module:** server-generated (→ [summaries/server-generated.md](architecture/summaries/server-generated.md))
- **Summary:** 消息数据实体，记录对话中的用户/AI 消息，包含文本内容、图片、内容块和流式事件。
- **References:** [CONC-003 AgentSession Model]
- **Source files:** apps/server/src/generated/models/Message.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-005: TodoItem Model

- **Type:** entity
- **Module:** server-generated (→ [summaries/server-generated.md](architecture/summaries/server-generated.md))
- **Summary:** 待办任务数据实体，记录 AI Agent 执行过程中的任务项、状态和活跃表单。
- **References:** [CONC-003 AgentSession Model]
- **Source files:** apps/server/src/generated/models/TodoItem.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-006: Server Core Logic

- **Type:** domain
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** 服务端核心业务逻辑层，封装 Agent 生命周期管理、Graph 数据存储、同步引擎和数据库连接。
- **References:** [CONC-001 Prisma Generated Database Layer]
- **Source files:** apps/server/src/lib/*.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-007: Agent Service

- **Type:** feature
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** Agent 会话生命周期管理的核心服务。负责创建/销毁会话、收发消息、SSE 广播、AskUserQuestion 拦截处理、TodoWrite 持久化和服务重启时的会话恢复。
- **References:** [CONC-010 Claude Code Adapter], [CONC-003 AgentSession Model], [CONC-004 Message Model], [CONC-005 TodoItem Model]
- **Source files:** apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-008: Graph Storage

- **Type:** feature
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** Graph 规格数据的持久化存储层，管理 manifest、specs 和 architect 数据的读写、归档和历史版本查询。支持项目级和用户级两种存储位置。
- **References:** [CONC-046 Graph Types]
- **Source files:** apps/server/src/lib/graph-storage.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-009: Sync Engine

- **Type:** feature
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** 规格同步引擎。通过子进程运行 sync-specs CLI，支持 SSE 流式推送同步进度，管理活跃同步进程的启停和取消。
- **References:** [CONC-008 Graph Storage], [CONC-046 Graph Types]
- **Source files:** apps/server/src/lib/sync-engine.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-010: Claude Code Adapter

- **Type:** feature
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** Claude Code CLI 的适配器实现。通过子进程与 claude CLI 通信，管理会话创建、消息发送、流式输出和会话恢复。
- **References:** [CONC-011 Agent Adapter Interface]
- **Source files:** apps/server/src/lib/claude-code-adapter.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-011: Agent Adapter Interface

- **Type:** interface
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** Agent 适配器的抽象接口契约。定义 createSession、sendMessage、abort、destroySession、restoreSession 等标准方法，支持不同 AI 后端的可插拔替换。
- **References:**
- **Source files:** apps/server/src/lib/agent-adapter.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-012: Slash Commands Discovery

- **Type:** operation
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** 从项目工作目录扫描可用的斜杠命令和 Skills，供前端自动补全使用。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/server/src/lib/slash-commands.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-013: Port Finder

- **Type:** operation
- **Module:** server-lib (→ [summaries/server-lib.md](architecture/summaries/server-lib.md))
- **Summary:** 端口可用性检测工具，在首选端口被占用时自动选择备用端口。
- **References:**
- **Source files:** apps/server/src/lib/find-port.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-014: Server API Routes

- **Type:** domain
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** 基于 Hono 框架的 REST API 路由层，提供项目管理、Agent 管理、Graph 同步、Git 分支操作等全部 HTTP 端点。
- **References:** [CONC-006 Server Core Logic]
- **Source files:** apps/server/src/routes/*.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-015: List Projects API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/projects — 获取所有项目列表，按更新时间倒序排列。
- **References:** [CONC-002 Project Model]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-016: Get Project API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/projects/:id — 根据 ID 获取单个项目详情。
- **References:** [CONC-002 Project Model]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-017: Create Project API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/projects — 创建新项目，支持本地路径和可选 git init。如路径已存在则返回已有项目。
- **References:** [CONC-002 Project Model]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-018: Delete Project API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** DELETE /api/projects/:id — 删除指定项目。
- **References:** [CONC-002 Project Model]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-019: List Models API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/models — 获取可用 AI 模型列表及其描述信息。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-020: Create Agent API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/agents — 创建新的 Agent 会话，指定工作目录、类型、模型和权限模式。自动关联到项目。
- **References:** [CONC-007 Agent Service], [CONC-003 AgentSession Model]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-021: List Agents API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/agents — 列出所有未销毁的 Agent 会话。
- **References:** [CONC-007 Agent Service], [CONC-003 AgentSession Model]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-022: Get Agent API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/agents/:id — 获取单个 Agent 会话详情，包含待回答的提问信息。
- **References:** [CONC-007 Agent Service], [CONC-003 AgentSession Model]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-023: Get Agent Messages API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/agents/:id/messages — 获取 Agent 会话的消息历史，支持分页限制和游标查询。
- **References:** [CONC-007 Agent Service], [CONC-004 Message Model]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-024: Get Agent Todos API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/agents/:id/todos — 获取 Agent 会话的当前待办任务列表。
- **References:** [CONC-007 Agent Service], [CONC-005 TodoItem Model]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-025: Send Agent Message API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/agents/:id/message — 向 Agent 发送用户消息并触发 AI 处理，支持文本、内容块和图片。
- **References:** [CONC-007 Agent Service], [CONC-004 Message Model]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-026: Submit Agent Tool Result API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/agents/:id/tool-result — 提交 AskUserQuestion 的用户回答，恢复 Agent 处理。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-027: Agent SSE Stream API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/agents/:id/stream — 建立 SSE 长连接，实时推送 Agent 的 thinking、text、tool_use、tool_result 等流式事件。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-028: Abort Agent API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/agents/:id/abort — 中止 Agent 当前正在进行的处理。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-029: List Slash Commands API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/slash-commands — 获取当前工作目录下可用的斜杠命令和 Skills 列表。
- **References:** [CONC-012 Slash Commands Discovery]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-030: Execute Command API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/agents/:id/command — 执行斜杠命令（如 /clear、/compact、/model、/help），支持参数传递。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-031: Destroy Agent API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** DELETE /api/agents/:id — 销毁 Agent 会话，关闭 SSE 连接并标记为 destroyed。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-032: Get Graph Status API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/graph/status — 检查项目是否已有图谱数据，以及是否需要重新同步。
- **References:** [CONC-008 Graph Storage]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-033: Get Graph Manifest API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/graph/manifest — 获取图谱 manifest，包含项目名、最后同步时间和提交哈希。
- **References:** [CONC-008 Graph Storage]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-034: Get Graph Data API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/graph/data — 获取项目的全量图谱数据（manifest + specs + architect）。
- **References:** [CONC-008 Graph Storage]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-035: Get Graph History API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/graph/history — 获取图谱的同步历史记录列表。
- **References:** [CONC-008 Graph Storage]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-036: Get Graph History Entry API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/graph/history/:timestamp — 获取指定时间戳的历史图谱数据快照。
- **References:** [CONC-008 Graph Storage]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-037: Start Graph Sync API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/graph/sync — 启动图谱同步，通过 SSE 流式返回同步进度和阶段信息。
- **References:** [CONC-009 Sync Engine]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-038: Cancel Graph Sync API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/graph/sync/cancel — 取消正在进行的图谱同步。
- **References:** [CONC-009 Sync Engine]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-039: List Branches API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/projects/:id/branches — 列出项目的本地和远程 Git 分支，识别当前分支。
- **References:** [CONC-002 Project Model]
- **Source files:** apps/server/src/routes/branches.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-040: Checkout Branch API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/projects/:id/checkout — 切换 Git 分支，支持本地分支和远程分支。
- **References:** [CONC-002 Project Model]
- **Source files:** apps/server/src/routes/branches.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-041: Health Check API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** GET /api/health — 服务端健康检查端点，用于前端检测后端可用性。
- **References:**
- **Source files:** apps/server/src/routes/health.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-042: Open Folder Dialog API

- **Type:** operation
- **Module:** server-routes (→ [summaries/server-routes.md](architecture/summaries/server-routes.md))
- **Summary:** POST /api/open-folder — 调用操作系统原生文件夹选择对话框。
- **References:**
- **Source files:** apps/server/src/routes/open-folder.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-043: Shared Type Definitions

- **Type:** domain
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 跨包共享的 TypeScript 类型定义，定义前后端共用的核心数据模型接口，确保类型安全。
- **References:**
- **Source files:** packages/shared/src/**/*.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-044: Agent Types

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** Agent 相关的共享类型定义，包括 Agent、AgentInfo、AgentStreamEvent、AgentMessage、TodoItem、CreateAgentRequest、SendMessageRequest、QuestionData、SlashCommand 等。
- **References:**
- **Source files:** packages/shared/src/types/agent.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-045: Project Types

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** Project 相关的共享类型定义，包括 Project 实体和 ProjectSource 枚举。
- **References:**
- **Source files:** packages/shared/src/types/project.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-046: Graph Types

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** Graph 规格图谱相关的共享类型定义，包括 Manifest、GraphData、SpecsData、ArchitectData、GraphFullData、HistoryEntry、SyncOptions 等。
- **References:**
- **Source files:** packages/shared/src/types/graph.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-047: Spec Node Types

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 规格树节点的共享类型定义，包括 SpecNode 结构和 NodeStatus 枚举（draft/review/stable/deprecated）。
- **References:**
- **Source files:** packages/shared/src/types/spec-node.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-048: Task Types

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 任务管理相关的共享类型定义，包括 Task 实体和 TaskStatus 枚举。
- **References:**
- **Source files:** packages/shared/src/types/task.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-049: AI Chat Interface

- **Type:** domain
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** AI 对话界面的核心组件集合，提供富文本输入、消息流渲染、工具调用卡片、思考状态展示等完整对话交互体验。
- **References:** [CONC-044 Agent Types]
- **Source files:** apps/web/src/components/chat/**/*.{ts,tsx}
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-050: Rich Text Input

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 富文本输入框组件，支持文本输入、图片粘贴和拖拽上传、斜杠命令触发、Enter 发送，使用 contenteditable div 实现。
- **References:** [CONC-053 Slash Command Popup], [CONC-055 Image Preview]
- **Source files:** apps/web/src/components/chat/RichTextInput.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-051: Message Renderer

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 消息渲染组件，将 Agent 的流式事件列表渲染为可视化消息，分发展示文本、工具调用、工具结果等不同事件类型。
- **References:** [CONC-057 Tool Event Card Router]
- **Source files:** apps/web/src/components/chat/MessageRenderer.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-052: Thinking Indicator

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** AI 思考状态动画指示器，在 Agent 处理消息时显示动态反馈。包含脉冲动画和进度条两种形式。
- **References:**
- **Source files:** apps/web/src/components/chat/ThinkingIndicator.tsx, apps/web/src/components/chat/ThinkingBar.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-053: Slash Command Popup

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 斜杠命令自动完成弹出面板，显示匹配的命令列表，支持键盘上下导航和 Enter/Tab 选择。
- **References:** [CONC-111 Slash Completion Hook]
- **Source files:** apps/web/src/components/chat/SlashCommandPopup.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-054: Ask User Question Panel

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** AskUserQuestion 交互面板，渲染 Agent 提问的问题选项（支持多选和预览），收集并提交用户回答。
- **References:** [CONC-026 Submit Agent Tool Result API]
- **Source files:** apps/web/src/components/chat/AskUserQuestionPanel.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-055: Image Preview

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 图片预览组件，显示已上传图片的缩略图，支持查看放大和删除操作。
- **References:**
- **Source files:** apps/web/src/components/chat/ImagePreview.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-056: Todo Bar

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 待办任务进度条，显示 AI Agent 当前的 TodoWrite 任务列表及其完成状态。
- **References:** [CONC-005 TodoItem Model]
- **Source files:** apps/web/src/components/chat/TodoBar.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-057: Tool Event Card Router

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 工具事件卡片路由组件，根据 tool name 查找注册表并分发到对应的具体卡片组件，维护 toolName→CardComponent 的映射。
- **References:** [CONC-058 Bash Card], [CONC-059 Read Card], [CONC-060 Write Card], [CONC-061 Edit Card]
- **Source files:** apps/web/src/components/chat/tool-cards/ToolEventCard.tsx, apps/web/src/components/chat/tool-cards/index.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-058: Bash Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** Bash 命令执行结果的展示卡片，支持输出内容折叠/展开和 ANSI 颜色代码渲染。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/BashCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-059: Read Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 文件读取结果展示卡片，显示文件路径和读取内容，支持代码语法高亮。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/ReadCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-060: Write Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 文件写入结果展示卡片，显示写入的文件路径和内容变更（diff）。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/WriteCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-061: Edit Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 文件编辑结果展示卡片，显示编辑前后的 diff 对比，支持代码语法高亮。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/EditCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-062: Glob Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 文件模式搜索结果显示卡片，展示匹配的文件路径列表。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/GlobCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-063: Grep Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 代码内容搜索结果显示卡片，展示匹配行和上下文，支持代码高亮。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/GrepCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-064: LSP Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** LSP 语言服务器诊断结果展示卡片，显示代码检查的问题和警告列表。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/LSPCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-065: Todo Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** TodoWrite 任务更新卡片，展示 AI Agent 创建或更新的任务列表变更。
- **References:** [CONC-005 TodoItem Model]
- **Source files:** apps/web/src/components/chat/tool-cards/TodoCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-066: Ask User Question Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** AskUserQuestion 工具调用的消息卡片，在消息流中展示 Agent 提问和用户回答。
- **References:** [CONC-054 Ask User Question Panel]
- **Source files:** apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-067: Generic Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 通用工具结果回退卡片，当工具没有专用卡片时使用，显示基本的工具名和输出内容。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/GenericCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-068: Streaming Agent Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 流式子 Agent 卡片，实时显示子 Agent 任务的输出和进度。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-069: Collapsible Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 可折叠卡片容器组件，提供展开/收起交互，用于包裹需要节省空间的工具卡片内容。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-070: QA Result Card

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** AskUserQuestion 回答结果展示卡片，在消息流中显示用户对 Agent 提问的回答内容。
- **References:** [CONC-066 Ask User Question Card]
- **Source files:** apps/web/src/components/chat/tool-cards/QAResultCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-071: Code Line

- **Type:** component
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 单行代码渲染组件，支持根据文件扩展名或语言标识进行语法高亮。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/CodeLine.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-072: Event Tree Builder

- **Type:** operation
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 事件树构建工具函数，将扁平的 Agent 流式事件列表组织为层级树结构，便于渲染嵌套的工具调用。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/buildEventTree.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-073: Event Pairer

- **Type:** operation
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 事件配对工具函数，将 tool_use 和对应的 tool_result 事件配对，形成完整的工具调用记录。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/pairEvents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-074: Event Segmenter

- **Type:** operation
- **Module:** web-chat (→ [summaries/web-chat.md](architecture/summaries/web-chat.md))
- **Summary:** 事件分段工具函数，将连续的 Agent 流式事件按回合（turn）进行划分。
- **References:**
- **Source files:** apps/web/src/components/chat/tool-cards/segmentEvents.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-075: Graph Visualization

- **Type:** domain
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 项目规格图谱可视化模块，提供多种视图展示项目架构和规格数据，支持同步进度展示和节点详情面板。
- **References:** [CONC-046 Graph Types]
- **Source files:** apps/web/src/components/graph/**/*.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-076: Specs Graph View

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 规格树力导向图谱可视化，以节点和连线展示项目规格的层级结构和关联关系。
- **References:** [CONC-047 Spec Node Types], [CONC-087 Graph Nodes]
- **Source files:** apps/web/src/components/graph/SpecsGraph.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-077: Specs List View

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 规格树形列表视图，以可折叠树形列表展示所有规格节点及其层级关系。
- **References:** [CONC-047 Spec Node Types]
- **Source files:** apps/web/src/components/graph/SpecsList.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-078: Specs Document View

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 规格文档视图，展示选中规格节点的详细文档内容，包括描述、验收标准、设计文档等。
- **References:** [CONC-085 Markdown Viewer]
- **Source files:** apps/web/src/components/graph/SpecsDocument.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-079: Flow Graph View

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 流程图视图，展示项目架构中模块间的数据流和依赖关系。
- **References:**
- **Source files:** apps/web/src/components/graph/FlowGraph.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-080: Architect Graph View

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 架构图视图，展示项目代码架构的组件层级和模块关系。
- **References:**
- **Source files:** apps/web/src/components/graph/ArchitectGraph.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-081: Graph Tab Bar

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 图谱页签切换栏，提供多个视图（specs-graph、specs-list、specs-document、architect-graph、flow-graph）之间的切换。
- **References:**
- **Source files:** apps/web/src/components/graph/GraphTabBar.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-082: Detail Panel

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 节点详情面板，展示选中图谱节点的完整信息，包括属性、描述、目标、约束和验收标准。
- **References:** [CONC-047 Spec Node Types]
- **Source files:** apps/web/src/components/graph/DetailPanel.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-083: Sync Progress

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 同步进度展示组件，显示图谱同步的当前阶段、进度百分比和日志输出。
- **References:** [CONC-009 Sync Engine]
- **Source files:** apps/web/src/components/graph/SyncProgress.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-084: Sync View

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 同步触发视图，提供同步按钮、自动同步检测和同步类型选择。
- **References:** [CONC-037 Start Graph Sync API]
- **Source files:** apps/web/src/components/graph/SyncView.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-085: Markdown Viewer

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** Markdown 渲染组件，将 Markdown 格式的文档内容渲染为富文本 HTML。
- **References:**
- **Source files:** apps/web/src/components/graph/MarkdownViewer.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-086: Technical Document View

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 技术文档视图，展示项目架构设计文档的完整内容。
- **References:** [CONC-085 Markdown Viewer]
- **Source files:** apps/web/src/components/graph/TechnicalDocument.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-087: Graph Nodes

- **Type:** component
- **Module:** web-graph (→ [summaries/web-graph.md](architecture/summaries/web-graph.md))
- **Summary:** 图谱节点渲染组件，根据节点类型和状态渲染对应的可视化节点元素。
- **References:** [CONC-047 Spec Node Types]
- **Source files:** apps/web/src/components/graph/GraphNodes.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-088: App Layout Framework

- **Type:** domain
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 应用布局框架，提供全局 UI 结构组件，包括主布局、侧边栏、顶栏、面板和通用交互控件。
- **References:**
- **Source files:** apps/web/src/components/layout/**/*.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-089: Main Layout

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 应用主布局组件，编排 Topbar、Sidebar、AgentPanel、ResizableDivider 和主内容区（Outlet），管理面板显示/隐藏/最大化状态。
- **References:** [CONC-091 Topbar], [CONC-090 Sidebar], [CONC-092 Agent Panel], [CONC-096 Resizable Divider]
- **Source files:** apps/web/src/components/layout/MainLayout.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-090: Sidebar

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 侧边栏组件，显示 Agent 会话历史列表和项目列表，支持点击切换活跃会话和项目。
- **References:** [CONC-095 Agent Status Dot]
- **Source files:** apps/web/src/components/layout/Sidebar.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-091: Topbar

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 顶栏组件，显示运行中的 Agent 数量和快捷操作按钮（新建项目、打开文件夹）。
- **References:**
- **Source files:** apps/web/src/components/layout/Topbar.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-092: Agent Panel

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** Agent 对话面板，作为消息列表、RichTextInput、AgentContextHeader 的容器，是用户与 AI 交互的主界面。
- **References:** [CONC-051 Message Renderer], [CONC-050 Rich Text Input], [CONC-093 Agent Context Header]
- **Source files:** apps/web/src/components/layout/AgentPanel.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-093: Agent Context Header

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** Agent 上下文头部，显示当前项目名称、Git 分支、AI 模型信息和快捷操作入口。
- **References:** [CONC-097 Project Dropdown], [CONC-098 Branch Dropdown], [CONC-099 Model Dropdown]
- **Source files:** apps/web/src/components/layout/AgentContextHeader.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-094: Agent Context Menu

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** Agent 上下文菜单，提供新建会话、清除对话、压缩上下文等操作选项。
- **References:** [CONC-007 Agent Service]
- **Source files:** apps/web/src/components/layout/AgentContextMenu.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-095: Agent Status Dot

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** Agent 状态指示器，用颜色圆点（绿色/idle、蓝色/running、红色/error）直观表示 Agent 运行状态。
- **References:**
- **Source files:** apps/web/src/components/layout/AgentStatusDot.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-096: Resizable Divider

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 可拖动分隔条，支持鼠标拖拽调整 Agent 面板宽度，以及面板的折叠/展开操作。
- **References:**
- **Source files:** apps/web/src/components/layout/ResizableDivider.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-097: Project Dropdown

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 项目选择器下拉菜单，列出所有已注册项目，支持切换活跃项目上下文。
- **References:** [CONC-045 Project Types]
- **Source files:** apps/web/src/components/layout/ProjectDropdown.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-098: Branch Dropdown

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 分支选择器下拉菜单，显示当前 Git 分支，列出本地/远程分支并支持切换。
- **References:** [CONC-039 List Branches API]
- **Source files:** apps/web/src/components/layout/BranchDropdown.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-099: Model Dropdown

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** AI 模型选择器下拉菜单，列出可用模型及其描述，支持切换当前会话使用的模型。
- **References:** [CONC-019 List Models API]
- **Source files:** apps/web/src/components/layout/ModelDropdown.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-100: Confirm Dialog

- **Type:** component
- **Module:** web-layout (→ [summaries/web-layout.md](architecture/summaries/web-layout.md))
- **Summary:** 通用确认对话框组件，用于删除确认、操作确认等需要用户二次确认的场景。
- **References:**
- **Source files:** apps/web/src/components/layout/ConfirmDialog.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-101: Project Management UI

- **Type:** domain
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 项目管理界面组件集合，提供项目的创建、列表展示、详情查看和删除等完整 UI 操作流程。
- **References:** [CONC-045 Project Types]
- **Source files:** apps/web/src/components/projects/**/*.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-102: Project List Container

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 项目列表容器组件，管理视图模式切换（卡片/列表）、搜索过滤和空状态条件渲染。
- **References:** [CONC-103 Project Card], [CONC-104 Project Row], [CONC-109 Empty State]
- **Source files:** apps/web/src/components/projects/ProjectList.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-103: Project Card

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 项目卡片组件，以卡片形式展示项目名称、路径摘要、来源类型等信息。
- **References:** [CONC-045 Project Types]
- **Source files:** apps/web/src/components/projects/ProjectCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-104: Project Row

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 项目列表行组件，以表格行形式在列表视图中展示项目详细信息。
- **References:** [CONC-045 Project Types]
- **Source files:** apps/web/src/components/projects/ProjectRow.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-105: Create Project Modal

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 创建项目弹窗，提供多步骤表单：选择创建方式（本地路径/仓库克隆）、输入项目名称和路径、配置 Git 初始化。
- **References:** [CONC-017 Create Project API], [CONC-106 Clone Repo Modal]
- **Source files:** apps/web/src/components/projects/CreateProjectModal.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-106: Clone Repo Modal

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** Git 仓库克隆弹窗，输入远程仓库 URL 和本地目标路径进行克隆。
- **References:** [CONC-017 Create Project API]
- **Source files:** apps/web/src/components/projects/CloneRepoModal.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-107: Project Detail Modal

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 项目详情弹窗，展示项目完整属性信息和操作选项（打开、删除等）。
- **References:** [CONC-045 Project Types]
- **Source files:** apps/web/src/components/projects/ProjectDetailModal.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-108: Action Card

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 操作卡片组件，在首页提供快速操作入口（新建项目、打开已有项目等）。
- **References:**
- **Source files:** apps/web/src/components/projects/ActionCard.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-109: Empty State

- **Type:** component
- **Module:** web-projects (→ [summaries/web-projects.md](architecture/summaries/web-projects.md))
- **Summary:** 空状态引导组件，在无项目时展示引导信息和快速创建入口。
- **References:**
- **Source files:** apps/web/src/components/projects/EmptyState.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-110: React Hooks

- **Type:** domain
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** React 自定义 Hooks 集合，封装可复用的 UI 交互逻辑和状态管理。
- **References:**
- **Source files:** apps/web/src/hooks/*.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-111: Slash Completion Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** 斜杠命令自动补全逻辑 Hook，监控输入框 `/` 触发命令搜索和过滤，支持键盘导航（ArrowUp/Down/Enter/Tab/Escape），选择后替换输入文本。
- **References:** [CONC-029 List Slash Commands API]
- **Source files:** apps/web/src/hooks/useSlashCompletion.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-112: Image Input Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** 图片输入 Hook，处理粘贴和拖拽图片到输入框，生成 ImageAttachment 数据用于发送给 Agent。
- **References:**
- **Source files:** apps/web/src/hooks/useImageInput.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-113: Emacs Keybindings Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** Emacs 风格快捷键 Hook，在文本输入框中支持 Ctrl+A/E/N/P/F/B/D/K 等基本编辑操作。
- **References:**
- **Source files:** apps/web/src/hooks/useEmacsKeybindings.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-114: Chat Panel Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** 聊天面板控制 Hook，管理 Agent 对话面板的打开/关闭/最大化状态切换。
- **References:** [CONC-092 Agent Panel]
- **Source files:** apps/web/src/hooks/useChatPanel.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-115: Auto Scroll Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** 自动滚动 Hook，在聊天消息更新时自动滚动到底部，检测用户手动上滚时暂停自动滚动。
- **References:**
- **Source files:** apps/web/src/hooks/useAutoScroll.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-116: Keyboard Navigation Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** 键盘导航 Hook，支持在列表中使用上下键导航选择项。
- **References:**
- **Source files:** apps/web/src/hooks/useKeyboardNavigation.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-117: Project Actions Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** 项目操作 Hook，封装创建项目（含本地文件夹选择对话框）和删除项目的完整异步操作流程。
- **References:** [CONC-017 Create Project API], [CONC-018 Delete Project API], [CONC-042 Open Folder Dialog API]
- **Source files:** apps/web/src/hooks/useProjectActions.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-118: Elapsed Time Hook

- **Type:** component
- **Module:** web-hooks (→ [summaries/web-hooks.md](architecture/summaries/web-hooks.md))
- **Summary:** 运行时间追踪 Hook，计算并显示从指定起始时间到当前的耗时（用于 Agent 运行时长等场景）。
- **References:**
- **Source files:** apps/web/src/hooks/useElapsedTime.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-119: Frontend Utility Library

- **Type:** domain
- **Module:** web-lib (→ [summaries/web-lib.md](architecture/summaries/web-lib.md))
- **Summary:** 前端工具库，封装后端 API 调用、斜杠命令过滤和通用工具函数，是前端与后端通信的统一接口层。
- **References:**
- **Source files:** apps/web/src/lib/*.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-120: Server API Client

- **Type:** feature
- **Module:** web-lib (→ [summaries/web-lib.md](architecture/summaries/web-lib.md))
- **Summary:** 服务端 API 调用封装，涵盖所有后端接口（项目 CRUD、Agent 管理、Graph 数据、Git 分支、Slash Commands），每个函数对应一个 REST 端点。
- **References:** [CONC-014 Server API Routes]
- **Source files:** apps/web/src/lib/serverApi.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-121: Slash Command Utilities

- **Type:** operation
- **Module:** web-lib (→ [summaries/web-lib.md](architecture/summaries/web-lib.md))
- **Summary:** 斜杠命令工具函数，解析输入文本中的当前斜杠片段并执行命令过滤匹配。
- **References:** [CONC-111 Slash Completion Hook]
- **Source files:** apps/web/src/lib/slashCommandUtils.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-122: Time Utilities

- **Type:** operation
- **Module:** web-lib (→ [summaries/web-lib.md](architecture/summaries/web-lib.md))
- **Summary:** 时间工具函数，格式化相对时间和持续时间的显示。
- **References:**
- **Source files:** apps/web/src/lib/time.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-123: General Utilities

- **Type:** operation
- **Module:** web-lib (→ [summaries/web-lib.md](architecture/summaries/web-lib.md))
- **Summary:** 通用客户端工具函数，如 className 条件合并等。
- **References:**
- **Source files:** apps/web/src/lib/utils.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-124: Application Pages

- **Type:** domain
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** 应用路由页面集合，每个页面对应一个前端路由，通过 React Router 在 MainLayout 中渲染。
- **References:**
- **Source files:** apps/web/src/pages/*.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-125: New Session Page

- **Type:** component
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** AI 新会话首页（路由 `/`），展示快速操作卡片和 Agent 创建入口，是用户启动 AI 对话的起点。
- **References:** [CONC-020 Create Agent API], [CONC-108 Action Card]
- **Source files:** apps/web/src/pages/NewSessionPage.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-126: Projects Page

- **Type:** component
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** 项目管理页面（路由 `/projects`），渲染项目列表和管理操作界面。
- **References:** [CONC-102 Project List Container]
- **Source files:** apps/web/src/pages/ProjectsPage.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-127: Graph Page

- **Type:** component
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** 图谱浏览页面（路由 `/graph`），渲染项目规格图谱的各视图组件和同步控件。
- **References:** [CONC-076 Specs Graph View], [CONC-081 Graph Tab Bar], [CONC-082 Detail Panel], [CONC-084 Sync View]
- **Source files:** apps/web/src/pages/GraphPage.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-128: Tasks Page

- **Type:** component
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** 任务管理页面（路由 `/tasks`），展示当前项目的待办任务列表和状态。
- **References:** [CONC-005 TodoItem Model]
- **Source files:** apps/web/src/pages/TasksPage.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-129: Files Page

- **Type:** component
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** 文件浏览页面（路由 `/files`），展示项目文件树结构。
- **References:**
- **Source files:** apps/web/src/pages/FilesPage.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-130: Git Page

- **Type:** component
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** Git 操作页面（路由 `/git`），展示分支信息、提交历史和 Git 相关操作。
- **References:** [CONC-039 List Branches API], [CONC-040 Checkout Branch API]
- **Source files:** apps/web/src/pages/GitPage.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-131: Not Found Page

- **Type:** component
- **Module:** web-pages (→ [summaries/web-pages.md](architecture/summaries/web-pages.md))
- **Summary:** 404 错误页面（路由 `*`），路由未匹配时的回退页面。
- **References:**
- **Source files:** apps/web/src/pages/NotFoundPage.tsx
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-132: State Management

- **Type:** domain
- **Module:** web-stores (→ [summaries/web-stores.md](architecture/summaries/web-stores.md))
- **Summary:** 基于 Zustand 的前端全局状态管理，管理 Agent 会话、Graph 数据、项目和斜杠命令等核心领域状态。
- **References:**
- **Source files:** apps/web/src/stores/*.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-133: Agent Store

- **Type:** feature
- **Module:** web-stores (→ [summaries/web-stores.md](architecture/summaries/web-stores.md))
- **Summary:** Agent 会话状态管理 Store，管理 Agent 列表、活跃会话、消息历史、SSE 实时连接、流式事件处理、Todo 列表和用户提问答案提交。
- **References:** [CONC-044 Agent Types], [CONC-025 Send Agent Message API], [CONC-027 Agent SSE Stream API]
- **Source files:** apps/web/src/stores/agentStore.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-134: Graph Store

- **Type:** feature
- **Module:** web-stores (→ [summaries/web-stores.md](architecture/summaries/web-stores.md))
- **Summary:** Graph 数据状态管理 Store，管理图谱数据加载、同步触发（SSE 流式进度）、视图切换、节点选择和详情面板状态。
- **References:** [CONC-046 Graph Types], [CONC-034 Get Graph Data API], [CONC-037 Start Graph Sync API]
- **Source files:** apps/web/src/stores/graphStore.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-135: Project Store

- **Type:** feature
- **Module:** web-stores (→ [summaries/web-stores.md](architecture/summaries/web-stores.md))
- **Summary:** 项目状态管理 Store，管理项目列表、活跃项目/分支、视图模式（卡片/列表）、搜索过滤和 Git 分支操作。
- **References:** [CONC-045 Project Types], [CONC-015 List Projects API], [CONC-039 List Branches API]
- **Source files:** apps/web/src/stores/projectStore.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0

---

## CONC-136: Slash Command Store

- **Type:** feature
- **Module:** web-stores (→ [summaries/web-stores.md](architecture/summaries/web-stores.md))
- **Summary:** 斜杠命令状态管理 Store，管理可用斜杠命令和 Skills 列表的获取与缓存。
- **References:** [CONC-029 List Slash Commands API]
- **Source files:** apps/web/src/stores/slashCommandStore.ts
- **Last synced:** 2026-05-19T21:00:00Z | Commit: 73edcc0
