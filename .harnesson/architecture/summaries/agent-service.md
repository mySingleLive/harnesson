# Module: Agent Service

> Source files: apps/server/src/lib/agent-service.ts, apps/server/src/lib/claude-code-adapter.ts, apps/server/src/lib/agent-adapter.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Core agent lifecycle management module. Handles agent session creation, message dispatch, SSE streaming, question-answer interception, abort, and restoration of persisted sessions on server restart. Uses the Claude Agent SDK via ClaudeCodeAdapter.

## Key Files

### agent-service.ts
AgentService class managing runtime state (adapters, SSE clients, event buffers), message processing with AskUserQuestion interception, todo persistence, and DB-backed session CRUD.

### claude-code-adapter.ts
ClaudeCodeAdapter implementing AgentAdapter. Bridges the Anthropic Claude Agent SDK query() API, maps SDK events to AgentStreamEvent, manages session IDs, abort controllers, and nested Agent tool tracking.

### agent-adapter.ts
AgentAdapter interface defining the contract for agent backends: session lifecycle, message streaming, abort, model switching, and persistence.

## Exports

- AgentService (class)
- agentService (singleton instance)
- ClaudeCodeAdapter (class)
- AgentAdapter (interface)
- SessionConfig (interface)
- ModelInfo (interface)
- AdapterSessionData (interface)

## Dependencies

- → shared-types (AgentStreamEvent, ContentBlock, ImageAttachment types)
- → prisma (DB access for sessions, messages, todos)
