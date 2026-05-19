# Module: graph-specs

## Summary
Graph/spec visualization storage and synchronization. Manages project specification data (specs graphs, architect graphs, lists, documents) with history archiving. The sync engine spawns an external CLI process for generating graph data and streams progress via SSE. Supports both project-local and user-level storage.

## Key Files
- `apps/server/src/lib/graph-storage.ts` — File-based storage for manifests, specs data, architect data, and history
- `apps/server/src/lib/sync-engine.ts` — Sync engine that spawns CLI processes for graph generation with SSE progress
- `apps/server/src/routes/graph.ts` — REST API: status, manifest, data, history, sync (SSE), cancel sync

## Exports
- `resolveBaseDir()` — Resolves storage directory based on project/user location
- `hasData()` — Checks if graph data exists
- `getFullData()` — Reads all graph data
- `getManifest()` — Reads manifest
- `writeManifest()` — Writes manifest
- `writeSpecsData()` — Writes spec data files
- `writeArchitectData()` — Writes architect data files
- `archiveCurrentData()` — Archives current data to history
- `runSync()` — Starts sync process
- `cancelSync()` — Cancels active sync
- `graphRoute` — Hono sub-router for graph APIs

## Dependencies
- `@harnesson/shared` — Graph types (Manifest, GraphData, SpecsData, etc.)
- `hono` — HTTP framework with SSE streaming
- `node:fs` — File system operations
- `node:child_process` — Process spawning for sync

## Source files
- apps/server/src/lib/graph-storage.ts
- apps/server/src/lib/sync-engine.ts
- apps/server/src/routes/graph.ts
