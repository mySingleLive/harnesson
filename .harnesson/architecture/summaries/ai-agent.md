# Module: ai-agent

## Summary
Core AI agent management system. Supports creating Claude Code agent sessions, sending messages via the Anthropic SDK with SSE streaming, handling interactive questions (AskUserQuestion), managing todos, and persisting session state to SQLite. Includes a Claude Code adapter that wraps the Claude Agent SDK with session management, abort support, and model switching.

## Key Files
- `apps/server/src/lib/agent-service.ts` — AgentService class: create, sendMessage, SSE broadcast, question handling, DB persistence, session restore
- `apps/server/src/lib/agent-adapter.ts` — AgentAdapter interface defining the contract for agent backends
- `apps/server/src/lib/claude-code-adapter.ts` — ClaudeCodeAdapter: wraps Claude Agent SDK, manages sessions, handles streaming with tool tracking
- `apps/server/src/routes/agents.ts` — REST API: CRUD agents, send messages, SSE stream, submit answers, execute commands

## Exports
- `agentService` — Singleton AgentService instance
- `AgentAdapter` — Interface type
- `ClaudeCodeAdapter` — Claude Code implementation
- `agentsRoute` — Hono sub-router for agent APIs

## Dependencies
- `@anthropic-ai/claude-agent-sdk` — Claude Agent SDK for AI interactions
- `@anthropic-ai/claude-code` — Claude Code integration
- `@harnesson/shared` — Agent types, stream events
- `prisma` — Database for session/message persistence
- `hono` — HTTP framework with SSE streaming

## Source files
- apps/server/src/lib/agent-service.ts
- apps/server/src/lib/agent-adapter.ts
- apps/server/src/lib/claude-code-adapter.ts
- apps/server/src/routes/agents.ts
