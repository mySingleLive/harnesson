# Module: web-stores

> Source files: apps/web/src/stores/*.ts
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

前端状态管理模块。基于 Zustand 实现的全局状态 stores，管理 Agent 会话、Graph 数据、项目和斜杠命令等核心前端状态。每个 store 负责一个领域的状态和操作。

## Key Files

### apps/web/src/stores/agentStore.ts
Agent 会话状态管理。管理 Agent 列表、活跃会话、消息历史、SSE 连接、流式事件处理、Todo 列表、提问答案提交等。核心复杂度在流式事件的接收和状态更新。

### apps/web/src/stores/graphStore.ts
Graph 数据状态管理。管理图谱数据加载、同步触发（SSE 流式进度）、页签切换、节点选择和详情面板。

### apps/web/src/stores/projectStore.ts
项目状态管理。管理项目列表、活跃项目/分支、视图模式（卡片/列表）、搜索过滤、分支操作。

### apps/web/src/stores/slashCommandStore.ts
斜杠命令状态管理。管理可用命令列表的获取和缓存。

## Exports

- useAgentStore (hook) — Agent 状态 store
- useGraphStore (hook) — Graph 状态 store
- useProjectStore (hook) — Project 状态 store
- useSlashCommandStore (hook) — Slash Command 状态 store

## Dependencies

- → shared-types (Agent, Project, GraphFullData, SpecsData, SlashCommand 等所有核心类型)
- → web-lib (serverApi)
