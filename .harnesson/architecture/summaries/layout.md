# Module: Layout

> Source files: apps/web/src/components/layout/MainLayout.tsx, apps/web/src/components/layout/Sidebar.tsx, apps/web/src/components/layout/Topbar.tsx, apps/web/src/components/layout/AgentPanel.tsx, apps/web/src/components/layout/AgentContextHeader.tsx, apps/web/src/components/layout/AgentContextMenu.tsx, apps/web/src/components/layout/AgentStatusDot.tsx, apps/web/src/components/layout/ConfirmDialog.tsx, apps/web/src/components/layout/ResizableDivider.tsx, apps/web/src/components/layout/ModelDropdown.tsx, apps/web/src/components/layout/BranchDropdown.tsx, apps/web/src/components/layout/ProjectDropdown.tsx
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Application shell components. MainLayout provides the overall page structure with sidebar navigation and main content area. AgentPanel is a resizable side panel for agent conversations. Topbar contains project/branch/model selectors. Sidebar provides navigation between pages.

## Key Files

### MainLayout.tsx
Root layout with sidebar + main content area, routing context.

### AgentPanel.tsx
Resizable panel showing agent chat conversation with drag-to-resize divider.

### Sidebar.tsx
Navigation sidebar with page links and agent list.

### Topbar.tsx
Top bar with ProjectDropdown, BranchDropdown, and ModelDropdown.

## Exports

- MainLayout (component)
- Sidebar (component)
- Topbar (component)
- AgentPanel (component)
- AgentContextHeader (component)
- AgentContextMenu (component)
- AgentStatusDot (component)
- ConfirmDialog (component)
- ResizableDivider (component)
- ModelDropdown (component)
- BranchDropdown (component)
- ProjectDropdown (component)

## Dependencies

- → agentStore (agent state)
- → projectStore (project/branch state)
