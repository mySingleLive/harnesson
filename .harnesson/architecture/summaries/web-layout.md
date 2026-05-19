# Module: web-layout

> Source files: apps/web/src/components/layout/**/*.tsx
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

应用布局框架组件。提供主布局（MainLayout）、侧边栏（Sidebar）、顶栏（Topbar）、Agent 面板（AgentPanel）、可拖动分隔条（ResizableDivider）等全局 UI 结构。同时包含项目/分支/模型选择器等上下文控件。

## Key Files

### apps/web/src/components/layout/MainLayout.tsx
应用主布局组件。组合 Topbar、Sidebar、AgentPanel、ResizableDivider 和主内容区（Outlet），管理面板的显示/隐藏/最大化状态。

### apps/web/src/components/layout/Sidebar.tsx
侧边栏组件。显示 Agent 会话列表和项目列表，支持激活和切换会话。

### apps/web/src/components/layout/Topbar.tsx
顶栏组件。显示运行中的 Agent 数量、快捷操作按钮（新建项目、打开文件夹）。

### apps/web/src/components/layout/AgentPanel.tsx
Agent 对话面板。包含消息列表、RichTextInput、AgentContextHeader，是对话交互的主容器。

### apps/web/src/components/layout/AgentContextHeader.tsx
Agent 上下文头部。显示当前项目、分支、模型信息和快捷操作。

### apps/web/src/components/layout/AgentContextMenu.tsx
Agent 上下文菜单。提供新建、清除、压缩上下文等操作。

### apps/web/src/components/layout/AgentStatusDot.tsx
Agent 状态指示器。用颜色圆点表示 idle/running/error 状态。

### apps/web/src/components/layout/ResizableDivider.tsx
可拖动分隔条组件。支持拖拽调整面板宽度和折叠/展开。

### apps/web/src/components/layout/ProjectDropdown.tsx
项目选择器下拉菜单。

### apps/web/src/components/layout/BranchDropdown.tsx
分支选择器下拉菜单。显示当前分支，支持切换。

### apps/web/src/components/layout/ModelDropdown.tsx
模型选择器下拉菜单。列出可用 AI 模型。

### apps/web/src/components/layout/ConfirmDialog.tsx
通用确认对话框组件。

## Exports

- MainLayout (component) — 主布局
- Sidebar (component) — 侧边栏
- Topbar (component) — 顶栏
- AgentPanel (component) — Agent 面板
- AgentContextHeader (component) — 上下文头部
- AgentContextMenu (component) — 上下文菜单
- AgentStatusDot (component) — 状态指示器
- ResizableDivider (component) — 可拖动分隔条
- ProjectDropdown (component) — 项目选择器
- BranchDropdown (component) — 分支选择器
- ModelDropdown (component) — 模型选择器
- ConfirmDialog (component) — 确认对话框

## Dependencies

- → shared-types (Agent, AgentMessage, Project 等类型)
- → web-stores (agentStore, projectStore)
- → web-chat (RichTextInput, MessageRenderer, ThinkingIndicator, TodoBar, AskUserQuestionPanel)
- → web-hooks (useChatPanel, useAutoScroll)
