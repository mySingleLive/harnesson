# Module: shared-types

> Source files: packages/shared/src/**/*.ts
> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Summary

跨包共享的 TypeScript 类型定义。定义前端和后端共用的数据模型接口，包括 Agent、Project、Graph/Specs、Task 等核心业务类型。通过 barrel export 统一导出。

## Key Files

### packages/shared/src/types/agent.ts
Agent 相关类型：Agent、AgentInfo、AgentStreamEvent、AgentMessage、TodoItem、CreateAgentRequest、SendMessageRequest、QuestionData、SlashCommand 等。

### packages/shared/src/types/project.ts
Project 相关类型：Project（id、name、path、description、source）、ProjectSource。

### packages/shared/src/types/graph.ts
Graph 相关类型：Manifest、GraphData、SpecsData、ArchitectData、GraphFullData、HistoryEntry、SyncOptions、SpecsListItem、GraphTab、SyncStatus。

### packages/shared/src/types/spec-node.ts
规格树节点类型：SpecNode、NodeStatus（draft/review/stable/deprecated）。

### packages/shared/src/types/task.ts
任务管理类型：Task、TaskStatus。

## Exports

- Agent, AgentInfo, AgentStatus, AgentMessage, AgentStreamEvent, TodoItem, TodoStatus (type)
- CreateAgentRequest, SendMessageRequest (type)
- QuestionData, PendingQuestion, SlashCommand (type)
- ImageAttachment, ContentBlock (type)
- Project, ProjectSource (type)
- Manifest, GraphData, SpecsData, ArchitectData, GraphFullData, HistoryEntry (type)
- SyncOptions, SpecsListItem, GraphTab, SyncStatus (type)
- SpecNode, NodeStatus (type)
- Task, TaskStatus (type)

## Dependencies

- → none（无模块依赖，纯类型定义）
