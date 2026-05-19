# Module: API Routes

> Source files: apps/server/src/routes/agents.ts, apps/server/src/routes/projects.ts, apps/server/src/routes/branches.ts, apps/server/src/routes/graph.ts, apps/server/src/routes/health.ts, apps/server/src/routes/open-folder.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

REST API layer using Hono framework. Defines HTTP endpoints for agent management (CRUD + SSE streaming + message sending + abort), project CRUD, git branch listing/checkout, graph data sync/status/history, health check, and native folder picker dialog.

## Key Files

### agents.ts
Full agent API: POST/GET/DELETE agents, POST message, POST tool-result (QA), GET SSE stream, POST abort, GET models, GET slash-commands, POST command execution.

### projects.ts
Project CRUD: GET all projects, GET single project, POST create project (with git init), DELETE project.

### branches.ts
Git branch operations: GET branches (local + remote), POST checkout (supports remote branch tracking).

### graph.ts
Graph data management: GET status/manifest/data/history, POST sync (SSE streaming), POST sync cancel.

### health.ts
Simple health check endpoint: GET /api/health.

### open-folder.ts
Native folder picker: POST /api/open-folder invokes OS dialog.

## Exports

- agentsRoute (Hono router)
- projectsRoute (Hono router)
- branchesRoute (Hono router)
- graphRoute (Hono router)
- healthRoute (Hono router)
- openFolderRoute (Hono router)

## Dependencies

- → agent-service (agent operations)
- → graph-storage (graph data access)
- → sync-engine (sync execution)
- → prisma (DB access)
