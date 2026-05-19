# Module: Graph Storage & Sync Engine

> Source files: apps/server/src/lib/graph-storage.ts, apps/server/src/lib/sync-engine.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Server-side data persistence layer for graph/spec data and the sync engine. Graph-storage handles reading/writing manifest, spec data (graph.json, list.json, document.md), architect data, and history archiving. Sync-engine manages external CLI process execution for syncing project data with SSE progress reporting.

## Key Files

### graph-storage.ts
File-based storage for graph data. Manages manifest, specs, architect data, history entries, and archive/restore operations.

### sync-engine.ts
Controls sync process lifecycle: spawns external CLI, reports progress via SSE, handles cancellation, and writes manifest on completion.

## Exports

- resolveBaseDir (function)
- hasData (function)
- getManifest (function)
- getFullData (function)
- getHistoryList (function)
- getHistoryData (function)
- runSync (function)
- cancelSync (function)
- writeManifest (function)
- writeSpecsData (function)
- writeArchitectData (function)

## Dependencies

- → shared-types (Manifest, GraphData, SyncOptions)
