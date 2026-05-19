# Module: server-generated

> Source files: apps/server/src/generated/**/*.ts
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

Prisma ORM 生成的数据库客户端和数据模型代码。提供强类型的数据库访问层，包括模型定义、枚举和 Prisma Client 实例。该模块由 Prisma schema 自动生成，不应手动编辑。

## Key Files

### apps/server/src/generated/client.ts
Prisma Client 的编译输出，提供数据库 CRUD 操作。

### apps/server/src/generated/models.ts
所有数据模型的 TypeScript 类型导出。

### apps/server/src/generated/models/Project.ts
Project 模型的类型定义，包含 id、name、path、description、source 等字段。

### apps/server/src/generated/models/AgentSession.ts
AgentSession 模型的类型定义，包含会话状态、配置、模型选择等字段。

### apps/server/src/generated/models/Message.ts
Message 模型的类型定义，包含角色、内容、事件、图片等字段。

### apps/server/src/generated/models/TodoItem.ts
TodoItem 模型的类型定义，包含任务状态、内容等字段。

## Exports

- prisma (PrismaClient instance) — 通过 `../lib/prisma.ts` 间接使用
- Project, AgentSession, Message, TodoItem (type) — 数据模型类型

## Dependencies

- → none（生成的代码，无模块依赖）
