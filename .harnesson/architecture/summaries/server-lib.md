# Module: server-lib

> Source files: apps/server/src/lib/*.ts
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

服务端核心业务逻辑库。封装 Agent 生命周期管理（创建、消息处理、SSE 流推送、销毁）、Graph 数据持久化和规格同步引擎、Prisma 数据库连接等关键功能。是整个后端的中枢模块。

## Key Files

### apps/server/src/lib/agent-service.ts
Agent 服务的核心实现。管理多个 Agent 会话的运行时状态、SSE 客户端连接、消息收发、AskUserQuestion 拦截、TodoWrite 持久化、会话恢复等功能。使用 ClaudeCodeAdapter 作为默认适配器。

### apps/server/src/lib/agent-adapter.ts
Agent 适配器的抽象接口定义。定义了 AgentAdapter、ModelInfo、SessionConfig、AdapterSessionData 等类型。

### apps/server/src/lib/claude-code-adapter.ts
Claude Code CLI 的具体适配器实现。通过子进程与 claude CLI 通信。

### apps/server/src/lib/prisma.ts
Prisma Client 实例化，使用 SQLite 适配器连接本地数据库文件。

### apps/server/src/lib/graph-storage.ts
Graph 数据的持久化存储层。管理 manifest.json、specs/ 和 architect/ 目录的读写，支持数据归档和历史版本查询。

### apps/server/src/lib/sync-engine.ts
Graph 同步引擎。通过子进程运行 sync-specs CLI，支持 SSE 流式推送进度，管理活跃同步进程。

### apps/server/src/lib/slash-commands.ts
斜杠命令发现和解析。从当前工作目录扫描可用的 slash commands 和 skills。

### apps/server/src/lib/find-port.ts
端口查找工具。检测端口可用性，自动选择备用端口。

### apps/server/src/lib/native-dialog.ts
原生对话框调用。用于打开文件夹选择对话框。

## Exports

- AgentService (class) — Agent 生命周期管理
- agentService (const) — AgentService 单例
- AgentAdapter (interface) — Agent 适配器接口
- ClaudeCodeAdapter (class) — Claude Code 适配器实现
- prisma (PrismaClient) — 数据库客户端
- runSync, cancelSync, isSyncing (function) — 同步引擎
- getManifest, getFullData, getHistoryList, getHistoryData, writeManifest, writeSpecsData, writeArchitectData, resolveBaseDir (function) — 数据存储
- getAvailableCommands (function) — 命令发现
- findAvailablePort (function) — 端口查找

## Dependencies

- → server-generated (Prisma Client 和数据模型)
- → shared-types (Agent、Graph、Project 等共享类型)
