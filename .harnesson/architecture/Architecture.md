# Harnesson Architecture Overview

**Last synced:** 2026-05-19
**Commit:** def814158a41b4d6ab719d48ab07d39b2bc62aa1

## Project Overview
Harnesson is a monorepo AI coding assistant platform with a React web frontend (`@harnesson/web`) and a Hono Node.js backend (`@harnesson/server`), sharing types through `@harnesson/shared`. It provides project management, AI agent sessions (Claude Code), spec/graph visualization, and Git integration.

## Module Map

| Module | Description | Key Files |
|--------|-------------|-----------|
| server-core | Server entry, health check, port detection | `apps/server/src/index.ts`, `routes/health.ts`, `lib/find-port.ts` |
| project-management | Project CRUD, Git branches, folder dialog | `routes/projects.ts`, `routes/branches.ts`, `routes/open-folder.ts` |
| ai-agent | Agent service, Claude Code adapter, streaming | `lib/agent-service.ts`, `lib/claude-code-adapter.ts`, `routes/agents.ts` |
| graph-specs | Graph storage, sync engine, visualization APIs | `lib/graph-storage.ts`, `lib/sync-engine.ts`, `routes/graph.ts` |
| slash-commands | Command scanning, parsing, autocomplete | `lib/slash-commands.ts`, `slashCommandUtils.ts`, `slashCommandStore.ts` |
| database | Prisma + SQLite, generated models | `lib/prisma.ts`, `prisma.config.ts`, `generated/` |
| shared-types | TypeScript type contracts | `packages/shared/src/types/` |
| app-shell | Layout, routing, sidebar, topbar | `App.tsx`, `MainLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx` |
| agent-ui | Agent chat panel, state management, SSE | `AgentPanel.tsx`, `agentStore.ts`, `useChatPanel.ts` |
| chat-ui | Rich input, message rendering, tool cards | `chat/RichTextInput.tsx`, `chat/tool-cards/*.tsx` |
| graph-ui | Graph/spec views, sync UI, detail panel | `GraphPage.tsx`, `graphStore.ts`, `graph/*.tsx` |
| app-hooks | Shared React hooks (Emacs, images, completion) | `hooks/useEmacsKeybindings.ts`, `hooks/useImageInput.ts` |
| new-session | New AI session landing page | `pages/NewSessionPage.tsx` |

## Dependency Graph

```
shared-types ← server-core ← project-management
             ←              ← ai-agent
             ←              ← graph-specs
             ←              ← slash-commands
             ←              ← database

shared-types ← app-shell ← agent-ui ← chat-ui
             ←           ← graph-ui
             ←           ← project-management (UI)
             ←           ← new-session
             ←           ← app-hooks
```

## Tech Stack
- **Backend:** Hono, Prisma, Better-SQLite3, Claude Agent SDK
- **Frontend:** React 19, Zustand, React Router 7, Tailwind CSS 4
- **Graph:** React Flow (XYFlow), Dagre layout
- **Build:** pnpm workspaces, Vite, TypeScript
