# Module: database

## Summary
Database layer using Prisma with Better-SQLite3 adapter. Contains the Prisma configuration, client initialization, and generated models for AgentSession, Project, Message, and TodoItem.

## Key Files
- `apps/server/src/lib/prisma.ts` — Prisma client initialization with Better-SQLite3 adapter
- `apps/server/prisma.config.ts` — Prisma configuration
- `apps/server/src/generated/client.ts` — Generated Prisma client
- `apps/server/src/generated/models/AgentSession.ts` — AgentSession model
- `apps/server/src/generated/models/Project.ts` — Project model
- `apps/server/src/generated/models/Message.ts` — Message model
- `apps/server/src/generated/models/TodoItem.ts` — TodoItem model

## Exports
- `prisma` — Singleton Prisma client instance

## Dependencies
- `@prisma/client` — Prisma ORM
- `@prisma/adapter-better-sqlite3` — SQLite adapter
- `better-sqlite3` — SQLite driver

## Source files
- apps/server/src/lib/prisma.ts
- apps/server/prisma.config.ts
- apps/server/src/generated/client.ts
- apps/server/src/generated/models/AgentSession.ts
- apps/server/src/generated/models/Project.ts
- apps/server/src/generated/models/Message.ts
- apps/server/src/generated/models/TodoItem.ts
