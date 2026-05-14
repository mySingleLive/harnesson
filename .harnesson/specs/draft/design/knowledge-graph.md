# Knowledge Graph — Design Specification

## Overview

The Knowledge Graph module provides a fullstack system for visualizing and managing project specification trees. It scans project source code, generates structured spec graphs (specs and architect views), and presents them through a multi-tab interface with graph visualization, list view, document rendering, and sync controls. Data is persisted as JSON files in `.harnesson/specs/` within the project directory.

---

## Frontend Design

### Pages

#### GraphPage (`apps/web/src/pages/GraphPage.tsx`)

Top-level page for the knowledge graph. Orchestrates all sub-components:

- Resolves the active project from `projectStore`
- On project change, loads graph data and checks for auto-sync
- Conditional rendering:
  - No data & not syncing: Shows `SyncView` to initiate first sync
  - Has data: Shows tabbed content with `GraphTabBar` and optional `DetailPanel`
  - Syncing: Overlays `SyncProgress` on top of content
- Five tabs managed by `activeTab` state in `graphStore`

### Components

#### GraphTabBar (`apps/web/src/components/graph/GraphTabBar.tsx`)

Tab navigation bar with 5 tabs:

| Tab ID | Label | Component |
|---|---|---|
| `specs-graph` | Specs Graph | `SpecsGraph` |
| `specs-list` | Specs List | `SpecsList` |
| `specs-document` | Specs Document | `SpecsDocument` |
| `architect-graph` | Architect Graph | `ArchitectGraph` |
| `technical-document` | Technical Document | `TechnicalDocument` |

Active tab indicated by accent-colored underline. Tab change updates `graphStore.activeTab`.

#### SpecsGraph (`apps/web/src/components/graph/SpecsGraph.tsx`)

Interactive node-edge graph visualization using ReactFlow (`@xyflow/react`):

- Renders project specification as a directed graph
- Uses `@dagrejs/dagre` for automatic layout (top-to-bottom or left-to-right)
- Custom node types defined in `GraphNodes.tsx`
- Node click opens `DetailPanel` with node details
- Supports zoom, pan, and minimap

#### SpecsList (`apps/web/src/components/graph/SpecsList.tsx`)

Flat or tree-structured list view of all spec items:

- Displays each spec node as a list item with type indicator
- Shows parent-child hierarchy
- Click to select and open detail panel

#### SpecsDocument (`apps/web/src/components/graph/SpecsDocument.tsx`)

Markdown document view of the full specification:

- Renders spec content as a formatted document using `MarkdownViewer`
- Read-only display of the generated spec document

#### ArchitectGraph (`apps/web/src/components/graph/ArchitectGraph.tsx`)

Architecture-level graph visualization:

- Higher-level view showing system architecture relationships
- Uses ReactFlow with custom architect-specific node types
- Similar interaction patterns to SpecsGraph

#### TechnicalDocument (`apps/web/src/components/graph/TechnicalDocument.tsx`)

Technical documentation view:

- Renders the generated technical document as markdown
- Read-only display of system architecture documentation

#### DetailPanel (`apps/web/src/components/graph/DetailPanel.tsx`)

Side panel showing details for a selected node:

- Displays node title, type, level, and content
- Shows parent-child relationships
- Markdown rendering of node content via `MarkdownViewer`

#### SyncView (`apps/web/src/components/graph/SyncView.tsx`)

Initial sync view shown when no graph data exists:

- Storage location selector (project-level or user-level)
- Sync button to trigger `POST /api/graph/sync`
- Progress display during sync

#### SyncProgress (`apps/web/src/components/graph/SyncProgress.tsx`)

Progress overlay during sync operations:

- Shows current phase and progress percentage
- Animated progress bar
- Cancel button to abort sync

### State Management

#### graphStore (`apps/web/src/stores/graphStore.ts`)

Zustand store managing:

- `specsData`: Specs graph, list, and document data
- `architectData`: Architect graph and document data
- `syncStatus`: Current sync state (`idle`, `syncing`, `completed`, `error`)
- `activeTab`: Current tab (`GraphTab` type)
- `isDetailPanelOpen`: Detail panel visibility
- `selectedNodeId`: Currently selected graph node
- Actions: `setProjectPath`, `loadGraph`, `checkAutoSync`, `setActiveTab`, `startSync`, `selectNode`, `toggleDetailPanel`

---

## Backend Design

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/graph/status` | Check if graph data exists and whether sync is needed |
| GET | `/api/graph/manifest` | Get the manifest metadata |
| GET | `/api/graph/data` | Get all graph data (specs + architect) |
| GET | `/api/graph/history` | List sync history entries |
| GET | `/api/graph/history/:timestamp` | Get data from a specific historical sync |
| POST | `/api/graph/sync` | Start a sync operation (SSE streaming) |
| POST | `/api/graph/sync/cancel` | Cancel an active sync |

### Endpoint Details

#### `GET /api/graph/status`

Checks if spec data exists for a project and determines if a re-sync is needed by comparing the manifest's `lastSyncCommit` with the current git HEAD.

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `projectPath` | string | yes | Absolute project path |
| `storageLocation` | string | no | `"project"` or `"user"` (default: `"project"`) |

**Response:**

```json
{
  "hasData": true,
  "lastSyncCommit": "abc1234",
  "lastSyncTime": "2025-06-15T12:00:00.000Z",
  "syncStatus": "idle",
  "needsSync": false
}
```

#### `GET /api/graph/data`

Returns the complete graph data including specs and architect views.

**Response:** `GraphFullData` object containing `manifest`, `specs`, and `architect`.

#### `POST /api/graph/sync`

Starts a sync operation. Uses SSE to stream progress events back to the client. The sync engine spawns a child process to scan the project and generate spec data.

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `projectPath` | string | yes | Absolute project path |
| `storageLocation` | string | no | `"project"` or `"user"` (default: `"project"`) |
| `syncType` | string | no | `"full"` or `"incremental"` (default: `"full"`) |

**SSE Events:**

| Event | Data | Description |
|---|---|---|
| `progress` | `{ phase, progress, message }` | Sync progress update |
| `error` | `{ message, code }` | Sync error |
| `done` | `{ manifest }` | Sync completed |

**Sync Phases:**

1. `initializing` (5%): Checking project structure
2. `scanning` (10%): Starting project scan
3. `processing`: Parsing and generating spec data
4. `writing`: Persisting to `.harnesson/specs/`
5. `complete` (100%): Sync finished

#### `POST /api/graph/sync/cancel`

Cancels an in-progress sync by killing the child process.

**Request Body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `projectPath` | string | yes | Absolute project path |

**Response:** `{ cancelled: boolean }`

### Graph Storage (`apps/server/src/lib/graph-storage.ts`)

File-based persistence layer for graph data. All data is stored under a base directory:

- **Project storage**: `<projectPath>/.harnesson/specs/`
- **User storage**: `~/.harnesson/<projectName>/specs/`

**File Structure:**

```
.harnesson/specs/
├── manifest.json              # Sync metadata
├── specs/
│   ├── graph.json             # Specs graph nodes & edges
│   ├── graph-summary.md       # Graph summary markdown
│   ├── list.json              # Flat list of spec items
│   └── document.md            # Full spec document
├── architect/
│   ├── graph.json             # Architect graph nodes & edges
│   ├── graph-summary.md       # Architect summary markdown
│   └── document.md            # Technical document
└── history/
    ├── 2025-06-15T12-00-00/
    │   ├── manifest.json
    │   ├── specs/
    │   └── architect/
    └── ...
```

**Key Functions:**

| Function | Purpose |
|---|---|
| `resolveBaseDir(projectPath, storageLocation)` | Resolves the base `.harnesson` directory |
| `hasData(baseDir)` | Checks if spec data exists |
| `getManifest(baseDir)` | Reads `manifest.json` |
| `getFullData(baseDir)` | Reads all specs + architect data |
| `getHistoryList(baseDir)` | Lists historical sync entries |
| `getHistoryData(baseDir, timestamp)` | Reads data from a specific historical sync |
| `archiveCurrentData(baseDir, timestamp)` | Archives current data before new sync |
| `writeManifest(baseDir, manifest)` | Writes manifest metadata |

### Sync Engine (`apps/server/src/lib/sync-engine.ts`)

Orchestrates the sync process by spawning a child process:

- Tracks active syncs in a `Map<string, ChildProcess>` to prevent concurrent syncs and enable cancellation
- Streams progress via SSE writer interface
- Archives existing data before overwriting
- Supports both `full` and `incremental` sync types
- Updates manifest with sync metadata on completion

### Data Model

#### Shared Types

```typescript
type GraphTab = 'specs-graph' | 'specs-list' | 'specs-document' | 'architect-graph' | 'technical-document'
type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error'
type StorageLocation = 'project' | 'user'
type SyncType = 'full' | 'incremental'

interface Manifest {
  projectName: string
  projectPath: string
  storageLocation: StorageLocation
  lastSyncCommit: string | null
  lastSyncTime: string | null
  syncStatus: SyncStatus
  version: number
}

interface GraphNode {
  id: string
  type: 'project' | 'domain' | 'feature'
  level: number
  title: string
  content?: string
  children?: string[]
}

interface GraphEdge {
  source: string
  target: string
}

interface SpecsData {
  graph: GraphData | null       // Node-edge graph
  graphSummary: string | null   // Markdown summary
  list: SpecsListItem[]         // Flat list view
  document: string | null       // Full markdown document
}

interface ArchitectData {
  graph: GraphData | null       // Node-edge graph
  graphSummary: string | null   // Markdown summary
  document: string | null       // Technical document
}
```

---

## Implementation Notes

- **File-based Storage**: Graph data is stored as JSON and Markdown files on disk, not in SQLite. This allows the data to be version-controlled alongside the project.
- **Sync Detection**: The system compares the git HEAD commit with the manifest's `lastSyncCommit` to determine if a re-sync is needed.
- **Archive History**: Before each sync, the existing data is archived to `history/<timestamp>/` for rollback and comparison.
- **Concurrent Sync Prevention**: Only one sync can run per project at a time, enforced by the `activeSyncs` map.
- **Child Process Isolation**: The sync engine runs the actual scanning in a child process, allowing cancellation via `SIGTERM`.
- **SSE Progress**: Sync progress is streamed to the client in real-time via Server-Sent Events, providing immediate feedback during long-running operations.
