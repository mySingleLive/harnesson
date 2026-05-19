# Module: Pages

> Source files: apps/web/src/pages/NewSessionPage.tsx, apps/web/src/pages/ProjectsPage.tsx, apps/web/src/pages/GraphPage.tsx, apps/web/src/pages/TasksPage.tsx, apps/web/src/pages/FilesPage.tsx, apps/web/src/pages/GitPage.tsx, apps/web/src/pages/NotFoundPage.tsx
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Route-level page components. NewSessionPage is the landing page with chat input and quick actions. ProjectsPage manages projects with agent panels. GraphPage shows spec visualization. Other pages handle tasks, files, git, and 404 routing.

## Key Files

### NewSessionPage.tsx
Landing page with RichTextInput and quick action buttons. Creates agent session and sends initial message on submit.

### ProjectsPage.tsx
Project listing with AgentPanel for each project's active agents.

### GraphPage.tsx
Spec graph visualization page with tab navigation.

## Exports

- NewSessionPage (component)
- ProjectsPage (component)
- GraphPage (component)
- TasksPage (component)
- FilesPage (component)
- GitPage (component)
- NotFoundPage (component)

## Dependencies

- → agentStore (agent creation/messaging)
- → projectStore (project selection)
- → RichTextInput (chat input)
