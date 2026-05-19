# Module: web-lib

> Source files: apps/web/src/lib/*.ts
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

前端工具库。封装后端 API 调用（serverApi）、斜杠命令工具函数（slashCommandUtils）和通用工具（时间格式化等）。作为前端与后端通信的统一接口层。

## Key Files

### apps/web/src/lib/serverApi.ts
服务端 API 调用封装。涵盖所有后端接口：项目管理（CRUD）、Agent 管理（创建、消息、流）、Graph 数据（状态、数据、历史、同步）、Git 分支（列表、切换）、Slash Commands 等。每个函数对应一个 REST 端点。

### apps/web/src/lib/slashCommandUtils.ts
斜杠命令工具函数。解析输入文本中的当前斜杠片段、命令过滤匹配逻辑。

### apps/web/src/lib/time.ts
时间工具函数。格式化相对时间、持续时间显示。

### apps/web/src/lib/utils.ts
通用工具函数。className 合并等。

## Exports

- isServerRunning (function) — 检测服务端状态
- openFolderDialog (function) — 打开文件夹
- getProjects, getProject, createProject, removeProject (function) — 项目 API
- getProjectBranches, checkoutBranch (function) — 分支 API
- getGraphStatus, getGraphData, getGraphManifest, getGraphHistory (function) — Graph API
- getSupportedModels (function) — 模型列表
- createAgent, listAgents, sendAgentMessage, abortAgent, destroyAgent (function) — Agent API
- getAgentMessages, getAgentTodos (function) — 消息和 Todo API
- getSlashCommands, executeCommand (function) — 命令 API
- filterCommands, getCurrentSlashFragment (function) — 命令工具
- formatTime, formatDuration (function) — 时间工具

## Dependencies

- → shared-types (Project, Agent, GraphFullData, Manifest, SlashCommand 等类型)
