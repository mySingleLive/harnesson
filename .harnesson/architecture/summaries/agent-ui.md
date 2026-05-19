# Module: agent-ui

## Summary
Agent chat panel and state management. The AgentPanel provides a full chat interface with message history, streaming indicators, todo tracking, question handling, slash command support, and model switching. The agent store manages all agent state, SSE connections, message history, and todo lists.

## Key Files
- `apps/web/src/components/layout/AgentPanel.tsx` — Main agent chat panel with message list, input, thinking bar, todos, and question popup
- `apps/web/src/stores/agentStore.ts` — Zustand store: agent CRUD, SSE connection management, message streaming, todo tracking, question handling
- `apps/web/src/hooks/useChatPanel.ts` — Hook for panel open/close/maximize state
- `apps/web/src/hooks/useAutoScroll.ts` — Auto-scroll hook for chat messages

## Exports
- `AgentPanel` — Main chat panel component
- `useAgentStore` — Zustand store for all agent state
- `useChatPanel` — Hook for panel control

## Dependencies
- `@harnesson/shared` — Agent, message, event types
- `zustand` — State management
- `@/lib/serverApi` — API client

## Source files
- apps/web/src/components/layout/AgentPanel.tsx
- apps/web/src/stores/agentStore.ts
- apps/web/src/hooks/useChatPanel.ts
- apps/web/src/hooks/useAutoScroll.ts
- apps/web/src/components/layout/AgentContextHeader.tsx
- apps/web/src/components/layout/AgentContextMenu.tsx
