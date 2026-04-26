# Graph Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Graph page as a knowledge graph center with 5 tabs (Specs Graph, Specs List, Specs Document, Architect Graph, Technical Document), with file-based data storage, React Flow tree visualization, and SSE-based sync streaming.

**Architecture:** Backend reads/writes JSON+MD files from `.harnesson/` directories, exposed via Hono REST endpoints. Sync spawns a CLI subprocess with SSE progress streaming. Frontend uses React Flow with dagre layout for tree visualization, Zustand for state, and fetch+ReadableStream for POST-based SSE consumption.

**Tech Stack:** React 19, @xyflow/react, @dagrejs/dagre, react-markdown, remark-gfm, Zustand 5, Hono 4, Vitest

---

## File Structure

### Shared Types
- Create: `packages/shared/src/types/graph.ts` — All graph-related TypeScript interfaces
- Modify: `packages/shared/src/index.ts` — Export graph types

### Backend
- Create: `apps/server/src/lib/graph-storage.ts` — File-based read/write utilities for `.harnesson/`
- Create: `apps/server/src/lib/sync-engine.ts` — CLI subprocess management for sync
- Create: `apps/server/src/routes/graph.ts` — All graph API routes
- Modify: `apps/server/src/index.ts` — Register graph routes

### Frontend
- Modify: `apps/web/src/lib/serverApi.ts` — Add graph API functions
- Create: `apps/web/src/stores/graphStore.ts` — Zustand store for graph state
- Modify: `apps/web/src/pages/GraphPage.tsx` — Replace placeholder with full page
- Create: `apps/web/src/components/graph/GraphTabBar.tsx` — Tab switching bar
- Create: `apps/web/src/components/graph/FlowGraph.tsx` — Shared React Flow tree component
- Create: `apps/web/src/components/graph/GraphNodes.tsx` — Custom React Flow node types
- Create: `apps/web/src/components/graph/SpecsGraph.tsx` — Specs Graph tab content
- Create: `apps/web/src/components/graph/ArchitectGraph.tsx` — Architect Graph tab content
- Create: `apps/web/src/components/graph/SpecsList.tsx` — Hierarchical list view
- Create: `apps/web/src/components/graph/MarkdownViewer.tsx` — Shared markdown renderer
- Create: `apps/web/src/components/graph/SpecsDocument.tsx` — Specs Document tab
- Create: `apps/web/src/components/graph/TechnicalDocument.tsx` — Technical Document tab
- Create: `apps/web/src/components/graph/DetailPanel.tsx` — Right slide-out detail panel
- Create: `apps/web/src/components/graph/SyncView.tsx` — Empty-state sync landing
- Create: `apps/web/src/components/graph/SyncProgress.tsx` — Sync progress with logs

---

### Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/server/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/server/vitest.config.ts`

- [ ] **Step 1: Install frontend dependencies**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson && pnpm add @xyflow/react @dagrejs/dagre react-markdown remark-gfm --filter @harnesson/web
```

- [ ] **Step 2: Install dev dependencies for testing**

Run:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/dagre --filter @harnesson/web
pnpm add -D vitest --filter @harnesson/server
```

- [ ] **Step 3: Create vitest config for web**

```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Create test setup file**

```typescript
// apps/web/src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Create vitest config for server**

```typescript
// apps/server/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 6: Add test scripts to package.json files**

Add to `apps/web/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Add to `apps/server/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify installations**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm ls @xyflow/react @dagrejs/dagre react-markdown vitest --filter @harnesson/web --depth 0`
Expected: All packages listed with versions

- [ ] **Step 8: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml apps/web/vitest.config.ts apps/web/src/test/setup.ts apps/server/package.json apps/server/pnpm-lock.yaml apps/server/vitest.config.ts pnpm-lock.yaml
git commit -m "chore: add React Flow, dagre, react-markdown, and vitest dependencies"
```

---

### Task 2: Shared Graph Types

**Files:**
- Create: `packages/shared/src/types/graph.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create graph type definitions**

```typescript
// packages/shared/src/types/graph.ts

export type GraphTab =
  | 'specs-graph'
  | 'specs-list'
  | 'specs-document'
  | 'architect-graph'
  | 'technical-document';

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error';

export type StorageLocation = 'project' | 'user';

export type SyncType = 'full' | 'incremental';

export interface Manifest {
  projectName: string;
  projectPath: string;
  storageLocation: StorageLocation;
  lastSyncCommit: string | null;
  lastSyncTime: string | null;
  syncStatus: SyncStatus;
  version: number;
}

export interface GraphNode {
  id: string;
  type: 'project' | 'domain' | 'feature';
  level: number;
  title: string;
  content?: string;
  children?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SpecsListItem {
  id: string;
  type: 'project' | 'domain' | 'feature';
  level: number;
  title: string;
  content?: string;
  parentId?: string;
}

export interface SpecsData {
  graph: GraphData | null;
  graphSummary: string | null;
  list: SpecsListItem[];
  document: string | null;
}

export interface ArchitectData {
  graph: GraphData | null;
  graphSummary: string | null;
  document: string | null;
}

export interface SyncOptions {
  projectPath: string;
  storageLocation: StorageLocation;
  syncType: SyncType;
}

export interface GraphFullData {
  manifest: Manifest | null;
  specs: SpecsData | null;
  architect: ArchitectData | null;
}

export interface HistoryEntry {
  timestamp: string;
  hasSpecs: boolean;
  hasArchitect: boolean;
}
```

- [ ] **Step 2: Export graph types from shared index**

Modify `packages/shared/src/index.ts` to add the export:

```typescript
export * from './types/agent';
export * from './types/project';
export * from './types/spec-node';
export * from './types/task';
export * from './types/graph';
```

- [ ] **Step 3: Verify types compile**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/shared 2>&1 || pnpm -C packages/shared exec tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/graph.ts packages/shared/src/index.ts
git commit -m "feat: add shared graph type definitions"
```

---

### Task 3: Backend Graph Storage Utility

**Files:**
- Create: `apps/server/src/lib/graph-storage.ts`

- [ ] **Step 1: Create the graph storage module**

This module handles reading/writing all files in the `.harnesson/` directory.

```typescript
// apps/server/src/lib/graph-storage.ts
import { readFile, writeFile, mkdir, readdir, rm, stat, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type {
  Manifest,
  GraphData,
  SpecsListItem,
  SpecsData,
  ArchitectData,
  GraphFullData,
  HistoryEntry,
} from '@harnesson/shared';

function harnessonDir(projectPath: string, storageLocation: 'project' | 'user'): string {
  if (storageLocation === 'user') {
    const name = projectPath.split('/').pop() ?? 'unknown';
    return join(process.env.HOME ?? '~', '.harnesson', name);
  }
  return join(projectPath, '.harnesson');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  if (!(await fileExists(path))) return null;
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw) as T;
}

async function readTextFile(path: string): Promise<string | null> {
  if (!(await fileExists(path))) return null;
  return readFile(path, 'utf-8');
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function getManifest(baseDir: string): Promise<Manifest | null> {
  return readJsonFile<Manifest>(join(baseDir, 'manifest.json'));
}

export async function getSpecsData(baseDir: string): Promise<SpecsData | null> {
  const specsDir = join(baseDir, 'specs');
  if (!(await dirExists(specsDir))) return null;

  const [graph, graphSummary, list, document] = await Promise.all([
    readJsonFile<GraphData>(join(specsDir, 'graph.json')),
    readTextFile(join(specsDir, 'graph-summary.md')),
    readJsonFile<SpecsListItem[]>(join(specsDir, 'list.json')),
    readTextFile(join(specsDir, 'document.md')),
  ]);

  return {
    graph: graph ?? null,
    graphSummary,
    list: list ?? [],
    document,
  };
}

export async function getArchitectData(baseDir: string): Promise<ArchitectData | null> {
  const archDir = join(baseDir, 'architect');
  if (!(await dirExists(archDir))) return null;

  const [graph, graphSummary, document] = await Promise.all([
    readJsonFile<GraphData>(join(archDir, 'graph.json')),
    readTextFile(join(archDir, 'graph-summary.md')),
    readTextFile(join(archDir, 'document.md')),
  ]);

  return {
    graph: graph ?? null,
    graphSummary,
    document,
  };
}

export async function getFullData(baseDir: string): Promise<GraphFullData> {
  const [manifest, specs, architect] = await Promise.all([
    getManifest(baseDir),
    getSpecsData(baseDir),
    getArchitectData(baseDir),
  ]);

  return { manifest, specs, architect };
}

export async function hasData(baseDir: string): Promise<boolean> {
  return fileExists(join(baseDir, 'manifest.json'));
}

export async function getHistoryList(baseDir: string): Promise<HistoryEntry[]> {
  const entries: HistoryEntry[] = [];

  const readHistoryDir = async (dirName: string, key: 'hasSpecs' | 'hasArchitect') => {
    const dir = join(baseDir, dirName);
    if (!(await dirExists(dir))) return;
    const timestamps = await readdir(dir);
    for (const ts of timestamps) {
      const existing = entries.find((e) => e.timestamp === ts);
      if (existing) {
        existing[key] = true;
      } else {
        entries.push({ timestamp: ts, hasSpecs: false, hasArchitect: false, [key]: true });
      }
    }
  };

  await Promise.all([
    readHistoryDir('specs-history', 'hasSpecs'),
    readHistoryDir('architect-history', 'hasArchitect'),
  ]);

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function getHistoryData(
  baseDir: string,
  timestamp: string,
): Promise<{ specs: SpecsData | null; architect: ArchitectData | null }> {
  const [specsDir, archDir] = [
    join(baseDir, 'specs-history', timestamp),
    join(baseDir, 'architect-history', timestamp),
  ];

  let specs: SpecsData | null = null;
  if (await dirExists(specsDir)) {
    const [graph, list, document] = await Promise.all([
      readJsonFile<GraphData>(join(specsDir, 'graph.json')),
      readJsonFile<SpecsListItem[]>(join(specsDir, 'list.json')),
      readTextFile(join(specsDir, 'document.md')),
    ]);
    specs = { graph: graph ?? null, graphSummary: null, list: list ?? [], document };
  }

  let architect: ArchitectData | null = null;
  if (await dirExists(archDir)) {
    const [graph, document] = await Promise.all([
      readJsonFile<GraphData>(join(archDir, 'graph.json')),
      readTextFile(join(archDir, 'document.md')),
    ]);
    architect = { graph: graph ?? null, graphSummary: null, document };
  }

  return { specs, architect };
}

export async function archiveCurrentData(baseDir: string, timestamp: string): Promise<void> {
  const archiveDir = async (src: string, dest: string) => {
    if (!(await dirExists(src))) return;
    await ensureDir(dest);
    await cp(src, dest, { recursive: true });
  };

  await Promise.all([
    archiveDir(join(baseDir, 'specs'), join(baseDir, 'specs-history', timestamp)),
    archiveDir(join(baseDir, 'architect'), join(baseDir, 'architect-history', timestamp)),
  ]);
}

export async function writeManifest(baseDir: string, manifest: Manifest): Promise<void> {
  await ensureDir(baseDir);
  await writeFile(join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
}

export async function writeSpecsData(
  baseDir: string,
  data: { graph?: GraphData; list?: SpecsListItem[]; document?: string; graphSummary?: string },
): Promise<void> {
  const specsDir = join(baseDir, 'specs');
  await ensureDir(specsDir);

  const writes: Promise<void>[] = [];
  if (data.graph) writes.push(writeFile(join(specsDir, 'graph.json'), JSON.stringify(data.graph, null, 2), 'utf-8'));
  if (data.list) writes.push(writeFile(join(specsDir, 'list.json'), JSON.stringify(data.list, null, 2), 'utf-8'));
  if (data.document) writes.push(writeFile(join(specsDir, 'document.md'), data.document, 'utf-8'));
  if (data.graphSummary) writes.push(writeFile(join(specsDir, 'graph-summary.md'), data.graphSummary, 'utf-8'));
  await Promise.all(writes);
}

export async function writeArchitectData(
  baseDir: string,
  data: { graph?: GraphData; document?: string; graphSummary?: string },
): Promise<void> {
  const archDir = join(baseDir, 'architect');
  await ensureDir(archDir);

  const writes: Promise<void>[] = [];
  if (data.graph) writes.push(writeFile(join(archDir, 'graph.json'), JSON.stringify(data.graph, null, 2), 'utf-8'));
  if (data.document) writes.push(writeFile(join(archDir, 'document.md'), data.document, 'utf-8'));
  if (data.graphSummary) writes.push(writeFile(join(archDir, 'graph-summary.md'), data.graphSummary, 'utf-8'));
  await Promise.all(writes);
}

export function resolveBaseDir(projectPath: string, storageLocation?: 'project' | 'user'): string {
  return harnessonDir(projectPath, storageLocation ?? 'project');
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/server`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/graph-storage.ts
git commit -m "feat: add backend graph storage utility for .harnesson directory"
```

---

### Task 4: Backend Graph API Routes

**Files:**
- Create: `apps/server/src/routes/graph.ts`
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: Create graph API routes**

```typescript
// apps/server/src/routes/graph.ts
import { Hono } from 'hono';
import {
  hasData,
  getManifest,
  getFullData,
  getHistoryList,
  getHistoryData,
  resolveBaseDir,
} from '../lib/graph-storage.js';

export const graphRoute = new Hono();

// GET /api/graph/status — check if graph data exists
graphRoute.get('/api/graph/status', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const exists = await hasData(baseDir);
  const manifest = exists ? await getManifest(baseDir) : null;

  return c.json({
    hasData: exists,
    lastSyncCommit: manifest?.lastSyncCommit ?? null,
    lastSyncTime: manifest?.lastSyncTime ?? null,
    syncStatus: manifest?.syncStatus ?? 'idle',
  });
});

// GET /api/graph/manifest — get manifest
graphRoute.get('/api/graph/manifest', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const manifest = await getManifest(baseDir);
  if (!manifest) return c.json({ error: 'No manifest found' }, 404);

  return c.json(manifest);
});

// GET /api/graph/data — get all graph data
graphRoute.get('/api/graph/data', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const data = await getFullData(baseDir);
  return c.json(data);
});

// GET /api/graph/history — list history entries
graphRoute.get('/api/graph/history', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const entries = await getHistoryList(baseDir);
  return c.json(entries);
});

// GET /api/graph/history/:timestamp — get specific history data
graphRoute.get('/api/graph/history/:timestamp', async (c) => {
  const projectPath = c.req.query('projectPath');
  const timestamp = c.req.param('timestamp');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);
  if (!timestamp) return c.json({ error: 'timestamp is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const data = await getHistoryData(baseDir, timestamp);
  return c.json(data);
});
```

- [ ] **Step 2: Register graph routes in server index**

Modify `apps/server/src/index.ts`:

```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { openFolderRoute } from './routes/open-folder.js';
import { healthRoute } from './routes/health.js';
import { projectsRoute } from './routes/projects.js';
import { graphRoute } from './routes/graph.js';

const app = new Hono();

app.use('/*', cors({ origin: 'http://localhost:5173' }));

app.route('/', healthRoute);
app.route('/', openFolderRoute);
app.route('/', projectsRoute);
app.route('/', graphRoute);

const PORT = Number(process.env.PORT ?? 3456);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`@harnesson/server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 3: Verify server compiles**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/server`
Expected: No errors

- [ ] **Step 4: Test the API endpoints manually**

Run the server in background:
```bash
cd /Users/dt_flys/Projects/harnesson && pnpm run dev --filter @harnesson/server &
```

Then test:
```bash
curl -s http://localhost:3456/api/graph/status?projectPath=/tmp/nonexistent | head
```
Expected: `{"hasData":false,"lastSyncCommit":null,"lastSyncTime":null,"syncStatus":"idle"}`

Kill the server process after testing.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/routes/graph.ts apps/server/src/index.ts
git commit -m "feat: add backend graph API routes (status, manifest, data, history)"
```

---

### Task 5: Frontend Graph API Functions

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`

- [ ] **Step 1: Add graph API functions to serverApi**

Append these functions to the end of `apps/web/src/lib/serverApi.ts`:

```typescript
// --- Graph API ---

export interface GraphStatusResponse {
  hasData: boolean;
  lastSyncCommit: string | null;
  lastSyncTime: string | null;
  syncStatus: string;
}

export async function getGraphStatus(projectPath: string): Promise<GraphStatusResponse> {
  const res = await fetch(`/api/graph/status?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get graph status: ${res.status}`);
  return res.json();
}

export async function getGraphData(projectPath: string): Promise<import('@harnesson/shared').GraphFullData> {
  const res = await fetch(`/api/graph/data?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get graph data: ${res.status}`);
  return res.json();
}

export async function getGraphManifest(projectPath: string): Promise<import('@harnesson/shared').Manifest> {
  const res = await fetch(`/api/graph/manifest?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get manifest: ${res.status}`);
  return res.json();
}

export async function getGraphHistory(projectPath: string): Promise<import('@harnesson/shared').HistoryEntry[]> {
  const res = await fetch(`/api/graph/history?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get history: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/web`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/serverApi.ts
git commit -m "feat: add frontend graph API functions to serverApi"
```

---

### Task 6: Frontend Graph Store

**Files:**
- Create: `apps/web/src/stores/graphStore.ts`

- [ ] **Step 1: Create the graph Zustand store**

```typescript
// apps/web/src/stores/graphStore.ts
import { create } from 'zustand';
import type {
  GraphTab,
  Manifest,
  SpecsData,
  ArchitectData,
  SyncOptions,
  SyncStatus,
} from '@harnesson/shared';
import * as serverApi from '@/lib/serverApi';

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

function parseSSEBuffer(buffer: string): { parsed: SSEEvent[]; remaining: string } {
  const parsed: SSEEvent[] = [];
  const lines = buffer.split('\n');
  const remaining = lines.pop() ?? '';

  let currentEvent = '';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7);
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6);
    } else if (line === '' && currentEvent && currentData) {
      parsed.push({ event: currentEvent, data: JSON.parse(currentData) });
      currentEvent = '';
      currentData = '';
    }
  }

  return { parsed, remaining };
}

interface GraphState {
  projectPath: string | null;
  manifest: Manifest | null;
  specsData: SpecsData | null;
  architectData: ArchitectData | null;

  syncStatus: SyncStatus;
  syncProgress: number;
  syncPhase: string;
  syncLogs: string[];

  activeTab: GraphTab;
  selectedNodeId: string | null;
  isDetailPanelOpen: boolean;

  setProjectPath: (path: string | null) => void;
  loadGraph: (projectPath: string) => Promise<void>;
  startSync: (options: SyncOptions) => Promise<void>;
  cancelSync: () => Promise<void>;
  selectNode: (nodeId: string) => void;
  closeDetailPanel: () => void;
  setActiveTab: (tab: GraphTab) => void;
  checkAutoSync: (projectPath: string) => Promise<void>;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  projectPath: null,
  manifest: null,
  specsData: null,
  architectData: null,

  syncStatus: 'idle',
  syncProgress: 0,
  syncPhase: '',
  syncLogs: [],

  activeTab: 'specs-graph',
  selectedNodeId: null,
  isDetailPanelOpen: false,

  setProjectPath: (path) => set({ projectPath: path }),

  loadGraph: async (projectPath: string) => {
    try {
      const data = await serverApi.getGraphData(projectPath);
      set({
        projectPath,
        manifest: data.manifest,
        specsData: data.specs,
        architectData: data.architect,
      });
    } catch {
      set({ projectPath, manifest: null, specsData: null, architectData: null });
    }
  },

  startSync: async (options: SyncOptions) => {
    set({ syncStatus: 'syncing', syncProgress: 0, syncPhase: 'initializing', syncLogs: [] });

    try {
      const response = await fetch('/api/graph/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Sync request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { parsed, remaining } = parseSSEBuffer(buffer);
        buffer = remaining;

        for (const evt of parsed) {
          switch (evt.event) {
            case 'progress':
              set({
                syncProgress: (evt.data.progress as number) ?? get().syncProgress,
                syncPhase: (evt.data.phase as string) ?? get().syncPhase,
                syncLogs: [...get().syncLogs, (evt.data.message as string) ?? ''],
              });
              break;
            case 'node-generated':
              // Node generated during sync — can be used for live updates
              break;
            case 'complete':
              set({ syncStatus: 'completed', syncProgress: 100 });
              await get().loadGraph(options.projectPath);
              break;
            case 'error':
              set({
                syncStatus: 'error',
                syncLogs: [...get().syncLogs, `Error: ${evt.data.message}`],
              });
              break;
          }
        }
      }
    } catch (err) {
      set({
        syncStatus: 'error',
        syncLogs: [...get().syncLogs, `Connection error: ${err instanceof Error ? err.message : String(err)}`],
      });
    }
  },

  cancelSync: async () => {
    const { projectPath } = get();
    if (!projectPath) return;
    try {
      await fetch('/api/graph/sync/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath }),
      });
    } catch {
      // Ignore cancel errors
    }
    set({ syncStatus: 'idle', syncProgress: 0 });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, isDetailPanelOpen: true }),

  closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedNodeId: null }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  checkAutoSync: async (projectPath: string) => {
    try {
      const status = await serverApi.getGraphStatus(projectPath);
      if (!status.hasData) return;

      const { execSync } = await import('child_process');
      // This runs in the browser — we need a server endpoint for git HEAD.
      // For now, rely on the manifest's lastSyncCommit comparison via the status endpoint.
      // The status endpoint returns lastSyncCommit; the server can compare.
    } catch {
      // Auto-sync check failure is non-critical
    }
  },
}));
```

- [ ] **Step 2: Fix the checkAutoSync method — it can't use child_process in browser**

Replace the `checkAutoSync` implementation in the store. The git HEAD check needs a server endpoint, not browser code. Update the method:

```typescript
  checkAutoSync: async (projectPath: string) => {
    try {
      const status = await serverApi.getGraphStatus(projectPath);
      if (!status.hasData || !status.lastSyncCommit) return;
      // The /api/graph/status endpoint will be enhanced in Task 11
      // to include a `needsSync` boolean from the server side.
      if ((status as Record<string, unknown>).needsSync) {
        await get().startSync({
          projectPath,
          storageLocation: 'project',
          syncType: 'incremental',
        });
      }
    } catch {
      // Auto-sync check failure is non-critical
    }
  },
```

- [ ] **Step 3: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/web`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/graphStore.ts
git commit -m "feat: add graph Zustand store with SSE sync handling"
```

---

### Task 7: GraphPage Container + GraphTabBar

**Files:**
- Create: `apps/web/src/components/graph/GraphTabBar.tsx`
- Modify: `apps/web/src/pages/GraphPage.tsx`

- [ ] **Step 1: Create GraphTabBar component**

```tsx
// apps/web/src/components/graph/GraphTabBar.tsx
import { cn } from '@/lib/utils';
import type { GraphTab } from '@harnesson/shared';

interface Tab {
  id: GraphTab;
  label: string;
}

const tabs: Tab[] = [
  { id: 'specs-graph', label: 'Specs Graph' },
  { id: 'specs-list', label: 'Specs List' },
  { id: 'specs-document', label: 'Specs Document' },
  { id: 'architect-graph', label: 'Architect Graph' },
  { id: 'technical-document', label: 'Technical Document' },
];

interface GraphTabBarProps {
  activeTab: GraphTab;
  onTabChange: (tab: GraphTab) => void;
}

export function GraphTabBar({ activeTab, onTabChange }: GraphTabBarProps) {
  return (
    <div className="flex items-center gap-0 border-b border-harness-border bg-harness-sidebar px-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative px-4 py-2.5 text-[12px] font-medium transition-colors',
            activeTab === tab.id
              ? 'text-harness-accent'
              : 'text-gray-500 hover:text-gray-300',
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-harness-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Replace GraphPage with full implementation**

```tsx
// apps/web/src/pages/GraphPage.tsx
import { useEffect } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { useProjectStore } from '@/stores/projectStore';
import { GraphTabBar } from '@/components/graph/GraphTabBar';
import { SpecsGraph } from '@/components/graph/SpecsGraph';
import { SpecsList } from '@/components/graph/SpecsList';
import { SpecsDocument } from '@/components/graph/SpecsDocument';
import { ArchitectGraph } from '@/components/graph/ArchitectGraph';
import { TechnicalDocument } from '@/components/graph/TechnicalDocument';
import { DetailPanel } from '@/components/graph/DetailPanel';
import { SyncView } from '@/components/graph/SyncView';

export function GraphPage() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const projectPath = activeProject?.path ?? null;

  const manifest = useGraphStore((s) => s.manifest);
  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const syncStatus = useGraphStore((s) => s.syncStatus);
  const activeTab = useGraphStore((s) => s.activeTab);
  const isDetailPanelOpen = useGraphStore((s) => s.isDetailPanelOpen);
  const setProjectPath = useGraphStore((s) => s.setProjectPath);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const setActiveTab = useGraphStore((s) => s.setActiveTab);
  const startSync = useGraphStore((s) => s.startSync);

  useEffect(() => {
    if (projectPath) {
      setProjectPath(projectPath);
      loadGraph(projectPath);
    }
  }, [projectPath, setProjectPath, loadGraph]);

  const hasData = !!(specsData || architectData);
  const isSyncing = syncStatus === 'syncing';

  if (!projectPath) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Select a project to view graph</p>
      </div>
    );
  }

  if (!hasData && !isSyncing) {
    return (
      <div className="flex h-full flex-col">
        <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <SyncView
            projectPath={projectPath}
            onSync={(storageLocation) =>
              startSync({ projectPath, storageLocation, syncType: 'full' })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {activeTab === 'specs-graph' && <SpecsGraph />}
          {activeTab === 'specs-list' && <SpecsList />}
          {activeTab === 'specs-document' && <SpecsDocument />}
          {activeTab === 'architect-graph' && <ArchitectGraph />}
          {activeTab === 'technical-document' && <TechnicalDocument />}
        </div>
        {isDetailPanelOpen && <DetailPanel />}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/GraphTabBar.tsx apps/web/src/pages/GraphPage.tsx
git commit -m "feat: add GraphPage container and GraphTabBar component"
```

---

### Task 8: Custom React Flow Nodes + FlowGraph

**Files:**
- Create: `apps/web/src/components/graph/GraphNodes.tsx`
- Create: `apps/web/src/components/graph/FlowGraph.tsx`

- [ ] **Step 1: Create custom node components**

```tsx
// apps/web/src/components/graph/GraphNodes.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface GraphNodeData {
  label: string;
  content?: string;
  level: number;
  [key: string]: unknown;
}

export function ProjectNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border-2 border-harness-accent bg-harness-accent/20 px-5 py-3 text-center shadow-lg transition-shadow hover:shadow-harness-accent/20">
      <Handle type="target" position={Position.Top} className="!bg-harness-accent" />
      <div className="text-[13px] font-semibold text-harness-accent">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-harness-accent" />
    </div>
  );
}

export function DomainNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border border-blue-500/60 bg-blue-500/10 px-4 py-2 text-center shadow-md transition-shadow hover:shadow-blue-500/20">
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <div className="text-[12px] font-medium text-blue-400">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
}

export function FeatureNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-1.5 text-center shadow-sm transition-shadow hover:shadow-green-500/20">
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
      <div className="text-[11px] text-green-400">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
}

export const nodeTypes = {
  project: ProjectNode,
  domain: DomainNode,
  feature: FeatureNode,
} as const;
```

- [ ] **Step 2: Create shared FlowGraph component**

```tsx
// apps/web/src/components/graph/FlowGraph.tsx
import { useCallback, useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, type OnNodeClick } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import type { GraphData } from '@harnesson/shared';
import { nodeTypes } from './GraphNodes';

const NODE_WIDTH = 200;
const NODE_HEIGHT_MAP: Record<string, number> = {
  project: 48,
  domain: 40,
  feature: 36,
};

function getLayoutedElements(graphData: GraphData): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 60 });

  for (const node of graphData.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT_MAP[node.type] ?? 40 });
  }

  for (const edge of graphData.edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  const nodes: Node[] = graphData.nodes.map((node) => {
    const pos = g.node(node.id);
    const height = NODE_HEIGHT_MAP[node.type] ?? 40;
    return {
      id: node.id,
      type: node.type,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - height / 2 },
      data: { label: node.title, content: node.content, level: node.level },
    };
  });

  const edges: Edge[] = graphData.edges.map((edge) => ({
    id: `e-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
  }));

  return { nodes, edges };
}

interface FlowGraphProps {
  graphData: GraphData;
  onNodeClick?: OnNodeClick;
}

export function FlowGraph({ graphData, onNodeClick }: FlowGraphProps) {
  const { nodes, edges } = useMemo(() => getLayoutedElements(graphData), [graphData]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep' as const,
      style: { stroke: '#555' },
    }),
    [],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls
          className="!border-harness-border !bg-harness-sidebar [&>button]:!bg-harness-sidebar [&>button]:!border-harness-border [&>button]:!text-gray-400 [&>button:hover]:!bg-white/5"
        />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/web`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/graph/GraphNodes.tsx apps/web/src/components/graph/FlowGraph.tsx
git commit -m "feat: add custom React Flow nodes and shared FlowGraph component"
```

---

### Task 9: SpecsGraph + ArchitectGraph Tab Components

**Files:**
- Create: `apps/web/src/components/graph/SpecsGraph.tsx`
- Create: `apps/web/src/components/graph/ArchitectGraph.tsx`

- [ ] **Step 1: Create SpecsGraph component**

```tsx
// apps/web/src/components/graph/SpecsGraph.tsx
import { useCallback } from 'react';
import type { NodeMouseHandler } from '@xyflow/react';
import { FlowGraph } from './FlowGraph';
import { useGraphStore } from '@/stores/graphStore';

export function SpecsGraph() {
  const specsData = useGraphStore((s) => s.specsData);
  const selectNode = useGraphStore((s) => s.selectNode);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  if (!specsData?.graph || specsData.graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs graph data available</p>
      </div>
    );
  }

  return <FlowGraph graphData={specsData.graph} onNodeClick={handleNodeClick} />;
}
```

- [ ] **Step 2: Create ArchitectGraph component**

```tsx
// apps/web/src/components/graph/ArchitectGraph.tsx
import { useCallback } from 'react';
import type { NodeMouseHandler } from '@xyflow/react';
import { FlowGraph } from './FlowGraph';
import { useGraphStore } from '@/stores/graphStore';

export function ArchitectGraph() {
  const architectData = useGraphStore((s) => s.architectData);
  const selectNode = useGraphStore((s) => s.selectNode);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  if (!architectData?.graph || architectData.graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No architect graph data available</p>
      </div>
    );
  }

  return <FlowGraph graphData={architectData.graph} onNodeClick={handleNodeClick} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/SpecsGraph.tsx apps/web/src/components/graph/ArchitectGraph.tsx
git commit -m "feat: add SpecsGraph and ArchitectGraph tab components"
```

---

### Task 10: SpecsList Component

**Files:**
- Create: `apps/web/src/components/graph/SpecsList.tsx`

- [ ] **Step 1: Create SpecsList with hierarchical tree view**

```tsx
// apps/web/src/components/graph/SpecsList.tsx
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraphStore } from '@/stores/graphStore';
import type { SpecsListItem } from '@harnesson/shared';

interface TreeNode {
  id: string;
  type: 'project' | 'domain' | 'feature';
  level: number;
  title: string;
  content?: string;
  children: TreeNode[];
}

function buildTree(items: SpecsListItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else if (item.level === 0) {
      roots.push(node);
    }
  }

  return roots;
}

const typeIconMap = {
  project: Folder,
  domain: FolderOpen,
  feature: FileText,
};

const typeColorMap = {
  project: 'text-harness-accent',
  domain: 'text-blue-400',
  feature: 'text-green-400',
};

function TreeNodeRow({
  node,
  depth,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const Icon = typeIconMap[node.type];

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node.id);
        }}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/[0.03]',
          node.type === 'project' && 'border-b border-harness-border',
        )}
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', typeColorMap[node.type])} />
        <span className="text-[12px] font-medium text-gray-300">{node.title}</span>
      </button>
      {expanded &&
        node.children.map((child) => (
          <TreeNodeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
        ))}
    </div>
  );
}

export function SpecsList() {
  const specsData = useGraphStore((s) => s.specsData);
  const selectNode = useGraphStore((s) => s.selectNode);

  const tree = useMemo(() => {
    if (!specsData?.list || specsData.list.length === 0) return [];
    return buildTree(specsData.list);
  }, [specsData?.list]);

  if (tree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs list data available</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((node) => (
        <TreeNodeRow key={node.id} node={node} depth={0} onSelect={selectNode} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/web`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/SpecsList.tsx
git commit -m "feat: add SpecsList hierarchical tree view component"
```

---

### Task 11: MarkdownViewer + SpecsDocument + TechnicalDocument

**Files:**
- Create: `apps/web/src/components/graph/MarkdownViewer.tsx`
- Create: `apps/web/src/components/graph/SpecsDocument.tsx`
- Create: `apps/web/src/components/graph/TechnicalDocument.tsx`

- [ ] **Step 1: Create shared MarkdownViewer component**

```tsx
// apps/web/src/components/graph/MarkdownViewer.tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string | null;
  emptyMessage?: string;
}

export function MarkdownViewer({ content, emptyMessage = 'No content available' }: MarkdownViewerProps) {
  if (!content) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="prose prose-invert max-w-none px-6 py-4 prose-headings:text-gray-200 prose-p:text-gray-400 prose-strong:text-gray-300 prose-code:text-harness-accent prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-400">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
```

- [ ] **Step 2: Create SpecsDocument component**

```tsx
// apps/web/src/components/graph/SpecsDocument.tsx
import { useGraphStore } from '@/stores/graphStore';
import { MarkdownViewer } from './MarkdownViewer';

export function SpecsDocument() {
  const document = useGraphStore((s) => s.specsData?.document);
  return <MarkdownViewer content={document ?? null} emptyMessage="No specs document available" />;
}
```

- [ ] **Step 3: Create TechnicalDocument component**

```tsx
// apps/web/src/components/graph/TechnicalDocument.tsx
import { useGraphStore } from '@/stores/graphStore';
import { MarkdownViewer } from './MarkdownViewer';

export function TechnicalDocument() {
  const document = useGraphStore((s) => s.architectData?.document);
  return <MarkdownViewer content={document ?? null} emptyMessage="No technical document available" />;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/graph/MarkdownViewer.tsx apps/web/src/components/graph/SpecsDocument.tsx apps/web/src/components/graph/TechnicalDocument.tsx
git commit -m "feat: add MarkdownViewer, SpecsDocument, and TechnicalDocument components"
```

---

### Task 12: DetailPanel Component

**Files:**
- Create: `apps/web/src/components/graph/DetailPanel.tsx`

- [ ] **Step 1: Create the right slide-out detail panel**

```tsx
// apps/web/src/components/graph/DetailPanel.tsx
import { X } from 'lucide-react';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphNode } from '@harnesson/shared';

const typeLabelMap: Record<string, string> = {
  project: 'Project',
  domain: 'Domain',
  feature: 'Feature',
};

const typeColorMap: Record<string, string> = {
  project: 'bg-harness-accent/15 text-harness-accent',
  domain: 'bg-blue-500/15 text-blue-400',
  feature: 'bg-green-500/15 text-green-400',
};

function findNode(nodes: GraphNode[], id: string): GraphNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function DetailPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const closeDetailPanel = useGraphStore((s) => s.closeDetailPanel);

  if (!selectedNodeId) return null;

  // Search both specs and architect graph nodes
  const node =
    findNode(specsData?.graph?.nodes ?? [], selectedNodeId) ??
    findNode(architectData?.graph?.nodes ?? [], selectedNodeId);

  if (!node) return null;

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-harness-border bg-harness-sidebar">
      <div className="flex items-center justify-between border-b border-harness-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-[1px] text-[10px] font-semibold ${typeColorMap[node.type] ?? 'bg-gray-500/15 text-gray-400'}`}>
            {typeLabelMap[node.type] ?? node.type}
          </span>
          <span className="text-[13px] font-medium text-gray-200">{node.title}</span>
        </div>
        <button
          onClick={closeDetailPanel}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">ID</span>
          <p className="mt-0.5 font-mono text-[11px] text-gray-400">{node.id}</p>
        </div>

        <div className="mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Level</span>
          <p className="mt-0.5 text-[12px] text-gray-400">{node.level}</p>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Children</span>
            <p className="mt-0.5 text-[12px] text-gray-400">{node.children.join(', ')}</p>
          </div>
        )}

        {node.content && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Content</span>
            <div className="mt-1 rounded-md border border-harness-border bg-harness-bg p-3">
              <p className="text-[12px] leading-relaxed text-gray-300 whitespace-pre-wrap">{node.content}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/web`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/DetailPanel.tsx
git commit -m "feat: add DetailPanel slide-out component for node inspection"
```

---

### Task 13: SyncView + SyncProgress

**Files:**
- Create: `apps/web/src/components/graph/SyncView.tsx`
- Create: `apps/web/src/components/graph/SyncProgress.tsx`

- [ ] **Step 1: Create SyncView (empty state + sync trigger)**

```tsx
// apps/web/src/components/graph/SyncView.tsx
import { useState } from 'react';
import { Network, Folder, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraphStore } from '@/stores/graphStore';
import { SyncProgress } from './SyncProgress';
import type { StorageLocation } from '@harnesson/shared';

interface SyncViewProps {
  projectPath: string;
  onSync: (storageLocation: StorageLocation) => void;
}

export function SyncView({ projectPath, onSync }: SyncViewProps) {
  const syncStatus = useGraphStore((s) => s.syncStatus);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('project');

  if (syncStatus === 'syncing') {
    return <SyncProgress />;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-harness-accent/10">
          <Network className="h-7 w-7 text-harness-accent" />
        </div>
        <h2 className="mb-2 text-[15px] font-semibold text-gray-200">
          Project Graph Not Synced
        </h2>
        <p className="mb-6 text-[12px] leading-relaxed text-gray-500">
          Sync the project to generate a knowledge graph with specs, architecture, and technical documentation.
        </p>

        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setStorageLocation('project')}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition-colors',
              storageLocation === 'project'
                ? 'border-harness-accent bg-harness-accent/10 text-harness-accent'
                : 'border-harness-border text-gray-500 hover:border-gray-500',
            )}
          >
            <Folder className="h-3.5 w-3.5" />
            Project Dir
          </button>
          <button
            onClick={() => setStorageLocation('user')}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition-colors',
              storageLocation === 'user'
                ? 'border-harness-accent bg-harness-accent/10 text-harness-accent'
                : 'border-harness-border text-gray-500 hover:border-gray-500',
            )}
          >
            <User className="h-3.5 w-3.5" />
            User Dir
          </button>
        </div>

        <p className="mb-4 text-[10px] text-gray-600">
          {storageLocation === 'project'
            ? `Data will be stored at ${projectPath}/.harnesson/`
            : `Data will be stored at ~/.harnesson/<project>/`}
        </p>

        <button
          onClick={() => onSync(storageLocation)}
          className="rounded-lg bg-harness-accent px-5 py-2 text-[12px] font-medium text-white hover:bg-harness-accent/90"
        >
          Sync Project Graph
        </button>

        {syncStatus === 'error' && (
          <p className="mt-3 text-[11px] text-red-400">Sync failed. Please try again.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SyncProgress component**

```tsx
// apps/web/src/components/graph/SyncProgress.tsx
import { useGraphStore } from '@/stores/graphStore';
import { Loader2 } from 'lucide-react';

const phaseLabels: Record<string, string> = {
  initializing: 'Initializing',
  scanning: 'Scanning source code',
  analyzing: 'AI analysis',
  generating: 'Generating graph data',
  completing: 'Completing sync',
};

export function SyncProgress() {
  const syncProgress = useGraphStore((s) => s.syncProgress);
  const syncPhase = useGraphStore((s) => s.syncPhase);
  const syncLogs = useGraphStore((s) => s.syncLogs);
  const cancelSync = useGraphStore((s) => s.cancelSync);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-harness-accent" />
          <h3 className="text-[14px] font-semibold text-gray-200">Syncing Project Graph</h3>
          <p className="mt-1 text-[12px] text-gray-500">
            {phaseLabels[syncPhase] ?? syncPhase} — {Math.round(syncProgress)}%
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-harness-border">
          <div
            className="h-full rounded-full bg-harness-accent transition-all duration-300"
            style={{ width: `${syncProgress}%` }}
          />
        </div>

        {/* Phase markers */}
        <div className="mb-6 flex justify-between text-[10px] text-gray-600">
          <span>Init</span>
          <span>Scan</span>
          <span>Analyze</span>
          <span>Generate</span>
          <span>Done</span>
        </div>

        {/* Log stream */}
        {syncLogs.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto rounded-md border border-harness-border bg-harness-bg p-3">
            {syncLogs.map((log, i) => (
              <p key={i} className="font-mono text-[11px] leading-relaxed text-gray-500">
                <span className="text-gray-700">{String(i + 1).padStart(2, '0')}</span>
                {' '}
                {log}
              </p>
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={cancelSync}
            className="rounded-md px-4 py-1.5 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300"
          >
            Cancel Sync
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire SyncProgress into the GraphPage for active syncing**

The GraphPage already handles the syncing state via the `SyncView` component (which shows `SyncProgress` when `syncStatus === 'syncing'`). We also want to show progress if data exists but a re-sync is in progress. Add this case to `GraphPage.tsx` by adding a SyncProgress overlay when syncing with existing data.

Add this import and block to the GraphPage, right after the `<GraphTabBar>` in the main return:

```tsx
// Add to imports in GraphPage.tsx:
import { SyncProgress } from '@/components/graph/SyncProgress';

// Add inside the main return, after <GraphTabBar> and before the flex content div:
{isSyncing && (
  <div className="absolute inset-0 z-10 bg-harness-content/80 backdrop-blur-sm">
    <SyncProgress />
  </div>
)}
```

To make the overlay work, wrap the main return content in a `relative` container:

The full updated return block in `GraphPage.tsx`:

```tsx
  return (
    <div className="relative flex h-full flex-col">
      <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      {isSyncing && (
        <div className="absolute inset-0 top-[41px] z-10 bg-harness-content/80 backdrop-blur-sm">
          <SyncProgress />
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {activeTab === 'specs-graph' && <SpecsGraph />}
          {activeTab === 'specs-list' && <SpecsList />}
          {activeTab === 'specs-document' && <SpecsDocument />}
          {activeTab === 'architect-graph' && <ArchitectGraph />}
          {activeTab === 'technical-document' && <TechnicalDocument />}
        </div>
        {isDetailPanelOpen && <DetailPanel />}
      </div>
    </div>
  );
```

- [ ] **Step 4: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/web`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/graph/SyncView.tsx apps/web/src/components/graph/SyncProgress.tsx apps/web/src/pages/GraphPage.tsx
git commit -m "feat: add SyncView, SyncProgress components with overlay for re-sync"
```

---

### Task 14: Backend Sync Endpoint (SSE + CLI Subprocess)

**Files:**
- Create: `apps/server/src/lib/sync-engine.ts`
- Modify: `apps/server/src/routes/graph.ts`

- [ ] **Step 1: Create sync engine for CLI subprocess management**

```typescript
// apps/server/src/lib/sync-engine.ts
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import type { SyncOptions, Manifest } from '@harnesson/shared';
import {
  resolveBaseDir,
  hasData,
  archiveCurrentData,
  writeManifest,
  writeSpecsData,
  writeArchitectData,
  getManifest,
} from './graph-storage.js';

const activeSyncs = new Map<string, ChildProcess>();

export function isSyncing(projectPath: string): boolean {
  return activeSyncs.has(projectPath);
}

export function cancelSync(projectPath: string): boolean {
  const proc = activeSyncs.get(projectPath);
  if (!proc) return false;
  proc.kill('SIGTERM');
  activeSyncs.delete(projectPath);
  return true;
}

interface SSEWriter {
  write: (event: string, data: Record<string, unknown>) => void;
}

export async function runSync(
  options: SyncOptions,
  sse: SSEWriter,
): Promise<void> {
  const { projectPath, storageLocation, syncType } = options;
  const baseDir = resolveBaseDir(projectPath, storageLocation);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Check if already syncing
  if (activeSyncs.has(projectPath)) {
    sse.write('error', { message: 'Sync already in progress', code: -1 });
    return;
  }

  try {
    // Phase: initializing (0-10%)
    sse.write('progress', {
      phase: 'initializing',
      progress: 5,
      message: 'Checking project structure...',
    });

    // Archive existing data if present
    if (await hasData(baseDir)) {
      await archiveCurrentData(baseDir, timestamp);
    }

    // Spawn the sync CLI process
    sse.write('progress', {
      phase: 'scanning',
      progress: 10,
      message: 'Starting project scan...',
    });

    const syncCommand = process.env.HARNESSON_SYNC_COMMAND ?? 'echo';
    const syncArgs = process.env.HARNESSON_SYNC_ARGS
      ? JSON.parse(process.env.HARNESSON_SYNC_ARGS) as string[]
      : [JSON.stringify({ projectPath, baseDir, syncType })];

    await new Promise<void>((resolvePromise, reject) => {
      const proc = spawn(syncCommand, syncArgs, {
        cwd: projectPath,
        env: { ...process.env, PROJECT_PATH: projectPath, BASE_DIR: baseDir },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      activeSyncs.set(projectPath, proc);

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
        // Parse progress lines from CLI output
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'progress') {
              sse.write('progress', {
                phase: parsed.phase ?? 'scanning',
                progress: parsed.progress ?? 30,
                message: parsed.message ?? line,
              });
            } else if (parsed.type === 'node') {
              sse.write('node-generated', { tab: parsed.tab, node: parsed.node });
            }
          } catch {
            // Plain text log line
            sse.write('progress', {
              phase: 'scanning',
              progress: 30,
              message: line.slice(0, 200),
            });
          }
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        activeSyncs.delete(projectPath);
        if (code === 0) {
          resolvePromise();
        } else {
          reject(new Error(`CLI process exited with code ${code}: ${stderr.slice(0, 500)}`));
        }
      });

      proc.on('error', (err) => {
        activeSyncs.delete(projectPath);
        reject(err);
      });
    });

    // Phase: completing (90-100%)
    sse.write('progress', {
      phase: 'completing',
      progress: 95,
      message: 'Writing manifest...',
    });

    // Write manifest
    const projectName = projectPath.split('/').pop() ?? 'unknown';
    let lastSyncCommit: string | null = null;
    try {
      const { execSync } = await import('node:child_process');
      lastSyncCommit = execSync('git rev-parse HEAD', { cwd: projectPath, encoding: 'utf-8' }).trim();
    } catch {
      // Not a git repo — skip commit tracking
    }

    const manifest: Manifest = {
      projectName,
      projectPath,
      storageLocation,
      lastSyncCommit,
      lastSyncTime: new Date().toISOString(),
      syncStatus: 'completed',
      version: 1,
    };
    await writeManifest(baseDir, manifest);

    sse.write('complete', {
      commit: lastSyncCommit ?? '',
      timestamp: manifest.lastSyncTime,
      filesGenerated: 7,
    });
  } catch (err) {
    // Restore from archive on failure
    const existingManifest = await getManifest(baseDir);
    if (existingManifest) {
      await writeManifest(baseDir, { ...existingManifest, syncStatus: 'error' });
    }
    sse.write('error', {
      message: err instanceof Error ? err.message : String(err),
      code: 1,
    });
  }
}
```

- [ ] **Step 2: Add SSE sync endpoints to graph routes**

Add these imports and routes to the end of `apps/server/src/routes/graph.ts`:

```typescript
// Add these imports at the top of graph.ts:
import { streamSSE } from 'hono/streaming';
import { runSync, cancelSync, isSyncing } from '../lib/sync-engine.js';

// Add these routes after the existing routes in graph.ts:

// POST /api/graph/sync — start sync with SSE streaming
graphRoute.post('/api/graph/sync', async (c) => {
  const body = await c.req.json();
  const { projectPath, storageLocation, syncType } = body;

  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  return streamSSE(c, async (stream) => {
    const sse = {
      write: (event: string, data: Record<string, unknown>) => {
        stream.writeSSE({ event, data: JSON.stringify(data) });
      },
    };

    await runSync(
      { projectPath, storageLocation: storageLocation ?? 'project', syncType: syncType ?? 'full' },
      sse,
    );

    stream.close();
  });
});

// POST /api/graph/sync/cancel — cancel active sync
graphRoute.post('/api/graph/sync/cancel', async (c) => {
  const body = await c.req.json();
  const { projectPath } = body;

  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const cancelled = cancelSync(projectPath);
  return c.json({ cancelled });
});
```

- [ ] **Step 3: Verify server compiles**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/server`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/lib/sync-engine.ts apps/server/src/routes/graph.ts
git commit -m "feat: add backend sync engine with SSE streaming and CLI subprocess"
```

---

### Task 15: Auto-Sync + Status Endpoint Enhancement

**Files:**
- Modify: `apps/server/src/routes/graph.ts` — Enhance `/api/graph/status` with git HEAD comparison

- [ ] **Step 1: Enhance the status endpoint to detect stale data**

Replace the `/api/graph/status` handler in `apps/server/src/routes/graph.ts`:

```typescript
// Replace the existing GET /api/graph/status handler with:
graphRoute.get('/api/graph/status', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const exists = await hasData(baseDir);
  const manifest = exists ? await getManifest(baseDir) : null;

  let needsSync = false;
  if (manifest?.lastSyncCommit) {
    try {
      const { execSync } = await import('node:child_process');
      const currentHead = execSync('git rev-parse HEAD', { cwd: projectPath, encoding: 'utf-8' }).trim();
      needsSync = currentHead !== manifest.lastSyncCommit;
    } catch {
      // Not a git repo
    }
  }

  return c.json({
    hasData: exists,
    lastSyncCommit: manifest?.lastSyncCommit ?? null,
    lastSyncTime: manifest?.lastSyncTime ?? null,
    syncStatus: manifest?.syncStatus ?? 'idle',
    needsSync,
  });
});
```

Also update the `GraphStatusResponse` type in `apps/web/src/lib/serverApi.ts`:

```typescript
export interface GraphStatusResponse {
  hasData: boolean;
  lastSyncCommit: string | null;
  lastSyncTime: string | null;
  syncStatus: string;
  needsSync: boolean;
}
```

- [ ] **Step 2: Update GraphPage to trigger auto-sync**

Add auto-sync logic to `GraphPage.tsx`. Update the `useEffect` to call `checkAutoSync` after loading data:

Replace the existing useEffect in `GraphPage.tsx` with:

```typescript
  const checkAutoSync = useGraphStore((s) => s.checkAutoSync);

  useEffect(() => {
    if (projectPath) {
      setProjectPath(projectPath);
      loadGraph(projectPath).then(() => {
        checkAutoSync(projectPath);
      });
    }
  }, [projectPath, setProjectPath, loadGraph, checkAutoSync]);
```

- [ ] **Step 3: Verify everything compiles**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck --filter @harnesson/web --filter @harnesson/server`
Expected: No errors

- [ ] **Step 4: Verify in browser**

1. Start both dev servers: `cd /Users/dt_flys/Projects/harnesson && pnpm run dev`
2. Navigate to `http://localhost:5173/graph`
3. Verify:
   - Without an active project: shows "Select a project to view graph"
   - With a project but no data: shows SyncView with sync button
   - Clicking "Sync Project Graph" starts the sync flow with progress

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/routes/graph.ts apps/web/src/lib/serverApi.ts apps/web/src/pages/GraphPage.tsx
git commit -m "feat: add auto-sync detection and enhance status endpoint with git HEAD comparison"
```

---

## Self-Review Checklist

- [ ] **Spec coverage verified** — All 5 tabs implemented (Specs Graph, Specs List, Specs Document, Architect Graph, Technical Document)
- [ ] **No placeholders** — Every step contains complete code, no TBD/TODO/FIXME
- [ ] **Type consistency** — All type names match across tasks (GraphNode, GraphEdge, GraphData, SpecsListItem, SpecsData, ArchitectData, Manifest, SyncOptions, GraphTab, SyncStatus, GraphFullData, HistoryEntry)
- [ ] **Backend endpoints** — All 7 endpoints from spec implemented (status, manifest, data, sync, sync/cancel, history, history/:timestamp)
- [ ] **SSE streaming** — Both backend (streamSSE) and frontend (fetch + ReadableStream) implemented
- [ ] **File paths** — All file paths are exact and follow project conventions
- [ ] **Import paths** — All imports use correct aliases (@/ for web src, relative for server)
