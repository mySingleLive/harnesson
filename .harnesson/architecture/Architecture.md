# Architecture: Harnesson

> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Module Map

| Module | Path | Key Files | Summary |
|--------|------|-----------|---------|
| Server Core | apps/server/src/ | index.ts | Hono HTTP server entry point, route mounting, CORS |
| Agent Service | apps/server/src/lib/ | agent-service.ts, claude-code-adapter.ts, agent-adapter.ts | AI agent lifecycle, session management, Claude SDK integration, SSE streaming |
| API Routes | apps/server/src/routes/ | agents.ts, projects.ts, branches.ts, graph.ts, health.ts, open-folder.ts | REST API endpoints for agents, projects, branches, graph data |
| Graph Storage | apps/server/src/lib/ | graph-storage.ts, sync-engine.ts | Graph/spec data persistence, sync engine with external CLI |
| Chat UI | apps/web/src/components/chat/ | RichTextInput.tsx, MessageRenderer.tsx | Chat input with rich text editing, message display, tool cards |
| Tool Cards | apps/web/src/components/chat/tool-cards/ | BashCard.tsx, ReadCard.tsx, WriteCard.tsx, EditCard.tsx, StreamingAgentCard.tsx | Individual tool execution result display cards |
| Graph UI | apps/web/src/components/graph/ | SpecsGraph.tsx, FlowGraph.tsx, SyncView.tsx | Spec graph visualization, ReactFlow-based rendering, sync progress |
| Layout | apps/web/src/components/layout/ | MainLayout.tsx, Sidebar.tsx, Topbar.tsx, AgentPanel.tsx | App shell with resizable panels, sidebar navigation, agent context |
| Projects UI | apps/web/src/components/projects/ | ProjectList.tsx, CreateProjectModal.tsx, ProjectCard.tsx | Project management UI: CRUD, clone, detail view |
| Pages | apps/web/src/pages/ | NewSessionPage.tsx, ProjectsPage.tsx, GraphPage.tsx | Route-level page components |
| Stores | apps/web/src/stores/ | agentStore.ts, projectStore.ts, graphStore.ts | Zustand state management for agents, projects, graph data |
| Hooks | apps/web/src/hooks/ | useSlashCompletion.ts, useImageInput.ts, useEmacsKeybindings.ts | Reusable hooks for chat input features |
| Shared Types | packages/shared/src/types/ | agent.ts, project.ts, graph.ts | Shared TypeScript type definitions |
| Slash Commands | apps/server/src/lib/ | slash-commands.ts | Built-in and skill-based slash command discovery |

## Dependency Graph

```
Shared Types ← Server Core ← API Routes ← Agent Service ← Claude SDK
                          ← Graph Storage ← Sync Engine
Shared Types ← Pages ← Layout ← Stores ← Hooks ← Chat UI ← Tool Cards
                                          ← Graph UI
                                          ← Projects UI
```
