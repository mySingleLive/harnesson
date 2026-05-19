# Module: shared-types

> Source files: packages/shared/src/**/*.ts
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Shared TypeScript type definitions used across server and web workspaces. Defines the data contracts for the entire application: agent types, graph/specs structures, project entities, spec nodes, and task models.

## Key Files

### types/agent.ts
Core agent types: AgentType, AgentStatus, Agent, AgentStreamEvent, TodoItem, ImageAttachment, ContentBlock, AgentMessage, request/response types, slash command types, question/answer types, and persisted data models.

### types/graph.ts
Graph types: GraphTab, SyncStatus, StorageLocation, SyncType, Manifest, GraphNode, GraphEdge, GraphData, SpecsListItem, SpecsData, ArchitectData, SyncOptions, GraphFullData, HistoryEntry.

### types/project.ts
Project entity type with id, name, path, description, source, agent count, and timestamps.

### types/spec-node.ts
Spec node type with hierarchy support (parentId, level, order) and business/tech classification.

### types/task.ts
Task tracking types: TaskStatus, TaskPriority, Task entity with spec linkage, agent assignment, branch, labels, time tracking, and lifecycle timestamps.

### index.ts
Barrel re-export of all type modules.

## Exports

- Agent, AgentStatus, AgentType, AgentStreamEvent, AgentMessage, ContentBlock (types)
- TodoItem, ImageAttachment, SlashCommand, QuestionData, PendingQuestion (types)
- GraphTab, SyncStatus, Manifest, GraphNode, GraphEdge, GraphData, SpecsData, ArchitectData (types)
- Project (type)
- SpecNode, SpecNodeType (types)
- Task, TaskStatus, TaskPriority (types)

## Dependencies

None (pure type definitions).
