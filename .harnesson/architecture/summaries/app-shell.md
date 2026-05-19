# Module: app-shell

## Summary
Application shell providing the main layout structure, routing, navigation sidebar, topbar with project/branch selectors, and the resizable agent panel. Sets up React Router with all page routes and manages the overall UI framework.

## Key Files
- `apps/web/src/App.tsx` — Root component with React Router setup
- `apps/web/src/main.tsx` — Entry point
- `apps/web/src/components/layout/MainLayout.tsx` — Main layout with Topbar, Sidebar, AgentPanel, and content area
- `apps/web/src/components/layout/Topbar.tsx` — Top bar with project selector, branch selector, agent count, settings
- `apps/web/src/components/layout/Sidebar.tsx` — Navigation sidebar with route links and agent session list grouped by project
- `apps/web/src/components/layout/AgentStatusDot.tsx` — Agent status indicator (running/idle/error/waiting/completed)
- `apps/web/src/components/layout/ResizableDivider.tsx` — Resizable panel divider
- `apps/web/src/components/layout/ConfirmDialog.tsx` — Confirmation dialog
- `apps/web/src/components/layout/ProjectDropdown.tsx` — Project selection dropdown
- `apps/web/src/components/layout/BranchDropdown.tsx` — Branch selection dropdown
- `apps/web/src/components/layout/ModelDropdown.tsx` — AI model selection dropdown

## Exports
- `App` — Root application component
- `MainLayout` — Main layout wrapper
- `Topbar` — Top bar component
- `Sidebar` — Navigation sidebar
- `AgentStatusDot` — Status indicator

## Dependencies
- `react-router` — Client-side routing
- `lucide-react` — Icons
- `@harnesson/shared` — Agent types
- Agent store, project store

## Source files
- apps/web/src/App.tsx
- apps/web/src/main.tsx
- apps/web/src/components/layout/MainLayout.tsx
- apps/web/src/components/layout/Topbar.tsx
- apps/web/src/components/layout/Sidebar.tsx
- apps/web/src/components/layout/AgentStatusDot.tsx
- apps/web/src/components/layout/ResizableDivider.tsx
- apps/web/src/components/layout/ConfirmDialog.tsx
- apps/web/src/components/layout/ProjectDropdown.tsx
- apps/web/src/components/layout/BranchDropdown.tsx
- apps/web/src/components/layout/ModelDropdown.tsx
- apps/web/src/components/layout/AgentContextHeader.tsx
- apps/web/src/components/layout/AgentContextMenu.tsx
- apps/web/src/pages/NotFoundPage.tsx
- apps/web/src/pages/FilesPage.tsx
- apps/web/src/pages/GitPage.tsx
- apps/web/src/pages/TasksPage.tsx
