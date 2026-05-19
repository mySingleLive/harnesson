# Module: server-core

## Summary
Server entry point and infrastructure. Initializes the Hono HTTP server, registers all route modules, restores persisted agent sessions on startup, and provides a health check endpoint. Includes port auto-detection to avoid conflicts.

## Key Files
- `apps/server/src/index.ts` — Hono app setup, CORS config, route registration, server start with agent restore
- `apps/server/src/routes/health.ts` — GET /api/health endpoint
- `apps/server/src/lib/find-port.ts` — Finds an available TCP port if the preferred one is in use

## Exports
- `healthRoute` — Hono sub-router for health check
- `findAvailablePort(startPort)` — Async port finder
- `startServer()` — Main server bootstrap

## Dependencies
- `hono` — HTTP framework
- `@hono/node-server` — Node.js adapter for Hono
- All route modules (projects, branches, graph, agents, open-folder)
- `agent-service` — For session restore on startup

## Source files
- apps/server/src/index.ts
- apps/server/src/routes/health.ts
- apps/server/src/lib/find-port.ts
