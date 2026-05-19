# Module: Stores

> Source files: apps/web/src/stores/agentStore.ts, apps/web/src/stores/projectStore.ts, apps/web/src/stores/graphStore.ts, apps/web/src/stores/slashCommandStore.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Zustand state management stores. AgentStore manages agent sessions, messaging, and SSE event handling. ProjectStore handles project CRUD, branch selection, and folder opening. GraphStore manages graph data fetching and sync state. SlashCommandStore fetches and caches available slash commands.

## Key Files

### agentStore.ts
Zustand store for agent lifecycle: create, sendMessage (with SSE streaming), abort, destroy, message history, todo tracking.

### projectStore.ts
Zustand store for project management: CRUD operations, active project/branch selection, folder picker integration.

### graphStore.ts
Zustand store for graph data: status checking, data loading, sync triggering, and history browsing.

### slashCommandStore.ts
Zustand store caching slash commands fetched from the server API.

## Exports

- useAgentStore (hook)
- useProjectStore (hook)
- useGraphStore (hook)
- useSlashCommandStore (hook)

## Dependencies

- → serverApi (HTTP client)
- → shared-types (type definitions)
