# Concepts: Harnesson

> Total concepts: 95
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4
> Modules: api-routes, agent-service, chat-ui, graph-ui, layout, projects-ui, pages, stores, hooks, web-lib, shared-types

---

## CONC-001: AI Agent Service

- **Type:** domain
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** 服务端核心模块，管理 AI Agent 的生命周期、消息处理与流式传输、Claude Code SDK 集成、图形/规格存储、同步引擎和斜杠命令发现。
- **References:**
- **Source files:** apps/server/src/lib/*.ts, apps/server/src/index.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-002: API Routes

- **Type:** domain
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** Hono HTTP API 路由处理层，提供 Agent 管理、项目 CRUD、Git 分支操作、图形数据访问和同步编排等 REST 端点。
- **References:** [CONC-001 AI Agent Service]
- **Source files:** apps/server/src/routes/*.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-003: Chat Interface

- **Type:** domain
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** AI Agent 对话界面，包含消息渲染、富文本输入（图片嵌入、斜杠命令）、思考指示器和 15+ 专用工具事件卡片。
- **References:** [CONC-008 State Management], [CONC-010 Web Utilities]
- **Source files:** apps/web/src/components/chat/**/*.{ts,tsx}
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-004: Graph Visualization

- **Type:** domain
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 知识图谱可视化模块，使用 React Flow 和 Dagre 布局展示规格图、架构图，提供列表视图、文档查看和同步工作流。
- **References:** [CONC-008 State Management]
- **Source files:** apps/web/src/components/graph/**/*.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-005: App Layout

- **Type:** domain
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 应用布局外壳，提供导航侧栏、顶部栏、Agent 聊天面板、可调整分割器和下拉选择器。
- **References:** [CONC-003 Chat Interface], [CONC-006 Project Management]
- **Source files:** apps/web/src/components/layout/**/*.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-006: Project Management UI

- **Type:** domain
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 项目管理 UI，支持卡片/列表视图、创建/克隆项目、项目详情、空状态和拖放文件夹打开。
- **References:** [CONC-013 Project Entity]
- **Source files:** apps/web/src/components/projects/**/*.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-007: Pages & Routing

- **Type:** domain
- **Module:** pages (→ [summaries/pages.md](architecture/summaries/pages.md))
- **Summary:** 页面级路由组件，将布局和功能模块组合成完整视图：新建会话、项目管理、图形浏览器等。
- **References:** [CONC-003 Chat Interface], [CONC-004 Graph Visualization], [CONC-006 Project Management UI]
- **Source files:** apps/web/src/pages/**/*.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-008: State Management

- **Type:** domain
- **Module:** stores (→ [summaries/stores.md](architecture/summaries/stores.md))
- **Summary:** Zustand 状态管理层，为 Agent、图形/规格、项目和斜杠命令提供集中响应式状态和服务端 API 集成。
- **References:** [CONC-010 Web Utilities], [CONC-011 Shared Type Definitions]
- **Source files:** apps/web/src/stores/*.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-009: React Hooks

- **Type:** domain
- **Module:** hooks (→ [summaries/hooks.md](architecture/summaries/hooks.md))
- **Summary:** 共享 React Hooks 提供可复用的 UI 行为模式：自动滚动、聊天面板状态、计时、Emacs 快捷键、图片输入、键盘导航、项目操作和斜杠命令自动补全。
- **References:** [CONC-008 State Management], [CONC-010 Web Utilities]
- **Source files:** apps/web/src/hooks/*.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-010: Web Utilities

- **Type:** domain
- **Module:** web-lib (→ [summaries/web-lib.md](architecture/summaries/web-lib.md))
- **Summary:** 客户端工具库，提供集中式 API 客户端、斜杠命令解析工具、时间格式化和 Tailwind CSS 类名工具。
- **References:** [CONC-011 Shared Type Definitions]
- **Source files:** apps/web/src/lib/*.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-011: Shared Type Definitions

- **Type:** domain
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 跨工作空间的共享 TypeScript 类型定义，定义整个应用的数据契约：Agent、Graph、Project、SpecNode 和 Task。
- **References:**
- **Source files:** packages/shared/src/**/*.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-012: Agent Entity

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** AI Agent 核心数据模型，定义 Agent 类型、状态、会话上下文、流事件、消息、待办事项、图片附件和内容块等类型。
- **References:** [CONC-011 Shared Type Definitions]
- **Source files:** packages/shared/src/types/agent.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-013: Project Entity

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 项目实体类型，包含 ID、名称、路径、描述、来源、Agent 计数和时间戳字段。
- **References:** [CONC-011 Shared Type Definitions]
- **Source files:** packages/shared/src/types/project.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-014: Graph Data Model

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 知识图谱数据模型，定义图标签、同步状态、存储位置、节点/边数据、规格数据、架构数据、清单和历史条目类型。
- **References:** [CONC-011 Shared Type Definitions]
- **Source files:** packages/shared/src/types/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-015: Spec Node Model

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 规格节点类型，支持层级结构（parentId、level、order）和业务/技术分类。
- **References:** [CONC-011 Shared Type Definitions]
- **Source files:** packages/shared/src/types/spec-node.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-016: Task Model

- **Type:** entity
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** 任务追踪类型，定义任务状态、优先级、规格关联、Agent 分配、分支、标签、时间追踪和生命周期时间戳。
- **References:** [CONC-011 Shared Type Definitions]
- **Source files:** packages/shared/src/types/task.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-017: Agent Adapter Interface

- **Type:** interface
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** AI Agent 后端适配器契约接口，定义 SessionConfig、ModelInfo 和 AdapterSessionData 等支持类型。任何 AI 后端适配器必须实现此接口。
- **References:** [CONC-001 AI Agent Service], [CONC-012 Agent Entity]
- **Source files:** apps/server/src/lib/agent-adapter.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-018: Server API Client

- **Type:** interface
- **Module:** web-lib (→ [summaries/web-lib.md](architecture/summaries/web-lib.md))
- **Summary:** 集中式前端 API 客户端契约，定义所有与后端通信的 fetch 函数签名和请求/响应类型。
- **References:** [CONC-010 Web Utilities], [CONC-011 Shared Type Definitions]
- **Source files:** apps/web/src/lib/serverApi.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-019: Agent Stream Events

- **Type:** interface
- **Module:** shared-types (→ [summaries/shared-types.md](architecture/summaries/shared-types.md))
- **Summary:** Agent 流式事件类型定义，定义 SSE 事件的数据结构，用于前端接收 Agent 的实时响应流。
- **References:** [CONC-012 Agent Entity]
- **Source files:** packages/shared/src/types/agent.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-020: Agent Lifecycle Management

- **Type:** feature
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** Agent 生命周期管理功能，包括创建、销毁、恢复持久化会话，SSE 广播和数据库持久化。
- **References:** [CONC-001 AI Agent Service], [CONC-012 Agent Entity]
- **Source files:** apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-021: Claude Code Integration

- **Type:** feature
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** 通过 @anthropic-ai/claude-agent-sdk 实现 Claude Code 集成，管理 SDK 会话、流式消息、嵌套 Agent 工具调用追踪和中止处理。
- **References:** [CONC-001 AI Agent Service], [CONC-017 Agent Adapter Interface]
- **Source files:** apps/server/src/lib/claude-code-adapter.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-022: Graph/Specs Storage Layer

- **Type:** feature
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** 文件系统存储层，在 .harnesson 目录下读写清单、规格数据（图 JSON、列表 JSON、文档 Markdown）、架构数据和历史归档。
- **References:** [CONC-001 AI Agent Service], [CONC-014 Graph Data Model]
- **Source files:** apps/server/src/lib/graph-storage.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-023: Project Sync Engine

- **Type:** feature
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** 项目同步引擎，生成外部 CLI 子进程进行同步，通过 SSE 流式传输 JSON 进度/节点事件，完成后写入清单并归档。
- **References:** [CONC-001 AI Agent Service], [CONC-022 Graph/Specs Storage Layer]
- **Source files:** apps/server/src/lib/sync-engine.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-024: Slash Command Discovery

- **Type:** feature
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** 从三个来源发现斜杠命令：内置命令、插件技能（~/.claude/plugins/cache）和项目级技能（.claude/skills）。解析 SKILL.md frontmatter 获取描述。
- **References:** [CONC-001 AI Agent Service]
- **Source files:** apps/server/src/lib/slash-commands.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-025: Message Rendering

- **Type:** feature
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 消息渲染功能，将 Agent 流事件构建为层级事件树，渲染 Markdown 文本和工具事件卡片。
- **References:** [CONC-003 Chat Interface], [CONC-019 Agent Stream Events]
- **Source files:** apps/web/src/components/chat/MessageRenderer.tsx, apps/web/src/components/chat/tool-cards/buildEventTree.ts, apps/web/src/components/chat/tool-cards/segmentEvents.ts, apps/web/src/components/chat/tool-cards/pairEvents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-026: Rich Text Editing

- **Type:** feature
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 富文本输入功能，支持 contentEditable 编辑器、内联图片嵌入、斜杠命令补全、Emacs 快捷键、模型选择和发送/中止按钮。
- **References:** [CONC-003 Chat Interface], [CONC-042 Image Upload], [CONC-043 Slash Command Completion], [CONC-044 Emacs Keybindings]
- **Source files:** apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/components/chat/SlashCommandPopup.tsx, apps/web/src/components/chat/HighlightOverlay.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-027: Tool Event Visualization

- **Type:** feature
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 工具事件可视化功能，将 Agent 工具调用和结果配对并渲染为可折叠卡片，支持 Bash、Read、Edit、Write 等 12 种工具类型。
- **References:** [CONC-003 Chat Interface], [CONC-025 Message Rendering]
- **Source files:** apps/web/src/components/chat/tool-cards/*.tsx, apps/web/src/components/chat/tool-cards/*.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-028: Specs Graph View

- **Type:** feature
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 规格知识图谱视图，使用 React Flow 和 Dagre 布局展示规格节点的交互式图。
- **References:** [CONC-004 Graph Visualization], [CONC-015 Spec Node Model]
- **Source files:** apps/web/src/components/graph/SpecsGraph.tsx, apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-029: Architecture Graph View

- **Type:** feature
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 架构知识图谱视图，从 graph store 读取架构数据并通过 FlowGraph 组件渲染。
- **References:** [CONC-004 Graph Visualization]
- **Source files:** apps/web/src/components/graph/ArchitectGraph.tsx, apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-030: Specs List View

- **Type:** feature
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 规格项的树形列表视图，将扁平的 SpecsListItem 数据组织为可折叠的层级结构（项目/域/功能）。
- **References:** [CONC-004 Graph Visualization], [CONC-014 Graph Data Model]
- **Source files:** apps/web/src/components/graph/SpecsList.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-031: Document Viewing

- **Type:** feature
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** Markdown 文档查看功能，用于展示规格文档和技术/架构文档。
- **References:** [CONC-004 Graph Visualization]
- **Source files:** apps/web/src/components/graph/SpecsDocument.tsx, apps/web/src/components/graph/TechnicalDocument.tsx, apps/web/src/components/graph/MarkdownViewer.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-032: Sync Workflow

- **Type:** feature
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 图谱同步工作流，允许用户选择存储位置、发起同步、查看进度和取消同步。
- **References:** [CONC-004 Graph Visualization], [CONC-023 Project Sync Engine]
- **Source files:** apps/web/src/components/graph/SyncView.tsx, apps/web/src/components/graph/SyncProgress.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-033: Agent Chat Panel

- **Type:** feature
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** Agent 聊天面板，渲染消息列表、思考指示器、待办进度条、问答面板和富文本输入，处理消息发送和中止。
- **References:** [CONC-005 App Layout], [CONC-003 Chat Interface]
- **Source files:** apps/web/src/components/layout/AgentPanel.tsx, apps/web/src/components/layout/AgentContextHeader.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-034: Navigation Sidebar

- **Type:** feature
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 左侧导航栏，显示导航链接和按项目分组的 Agent 会话列表，支持折叠和右键上下文菜单。
- **References:** [CONC-005 App Layout], [CONC-012 Agent Entity]
- **Source files:** apps/web/src/components/layout/Sidebar.tsx, apps/web/src/components/layout/AgentContextMenu.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-035: Topbar & Dropdowns

- **Type:** feature
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 顶部栏和下拉选择器，显示品牌、项目切换、分支选择、运行中 Agent 计数和设置按钮。
- **References:** [CONC-005 App Layout], [CONC-013 Project Entity]
- **Source files:** apps/web/src/components/layout/Topbar.tsx, apps/web/src/components/layout/ProjectDropdown.tsx, apps/web/src/components/layout/BranchDropdown.tsx, apps/web/src/components/layout/ModelDropdown.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-036: Project CRUD Operations

- **Type:** feature
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 项目 CRUD 操作界面，支持项目列表搜索、卡片/列表视图切换、创建/克隆/删除项目。
- **References:** [CONC-006 Project Management UI], [CONC-013 Project Entity]
- **Source files:** apps/web/src/components/projects/ProjectList.tsx, apps/web/src/components/projects/ProjectCard.tsx, apps/web/src/components/projects/ProjectRow.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-037: Project Creation & Cloning

- **Type:** feature
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 项目创建和克隆功能，通过模态框收集项目信息或仓库 URL 并调用服务端 API。
- **References:** [CONC-006 Project Management UI]
- **Source files:** apps/web/src/components/projects/CreateProjectModal.tsx, apps/web/src/components/projects/CloneRepoModal.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-038: New Session Page

- **Type:** feature
- **Module:** pages (→ [summaries/pages.md](architecture/summaries/pages.md))
- **Summary:** 新建会话页面，显示品牌、富文本输入和快捷操作按钮（创建功能、修复 Bug、代码审查、编写测试）。
- **References:** [CONC-007 Pages & Routing], [CONC-026 Rich Text Editing]
- **Source files:** apps/web/src/pages/NewSessionPage.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-039: Graph Page

- **Type:** feature
- **Module:** pages (→ [summaries/pages.md](architecture/summaries/pages.md))
- **Summary:** 图形浏览器页面，管理标签视图（规格图、规格列表、文档、架构图、技术文档）、同步工作流和详情面板。
- **References:** [CONC-007 Pages & Routing], [CONC-004 Graph Visualization]
- **Source files:** apps/web/src/pages/GraphPage.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-040: Projects Page

- **Type:** feature
- **Module:** pages (→ [summaries/pages.md](architecture/summaries/pages.md))
- **Summary:** 项目管理页面，显示项目列表或空状态，管理创建和克隆模态框。
- **References:** [CONC-007 Pages & Routing], [CONC-006 Project Management UI]
- **Source files:** apps/web/src/pages/ProjectsPage.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-041: Bash Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Bash 工具事件的可折叠卡片，显示命令、截断输出预览、成功/失败徽章和执行时长。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/BashCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-042: Read Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Read 工具事件的可折叠卡片，显示文件路径、带行号的内容预览（最多 50 行）和成功徽章。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/ReadCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-043: Edit Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Edit 工具事件的差异视图卡片，使用 diffLines 计算统一差异并通过 prism-react-renderer 进行语法高亮。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/EditCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-044: Write Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Write 工具事件的可展开卡片，显示语法高亮的文件内容、文件大小和可折叠代码视图。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/WriteCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-045: Glob Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Glob 工具事件的可折叠卡片，显示 glob 模式、匹配文件数和截断文件列表预览。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/GlobCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-046: Grep Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Grep 工具事件的可折叠卡片，显示搜索模式、可选路径、匹配数和匹配行预览。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/GrepCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-047: LSP Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** LSP 工具事件的可折叠卡片，显示操作类型、文件路径（含行号）和输出结果。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/LSPCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-048: Generic Tool Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 未识别工具事件的回退卡片，显示工具名称、JSON 序列化输入和输出。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/GenericCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-049: AskUserQuestion Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** AskUserQuestion 工具事件的可折叠卡片，显示问题标题和回答文本。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-050: Streaming Agent Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 嵌套 Agent 卡片，支持 running/completed/error/pending 状态，完成后自动折叠，递归渲染子工具卡片和文本段。
- **References:** [CONC-027 Tool Event Visualization], [CONC-025 Message Rendering]
- **Source files:** apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-051: Todo Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 待办事项卡片，显示已完成的待办项列表，带勾选图标和完成计数徽章。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/TodoCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-052: QA Result Card

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 问答结果的内联显示卡片，展示问题和回答文本。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/QAResultCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-053: Collapsible Card Shell

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 可复用的可折叠卡片外壳组件，支持三种视觉状态：运行中（脉冲动画）、折叠（预览）和展开。
- **References:** [CONC-027 Tool Event Visualization]
- **Source files:** apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-054: AskUserQuestion Panel

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 交互式问答面板，支持从预定义选项中单选/多选或输入自定义答案，支持键盘导航和预览布局。
- **References:** [CONC-003 Chat Interface]
- **Source files:** apps/web/src/components/chat/AskUserQuestionPanel.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-055: Thinking Indicator

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 动画"思考中"指示器，带弹跳圆点和旋转状态词（thinking、reasoning、analyzing、processing），支持 sm/md 尺寸。
- **References:** [CONC-003 Chat Interface]
- **Source files:** apps/web/src/components/chat/ThinkingIndicator.tsx, apps/web/src/components/chat/ThinkingBar.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-056: Todo Progress Bar

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 紧凑的水平待办进度条，为每项显示状态图标（完成勾选、进行中旋转、待办方块）。
- **References:** [CONC-003 Chat Interface]
- **Source files:** apps/web/src/components/chat/TodoBar.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-057: Image Upload

- **Type:** component
- **Module:** hooks (→ [summaries/hooks.md](architecture/summaries/hooks.md))
- **Summary:** 图片上传功能 Hook，处理文件选择和剪贴板粘贴，将文件转换为 base64 预览 URL，提供 ImageAttachment[] 供 API 调用使用。
- **References:** [CONC-009 React Hooks], [CONC-026 Rich Text Editing]
- **Source files:** apps/web/src/hooks/useImageInput.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-058: Slash Command Completion

- **Type:** component
- **Module:** hooks (→ [summaries/hooks.md](architecture/summaries/hooks.md))
- **Summary:** 斜杠命令自动补全 Hook，检测 / 片段、过滤命令、管理弹出窗口的键盘导航（方向键、Enter、Tab、Escape）。
- **References:** [CONC-009 React Hooks], [CONC-026 Rich Text Editing]
- **Source files:** apps/web/src/hooks/useSlashCompletion.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-059: Emacs Keybindings

- **Type:** component
- **Module:** hooks (→ [summaries/hooks.md](architecture/summaries/hooks.md))
- **Summary:** Emacs/Readline 快捷键 Hook，为 contentEditable 编辑器提供光标移动、删除和 kill ring 操作，支持跨实例共享 kill ring。
- **References:** [CONC-009 React Hooks], [CONC-026 Rich Text Editing]
- **Source files:** apps/web/src/hooks/useEmacsKeybindings.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-060: Main Layout Shell

- **Type:** component
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 根布局外壳组件，编排 Topbar、Sidebar、AgentPanel、ResizableDivider 和主内容区域，管理面板可见性和调整大小。
- **References:** [CONC-005 App Layout]
- **Source files:** apps/web/src/components/layout/MainLayout.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-061: Agent Status Dot

- **Type:** component
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 彩色状态指示器，显示 Agent 状态（运行中=动画脉冲、已完成=绿色光晕、等待=琥珀色、空闲=灰色、错误=红色）。
- **References:** [CONC-005 App Layout]
- **Source files:** apps/web/src/components/layout/AgentStatusDot.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-062: Confirm Dialog

- **Type:** component
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 通用确认对话框，通过 portal 渲染，支持 Escape 取消和 Enter 确认的键盘监听。
- **References:** [CONC-005 App Layout]
- **Source files:** apps/web/src/components/layout/ConfirmDialog.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-063: Resizable Divider

- **Type:** component
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** AgentPanel 和主内容之间的可拖动垂直分割线，支持鼠标拖动调整大小、折叠和展开。
- **References:** [CONC-005 App Layout]
- **Source files:** apps/web/src/components/layout/ResizableDivider.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-064: Empty State

- **Type:** component
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 无项目时的着陆页面，显示三个操作卡片（打开文件夹、克隆仓库、创建项目），支持拖放文件夹打开。
- **References:** [CONC-006 Project Management UI]
- **Source files:** apps/web/src/components/projects/EmptyState.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-065: Create Project Modal

- **Type:** component
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 创建项目的模态对话框，收集名称、路径、描述和 git-init 开关，显示加载/错误状态。
- **References:** [CONC-006 Project Management UI], [CONC-037 Project Creation & Cloning]
- **Source files:** apps/web/src/components/projects/CreateProjectModal.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-066: Clone Repo Modal

- **Type:** component
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 克隆 Git 仓库的模态对话框，收集仓库 URL 和本地路径，显示加载/错误状态。
- **References:** [CONC-006 Project Management UI], [CONC-037 Project Creation & Cloning]
- **Source files:** apps/web/src/components/projects/CloneRepoModal.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-067: Project Detail Modal

- **Type:** component
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 项目详情模态框，显示名称、路径、来源、Agent 数量、日期，含删除确认和"打开项目"按钮。
- **References:** [CONC-006 Project Management UI], [CONC-013 Project Entity]
- **Source files:** apps/web/src/components/projects/ProjectDetailModal.tsx
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-068: GET /api/models

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取可用 AI 模型列表，通过 agentService 查询支持的模型。
- **References:** [CONC-002 API Routes], [CONC-020 Agent Lifecycle Management]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-069: POST /api/agents

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 创建新 Agent，验证 cwd 为绝对路径且 type 存在，调用 agentService.create 并返回 201。
- **References:** [CONC-002 API Routes], [CONC-020 Agent Lifecycle Management], [CONC-012 Agent Entity]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-070: GET /api/agents

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 列出所有 Agent，从数据库查询并返回列表。
- **References:** [CONC-002 API Routes], [CONC-020 Agent Lifecycle Management]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-071: GET /api/agents/:id

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取单个 Agent 信息，根据 ID 查询数据库，不存在返回 404。
- **References:** [CONC-002 API Routes], [CONC-012 Agent Entity]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-072: GET /api/agents/:id/messages

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取 Agent 消息历史，支持 limit（最大 500）和 before 参数进行分页查询。
- **References:** [CONC-002 API Routes], [CONC-012 Agent Entity]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-073: GET /api/agents/:id/todos

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取 Agent 待办事项列表。
- **References:** [CONC-002 API Routes], [CONC-012 Agent Entity]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-074: POST /api/agents/:id/message

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 向 Agent 发送消息，支持文本和内容块（图片），调用 agentService.sendMessage 进行异步处理。
- **References:** [CONC-002 API Routes], [CONC-020 Agent Lifecycle Management], [CONC-019 Agent Stream Events]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-075: POST /api/agents/:id/tool-result

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 提交 AskUserQuestion 的回答，支持字符串或字符串数组，通过 agentService.submitAnswer 处理。
- **References:** [CONC-002 API Routes], [CONC-020 Agent Lifecycle Management]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-076: GET /api/agents/:id/stream

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** Agent 事件 SSE 流，将 agentService 的实时事件通过 Server-Sent Events 推送到前端，含 30 秒心跳。
- **References:** [CONC-002 API Routes], [CONC-019 Agent Stream Events]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-077: POST /api/agents/:id/abort

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 中止 Agent 当前处理，调用 agentService.abort 取消正在进行的操作。
- **References:** [CONC-002 API Routes], [CONC-020 Agent Lifecycle Management]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-078: GET /api/slash-commands

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取可用斜杠命令列表，根据 cwd 参数从内置命令、插件和项目技能中聚合。
- **References:** [CONC-002 API Routes], [CONC-024 Slash Command Discovery]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-079: POST /api/agents/:id/command

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 执行斜杠命令，验证 command 参数后通过 agentService.executeCommand 执行。
- **References:** [CONC-002 API Routes], [CONC-024 Slash Command Discovery]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-080: DELETE /api/agents/:id

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 销毁 Agent，从数据库和内存中移除 Agent 及其会话数据。
- **References:** [CONC-002 API Routes], [CONC-020 Agent Lifecycle Management], [CONC-012 Agent Entity]
- **Source files:** apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-081: GET /api/projects

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取所有项目列表，按 updatedAt 降序排列。
- **References:** [CONC-002 API Routes], [CONC-013 Project Entity]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-082: GET /api/projects/:id

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取单个项目详情，根据 ID 查询 Prisma，不存在返回 404。
- **References:** [CONC-002 API Routes], [CONC-013 Project Entity]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-083: POST /api/projects

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 创建项目，验证 name 和 path，检查路径是否已存在，可选执行 git init。
- **References:** [CONC-002 API Routes], [CONC-013 Project Entity]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-084: DELETE /api/projects/:id

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 删除项目，通过 Prisma 删除数据库记录，不存在返回 404。
- **References:** [CONC-002 API Routes], [CONC-013 Project Entity]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-085: GET /api/projects/:id/branches

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 列出项目的 Git 分支，包括本地分支、远程分支和当前分支标记。
- **References:** [CONC-002 API Routes], [CONC-013 Project Entity]
- **Source files:** apps/server/src/routes/branches.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-086: POST /api/projects/:id/checkout

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 切换 Git 分支，验证分支名安全，支持从远程分支创建本地跟踪分支。
- **References:** [CONC-002 API Routes], [CONC-013 Project Entity]
- **Source files:** apps/server/src/routes/branches.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-087: GET /api/graph/status

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 检查图谱数据状态，返回是否有数据、最后同步提交、同步时间和是否需要同步。
- **References:** [CONC-002 API Routes], [CONC-022 Graph/Specs Storage Layer], [CONC-014 Graph Data Model]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-088: GET /api/graph/manifest

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取图谱清单数据，包含同步元信息和配置。
- **References:** [CONC-002 API Routes], [CONC-022 Graph/Specs Storage Layer]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-089: GET /api/graph/data

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-rotes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取完整图谱数据，包括规格图、架构图、列表和文档等所有数据。
- **References:** [CONC-002 API Routes], [CONC-022 Graph/Specs Storage Layer]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-090: GET /api/graph/history

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 列出图谱同步历史条目。
- **References:** [CONC-002 API Routes], [CONC-022 Graph/Specs Storage Layer]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-091: GET /api/graph/history/:timestamp

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取特定时间戳的历史图谱数据。
- **References:** [CONC-002 API Routes], [CONC-022 Graph/Specs Storage Layer]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-092: POST /api/graph/sync

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 启动图谱同步，通过 SSE 流式传输进度和节点事件，支持存储位置和同步类型参数。
- **References:** [CONC-002 API Routes], [CONC-023 Project Sync Engine]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-093: POST /api/graph/sync/cancel

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 取消正在进行的图谱同步操作。
- **References:** [CONC-002 API Routes], [CONC-023 Project Sync Engine]
- **Source files:** apps/server/src/routes/graph.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-094: GET /api/health

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 健康检查端点，返回 { status: 'ok', timestamp }。
- **References:** [CONC-002 API Routes]
- **Source files:** apps/server/src/routes/health.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4

---

## CONC-095: POST /api/open-folder

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 触发原生 OS 文件夹选择对话框，返回选定路径或取消状态。
- **References:** [CONC-002 API Routes]
- **Source files:** apps/server/src/routes/open-folder.ts
- **Last synced:** 2026-05-19T00:00:00Z | Commit: 1d90ec4
