# Module: project-management

## Summary
Manages projects (CRUD) and Git branch operations. Projects are persisted in SQLite via Prisma. Supports creating projects from local folders, cloning repos, or fresh creation with optional git init. Branch listing and checkout are handled by spawning git CLI commands.

## Key Files
- `apps/server/src/routes/projects.ts` — REST API: GET/POST/DELETE /api/projects, GET /api/projects/:id
- `apps/server/src/routes/branches.ts` — REST API: GET /api/projects/:id/branches, POST /api/projects/:id/checkout
- `apps/server/src/routes/open-folder.ts` — POST /api/open-folder native folder dialog
- `apps/server/src/lib/native-dialog.ts` — Platform-specific folder picker (macOS/Linux/Windows)
- `apps/web/src/hooks/useProjectActions.ts` — Frontend actions for open/clone/create project
- `apps/web/src/pages/ProjectsPage.tsx` — Project list page with empty state and modals
- `apps/web/src/stores/projectStore.ts` — Zustand store for project state, branches, view mode

## Exports
- `projectsRoute` — Hono sub-router for project CRUD
- `branchesRoute` — Hono sub-router for branch operations
- `openFolderRoute` — Hono sub-router for native folder dialog
- `pickFolder()` — Opens native folder dialog
- `useProjectActions()` — React hook for project actions
- `useProjectStore` — Zustand store

## Dependencies
- `@harnesson/shared` — Project type
- `prisma` — Database client
- `child_process` — For git operations

## Source files
- apps/server/src/routes/projects.ts
- apps/server/src/routes/branches.ts
- apps/server/src/routes/open-folder.ts
- apps/server/src/lib/native-dialog.ts
- apps/web/src/hooks/useProjectActions.ts
- apps/web/src/pages/ProjectsPage.tsx
- apps/web/src/stores/projectStore.ts
- apps/web/src/components/projects/ActionCard.tsx
- apps/web/src/components/projects/CloneRepoModal.tsx
- apps/web/src/components/projects/CreateProjectModal.tsx
- apps/web/src/components/projects/EmptyState.tsx
- apps/web/src/components/projects/ProjectCard.tsx
- apps/web/src/components/projects/ProjectDetailModal.tsx
- apps/web/src/components/projects/ProjectList.tsx
- apps/web/src/components/projects/ProjectRow.tsx
