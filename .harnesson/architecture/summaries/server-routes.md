# Module: server-routes

> Source files: apps/server/src/routes/*.ts
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

服务端 REST API 路由层。基于 Hono 框架定义所有 HTTP 端点，包括项目管理、Agent 管理、Graph 同步、Git 分支操作、健康检查和文件夹对话框。所有路由挂载在根路径下，通过 CORS 中间件允许前端访问。

## Key Files

### apps/server/src/routes/projects.ts
项目管理 API：GET/POST/DELETE 项目，支持创建时 git init。

### apps/server/src/routes/agents.ts
Agent 管理 API：创建、列表、消息收发、SSE 流、Todo 查询、AskUserQuestion 回答提交、斜杠命令执行、模型列表、会话销毁。

### apps/server/src/routes/graph.ts
Graph 数据 API：状态查询、manifest 获取、全量数据读取、历史记录、同步触发（SSE 流式）和取消。

### apps/server/src/routes/branches.ts
Git 分支 API：列出本地和远程分支、切换分支（checkout）。

### apps/server/src/routes/health.ts
健康检查端点。

### apps/server/src/routes/open-folder.ts
原生文件夹选择对话框 API。

## Exports

- projectsRoute (Hono) — /api/projects 路由
- agentsRoute (Hono) — /api/agents, /api/models, /api/slash-commands 路由
- graphRoute (Hono) — /api/graph 路由
- branchesRoute (Hono) — /api/projects/:id/branches, /api/projects/:id/checkout 路由
- healthRoute (Hono) — /api/health 路由
- openFolderRoute (Hono) — /api/open-folder 路由

## Dependencies

- → server-lib (prisma, agentService, graph-storage, sync-engine, slash-commands)
- → shared-types (CreateAgentRequest, SendMessageRequest 等类型)
