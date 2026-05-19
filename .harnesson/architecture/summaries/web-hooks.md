# Module: web-hooks

> Source files: apps/web/src/hooks/*.ts
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

React 自定义 Hooks 集合。封装可复用的 UI 交互逻辑，包括斜杠命令补全、图片上传、Emacs 快捷键、聊天面板控制、自动滚动、项目操作、键盘导航和运行时间追踪。

## Key Files

### apps/web/src/hooks/useSlashCompletion.ts
斜杠命令自动补全 Hook。监控输入框中的 `/` 触发命令搜索、过滤和键盘导航，支持选择后替换输入文本。

### apps/web/src/hooks/useImageInput.ts
图片输入 Hook。处理粘贴和拖拽图片上传，生成 ImageAttachment 数据。

### apps/web/src/hooks/useEmacsKeybindings.ts
Emacs 风格快捷键 Hook。支持 Ctrl+A/E/N/P/F/B/D/K 等基本编辑快捷键。

### apps/web/src/hooks/useChatPanel.ts
聊天面板控制 Hook。管理面板打开/关闭/最大化状态。

### apps/web/src/hooks/useAutoScroll.ts
自动滚动 Hook。聊天消息更新时自动滚动到底部，用户手动上滚时暂停。

### apps/web/src/hooks/useKeyboardNavigation.ts
键盘导航 Hook。支持上下键在列表中导航。

### apps/web/src/hooks/useProjectActions.ts
项目操作 Hook。封装创建项目（含本地文件夹选择）、删除项目的异步操作。

### apps/web/src/hooks/useElapsedTime.ts
运行时间追踪 Hook。计算并显示从指定时间开始的耗时。

## Exports

- useSlashCompletion (hook) — 斜杠命令补全
- useImageInput (hook) — 图片上传
- useEmacsKeybindings (hook) — Emacs 快捷键
- useChatPanel (hook) — 聊天面板控制
- useAutoScroll (hook) — 自动滚动
- useKeyboardNavigation (hook) — 键盘导航
- useProjectActions (hook) — 项目操作
- useElapsedTime (hook) — 运行时间

## Dependencies

- → shared-types (SlashCommand, ImageAttachment, Agent 等类型)
- → web-stores (agentStore, slashCommandStore, projectStore)
- → web-lib (serverApi, slashCommandUtils)
