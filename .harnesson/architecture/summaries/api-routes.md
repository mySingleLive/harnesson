# Module: api-routes

> Source files: apps/server/src/routes/**/*.ts
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

HTTP API route handlers for the Harnesson server, built on Hono. Defines all REST endpoints for agent management, project CRUD, git branch operations, graph/specs data access, sync orchestration, health checks, and native OS folder dialogs.

## Key Files

### agents.ts
Agent lifecycle and messaging routes. Handles create/destroy agents, send messages, SSE streaming of agent events, abort, slash command discovery, model listing, question/answer flow, and todo retrieval. The most complex route file with ~15 endpoints.

### projects.ts
CRUD endpoints for project entities. Lists, fetches by ID, creates (with optional `git init`), and deletes projects via Prisma ORM.

### branches.ts
Git branch operations. Lists local/remote branches and handles branch checkout (creating local tracking branches from remote refs).

### graph.ts
Graph/specs visualization endpoints. Provides graph data status, manifest/full-data/history reads, and sync orchestration with SSE progress streaming.

### health.ts
Health-check endpoint returning `{ status: 'ok', timestamp }`.

### open-folder.ts
Triggers native OS folder-picker dialog and returns the selected path.

## Exports

- agentsRoute (const: Hono router)
- branchesRoute (const: Hono router)
- graphRoute (const: Hono router)
- healthRoute (const: Hono router)
- openFolderRoute (const: Hono router)
- projectsRoute (const: Hono router)

## Dependencies

- → agent-service (agent CRUD, messaging, streaming)
- → graph-storage (graph data reads/writes)
- → sync-engine (sync orchestration)
- → prisma (database access for projects/branches)
- → native-dialog (folder picker)
- → slash-commands (command discovery)
- → @harnesson/shared (request/response types)
