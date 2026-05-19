# Module: stores

> Source files: apps/web/src/stores/*.ts
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Zustand state management stores providing centralized reactive state for agents, graph/specs data, projects, and slash commands. Each store encapsulates its domain's state, server API integration, and SSE streaming logic.

## Key Files

### agentStore.ts
Central agent state: agent list, active agent, messages, SSE connections, streaming status, todos, pending questions, panel dimensions. Actions for full agent lifecycle including create, send, abort, destroy, SSE streaming, todo management, and question handling.

### graphStore.ts
Graph/specs state: data, sync status/progress, active tab, selected node, detail panel. SSE-based sync streaming with progress events and auto-sync checking.

### projectStore.ts
Project state: list, active project/branch, view mode, search, loading. Actions for loading projects, switching, branch operations, and localStorage persistence.

### slashCommandStore.ts
Slash command cache with 5-minute TTL per CWD. Fetches from server API with cache invalidation.

## Exports

- useAgentStore (Zustand hook)
- useGraphStore (Zustand hook)
- useProjectStore (Zustand hook)
- useSlashCommandStore (Zustand hook)

## Dependencies

- → web-lib (serverApi for all server communication)
- → @harnesson/shared (all domain types)
