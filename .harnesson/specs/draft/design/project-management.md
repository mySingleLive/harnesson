# Project Management — Design Specification

## Overview

The Project Management module provides CRUD operations for local and cloned projects. Users can create, open, clone, and delete projects. Each project is persisted in SQLite via Prisma and displayed in a React frontend with modals for creation and cloning.

---

## Frontend Design

### Pages

#### ProjectsPage (`apps/web/src/pages/ProjectsPage.tsx`)

Top-level page that conditionally renders either the `EmptyState` (no projects) or the `ProjectList`.

- On mount, calls `loadProjects()` from `projectStore`
- Manages modal open/close state for `CreateProjectModal` and `CloneRepoModal`
- Delegates actions to `useProjectActions` hook: `openFolder`, `openProjectWithPath`, `cloneRepo`, `createProject`

### Components

#### ProjectList (`apps/web/src/components/projects/ProjectList.tsx`)

Renders a grid of `ProjectCard` components for each project.

#### ProjectCard (`apps/web/src/components/projects/ProjectCard.tsx`)

Card component displaying:
- Project name
- Project description
- Source type (local / cloned)
- Agent count
- Last updated timestamp
- Click action to open the project workspace

#### CreateProjectModal (`apps/web/src/components/projects/CreateProjectModal.tsx`)

Modal dialog for creating a new project:
- Fields: name, path, description
- "Browse" button triggers native folder picker via `POST /api/open-folder`
- Optional `gitInit` flag to initialize a git repository
- Calls `POST /api/projects` on submit

#### CloneRepoModal (`apps/web/src/components/projects/CloneRepoModal.tsx`)

Modal dialog for cloning a remote repository:
- Fields: repository URL, target directory
- Executes `git clone` and creates a project record
- Calls `POST /api/projects` on submit

#### EmptyState (`apps/web/src/components/projects/EmptyState.tsx`)

Shown when no projects exist. Provides three entry points:
- **Open Folder**: Native folder picker to add an existing project
- **Clone Repo**: Opens CloneRepoModal
- **Create Project**: Opens CreateProjectModal
- Supports drag-and-drop folder via `onDropFolder`

### State Management

#### projectStore (`apps/web/src/stores/projectStore.ts`)

Zustand store managing:
- `projects`: Array of Project records
- `activeProjectId`: Currently selected project
- `isLoading`: Loading state
- Actions: `loadProjects`, `setActiveProject`, `addProject`, `removeProject`

#### useProjectActions hook (`apps/web/src/hooks/useProjectActions.ts`)

Custom hook exposing:
- `openFolder()`: Calls `POST /api/open-folder`, then `POST /api/projects`
- `openProjectWithPath(path)`: Creates a project from a given path
- `cloneRepo(url, targetDir)`: Clones and creates a project
- `createProject(data)`: Creates a new project with optional git init
- Loading flags: `isOpening`, `isCloning`, `isCreating`

---

## Backend Design

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all projects, ordered by `updatedAt DESC` |
| GET | `/api/projects/:id` | Get a single project by ID |
| POST | `/api/projects` | Create a new project |
| DELETE | `/api/projects/:id` | Delete a project by ID |
| POST | `/api/open-folder` | Open native folder picker dialog |

### Endpoint Details

#### `GET /api/projects`

Returns all projects sorted by most recently updated.

```json
[
  {
    "id": "uuid",
    "name": "my-project",
    "path": "/home/user/projects/my-project",
    "description": "A sample project",
    "source": "local",
    "agentCount": 3,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-06-15T12:30:00.000Z"
  }
]
```

#### `POST /api/projects`

Creates a project. Deduplicates by path — if a project with the same path exists, returns the existing record.

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Project display name |
| `path` | string | yes | Absolute filesystem path |
| `description` | string | no | Project description |
| `source` | string | no | Origin: `"local"`, `"clone"`, or `"create"` (default: `"local"`) |
| `gitInit` | boolean | no | Run `git init` at path (only when source is `"create"`) |

**Response:** `201 Created` with the new Project record, or `200 OK` with existing record if path already registered.

#### `DELETE /api/projects/:id`

Deletes a project record by ID. Returns `404` if not found.

#### `POST /api/open-folder`

Opens a native OS folder picker dialog. Returns the selected path or `{ cancelled: true }` if the user dismissed the dialog.

**Response:**

```json
{ "path": "/home/user/projects/my-project" }
```

or

```json
{ "cancelled": true }
```

### Data Model

#### Prisma Schema — Project

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  path        String   @unique
  description String?
  source      String   @default("local")
  agentCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  sessions    AgentSession[]
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Auto-generated primary key |
| `name` | String | Display name |
| `path` | String | Absolute path, unique constraint |
| `description` | String? | Optional description |
| `source` | String | Origin: `"local"`, `"clone"`, `"create"` |
| `agentCount` | Int | Denormalized agent count |
| `sessions` | AgentSession[] | Related agent sessions |

---

## Implementation Notes

- **Path Validation**: The server validates that paths are absolute and do not contain `..` traversal sequences.
- **Git Init**: When `source === "create"` and `gitInit` is true, the server runs `git init` via `child_process.execSync`. Failure does not block project creation.
- **Deduplication**: Creating a project with a path that already exists returns the existing record without error.
- **Native Dialog**: Folder picking uses a native OS dialog via `apps/server/src/lib/native-dialog.ts`, not a browser-based file input.
- **Cascade Delete**: Deleting a project cascades to all related AgentSession, Message, and TodoItem records.
