# Module: layout

> Source files: apps/web/src/components/layout/**/*.tsx
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Application layout shell providing navigation, project/branch selection, agent panel management, and reusable UI primitives. Includes the main layout with resizable panels, sidebar navigation with agent session list, topbar with dropdowns, and context menus.

## Key Files

### MainLayout.tsx
Root layout shell orchestrating Topbar, Sidebar, AgentPanel, ResizableDivider, and main content area. Loads projects and agents on mount, manages panel visibility and resizing.

### Sidebar.tsx
Left sidebar navigation with nav links and agent session list grouped by project with collapsible sections. Supports right-click context menu.

### AgentPanel.tsx
Main chat panel for agent interaction. Renders message list, ThinkingBar, TodoBar, AskUserQuestionPanel, and RichTextInput. Handles message sending, aborting, and auto-scrolling.

### Topbar.tsx
Header bar with branding, ProjectDropdown, BranchDropdown, agent count badge, and settings button.

### AgentContextHeader.tsx
Header within AgentPanel showing agent name, status, elapsed time, maximize/close buttons, and token usage.

### AgentContextMenu.tsx
Right-click context menu for sidebar agents with open/close/copy/delete actions via React portal.

### ProjectDropdown.tsx / BranchDropdown.tsx / ModelDropdown.tsx
Dropdown selectors for project, git branch, and AI model with search, keyboard navigation, and server integration.

### ConfirmDialog.tsx
Generic confirmation dialog with keyboard support (Escape/Enter) rendered via portal.

### ResizableDivider.tsx
Draggable vertical divider between AgentPanel and main content with collapse/expand behavior.

### AgentStatusDot.tsx
Colored status indicator for agent states (running/completed/waiting/idle/error).

## Exports

- MainLayout, Sidebar, AgentPanel, Topbar (components)
- AgentContextHeader, AgentContextMenu, AgentStatusDot (components)
- ProjectDropdown, BranchDropdown, ModelDropdown (components)
- ConfirmDialog, ResizableDivider (components)

## Dependencies

- → stores (agentStore, projectStore, slashCommandStore)
- → chat-ui (MessageRenderer, ThinkingBar, TodoBar, AskUserQuestionPanel, RichTextInput)
- → hooks (useAutoScroll, useElapsedTime, useProjectActions)
- → projects-ui (CreateProjectModal)
- → web-lib (serverApi, slashCommandUtils, utils)
- → @harnesson/shared (Agent, AgentMessage, ContentBlock types)
