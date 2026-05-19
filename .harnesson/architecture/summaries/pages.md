# Module: pages

> Source files: apps/web/src/pages/**/*.tsx
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Page-level route components that compose layout and feature modules into full views. Includes the new session landing page with quick actions, the project management page, the graph/specs viewer, and stub pages for tasks, files, and git features.

## Key Files

### NewSessionPage.tsx
Landing page for creating new agent sessions. Shows brand, RichTextInput, and quick-action buttons (create feature, fix bug, code review, write tests). Creates agent and sends initial message on submit.

### ProjectsPage.tsx
Project management page displaying ProjectList or EmptyState with modals for cloning/creating projects.

### GraphPage.tsx
Graph/specs viewer with tabbed views (specs graph, specs list, specs document, architect graph, technical document), sync workflow, and detail panel.

### TasksPage.tsx / FilesPage.tsx / GitPage.tsx
Stub/placeholder pages for upcoming features.

### NotFoundPage.tsx
404 page for unmatched routes.

## Exports

- NewSessionPage, ProjectsPage, GraphPage (components)
- TasksPage, FilesPage, GitPage, NotFoundPage (components)

## Dependencies

- → chat-ui (RichTextInput)
- → graph-ui (SpecsGraph, SpecsList, SpecsDocument, ArchitectGraph, TechnicalDocument, DetailPanel, SyncView, SyncProgress, GraphTabBar)
- → projects-ui (ProjectList, EmptyState, CloneRepoModal, CreateProjectModal)
- → stores (agentStore, projectStore, graphStore, slashCommandStore)
- → hooks (useProjectActions)
- → @harnesson/shared (ContentBlock, ImageAttachment types)
