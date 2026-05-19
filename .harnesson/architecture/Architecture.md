# Architecture: Harnesson

> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Module Map

| Module | Path | Key Files | Summary |
|--------|------|-----------|---------|
| api-routes | apps/server/src/routes/ | agents.ts, projects.ts, graph.ts, branches.ts | Hono REST API endpoints for agents, projects, graph, branches |
| agent-service | apps/server/src/lib/ | agent-service.ts, claude-code-adapter.ts, graph-storage.ts, sync-engine.ts | Agent management, Claude SDK integration, graph storage, sync engine |
| chat-ui | apps/web/src/components/chat/ | MessageRenderer.tsx, RichTextInput.tsx, tool-cards/* | Chat interface with message rendering, rich input, and tool event cards |
| graph-ui | apps/web/src/components/graph/ | FlowGraph.tsx, SpecsGraph.tsx, SpecsList.tsx, SyncView.tsx | Graph visualization with React Flow, specs views, and sync workflow |
| layout | apps/web/src/components/layout/ | MainLayout.tsx, AgentPanel.tsx, Sidebar.tsx, Topbar.tsx | App shell with navigation, agent panel, and dropdown selectors |
| projects-ui | apps/web/src/components/projects/ | ProjectList.tsx, CreateProjectModal.tsx, EmptyState.tsx | Project management with card/list views and CRUD modals |
| pages | apps/web/src/pages/ | NewSessionPage.tsx, GraphPage.tsx, ProjectsPage.tsx | Route-level page components composing feature modules |
| stores | apps/web/src/stores/ | agentStore.ts, graphStore.ts, projectStore.ts | Zustand state management for agents, graph, projects |
| hooks | apps/web/src/hooks/ | useSlashCompletion.ts, useImageInput.ts, useEmacsKeybindings.ts | Shared React hooks for UI behavior patterns |
| web-lib | apps/web/src/lib/ | serverApi.ts, slashCommandUtils.ts | Centralized API client and utility functions |
| shared-types | packages/shared/src/types/ | agent.ts, graph.ts, project.ts, task.ts | Shared TypeScript type definitions across workspaces |

## Dependency Graph

```mermaid
graph TD
    shared-types["shared-types"]

    subgraph Server
        api-routes["api-routes"]
        agent-service["agent-service"]
    end

    subgraph Web
        web-lib["web-lib"]
        stores["stores"]
        hooks["hooks"]
        layout["layout"]
        chat-ui["chat-ui"]
        graph-ui["graph-ui"]
        projects-ui["projects-ui"]
        pages["pages"]
    end

    api-routes --> agent-service
    api-routes --> shared-types
    agent-service --> shared-types

    web-lib --> shared-types
    stores --> web-lib
    hooks --> stores
    hooks --> web-lib

    layout --> stores
    layout --> chat-ui
    layout --> hooks
    layout --> web-lib
    layout --> projects-ui

    chat-ui --> stores
    chat-ui --> hooks
    chat-ui --> web-lib

    graph-ui --> stores
    graph-ui --> web-lib

    projects-ui --> stores
    projects-ui --> hooks
    projects-ui --> web-lib

    pages --> chat-ui
    pages --> graph-ui
    pages --> projects-ui
    pages --> stores
    pages --> hooks
```
