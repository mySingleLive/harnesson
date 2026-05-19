# Module: agent-service

> Source files: apps/server/src/lib/*.ts, apps/server/src/index.ts
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Server-side core library containing the agent management service, adapter interfaces, Claude Code SDK integration, graph/specs storage, sync engine, slash command discovery, and database access. The server entry point wires everything together.

## Key Files

### agent-service.ts
Central singleton service managing agent lifecycle (create, destroy, restore), message processing with streaming, SSE broadcasting, question/answer interception, todo persistence, and DB persistence via Prisma.

### agent-adapter.ts
Defines the abstract `AgentAdapter` interface and supporting types (`SessionConfig`, `ModelInfo`, `AdapterSessionData`). The contract any AI backend adapter must implement.

### claude-code-adapter.ts
Concrete `AgentAdapter` backed by `@anthropic-ai/claude-agent-sdk`. Manages SDK sessions, streams messages, tracks nested Agent tool calls, handles abort, persistence/restoration, and model discovery.

### graph-storage.ts
File-system storage layer for graph visualization. Reads/writes manifest, specs data (graph JSON, list JSON, document markdown), architect data, and history archives under `.harnesson` directories.

### sync-engine.ts
Orchestrates the project sync process. Spawns an external CLI child process, streams JSON progress/node events over SSE, archives previous data, writes manifest on completion. Tracks active syncs for concurrency control.

### slash-commands.ts
Discovers slash commands from three sources: built-in commands, plugin skills (from `~/.claude/plugins/cache`), and project-level skills (from `<project>/.claude/skills`). Parses SKILL.md frontmatter.

### prisma.ts
Initializes the singleton Prisma client connected to a local Better-SQLite3 database.

### native-dialog.ts
Cross-platform native folder-picker: AppleScript on macOS, Zenity on Linux, PowerShell on Windows.

### find-port.ts
Utility to find an available TCP port starting from a given port number.

### index.ts
Server entry point. Creates Hono app, registers all routes under CORS, finds available port, restores agent sessions on startup, starts listening.

## Exports

- AgentService (class)
- agentService (singleton instance)
- AgentAdapter (interface)
- SessionConfig, ModelInfo, AdapterSessionData (interfaces)
- ClaudeCodeAdapter (class)
- getManifest, getSpecsData, getArchitectData, getFullData, hasData, getHistoryList, getHistoryData, archiveCurrentData, writeManifest, writeSpecsData, writeArchitectData, resolveBaseDir (functions)
- runSync, cancelSync, isSyncing (functions)
- getAvailableCommands (async function)
- prisma (PrismaClient instance)
- pickFolder (function)
- findAvailablePort (function)

## Dependencies

- → @harnesson/shared (types: Agent, Project, Graph, Spec, etc.)
- → @anthropic-ai/claude-agent-sdk (Claude Code SDK)
- → @prisma/adapter-better-sqlite3 (SQLite adapter)
- → hono (HTTP framework)
