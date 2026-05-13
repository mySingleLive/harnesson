# 同步计划 - 2026-05-13

> **Review 状态**: 已通过 (代码一致性 ✓ / 叶子节点检测 ✓ / 结构合理性 ✓)

## 模式
全量同步

## 基准版本
- Commit: 13a8c663d6169161101ac98d92267cb7979cd6e7
- Message: feat(sync-specs): add operation-level split examples for non-leaf nodes
- Branch: feature/agent-chat-panel

## 变更概览

Harnesson (L1, 新增)
├── AI 对话 (L2, 新增) - AI Agent 对话交互域
│   ├── 会话管理 (L3, 新增)
│   │   ├── 创建会话 (L4, 新增)
│   │   ├── 切换会话 (L4, 新增)
│   │   └── 删除会话 (L4, 新增)
│   ├── 消息输入 (L3, 新增)
│   │   ├── 文本输入与发送 (L4, 新增)
│   │   ├── 图片上传 (L4, 新增)
│   │   └── 斜杠命令补全 (L4, 新增)
│   ├── 消息展示 (L3, 新增)
│   │   ├── 文本消息渲染 (L4, 新增)
│   │   ├── 思考指示器 (L4, 新增)
│   │   ├── 工具执行展示 (L4, 新增)
│   │   │   ├── Bash 命令卡片 (L5, 新增)
│   │   │   ├── 文件读取卡片 (L5, 新增)
│   │   │   ├── 文件写入卡片 (L5, 新增)
│   │   │   ├── 文件编辑卡片 (L5, 新增)
│   │   │   ├── 文件搜索卡片 (L5, 新增)
│   │   │   ├── 内容搜索卡片 (L5, 新增)
│   │   │   ├── LSP 操作卡片 (L5, 新增)
│   │   │   ├── 任务管理卡片 (L5, 新增)
│   │   │   ├── 问答卡片 (L5, 新增)
│   │   │   ├── 嵌套 Agent 卡片 (L5, 新增)
│   │   │   └── 通用工具卡片 (L5, 新增)
│   │   ├── 待办事项展示 (L4, 新增)
│   │   └── 用户问答交互 (L4, 新增)
│   └── Agent 控制 (L3, 新增)
│       ├── 中止执行 (L4, 新增)
│       └── 模型切换 (L4, 新增)
├── 项目管理 (L2, 新增) - 项目 CRUD 和分支管理域
│   ├── 项目创建 (L3, 新增)
│   │   ├── 新建项目 (L4, 新增)
│   │   ├── 打开文件夹 (L4, 新增)
│   │   └── 克隆仓库 (L4, 新增)
│   ├── 项目浏览 (L3, 新增)
│   ├── 查看项目详情 (L3, 新增)
│   ├── 删除项目 (L3, 新增)
│   └── 分支管理 (L3, 新增)
│       ├── 查看分支列表 (L4, 新增)
│       └── 切换分支 (L4, 新增)
├── 规格图谱 (L2, 新增) - 项目规格可视化与同步域
│   ├── 图谱同步 (L3, 新增)
│   │   ├── 发起同步 (L4, 新增)
│   │   ├── 同步进度查看 (L4, 新增)
│   │   └── 取消同步 (L4, 新增)
│   ├── 规格可视化 (L3, 新增)
│   │   ├── 规格图谱视图 (L4, 新增)
│   │   ├── 规格列表视图 (L4, 新增)
│   │   ├── 规格文档视图 (L4, 新增)
│   │   ├── 架构图视图 (L4, 新增)
│   │   └── 技术文档视图 (L4, 新增)
│   └── 节点详情查看 (L3, 新增)
├── 应用框架 (L2, 新增) - 全局导航与面板管理域
│   ├── 页面导航 (L3, 新增)
│   ├── 顶部控制 (L3, 新增)
│   │   ├── 项目快速切换 (L4, 新增)
│   │   └── 分支快速切换 (L4, 新增)
│   └── Agent 面板管理 (L3, 新增)
│       ├── 打开 Agent 面板 (L4, 新增)
│       ├── 调整面板大小 (L4, 新增)
│       └── 最大化面板 (L4, 新增)
├── 文件浏览 (L2, 新增) - 功能待实现
├── Git 管理 (L2, 新增) - 功能待实现
└── 任务管理 (L2, 新增) - 功能待实现

## 详细变更

### harnesson (新增)
- 关联文件: package.json, apps/server/package.json, apps/web/package.json, packages/shared/package.json
- 变更原因: 全量同步，根节点定义项目整体信息
- 预计影响: 所有字段

### ai-chat (新增)
- 关联文件: apps/server/src/routes/agents.ts, apps/server/src/lib/agent-service.ts, apps/server/src/lib/agent-adapter.ts, apps/server/src/lib/claude-code-adapter.ts, apps/web/src/stores/agentStore.ts, apps/web/src/components/layout/AgentPanel.tsx
- 变更原因: AI 对话是核心业务域，覆盖 Agent 会话全生命周期
- 预计影响: 所有字段

### session-management (新增)
- 关联文件: apps/server/src/routes/agents.ts, apps/web/src/stores/agentStore.ts, apps/web/src/components/layout/Sidebar.tsx, apps/web/src/pages/NewSessionPage.tsx
- 变更原因: 会话的创建、切换、删除是独立用户操作
- 预计影响: 所有字段

### create-session (新增)
- 关联文件: apps/web/src/pages/NewSessionPage.tsx, apps/web/src/stores/agentStore.ts, apps/server/src/routes/agents.ts
- 变更原因: 用户通过快捷操作或手动输入创建新 Agent 会话
- 预计影响: 所有字段

### switch-session (新增)
- 关联文件: apps/web/src/components/layout/Sidebar.tsx, apps/web/src/stores/agentStore.ts, apps/web/src/hooks/useChatPanel.ts
- 变更原因: 用户在侧边栏 Agent 列表中切换活跃会话
- 预计影响: 所有字段

### delete-session (新增)
- 关联文件: apps/web/src/components/layout/AgentContextMenu.tsx, apps/web/src/stores/agentStore.ts, apps/server/src/routes/agents.ts
- 变更原因: 用户通过右键菜单删除 Agent 会话
- 预计影响: 所有字段

### message-input (新增)
- 关联文件: apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/hooks/useImageInput.ts, apps/web/src/hooks/useSlashCompletion.ts, apps/web/src/hooks/useEmacsKeybindings.ts
- 变更原因: 消息输入包含文本、图片、斜杠命令等独立输入方式
- 预计影响: 所有字段

### text-input-send (新增)
- 关联文件: apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/hooks/useEmacsKeybindings.ts
- 变更原因: 文本输入与发送是消息交互的最核心操作
- 预计影响: 所有字段

### image-upload (新增)
- 关联文件: apps/web/src/hooks/useImageInput.ts, apps/web/src/components/chat/ImagePreview.tsx, apps/web/src/components/chat/RichTextInput.tsx
- 变更原因: 图片上传（粘贴/拖放）是独立的输入功能
- 预计影响: 所有字段

### slash-command-completion (新增)
- 关联文件: apps/web/src/components/chat/SlashCommandPopup.tsx, apps/web/src/hooks/useSlashCompletion.ts, apps/web/src/lib/slashCommandUtils.ts, apps/web/src/stores/slashCommandStore.ts, apps/server/src/lib/slash-commands.ts
- 变更原因: 斜杠命令自动补全是独立的输入辅助功能
- 预计影响: 所有字段

### message-display (新增)
- 关联文件: apps/web/src/components/chat/MessageRenderer.tsx, apps/web/src/components/chat/tool-cards/ToolEventCard.tsx, apps/web/src/components/chat/tool-cards/buildEventTree.ts, apps/web/src/components/chat/tool-cards/pairEvents.ts, apps/web/src/components/chat/tool-cards/segmentEvents.ts
- 变更原因: 消息展示包含文本、工具卡片、思考指示器等多种展示类型
- 预计影响: 所有字段

### text-message-rendering (新增)
- 关联文件: apps/web/src/components/chat/MessageRenderer.tsx
- 变更原因: 文本消息（用户和 Agent）的 Markdown 渲染
- 预计影响: 所有字段

### thinking-indicator (新增)
- 关联文件: apps/web/src/components/chat/ThinkingBar.tsx, apps/web/src/components/chat/ThinkingIndicator.tsx
- 变更原因: Agent 思考状态的可视化指示
- 预计影响: 所有字段

### tool-execution-display (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/index.ts, apps/web/src/components/chat/tool-cards/ToolEventCard.tsx, apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx, apps/web/src/components/chat/tool-cards/CodeLine.tsx
- 变更原因: 工具执行展示包含多种独立工具类型卡片，需按工具类型拆分子节点
- 预计影响: 所有字段

### bash-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/BashCard.tsx
- 变更原因: Bash 命令执行结果的独立展示卡片
- 预计影响: 所有字段

### file-read-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/ReadCard.tsx
- 变更原因: 文件读取操作的独立展示卡片
- 预计影响: 所有字段

### file-write-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/WriteCard.tsx
- 变更原因: 文件写入操作的独立展示卡片
- 预计影响: 所有字段

### file-edit-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/EditCard.tsx
- 变更原因: 文件编辑（diff 可视化）的独立展示卡片
- 预计影响: 所有字段

### file-search-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/GlobCard.tsx
- 变更原因: 文件模式搜索（Glob）的独立展示卡片
- 预计影响: 所有字段

### content-search-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/GrepCard.tsx
- 变更原因: 内容搜索（Grep）的独立展示卡片
- 预计影响: 所有字段

### lsp-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/LSPCard.tsx
- 变更原因: LSP 操作（定义跳转等）的独立展示卡片
- 预计影响: 所有字段

### todo-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/TodoCard.tsx
- 变更原因: 任务管理操作的独立展示卡片
- 预计影响: 所有字段

### qa-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx, apps/web/src/components/chat/tool-cards/QAResultCard.tsx
- 变更原因: Agent 问答交互的展示卡片
- 预计影响: 所有字段

### nested-agent-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx
- 变更原因: 嵌套 Agent 执行的独立展示卡片
- 预计影响: 所有字段

### generic-tool-card (新增)
- 关联文件: apps/web/src/components/chat/tool-cards/GenericCard.tsx
- 变更原因: 未知工具类型的通用展示卡片
- 预计影响: 所有字段

### todo-display (新增)
- 关联文件: apps/web/src/components/chat/TodoBar.tsx, apps/web/src/stores/agentStore.ts
- 变更原因: Agent 待办事项列表的实时展示
- 预计影响: 所有字段

### user-qa-interaction (新增)
- 关联文件: apps/web/src/components/chat/AskUserQuestionPanel.tsx, apps/web/src/components/chat/HighlightOverlay.tsx
- 变更原因: Agent 向用户提问时的交互面板（选项/自定义回答）
- 预计影响: 所有字段

### agent-control (新增)
- 关联文件: apps/web/src/components/layout/AgentPanel.tsx, apps/web/src/components/layout/AgentContextHeader.tsx, apps/web/src/components/layout/ModelDropdown.tsx, apps/web/src/stores/agentStore.ts
- 变更原因: Agent 运行时控制操作（中止、模型切换）
- 预计影响: 所有字段

### abort-execution (新增)
- 关联文件: apps/web/src/stores/agentStore.ts, apps/server/src/routes/agents.ts
- 变更原因: 用户中止 Agent 当前执行
- 预计影响: 所有字段

### model-switch (新增)
- 关联文件: apps/web/src/components/layout/ModelDropdown.tsx, apps/server/src/routes/agents.ts
- 变更原因: 用户在对话中切换 AI 模型
- 预计影响: 所有字段

### project-management (新增)
- 关联文件: apps/server/src/routes/projects.ts, apps/server/src/routes/branches.ts, apps/web/src/stores/projectStore.ts, apps/web/src/pages/ProjectsPage.tsx
- 变更原因: 项目管理域覆盖项目 CRUD 和分支切换
- 预计影响: 所有字段

### project-creation (新增)
- 关联文件: apps/web/src/components/projects/CreateProjectModal.tsx, apps/web/src/components/projects/CloneRepoModal.tsx, apps/web/src/hooks/useProjectActions.ts
- 变更原因: 项目创建包含新建、打开文件夹、克隆三种独立方式
- 预计影响: 所有字段

### create-project (新增)
- 关联文件: apps/web/src/components/projects/CreateProjectModal.tsx, apps/web/src/hooks/useProjectActions.ts, apps/server/src/routes/projects.ts
- 变更原因: 从零创建新项目
- 预计影响: 所有字段

### open-folder (新增)
- 关联文件: apps/server/src/routes/open-folder.ts, apps/server/src/lib/native-dialog.ts, apps/web/src/hooks/useProjectActions.ts
- 变更原因: 通过系统文件夹选择器打开已有项目
- 预计影响: 所有字段

### clone-repo (新增)
- 关联文件: apps/web/src/components/projects/CloneRepoModal.tsx, apps/web/src/hooks/useProjectActions.ts
- 变更原因: 从 Git 仓库 URL 克隆项目
- 预计影响: 所有字段

### project-browsing (新增)
- 关联文件: apps/web/src/pages/ProjectsPage.tsx, apps/web/src/components/projects/ProjectList.tsx, apps/web/src/components/projects/ProjectCard.tsx, apps/web/src/components/projects/ProjectRow.tsx, apps/web/src/components/projects/EmptyState.tsx, apps/web/src/stores/projectStore.ts
- 变更原因: 浏览、搜索、切换显示模式查看项目列表
- 预计影响: 所有字段

### view-project-details (新增)
- 关联文件: apps/web/src/components/projects/ProjectDetailModal.tsx
- 变更原因: 查看项目元数据、状态、时间等详细信息
- 预计影响: 所有字段

### delete-project (新增)
- 关联文件: apps/web/src/components/projects/ProjectDetailModal.tsx, apps/web/src/hooks/useProjectActions.ts, apps/server/src/routes/projects.ts
- 变更原因: 删除项目（含确认对话框）
- 预计影响: 所有字段

### branch-management (新增)
- 关联文件: apps/server/src/routes/branches.ts, apps/web/src/stores/projectStore.ts
- 变更原因: Git 分支管理包含查看和切换两个独立操作
- 预计影响: 所有字段

### view-branch-list (新增)
- 关联文件: apps/server/src/routes/branches.ts, apps/web/src/stores/projectStore.ts
- 变更原因: 查看项目的本地和远程分支列表
- 预计影响: 所有字段

### switch-branch (新增)
- 关联文件: apps/server/src/routes/branches.ts, apps/web/src/stores/projectStore.ts
- 变更原因: 切换到指定分支（含确认）
- 预计影响: 所有字段

### spec-graph (新增)
- 关联文件: apps/web/src/pages/GraphPage.tsx, apps/web/src/stores/graphStore.ts, apps/server/src/routes/graph.ts, apps/server/src/lib/sync-engine.ts, apps/server/src/lib/graph-storage.ts
- 变更原因: 规格图谱域覆盖同步、可视化、节点详情
- 预计影响: 所有字段

### graph-sync (新增)
- 关联文件: apps/web/src/components/graph/SyncView.tsx, apps/web/src/components/graph/SyncProgress.tsx, apps/server/src/lib/sync-engine.ts, apps/server/src/lib/graph-storage.ts, apps/server/src/routes/graph.ts
- 变更原因: 图谱同步包含发起、查看进度、取消三个独立操作
- 预计影响: 所有字段

### start-sync (新增)
- 关联文件: apps/web/src/components/graph/SyncView.tsx, apps/web/src/stores/graphStore.ts, apps/server/src/routes/graph.ts
- 变更原因: 用户发起项目规格同步分析
- 预计影响: 所有字段

### sync-progress (新增)
- 关联文件: apps/web/src/components/graph/SyncProgress.tsx, apps/web/src/stores/graphStore.ts, apps/server/src/routes/graph.ts
- 变更原因: 实时查看同步进度和日志
- 预计影响: 所有字段

### cancel-sync (新增)
- 关联文件: apps/web/src/components/graph/SyncProgress.tsx, apps/web/src/stores/graphStore.ts, apps/server/src/routes/graph.ts
- 变更原因: 取消正在进行的同步操作
- 预计影响: 所有字段

### spec-visualization (新增)
- 关联文件: apps/web/src/components/graph/SpecsGraph.tsx, apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx, apps/web/src/components/graph/SpecsList.tsx, apps/web/src/components/graph/SpecsDocument.tsx, apps/web/src/components/graph/ArchitectGraph.tsx, apps/web/src/components/graph/TechnicalDocument.tsx, apps/web/src/components/graph/GraphTabBar.tsx, apps/web/src/components/graph/MarkdownViewer.tsx
- 变更原因: 规格可视化包含 5 种独立视图模式
- 预计影响: 所有字段

### specs-graph-view (新增)
- 关联文件: apps/web/src/components/graph/SpecsGraph.tsx, apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx
- 变更原因: 以交互式图谱方式展示项目规格
- 预计影响: 所有字段

### specs-list-view (新增)
- 关联文件: apps/web/src/components/graph/SpecsList.tsx
- 变更原因: 以可折叠树形列表展示规格节点
- 预计影响: 所有字段

### specs-doc-view (新增)
- 关联文件: apps/web/src/components/graph/SpecsDocument.tsx, apps/web/src/components/graph/MarkdownViewer.tsx
- 变更原因: 以文档形式展示规格内容
- 预计影响: 所有字段

### architect-graph-view (新增)
- 关联文件: apps/web/src/components/graph/ArchitectGraph.tsx
- 变更原因: 以架构图方式展示项目结构
- 预计影响: 所有字段

### tech-doc-view (新增)
- 关联文件: apps/web/src/components/graph/TechnicalDocument.tsx, apps/web/src/components/graph/MarkdownViewer.tsx
- 变更原因: 展示技术实现文档
- 预计影响: 所有字段

### node-detail-view (新增)
- 关联文件: apps/web/src/components/graph/DetailPanel.tsx
- 变更原因: 查看图谱节点的详细信息
- 预计影响: 所有字段

### app-shell (新增)
- 关联文件: apps/web/src/components/layout/MainLayout.tsx, apps/web/src/components/layout/Sidebar.tsx, apps/web/src/components/layout/Topbar.tsx
- 变更原因: 应用框架域覆盖全局导航、面板管理
- 预计影响: 所有字段

### page-navigation (新增)
- 关联文件: apps/web/src/components/layout/Sidebar.tsx, apps/web/src/App.tsx
- 变更原因: 侧边栏导航在不同功能页面间切换
- 预计影响: 所有字段

### top-controls (新增)
- 关联文件: apps/web/src/components/layout/Topbar.tsx, apps/web/src/components/layout/ProjectDropdown.tsx, apps/web/src/components/layout/BranchDropdown.tsx
- 变更原因: 顶部控制栏提供项目和分支的快速切换
- 预计影响: 所有字段

### quick-project-switch (新增)
- 关联文件: apps/web/src/components/layout/ProjectDropdown.tsx, apps/web/src/stores/projectStore.ts
- 变更原因: 通过下拉菜单快速切换当前项目
- 预计影响: 所有字段

### quick-branch-switch (新增)
- 关联文件: apps/web/src/components/layout/BranchDropdown.tsx, apps/web/src/stores/projectStore.ts
- 变更原因: 通过下拉菜单快速切换当前分支
- 预计影响: 所有字段

### agent-panel-management (新增)
- 关联文件: apps/web/src/components/layout/MainLayout.tsx, apps/web/src/components/layout/ResizableDivider.tsx, apps/web/src/hooks/useChatPanel.ts
- 变更原因: Agent 面板管理包含打开、调整大小、最大化三个独立操作
- 预计影响: 所有字段

### open-agent-panel (新增)
- 关联文件: apps/web/src/hooks/useChatPanel.ts, apps/web/src/components/layout/MainLayout.tsx
- 变更原因: 打开指定 Agent 的聊天面板
- 预计影响: 所有字段

### resize-panel (新增)
- 关联文件: apps/web/src/components/layout/ResizableDivider.tsx, apps/web/src/components/layout/MainLayout.tsx
- 变更原因: 拖拽调整 Agent 面板宽度
- 预计影响: 所有字段

### maximize-panel (新增)
- 关联文件: apps/web/src/hooks/useChatPanel.ts, apps/web/src/components/layout/MainLayout.tsx
- 变更原因: 最大化/还原 Agent 面板
- 预计影响: 所有字段

### file-browsing (新增, draft)
- 关联文件: apps/web/src/pages/FilesPage.tsx
- 变更原因: 文件浏览功能占位页面，功能待实现
- 预计影响: 所有字段（status: draft）

### git-management (新增, draft)
- 关联文件: apps/web/src/pages/GitPage.tsx
- 变更原因: Git 管理功能占位页面，功能待实现
- 预计影响: 所有字段（status: draft）

### task-management (新增, draft)
- 关联文件: apps/web/src/pages/TasksPage.tsx
- 变更原因: 任务管理功能占位页面，功能待实现
- 预计影响: 所有字段（status: draft）
