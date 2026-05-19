# Concepts: Harnesson

> Total concepts: 54
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe
> Modules: agent-service, api-routes, chat-ui, tool-cards, graph-ui, projects-ui, graph-storage, layout, pages, stores, slash-commands, shared-types

---

## CONC-001: AI Agent

- **Type:** domain
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** AI Agent 对话核心业务域，涵盖 Agent 会话的创建、消息发送、流式响应、工具调用展示、中断和销毁的完整生命周期。
- **References:** [CONC-002 Message Exchange], [CONC-003 Agent Session Management], [CONC-004 Tool Execution Display]
- **Source files:** apps/server/src/lib/agent-service.ts, apps/server/src/lib/claude-code-adapter.ts, apps/server/src/routes/agents.ts, apps/web/src/stores/agentStore.ts, apps/web/src/components/chat/
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-002: Message Exchange

- **Type:** feature
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 用户与 AI Agent 之间的消息交互功能，包括消息输入（文本、图片、斜杠命令）、消息发送、流式响应展示。
- **References:** [CONC-001 AI Agent], [CONC-005 Message Input], [CONC-006 Message Display], [CONC-007 Send Message]
- **Source files:** apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/components/chat/MessageRenderer.tsx, apps/web/src/hooks/useChatPanel.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-003: Agent Session Management

- **Type:** feature
- **Module:** agent-service (→ [summaries/agent-service.md](architecture/summaries/agent-service.md))
- **Summary:** Agent 会话的生命周期管理，包括创建新会话、列出会话、获取会话详情、销毁会话，以及服务器重启时的会话恢复。
- **References:** [CONC-001 AI Agent], [CONC-014 Create Session], [CONC-015 List Sessions], [CONC-016 Destroy Session]
- **Source files:** apps/server/src/lib/agent-service.ts, apps/server/src/routes/agents.ts, apps/web/src/stores/agentStore.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-004: Tool Execution Display

- **Type:** feature
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** AI Agent 工具调用结果的可视化展示，为每种工具类型提供独立的展示卡片（Bash、Read、Write、Edit 等）。
- **References:** [CONC-001 AI Agent], [CONC-008 Bash Tool Card], [CONC-009 Read Tool Card], [CONC-010 Write Tool Card], [CONC-011 Edit Tool Card], [CONC-012 Glob Tool Card], [CONC-013 Grep Tool Card]
- **Source files:** apps/web/src/components/chat/tool-cards/
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-005: Message Input

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 多功能消息输入组件，集成了文本编辑、斜杠命令补全、图片上传和 Emacs 快捷键。包含多个独立 hook 对应的子功能。
- **References:** [CONC-002 Message Exchange], [CONC-017 Text Input], [CONC-018 Slash Command Completion], [CONC-019 Image Upload], [CONC-020 Emacs Keybindings]
- **Source files:** apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/hooks/useSlashCompletion.ts, apps/web/src/hooks/useImageInput.ts, apps/web/src/hooks/useEmacsKeybindings.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-006: Message Display

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 消息渲染组件，展示对话历史中的文本消息、工具事件卡片、思考指示器和用户问答面板。
- **References:** [CONC-002 Message Exchange], [CONC-021 Thinking Indicator], [CONC-022 Ask User Question Panel], [CONC-023 Todo Progress Bar]
- **Source files:** apps/web/src/components/chat/MessageRenderer.tsx, apps/web/src/components/chat/ThinkingBar.tsx, apps/web/src/components/chat/ThinkingIndicator.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-007: Send Message

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 发送消息到 AI Agent，触发流式处理。前端调用 POST /api/agents/:id/message，后端通过 AgentService 将消息转发给 Claude SDK。
- **References:** [CONC-002 Message Exchange], [CONC-001 AI Agent]
- **Source files:** apps/server/src/routes/agents.ts, apps/web/src/stores/agentStore.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-008: Bash Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示 Bash 命令执行结果的卡片组件，以终端风格显示命令和输出。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/BashCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-009: Read Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示文件读取结果的卡片组件，显示文件内容并支持语法高亮。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/ReadCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-010: Write Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示文件写入操作的卡片组件，显示目标文件路径和写入内容。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/WriteCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-011: Edit Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示文件编辑操作的卡片组件，以搜索/替换差异块形式显示修改内容。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/EditCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-012: Glob Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示 Glob 文件搜索结果的卡片组件，列出匹配的文件路径。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/GlobCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-013: Grep Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示 Grep 内容搜索结果的卡片组件，显示匹配行和上下文。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/GrepCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-014: Create Session

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](summaries/api-routes.md))
- **Summary:** 创建新的 Agent 会话。前端 POST /api/agents，后端 AgentService 创建适配器会话并持久化到数据库。
- **References:** [CONC-003 Agent Session Management]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-015: List Sessions

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](summaries/api-routes.md))
- **Summary:** 列出所有活跃的 Agent 会话。GET /api/agents 返回非 destroyed 状态的会话列表。
- **References:** [CONC-003 Agent Session Management]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-016: Destroy Session

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](summaries/api-routes.md))
- **Summary:** 销毁 Agent 会话。DELETE /api/agents/:id，中断正在进行的处理，关闭 SSE 连接，并标记为 destroyed。
- **References:** [CONC-003 Agent Session Management]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-017: Text Input

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 基于 contentEditable 的富文本输入编辑器，支持多行输入、自动高度调整、Enter 发送和 Shift+Enter 换行。
- **References:** [CONC-005 Message Input]
- **Source files:** apps/web/src/components/chat/RichTextInput.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-018: Slash Command Completion

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 斜杠命令自动补全功能。输入 / 时弹出命令列表，支持键盘导航选择、模糊过滤和命令插入。
- **References:** [CONC-005 Message Input], [CONC-029 Slash Command Discovery]
- **Source files:** apps/web/src/hooks/useSlashCompletion.ts, apps/web/src/components/chat/SlashCommandPopup.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-019: Image Upload

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 图片上传功能。支持粘贴（Cmd+V）、拖拽和文件选择器上传图片，在编辑器中内联显示缩略图预览。
- **References:** [CONC-005 Message Input]
- **Source files:** apps/web/src/hooks/useImageInput.ts, apps/web/src/components/chat/ImagePreview.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-020: Emacs Keybindings

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Emacs/Readline 风格的行内编辑快捷键，包括光标移动（Ctrl+A/E/B/F/P/N）、删除（Ctrl+D/H/W）、Kill-ring（Ctrl+K/U/Y）。
- **References:** [CONC-005 Message Input]
- **Source files:** apps/web/src/hooks/useEmacsKeybindings.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-021: Thinking Indicator

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 思考状态指示器组件，在 Agent 处理过程中显示脉冲动画。
- **References:** [CONC-006 Message Display]
- **Source files:** apps/web/src/components/chat/ThinkingBar.tsx, apps/web/src/components/chat/ThinkingIndicator.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-022: Ask User Question Panel

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** 用户问答面板。当 Agent 通过 AskUserQuestion 工具提问时弹出，显示问题选项并收集用户回答。
- **References:** [CONC-006 Message Display], [CONC-001 AI Agent]
- **Source files:** apps/web/src/components/chat/AskUserQuestionPanel.tsx, apps/web/src/components/chat/HighlightOverlay.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-023: Todo Progress Bar

- **Type:** component
- **Module:** chat-ui (→ [summaries/chat-ui.md](architecture/summaries/chat-ui.md))
- **Summary:** Todo 任务进度条组件，展示 Agent 当前任务列表的完成状态。
- **References:** [CONC-006 Message Display]
- **Source files:** apps/web/src/components/chat/TodoBar.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-024: Streaming Agent Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 嵌套 Agent（子 Agent）对话卡片。以缩进形式展示 Agent 工具调用的嵌套层次，包含子 Agent 的工具使用和文本输出。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx, apps/web/src/components/chat/tool-cards/buildEventTree.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-025: Project Management

- **Type:** domain
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 项目管理业务域，涵盖项目的创建、打开、克隆、删除，以及项目列表展示和详情查看。
- **References:** [CONC-026 Project List], [CONC-027 Create Project], [CONC-028 Delete Project], [CONC-038 Clone Project]
- **Source files:** apps/web/src/components/projects/, apps/server/src/routes/projects.ts, apps/web/src/stores/projectStore.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-026: Project List

- **Type:** component
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 项目列表组件，以网格或行布局展示所有项目，支持切换布局模式。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/web/src/components/projects/ProjectList.tsx, apps/web/src/components/projects/ProjectCard.tsx, apps/web/src/components/projects/ProjectRow.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-027: Create Project

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 创建新项目操作。POST /api/projects，支持指定名称、路径、描述和 git init 选项。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/server/src/routes/projects.ts, apps/web/src/components/projects/CreateProjectModal.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-028: Delete Project

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 删除项目操作。DELETE /api/projects/:id，从数据库中移除项目记录。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-029: Slash Command Discovery

- **Type:** feature
- **Module:** slash-commands (→ [summaries/slash-commands.md](architecture/summaries/slash-commands.md))
- **Summary:** 斜杠命令发现和管理功能，扫描内置命令、插件技能和项目技能，为用户提供可用命令列表。
- **References:** [CONC-018 Slash Command Completion], [CONC-030 List Slash Commands API], [CONC-031 Execute Command API]
- **Source files:** apps/server/src/lib/slash-commands.ts, apps/web/src/stores/slashCommandStore.ts, apps/web/src/lib/slashCommandUtils.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-030: List Slash Commands API

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取可用斜杠命令列表的 API。GET /api/slash-commands，返回内置命令和扫描到的技能命令。
- **References:** [CONC-029 Slash Command Discovery]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/slash-commands.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-031: Execute Command API

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 在 Agent 会话中执行斜杠命令的 API。POST /api/agents/:id/command，支持 clear、compact、model 切换等命令。
- **References:** [CONC-029 Slash Command Discovery], [CONC-001 AI Agent]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-032: Spec Graph

- **Type:** domain
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 规格图谱可视化业务域，包含规格图渲染、详情面板、文档查看、列表视图和同步进度展示。
- **References:** [CONC-033 Specs Graph View], [CONC-034 Sync View], [CONC-035 Graph Detail Panel]
- **Source files:** apps/web/src/components/graph/, apps/web/src/stores/graphStore.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-033: Specs Graph View

- **Type:** component
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 基于 ReactFlow 的规格图可视化组件，以节点图形式展示规格树结构。
- **References:** [CONC-032 Spec Graph]
- **Source files:** apps/web/src/components/graph/SpecsGraph.tsx, apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-034: Sync View

- **Type:** component
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 规格同步触发和进度展示组件。支持全量和增量同步操作，显示同步阶段的进度条。
- **References:** [CONC-032 Spec Graph], [CONC-042 Graph Sync API]
- **Source files:** apps/web/src/components/graph/SyncView.tsx, apps/web/src/components/graph/SyncProgress.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-035: Graph Detail Panel

- **Type:** component
- **Module:** graph-ui (→ [summaries/graph-ui.md](architecture/summaries/graph-ui.md))
- **Summary:** 图谱节点详情侧面板，展示选中节点的详细信息和设计文档。
- **References:** [CONC-032 Spec Graph]
- **Source files:** apps/web/src/components/graph/DetailPanel.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-036: Agent SSE Streaming

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** Agent 事件流式传输。GET /api/agents/:id/stream，通过 SSE 实时推送 Agent 的思考、文本、工具调用等事件。
- **References:** [CONC-001 AI Agent]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-037: Abort Agent

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 中断 Agent 当前处理。POST /api/agents/:id/abort，终止正在进行的消息处理。
- **References:** [CONC-001 AI Agent]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-038: Clone Project

- **Type:** operation
- **Module:** projects-ui (→ [summaries/projects-ui.md](architecture/summaries/projects-ui.md))
- **Summary:** 克隆 Git 仓库到本地并创建项目的操作。通过克隆对话框输入仓库 URL 和本地路径。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/web/src/components/projects/CloneRepoModal.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-039: Get Project

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取单个项目详情的 API。GET /api/projects/:id，返回项目的完整信息。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-040: List Projects

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取所有项目列表的 API。GET /api/projects，按更新时间倒序返回。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/server/src/routes/projects.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-041: Branch Management

- **Type:** feature
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** Git 分支管理功能，包括列出本地和远程分支，以及切换分支操作。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/server/src/routes/branches.ts, apps/web/src/components/layout/BranchDropdown.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-042: Graph Sync API

- **Type:** feature
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 图谱数据同步 API 集合，包括状态检查、数据获取、同步触发（SSE 流式）和取消同步。
- **References:** [CONC-032 Spec Graph]
- **Source files:** apps/server/src/routes/graph.ts, apps/server/src/lib/sync-engine.ts, apps/server/src/lib/graph-storage.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-043: Model Selection

- **Type:** feature
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** AI 模型选择功能，通过下拉菜单列出可用模型并切换当前使用的模型。
- **References:** [CONC-001 AI Agent]
- **Source files:** apps/web/src/components/layout/ModelDropdown.tsx, apps/server/src/routes/agents.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-044: App Navigation

- **Type:** feature
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 应用导航功能，包含侧边栏页面切换和顶部栏的项目/分支选择器。
- **References:** [CONC-025 Project Management], [CONC-041 Branch Management]
- **Source files:** apps/web/src/components/layout/MainLayout.tsx, apps/web/src/components/layout/Sidebar.tsx, apps/web/src/components/layout/Topbar.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-045: Agent Panel

- **Type:** component
- **Module:** layout (→ [summaries/layout.md](architecture/summaries/layout.md))
- **Summary:** 可调整大小的 Agent 对话面板，包含对话内容展示、输入框和上下文菜单（右键菜单操作）。
- **References:** [CONC-001 AI Agent], [CONC-002 Message Exchange]
- **Source files:** apps/web/src/components/layout/AgentPanel.tsx, apps/web/src/components/layout/AgentContextMenu.tsx, apps/web/src/components/layout/AgentContextHeader.tsx, apps/web/src/components/layout/AgentStatusDot.tsx, apps/web/src/components/layout/ResizableDivider.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-046: Folder Picker

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 原生文件夹选择对话框。POST /api/open-folder 调用操作系统原生对话框让用户选择文件夹路径。
- **References:** [CONC-025 Project Management]
- **Source files:** apps/server/src/routes/open-folder.ts, apps/server/src/lib/native-dialog.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-047: Get Agent Messages

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取 Agent 消息历史的 API。GET /api/agents/:id/messages，支持分页和游标加载。
- **References:** [CONC-001 AI Agent], [CONC-006 Message Display]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-048: Get Agent Todos

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 获取 Agent Todo 列表的 API。GET /api/agents/:id/todos，返回任务列表和完成状态。
- **References:** [CONC-001 AI Agent], [CONC-023 Todo Progress Bar]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-049: Submit Tool Result

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 提交用户问答答案的 API。POST /api/agents/:id/tool-result，用于回复 Agent 的 AskUserQuestion 提问。
- **References:** [CONC-001 AI Agent], [CONC-022 Ask User Question Panel]
- **Source files:** apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-050: LSP Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示 LSP 语言服务协议工具调用结果的卡片组件。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/LSPCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-051: New Session Page

- **Type:** component
- **Module:** pages (→ [summaries/pages.md](architecture/summaries/pages.md))
- **Summary:** 新会话首页，包含消息输入框和快捷操作按钮。用户在此创建 Agent 会话并发送首条消息。
- **References:** [CONC-001 AI Agent], [CONC-002 Message Exchange]
- **Source files:** apps/web/src/pages/NewSessionPage.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-052: QA Result Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示用户问答结果的卡片组件，显示 Agent 提问和用户的回答。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/QAResultCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-053: Todo Tool Card

- **Type:** component
- **Module:** tool-cards (→ [summaries/tool-cards.md](architecture/summaries/tool-cards.md))
- **Summary:** 展示 TodoWrite 工具调用结果的卡片组件，显示任务列表和各任务状态。
- **References:** [CONC-004 Tool Execution Display]
- **Source files:** apps/web/src/components/chat/tool-cards/TodoCard.tsx
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-054: List Branches API

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 列出项目 Git 分支的 API。GET /api/projects/:id/branches，返回本地分支、远程分支和当前分支。
- **References:** [CONC-041 Branch Management]
- **Source files:** apps/server/src/routes/branches.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---

## CONC-055: Checkout Branch API

- **Type:** operation
- **Module:** api-routes (→ [summaries/api-routes.md](architecture/summaries/api-routes.md))
- **Summary:** 切换 Git 分支的 API。POST /api/projects/:id/checkout，支持本地分支切换和远程分支跟踪。
- **References:** [CONC-041 Branch Management]
- **Source files:** apps/server/src/routes/branches.ts
- **Last synced:** 2026-05-19T12:00:00Z | Commit: 20df4fe

---
