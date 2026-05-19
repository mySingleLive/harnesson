# Module: Shared Types

> Source files: packages/shared/src/types/agent.ts, packages/shared/src/types/project.ts, packages/shared/src/types/graph.ts, packages/shared/src/types/spec-node.ts, packages/shared/src/types/task.ts, packages/shared/src/index.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Shared TypeScript type definitions used across server and web apps. Defines interfaces for agent operations (sessions, messages, events, slash commands), project data, graph/spec structures, and task management.

## Key Files

### agent.ts
Core agent types: AgentStreamEvent, AgentInfo, CreateAgentRequest/Response, SendMessageRequest, SlashCommand, QuestionData, ContentBlock, ImageAttachment, TodoItem.

### graph.ts
Graph data types: Manifest, GraphData, SpecsListItem, SpecsData, ArchitectData, GraphFullData, HistoryEntry.

### project.ts
Project data types for the project model.

## Exports

- All type interfaces from types/*.ts

## Dependencies

- (none, leaf module)
