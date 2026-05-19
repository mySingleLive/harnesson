# Module: projects-ui

> Source files: apps/web/src/components/projects/**/*.tsx
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Project management UI components including project list with card/list views, create/clone modals, detail view, empty state with quick actions, and drag-and-drop folder opening.

## Key Files

### ProjectList.tsx
Main project list with search, card/list view toggle, add-project dropdown, and modals for clone/create/detail views.

### ProjectCard.tsx / ProjectRow.tsx
Card-style and list-style project items with context menus (view detail, open folder, remove with confirmation).

### CreateProjectModal.tsx
Modal for creating new projects with name, path, description, and git-init toggle.

### CloneRepoModal.tsx
Modal for cloning git repositories with URL and local path inputs.

### ProjectDetailModal.tsx
Modal showing project details with delete confirmation and open button.

### EmptyState.tsx
Landing page when no projects exist with action cards for opening folders, cloning repos, and creating projects. Supports drag-and-drop.

### ActionCard.tsx
Reusable button card with icon, title, and description.

## Exports

- ProjectList, ProjectCard, ProjectRow (components)
- CreateProjectModal, CloneRepoModal, ProjectDetailModal (components)
- EmptyState, ActionCard (components)

## Dependencies

- → stores (projectStore)
- → hooks (useProjectActions)
- → @harnesson/shared (Project type)
- → web-lib (utils, time)
