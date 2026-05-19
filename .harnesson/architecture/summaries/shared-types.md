# Module: shared-types

## Summary
Shared TypeScript type definitions used across both server and web packages. Defines the data contracts for agents (types, stream events, messages), projects, tasks, spec nodes, and graph data structures.

## Key Files
- `packages/shared/src/index.ts` — Re-exports all type modules
- `packages/shared/src/types/agent.ts` — Agent types: AgentType, AgentStatus, Agent, AgentStreamEvent, AgentMessage, ContentBlock, ImageAttachment, QuestionData, SlashCommand, etc.
- `packages/shared/src/types/project.ts` — Project interface
- `packages/shared/src/types/task.ts` — Task types: TaskStatus, TaskPriority, Task
- `packages/shared/src/types/spec-node.ts` — SpecNode types
- `packages/shared/src/types/graph.ts` — Graph types: GraphNode, GraphEdge, GraphData, Manifest, SpecsData, ArchitectData, SyncOptions, HistoryEntry

## Exports
- All types from agent, project, task, spec-node, graph modules

## Dependencies
- None (pure type definitions)

## Source files
- packages/shared/src/index.ts
- packages/shared/src/types/agent.ts
- packages/shared/src/types/project.ts
- packages/shared/src/types/task.ts
- packages/shared/src/types/spec-node.ts
- packages/shared/src/types/graph.ts
