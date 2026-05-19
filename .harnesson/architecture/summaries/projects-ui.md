# Module: Projects UI

> Source files: apps/web/src/components/projects/ProjectList.tsx, apps/web/src/components/projects/ProjectCard.tsx, apps/web/src/components/projects/ProjectRow.tsx, apps/web/src/components/projects/CreateProjectModal.tsx, apps/web/src/components/projects/CloneRepoModal.tsx, apps/web/src/components/projects/ProjectDetailModal.tsx, apps/web/src/components/projects/ActionCard.tsx, apps/web/src/components/projects/EmptyState.tsx
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Project management UI components. Provides a project list view, create/clone/detail modals, and action cards for common project operations.

## Key Files

### ProjectList.tsx
Main project listing component with grid/row layout modes.

### CreateProjectModal.tsx
Modal for creating new projects with name, path, and optional git init.

### CloneRepoModal.tsx
Modal for cloning a git repository into a new project.

### ProjectDetailModal.tsx
Modal showing project details and metadata.

## Exports

- ProjectList (component)
- ProjectCard (component)
- ProjectRow (component)
- CreateProjectModal (component)
- CloneRepoModal (component)
- ProjectDetailModal (component)
- ActionCard (component)
- EmptyState (component)

## Dependencies

- → projectStore (project state)
- → useProjectActions (project action hooks)
