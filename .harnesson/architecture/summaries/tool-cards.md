# Module: Tool Cards

> Source files: apps/web/src/components/chat/tool-cards/BashCard.tsx, apps/web/src/components/chat/tool-cards/ReadCard.tsx, apps/web/src/components/chat/tool-cards/WriteCard.tsx, apps/web/src/components/chat/tool-cards/EditCard.tsx, apps/web/src/components/chat/tool-cards/GlobCard.tsx, apps/web/src/components/chat/tool-cards/GrepCard.tsx, apps/web/src/components/chat/tool-cards/LSPCard.tsx, apps/web/src/components/chat/tool-cards/GenericCard.tsx, apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx, apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx, apps/web/src/components/chat/tool-cards/TodoCard.tsx, apps/web/src/components/chat/tool-cards/QAResultCard.tsx, apps/web/src/components/chat/tool-cards/ToolEventCard.tsx, apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx, apps/web/src/components/chat/tool-cards/CodeLine.tsx, apps/web/src/components/chat/tool-cards/buildEventTree.ts, apps/web/src/components/chat/tool-cards/segmentEvents.ts, apps/web/src/components/chat/tool-cards/pairEvents.ts, apps/web/src/components/chat/tool-cards/langUtils.ts, apps/web/src/components/chat/tool-cards/index.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Individual card components for displaying AI agent tool execution results. Each card type handles a specific tool's output format: BashCard shows terminal output, ReadCard displays file content, WriteCard/EditCard show file modifications, StreamingAgentCard renders nested agent conversations, and more.

## Key Files

### BashCard.tsx
Displays bash command execution results with terminal-style formatting.

### ReadCard.tsx
Displays file content reading results with syntax highlighting via CodeLine.

### WriteCard.tsx
Displays file write operations showing the target file path and content.

### EditCard.tsx
Displays file edit operations showing search/replace diff blocks.

### StreamingAgentCard.tsx
Displays nested agent (sub-agent) conversations with indented tool_use/tool_result pairs and text output.

### buildEventTree.ts
Utility to transform flat event arrays into a hierarchical tree structure for rendering nested agent conversations.

### index.ts
Barrel export for all tool card components.

## Exports

- BashCard (component)
- ReadCard (component)
- WriteCard (component)
- EditCard (component)
- GlobCard (component)
- GrepCard (component)
- LSPCard (component)
- GenericCard (component)
- StreamingAgentCard (component)
- AskUserQuestionCard (component)
- TodoCard (component)
- QAResultCard (component)
- ToolEventCard (component)
- CollapsibleCard (component)
- CodeLine (component)
- buildEventTree (function)

## Dependencies

- → shared-types (AgentStreamEvent)
- → langUtils (language detection for syntax highlighting)
