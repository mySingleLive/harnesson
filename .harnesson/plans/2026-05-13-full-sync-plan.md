# Sync Plan - 2026-05-13

## Mode
Full Sync

## Base Version
- Commit: 4e7a3cc
- Message: feat(sync-specs): add auto-detection status rules in Step 5 user review
- Branch: feature/agent-chat-panel

## Overview

Full sync for Harnesson — a Visual AI Coding Management Platform. The project is a pnpm monorepo with three packages:
- **@harnesson/server**: Hono API server with SQLite (Prisma), managing AI agent sessions, graph/specs sync, projects, branches
- **@harnesson/web**: React frontend with Zustand stores, chat interface, graph visualization, project management
- **@harnesson/shared**: Shared TypeScript type definitions

Tree: 3 levels, multi-domain scenario, 23 nodes total (1 root + 5 L2 + 17 L3).

## Change Overview

| Node | Operation | Reason |
|------|-----------|--------|
| project | New | Root node for the spec tree |
| agent-system | New | Agent lifecycle, streaming, adapter, and slash commands |
| agent-lifecycle | New | Agent create/destroy/abort, session persistence, state management |
| agent-streaming | New | SSE-based real-time message streaming between server and client |
| agent-adapter | New | Adapter pattern for pluggable AI agent backends (Claude Code) |
| slash-commands | New | Discovery and execution of slash commands from plugins/projects |
| chat-interface | New | Chat UI domain covering rendering, input, tool cards, and interactions |
| message-rendering | New | Message display with markdown, images, and event tree visualization |
| rich-text-input | New | Rich text input with image upload, slash commands, and keybindings |
| tool-cards | New | Visual card components for agent tool use events |
| interactive-tools | New | AskUserQuestion panel and TodoBar for interactive agent tools |
| thinking-indicators | New | Visual indicators for agent thinking state |
| graph-specs | New | Spec synchronization, storage, and visualization domain |
| sync-engine | New | CLI-based sync process coordination with progress streaming |
| graph-storage | New | File system operations for spec data persistence |
| graph-visualization | New | ReactFlow-based interactive graph rendering with Dagre layout |
| specs-views | New | Alternative views: list, document, architect |
| project-management | New | Project CRUD and git branch management |
| project-crud | New | Project create, list, delete with git initialization |
| branch-management | New | Git branch listing and switching |
| app-shell | New | Application layout, navigation, and panel management |
| main-layout | New | Root layout with resizable sidebar and agent panel |
| sidebar-navigation | New | Sidebar with navigation, agent list, and context menus |
| agent-panel | New | Chat panel with message history and rich input |

## Detailed Changes

### project (New)
- Associated files: package.json, apps/server/package.json, apps/web/package.json, packages/shared/package.json
- Reason: Root node representing the entire Harnesson platform
- Fields: id, name, treeDepth=3, treeScenario=multi-domain, children=[agent-system, chat-interface, graph-specs, project-management, app-shell]

### agent-system (New)
- Associated files: apps/server/src/lib/agent-adapter.ts, apps/server/src/lib/agent-service.ts, apps/server/src/lib/claude-code-adapter.ts, apps/server/src/routes/agents.ts, apps/web/src/stores/agentStore.ts
- Reason: Backend and frontend agent management system
- Children: agent-lifecycle, agent-streaming, agent-adapter, slash-commands

### agent-lifecycle (New)
- Associated files: apps/server/src/lib/agent-service.ts, apps/server/src/routes/agents.ts, apps/web/src/stores/agentStore.ts, apps/server/prisma/schema.prisma
- Reason: Agent session creation, destruction, abort, persistence via Prisma/SQLite

### agent-streaming (New)
- Associated files: apps/server/src/routes/agents.ts, apps/web/src/stores/agentStore.ts
- Reason: Server-Sent Events for real-time agent message streaming

### agent-adapter (New)
- Associated files: apps/server/src/lib/agent-adapter.ts, apps/server/src/lib/claude-code-adapter.ts
- Reason: Adapter interface and Claude Code SDK implementation for agent backends

### slash-commands (New)
- Associated files: apps/server/src/lib/slash-commands.ts, apps/web/src/stores/slashCommandStore.ts, apps/web/src/hooks/useSlashCompletion.ts, apps/web/src/components/chat/SlashCommandPopup.tsx
- Reason: Discovery of built-in, plugin, and project slash commands

### chat-interface (New)
- Associated files: apps/web/src/components/chat/
- Reason: Chat UI domain for message rendering, input, tool cards, and interactive tools
- Children: message-rendering, rich-text-input, tool-cards, interactive-tools, thinking-indicators

### message-rendering (New)
- Associated files: apps/web/src/components/chat/MessageRenderer.tsx, apps/web/src/components/chat/tool-cards/buildEventTree.ts
- Reason: Message display with markdown (react-markdown + GFM), image preview, and event tree

### rich-text-input (New)
- Associated files: apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/hooks/useImageInput.ts, apps/web/src/hooks/useEmacsKeybindings.ts
- Reason: ContentEditable input with image upload, slash command completion, drag-and-drop, auto-resize

### tool-cards (New)
- Associated files: apps/web/src/components/chat/tool-cards/ (BashCard, ReadCard, WriteCard, EditCard, GlobCard, GrepCard, LSPCard, GenericCard, CollapsibleCard, StreamingAgentCard, ToolEventCard, CodeLine, etc.)
- Reason: Visual card components for each agent tool type

### interactive-tools (New)
- Associated files: apps/web/src/components/chat/AskUserQuestionPanel.tsx, apps/web/src/components/chat/TodoBar.tsx, apps/web/src/hooks/useKeyboardNavigation.ts
- Reason: AskUserQuestion panel with option selection, TodoBar with animated status

### thinking-indicators (New)
- Associated files: apps/web/src/components/chat/ThinkingBar.tsx, apps/web/src/components/chat/ThinkingIndicator.tsx
- Reason: Animated visual indicators for agent thinking state

### graph-specs (New)
- Associated files: apps/server/src/lib/sync-engine.ts, apps/server/src/lib/graph-storage.ts, apps/server/src/routes/graph.ts, apps/web/src/components/graph/, apps/web/src/stores/graphStore.ts
- Reason: Spec synchronization engine, file storage, and visualization
- Children: sync-engine, graph-storage, graph-visualization, specs-views

### sync-engine (New)
- Associated files: apps/server/src/lib/sync-engine.ts
- Reason: Spawns CLI sync processes, streams progress via SSE, handles cancellation

### graph-storage (New)
- Associated files: apps/server/src/lib/graph-storage.ts
- Reason: File system CRUD for manifest, specs, architect data, and history archives

### graph-visualization (New)
- Associated files: apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx, apps/web/src/components/graph/SpecsGraph.tsx, apps/web/src/components/graph/ArchitectGraph.tsx
- Reason: ReactFlow + Dagre interactive graph with custom node types

### specs-views (New)
- Associated files: apps/web/src/components/graph/SpecsList.tsx, apps/web/src/components/graph/SpecsDocument.tsx, apps/web/src/components/graph/TechnicalDocument.tsx, apps/web/src/components/graph/DetailPanel.tsx, apps/web/src/components/graph/SyncView.tsx, apps/web/src/components/graph/SyncProgress.tsx
- Reason: Alternative spec views (list, document, technical doc) and sync progress UI

### project-management (New)
- Associated files: apps/server/src/routes/projects.ts, apps/web/src/components/projects/, apps/web/src/stores/projectStore.ts, apps/web/src/hooks/useProjectActions.ts
- Reason: Project and branch management domain
- Children: project-crud, branch-management

### project-crud (New)
- Associated files: apps/server/src/routes/projects.ts, apps/web/src/components/projects/, apps/web/src/stores/projectStore.ts, apps/web/src/hooks/useProjectActions.ts, apps/server/src/routes/open-folder.ts, apps/server/src/lib/native-dialog.ts
- Reason: Project create/list/delete, native folder picker, git initialization

### branch-management (New)
- Associated files: apps/server/src/routes/branches.ts, apps/web/src/components/layout/BranchDropdown.tsx
- Reason: Git branch listing, switching, and checkout

### app-shell (New)
- Associated files: apps/web/src/App.tsx, apps/web/src/components/layout/, apps/web/src/pages/
- Reason: Application layout, routing, navigation, and panel management
- Children: main-layout, sidebar-navigation, agent-panel

### main-layout (New)
- Associated files: apps/web/src/components/layout/MainLayout.tsx, apps/web/src/components/layout/ResizableDivider.tsx, apps/web/src/pages/GraphPage.tsx, apps/web/src/pages/NewSessionPage.tsx
- Reason: Root layout with sidebar, agent panel, and resizable divider

### sidebar-navigation (New)
- Associated files: apps/web/src/components/layout/Sidebar.tsx, apps/web/src/components/layout/Topbar.tsx, apps/web/src/components/layout/AgentStatusDot.tsx, apps/web/src/components/layout/AgentContextMenu.tsx, apps/web/src/components/layout/ProjectDropdown.tsx, apps/web/src/components/layout/ModelDropdown.tsx
- Reason: Navigation sidebar with agent list, project/model selectors, context menus

### agent-panel (New)
- Associated files: apps/web/src/components/layout/AgentPanel.tsx, apps/web/src/components/layout/AgentContextHeader.tsx, apps/web/src/hooks/useChatPanel.ts, apps/web/src/components/layout/ConfirmDialog.tsx
- Reason: Chat panel with message history, rich input, context header, and confirm dialogs

## New Nodes
All 23 nodes are new (full sync).

## Deleted Nodes
None.
