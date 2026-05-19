# Module: web-chat

> Source files: apps/web/src/components/chat/**/*.{ts,tsx}
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

AI 对话界面的核心组件集合。提供富文本输入、消息渲染、思考指示器、待办任务条、工具卡片渲染等功能。tool-cards 子目录包含所有 Claude Code 工具调用结果的可视化渲染组件。

## Key Files

### apps/web/src/components/chat/RichTextInput.tsx
富文本输入组件。支持文本输入、图片粘贴/拖拽上传、斜杠命令触发、Enter 发送。使用 contenteditable div 实现。

### apps/web/src/components/chat/MessageRenderer.tsx
消息渲染组件。将 Agent 流式事件列表渲染为可视化消息，处理 agent.text、agent.tool_use、agent.tool_result 等事件类型。

### apps/web/src/components/chat/ThinkingIndicator.tsx
AI 思考状态动画指示器。

### apps/web/src/components/chat/ThinkingBar.tsx
思考进度条组件。

### apps/web/src/components/chat/SlashCommandPopup.tsx
斜杠命令自动完成弹出面板。显示可用命令列表，支持键盘导航。

### apps/web/src/components/chat/AskUserQuestionPanel.tsx
AskUserQuestion 交互面板。渲染问题选项，收集用户回答。

### apps/web/src/components/chat/ImagePreview.tsx
图片预览组件。支持查看和删除已上传图片。

### apps/web/src/components/chat/HighlightOverlay.tsx
代码高亮覆盖层组件。

### apps/web/src/components/chat/TodoBar.tsx
待办任务进度条。显示当前任务列表及完成状态。

### apps/web/src/components/chat/tool-cards/index.ts
工具卡片注册表。维护 toolName → CardComponent 的映射关系。

### apps/web/src/components/chat/tool-cards/ToolEventCard.tsx
工具事件卡片路由组件。根据 tool name 分发到对应的具体卡片组件。

### apps/web/src/components/chat/tool-cards/BashCard.tsx
Bash 命令执行结果显示卡片。支持输出折叠和 ANSI 颜色渲染。

### apps/web/src/components/chat/tool-cards/ReadCard.tsx
文件读取结果显示卡片。显示文件路径和内容。

### apps/web/src/components/chat/tool-cards/WriteCard.tsx
文件写入结果显示卡片。显示写入路径和 diff。

### apps/web/src/components/chat/tool-cards/EditCard.tsx
文件编辑结果显示卡片。显示编辑前后的 diff。

### apps/web/src/components/chat/tool-cards/GlobCard.tsx
文件搜索结果显示卡片。显示匹配文件列表。

### apps/web/src/components/chat/tool-cards/GrepCard.tsx
代码搜索结果显示卡片。显示匹配行和上下文。

### apps/web/src/components/chat/tool-cards/LSPCard.tsx
LSP 诊断结果显示卡片。

### apps/web/src/components/chat/tool-cards/TodoCard.tsx
待办任务更新卡片。显示任务列表变更。

### apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx
用户提问交互卡片。

### apps/web/src/components/chat/tool-cards/GenericCard.tsx
通用工具结果回退卡片。

### apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx
流式 Agent 卡片。实时显示子 Agent 的输出。

### apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx
可折叠卡片容器。提供展开/收起交互。

### apps/web/src/components/chat/tool-cards/CodeLine.tsx
单行代码渲染组件。支持语法高亮。

### apps/web/src/components/chat/tool-cards/QAResultCard.tsx
AskUserQuestion 回答结果展示卡片。

### apps/web/src/components/chat/tool-cards/buildEventTree.ts
事件树构建工具。将扁平事件列表组织为层级结构。

### apps/web/src/components/chat/tool-cards/pairEvents.ts
事件配对工具。将 tool_use 和 tool_result 事件配对。

### apps/web/src/components/chat/tool-cards/segmentEvents.ts
事件分段工具。将连续流事件划分为回合。

### apps/web/src/components/chat/tool-cards/langUtils.ts
语言工具函数。根据文件扩展名推断编程语言。

## Exports

- RichTextInput (component) — 富文本输入框
- MessageRenderer (component) — 消息渲染器
- ThinkingIndicator (component) — 思考指示器
- SlashCommandPopup (component) — 命令弹出
- AskUserQuestionPanel (component) — 用户提问面板
- TodoBar (component) — 待办条
- ToolEventCard (component) — 工具卡片路由
- BashCard, ReadCard, WriteCard, EditCard, GlobCard, GrepCard, etc. (component) — 各工具卡片
- buildEventTree, pairEvents, segmentEvents (function) — 事件处理工具

## Dependencies

- → shared-types (AgentMessage, AgentStreamEvent, Agent, SlashCommand 等类型)
- → web-hooks (useSlashCompletion, useImageInput, useEmacsKeybindings)
- → web-stores (agentStore, slashCommandStore)
- → web-lib (serverApi, slashCommandUtils)
