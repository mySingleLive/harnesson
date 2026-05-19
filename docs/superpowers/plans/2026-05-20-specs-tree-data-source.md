# Specs Tree Data Source Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace specs-graph/list/document data source with `.harnesson/specs/nodes/` tree via new API endpoint and updated frontend components (status + summary node cards).

**Architecture:** New `GET /api/specs/tree` endpoint reads `project.json` + recursively loads `nodes/{id}/node.json`, returning root + flat node map. Frontend `graphStore` gains parallel `specsTree`/`specsNodeMap` data path. Specs tab components consume new types; architect tabs untouched.

**Tech Stack:** Hono (server), Zustand (store), @xyflow/react (graph), React 18, vitest

---

### Task 1: Replace shared types package

**Files:**
- Modify: `packages/shared/src/types/spec-node.ts`
- Check: `packages/shared/src/index.ts` (already re-exports, no change needed)

- [ ] **Step 1: Replace the type file**

Replace the entire contents of `packages/shared/src/types/spec-node.ts`:

```typescript
export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

export interface SpecTreeNode {
  id: string;
  name: string;
  level: number;
  parent: string | null;
  children: string[];
  isLeaf: boolean;
  summary: string;
  goals: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  status: string;
  design: unknown;
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd packages/shared && npx tsc --noEmit 2>&1`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/spec-node.ts
git commit -m "feat(shared): replace SpecNode with SpecTreeNode type for specs tree data"
```

---

### Task 2: Server — specs tree storage reader

**Files:**
- Create: `apps/server/src/lib/specs-tree.ts`

- [ ] **Step 1: Create specs-tree.ts with readSpecsTree function**

Create `apps/server/src/lib/specs-tree.ts`:

```typescript
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { SpecTreeNode } from '@harnesson/shared';

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function readNode(specsDir: string, nodeId: string): Promise<SpecTreeNode | null> {
  const nodePath = join(specsDir, 'nodes', nodeId, 'node.json');
  if (!(await fileExists(nodePath))) return null;
  const raw = await readFile(nodePath, 'utf-8');
  return JSON.parse(raw) as SpecTreeNode;
}

export interface SpecsTreeData {
  root: SpecTreeNode;
  nodes: Record<string, SpecTreeNode>;
}

export async function readSpecsTree(projectPath: string): Promise<SpecsTreeData | null> {
  const specsDir = join(projectPath, '.harnesson', 'specs');
  const projectJsonPath = join(specsDir, 'project.json');

  if (!(await fileExists(projectJsonPath))) return null;

  const raw = await readFile(projectJsonPath, 'utf-8');
  const root = JSON.parse(raw) as SpecTreeNode;
  const nodes: Record<string, SpecTreeNode> = { [root.id]: root };

  // Recursive BFS to load all children
  const queue = [...root.children];
  while (queue.length > 0) {
    const childId = queue.shift()!;
    if (nodes[childId]) continue;
    const childNode = await readNode(specsDir, childId);
    if (childNode) {
      nodes[childId] = childNode;
      queue.push(...childNode.children);
    } else {
      console.warn(`[specs-tree] missing node: ${childId}`);
    }
  }

  return { root, nodes };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/server && npx tsc --noEmit 2>&1`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/specs-tree.ts
git commit -m "feat(server): add readSpecsTree to load specs node tree from disk"
```

---

### Task 3: Server — GET /api/specs/tree route

**Files:**
- Create: `apps/server/src/routes/specs.ts`
- Modify: `apps/server/src/index.ts` (register route)

- [ ] **Step 1: Write the route with failing test**

Create `apps/server/src/routes/__tests__/specs.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import * as specsTreeModule from '../../lib/specs-tree.js';
import type { SpecTreeNode } from '@harnesson/shared';

const mockRoot: SpecTreeNode = {
  id: 'project', name: 'Test', level: 1, parent: null,
  children: ['child1'], isLeaf: false, summary: 'root summary',
  goals: [], acceptanceCriteria: [], status: 'draft', design: null,
};

const mockChild: SpecTreeNode = {
  id: 'child1', name: 'Child', level: 2, parent: 'project',
  children: [], isLeaf: true, summary: 'child summary',
  goals: ['goal 1'], acceptanceCriteria: [
    { given: 'x', when: 'y', then: 'z' },
  ], status: 'review', design: null,
};

// The route file imports readSpecsTree — we need to mock the module
vi.mock('../../lib/specs-tree.js', () => ({
  readSpecsTree: vi.fn(),
}));

// We must import the route after mocking the dependency
const { specsRoute } = await import('../../routes/specs.js');

function makeApp() {
  const app = new Hono();
  app.route('/', specsRoute);
  return app;
}

function createReq(path: string) {
  return new Request(`http://localhost${path}`);
}

describe('specs/tree API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when projectPath is missing', async () => {
    const app = makeApp();
    const res = await app.fetch(createReq('/api/specs/tree'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when project.json does not exist', async () => {
    vi.mocked(specsTreeModule.readSpecsTree).mockResolvedValue(null);
    const app = makeApp();
    const res = await app.fetch(createReq('/api/specs/tree?projectPath=/abs/path'));
    expect(res.status).toBe(404);
  });

  it('returns tree data when project.json exists', async () => {
    vi.mocked(specsTreeModule.readSpecsTree).mockResolvedValue({
      root: mockRoot,
      nodes: { project: mockRoot, child1: mockChild },
    });
    const app = makeApp();
    const res = await app.fetch(createReq('/api/specs/tree?projectPath=/abs/path'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.root.id).toBe('project');
    expect(Object.keys(body.nodes)).toHaveLength(2);
  });

  it('returns 400 for relative projectPath', async () => {
    const app = makeApp();
    const res = await app.fetch(createReq('/api/specs/tree?projectPath=relative/path'));
    expect(res.status).toBe(400);
  });
});
```

Wait — there's a subtlety with route tests and ESM mocking. In vitest, `vi.mock` with dynamic `await import` inside `describe` can be tricky. The cleaner approach for Hono route testing is to pass the dependency rather than mock at module level. Let me adjust the route design.

Actually, let me structure the test differently. The Hono route constructor gets the handler as a closure, so we can inject the dependency:

```typescript
// apps/server/src/routes/specs.ts

import { Hono } from 'hono';
import { isAbsolute } from 'node:path';
import { readSpecsTree } from '../lib/specs-tree.js';

export function createSpecsRoute(readFn = readSpecsTree): Hono {
  const route = new Hono();

  route.get('/api/specs/tree', async (c) => {
    const projectPath = c.req.query('projectPath');
    if (!projectPath || !isAbsolute(projectPath)) {
      return c.json({ error: 'projectPath must be an absolute path' }, 400);
    }

    const data = await readFn(projectPath);
    if (!data) {
      return c.json({ error: 'No specs tree found. Run sync-specs first.' }, 404);
    }

    return c.json(data);
  });

  return route;
}

export const specsRoute = createSpecsRoute();
```

Then the test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { createSpecsRoute } from '../../routes/specs.js';
import type { SpecTreeNode } from '@harnesson/shared';

const mockRoot: SpecTreeNode = {
  id: 'project', name: 'Test', level: 1, parent: null,
  children: ['child1'], isLeaf: false, summary: 'root',
  goals: [], acceptanceCriteria: [], status: 'draft', design: null,
};

const mockChild: SpecTreeNode = {
  id: 'child1', name: 'Child', level: 2, parent: 'project',
  children: [], isLeaf: true, summary: 'child',
  goals: [], acceptanceCriteria: [], status: 'review', design: null,
};

describe('specs/tree API', () => {
  it('returns 400 when projectPath is missing', async () => {
    const app = new Hono();
    app.route('/', createSpecsRoute(vi.fn()));
    const req = new Request('http://localhost/api/specs/tree');
    const res = await app.fetch(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for relative projectPath', async () => {
    const app = new Hono();
    app.route('/', createSpecsRoute(vi.fn()));
    const req = new Request('http://localhost/api/specs/tree?projectPath=relative/path');
    const res = await app.fetch(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when readSpecsTree returns null', async () => {
    const app = new Hono();
    app.route('/', createSpecsRoute(vi.fn().mockResolvedValue(null)));
    const req = new Request('http://localhost/api/specs/tree?projectPath=/abs/path');
    const res = await app.fetch(req);
    expect(res.status).toBe(404);
  });

  it('returns tree data on success', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      root: mockRoot,
      nodes: { project: mockRoot, child1: mockChild },
    });
    const app = new Hono();
    app.route('/', createSpecsRoute(mockFn));
    const req = new Request('http://localhost/api/specs/tree?projectPath=/abs/path');
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.root.id).toBe('project');
    expect(Object.keys(body.nodes)).toHaveLength(2);
  });
});
```

This is cleaner with dependency injection. Let me rewrite the plan task with this approach.

- [ ] **Step 1: Write the failing test**

Create `apps/server/src/routes/__tests__/specs.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { createSpecsRoute } from '../../routes/specs.js';
import type { SpecTreeNode } from '@harnesson/shared';

const mockRoot: SpecTreeNode = {
  id: 'project', name: 'Test', level: 1, parent: null,
  children: ['child1'], isLeaf: false, summary: 'root',
  goals: [], acceptanceCriteria: [], status: 'draft', design: null,
};

const mockChild: SpecTreeNode = {
  id: 'child1', name: 'Child', level: 2, parent: 'project',
  children: [], isLeaf: true, summary: 'child',
  goals: [], acceptanceCriteria: [], status: 'review', design: null,
};

function buildApp(readFn: ReturnType<typeof vi.fn>) {
  const app = new Hono();
  app.route('/', createSpecsRoute(readFn));
  return app;
}

describe('specs/tree API', () => {
  it('returns 400 when projectPath is missing', async () => {
    const res = await buildApp(vi.fn()).fetch(new Request('http://localhost/api/specs/tree'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for relative projectPath', async () => {
    const res = await buildApp(vi.fn()).fetch(new Request('http://localhost/api/specs/tree?projectPath=relative/path'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when readSpecsTree returns null', async () => {
    const res = await buildApp(vi.fn().mockResolvedValue(null)).fetch(new Request('http://localhost/api/specs/tree?projectPath=/abs/path'));
    expect(res.status).toBe(404);
  });

  it('returns tree data on success', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      root: mockRoot,
      nodes: { project: mockRoot, child1: mockChild },
    });
    const res = await buildApp(mockFn).fetch(new Request('http://localhost/api/specs/tree?projectPath=/abs/path'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.root.id).toBe('project');
    expect(Object.keys(body.nodes)).toHaveLength(2);
  });
});
```

Run: `cd apps/server && npx vitest run src/routes/__tests__/specs.test.ts 2>&1`
Expected: FAIL — module `../../routes/specs.js` not found.

- [ ] **Step 2: Write the route implementation**

Create `apps/server/src/routes/specs.ts`:

```typescript
import { Hono } from 'hono';
import { isAbsolute } from 'node:path';
import type { SpecTreeNode } from '@harnesson/shared';
import type { SpecsTreeData } from '../lib/specs-tree.js';
import { readSpecsTree } from '../lib/specs-tree.js';

export function createSpecsRoute(
  readFn: (projectPath: string) => Promise<SpecsTreeData | null> = readSpecsTree,
): Hono {
  const route = new Hono();

  route.get('/api/specs/tree', async (c) => {
    const projectPath = c.req.query('projectPath');
    if (!projectPath || !isAbsolute(projectPath)) {
      return c.json({ error: 'projectPath must be an absolute path' }, 400);
    }

    const data = await readFn(projectPath);
    if (!data) {
      return c.json({ error: 'No specs tree found. Run sync-specs first.' }, 404);
    }

    return c.json(data);
  });

  return route;
}

export const specsRoute = createSpecsRoute();
```

- [ ] **Step 3: Register route in server/index.ts**

Edit `apps/server/src/index.ts`:

Add import after existing route imports:
```
import { specsRoute } from './routes/specs.js';
```

Add after `app.route('/', graphRoute);`:
```
app.route('/', specsRoute);
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd apps/server && npx vitest run src/routes/__tests__/specs.test.ts 2>&1`
Expected: 4 tests PASS

- [ ] **Step 5: Verify server compiles**

Run: `cd apps/server && npx tsc --noEmit 2>&1`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/routes/specs.ts apps/server/src/routes/__tests__/specs.test.ts apps/server/src/index.ts
git commit -m "feat(server): add GET /api/specs/tree endpoint for specs tree data"
```

---

### Task 4: Frontend — add getSpecsTree to serverApi

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`

- [ ] **Step 1: Add getSpecsTree function**

Edit `apps/web/src/lib/serverApi.ts`. Add after the graph API section (after `getGraphHistory`):

```typescript
// --- Specs Tree API ---

export interface SpecsTreeResponse {
  root: import('@harnesson/shared').SpecTreeNode;
  nodes: Record<string, import('@harnesson/shared').SpecTreeNode>;
}

export async function getSpecsTree(projectPath: string): Promise<SpecsTreeResponse> {
  const res = await fetch(`/api/specs/tree?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get specs tree: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/serverApi.ts
git commit -m "feat(web): add getSpecsTree API client function"
```

---

### Task 5: Frontend — add specs tree state to graphStore

**Files:**
- Modify: `apps/web/src/stores/graphStore.ts`
- Create: `apps/web/src/stores/__tests__/graphStore.specsTree.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/src/stores/__tests__/graphStore.specsTree.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGraphStore } from '../graphStore';
import * as serverApi from '@/lib/serverApi';
import type { SpecTreeNode } from '@harnesson/shared';

vi.mock('@/lib/serverApi', () => ({
  getSpecsTree: vi.fn(),
  getGraphData: vi.fn(),
  getGraphStatus: vi.fn(),
  getGraphManifest: vi.fn(),
  getGraphHistory: vi.fn(),
  isServerRunning: vi.fn(),
  getProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  removeProject: vi.fn(),
  openFolderDialog: vi.fn(),
  getProjectBranches: vi.fn(),
  checkoutBranch: vi.fn(),
  getSupportedModels: vi.fn(),
  createAgent: vi.fn(),
  listAgents: vi.fn(),
  sendAgentMessage: vi.fn(),
  abortAgent: vi.fn(),
  destroyAgent: vi.fn(),
  getAgentMessages: vi.fn(),
  getAgentTodos: vi.fn(),
  getSlashCommands: vi.fn(),
  executeCommand: vi.fn(),
}));

const mockRoot: SpecTreeNode = {
  id: 'project', name: 'Root', level: 1, parent: null,
  children: ['child1'], isLeaf: false, summary: 'root summary',
  goals: [], acceptanceCriteria: [], status: 'draft', design: null,
};

const mockChild: SpecTreeNode = {
  id: 'child1', name: 'Child 1', level: 2, parent: 'project',
  children: [], isLeaf: true, summary: 'child summary',
  goals: ['goal'], acceptanceCriteria: [{ given: 'x', when: 'y', then: 'z' }],
  status: 'review', design: null,
};

describe('graphStore - specsTree', () => {
  beforeEach(() => {
    useGraphStore.setState({
      specsTree: null,
      specsNodeMap: null,
      projectPath: null,
    });
    vi.clearAllMocks();
  });

  it('loadSpecsTree sets specsTree and specsNodeMap on success', async () => {
    vi.mocked(serverApi.getSpecsTree).mockResolvedValue({
      root: mockRoot,
      nodes: { project: mockRoot, child1: mockChild },
    });

    await useGraphStore.getState().loadSpecsTree('/abs/path');

    const state = useGraphStore.getState();
    expect(state.specsTree).toEqual(mockRoot);
    expect(state.specsNodeMap).toEqual({ project: mockRoot, child1: mockChild });
    expect(state.projectPath).toBe('/abs/path');
  });

  it('loadSpecsTree sets null on failure', async () => {
    vi.mocked(serverApi.getSpecsTree).mockRejectedValue(new Error('fail'));

    await useGraphStore.getState().loadSpecsTree('/bad/path');

    const state = useGraphStore.getState();
    expect(state.specsTree).toBeNull();
    expect(state.specsNodeMap).toBeNull();
  });
});
```

Run: `cd apps/web && npx vitest run src/stores/__tests__/graphStore.specsTree.test.ts 2>&1`
Expected: FAIL — property `loadSpecsTree` is not a function.

- [ ] **Step 2: Add specsTree state and loadSpecsTree to graphStore**

Edit `apps/web/src/stores/graphStore.ts`:

Add import at top (after existing `@harnesson/shared` import):
```typescript
import type { SpecTreeNode } from '@harnesson/shared';
```

Add to `GraphState` interface (after `specsData` line):
```typescript
  specsTree: SpecTreeNode | null;
  specsNodeMap: Record<string, SpecTreeNode> | null;
```

Add to actions interface (after `loadGraph` line):
```typescript
  loadSpecsTree: (projectPath: string) => Promise<void>;
```

Add to the store's initial state (after `specsData: null,`):
```typescript
  specsTree: null,
  specsNodeMap: null,
```

Add to the `create<GraphState>` object (after the `loadGraph` implementation):
```typescript
  loadSpecsTree: async (projectPath: string) => {
    try {
      const data = await serverApi.getSpecsTree(projectPath);
      set({
        projectPath,
        specsTree: data.root,
        specsNodeMap: data.nodes,
      });
    } catch {
      set({ projectPath, specsTree: null, specsNodeMap: null });
    }
  },
```

- [ ] **Step 3: Run tests to verify pass**

Run: `cd apps/web && npx vitest run src/stores/__tests__/graphStore.specsTree.test.ts 2>&1`
Expected: 2 tests PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/graphStore.ts apps/web/src/stores/__tests__/graphStore.specsTree.test.ts
git commit -m "feat(web): add specsTree/specsNodeMap state and loadSpecsTree to graphStore"
```

---

### Task 6: Frontend — buildGraphFromTree utility

**Files:**
- Create: `apps/web/src/components/graph/buildGraphFromTree.ts`
- Create: `apps/web/src/components/graph/__tests__/buildGraphFromTree.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/src/components/graph/__tests__/buildGraphFromTree.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildGraphFromTree } from '../buildGraphFromTree';
import type { SpecTreeNode } from '@harnesson/shared';
import type { GraphData } from '@harnesson/shared';

const root: SpecTreeNode = {
  id: 'root', name: 'Root', level: 1, parent: null,
  children: ['a', 'b'], isLeaf: false, summary: 'root node',
  goals: [], acceptanceCriteria: [], status: 'draft', design: null,
};

const childA: SpecTreeNode = {
  id: 'a', name: 'Child A', level: 2, parent: 'root',
  children: ['leaf'], isLeaf: false, summary: 'a node',
  goals: [], acceptanceCriteria: [], status: 'review', design: null,
};

const leaf: SpecTreeNode = {
  id: 'leaf', name: 'Leaf', level: 3, parent: 'a',
  children: [], isLeaf: true, summary: 'leaf node',
  goals: [], acceptanceCriteria: [], status: 'done', design: null,
};

const childB: SpecTreeNode = {
  id: 'b', name: 'Child B', level: 2, parent: 'root',
  children: [], isLeaf: true, summary: 'b node',
  goals: [], acceptanceCriteria: [], status: 'draft', design: null,
};

const nodeMap = { root, a: childA, leaf, b: childB };

describe('buildGraphFromTree', () => {
  it('converts tree to graph with correct node count', () => {
    const result = buildGraphFromTree(root, nodeMap);
    expect(result.nodes).toHaveLength(4);
  });

  it('maps type from level: 1 → project, 2-3 → domain, 4+ → feature', () => {
    const result = buildGraphFromTree(root, nodeMap);
    const types = result.nodes.map(n => n.type);
    expect(types).toEqual(['project', 'domain', 'domain', 'feature']);
  });

  it('maps name → title and summary → content', () => {
    const result = buildGraphFromTree(root, nodeMap);
    const rootNode = result.nodes.find(n => n.id === 'root')!;
    expect(rootNode.title).toBe('Root');
    expect(rootNode.content).toBe('root node');
    expect(rootNode.status).toBe('draft');
  });

  it('generates edges from parent→child relationships', () => {
    const result = buildGraphFromTree(root, nodeMap);
    const edgeIds = result.edges.map(e => `${e.source}→${e.target}`).sort();
    expect(edgeIds).toEqual(['a→leaf', 'root→a', 'root→b']);
  });

  it('handles leaf node with no children', () => {
    const singleRoot: SpecTreeNode = {
      ...root, children: [], isLeaf: true,
    };
    const result = buildGraphFromTree(singleRoot, { root: singleRoot });
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
  });

  it('skips missing child references gracefully', () => {
    const brokenRoot: SpecTreeNode = {
      ...root, children: ['root', 'ghost'],
    };
    const result = buildGraphFromTree(brokenRoot, { root: brokenRoot });
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);
  });

  it('preserves status field', () => {
    const result = buildGraphFromTree(root, nodeMap);
    expect(result.nodes.find(n => n.id === 'leaf')!.status).toBe('done');
    expect(result.nodes.find(n => n.id === 'a')!.status).toBe('review');
  });
});
```

Run: `cd apps/web && npx vitest run src/components/graph/__tests__/buildGraphFromTree.test.ts 2>&1`
Expected: FAIL — module not found.

- [ ] **Step 2: Write the utility**

Create `apps/web/src/components/graph/buildGraphFromTree.ts`:

```typescript
import type { SpecTreeNode, GraphData, GraphNode } from '@harnesson/shared';

function mapType(level: number): 'project' | 'domain' | 'feature' {
  if (level === 1) return 'project';
  if (level <= 3) return 'domain';
  return 'feature';
}

export function buildGraphFromTree(
  root: SpecTreeNode,
  nodeMap: Record<string, SpecTreeNode>,
): GraphData {
  const visited = new Set<string>();
  const nodes: GraphNode[] = [];
  const edges: { source: string; target: string }[] = [];

  function walk(node: SpecTreeNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    nodes.push({
      id: node.id,
      type: mapType(node.level),
      level: node.level,
      title: node.name,
      content: node.summary,
      children: node.children,
      status: node.status,
    });

    for (const childId of node.children) {
      const child = nodeMap[childId];
      if (child) {
        edges.push({ source: node.id, target: childId });
        walk(child);
      }
    }
  }

  walk(root);
  return { nodes, edges };
}
```

- [ ] **Step 3: Run tests to verify pass**

Run: `cd apps/web && npx vitest run src/components/graph/__tests__/buildGraphFromTree.test.ts 2>&1`
Expected: 6 tests PASS

- [ ] **Step 4: Update GraphNode type to include optional status field**

Edit `packages/shared/src/types/graph.ts`, in the `GraphNode` interface add after `children?: string[];`:
```typescript
  status?: string;
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/graph/buildGraphFromTree.ts apps/web/src/components/graph/__tests__/buildGraphFromTree.test.ts packages/shared/src/types/graph.ts
git commit -m "feat(web): add buildGraphFromTree utility to convert spec tree to graph data"
```

---

### Task 7: Frontend — update GraphNodes with status + summary

**Files:**
- Modify: `apps/web/src/components/graph/GraphNodes.tsx`
- Modify: `apps/web/src/components/graph/FlowGraph.tsx`

- [ ] **Step 1: Update GraphNodeData interface and node components**

Edit `apps/web/src/components/graph/GraphNodes.tsx`.

Replace the entire file:

```typescript
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface GraphNodeData {
  label: string;
  content?: string;
  level: number;
  status?: string;
  [key: string]: unknown;
}

const statusColors: Record<string, { dot: string; text: string }> = {
  draft: { dot: '#f9e2af', text: '#f9e2af' },
  review: { dot: '#89b4fa', text: '#89b4fa' },
  done: { dot: '#a6e3a1', text: '#a6e3a1' },
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status];
  if (!color) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: color.dot }} />
      <span style={{ fontSize: 10, color: color.text, fontWeight: 600 }}>{status}</span>
    </div>
  );
}

function SummaryLine({ content, maxLen = 50 }: { content?: string; maxLen?: number }) {
  if (!content) return null;
  const truncated = content.length > maxLen ? content.slice(0, maxLen) + '…' : content;
  return (
    <div style={{ fontSize: 10, color: '#6c7086', lineHeight: 1.3, marginTop: 2 }}>
      {truncated}
    </div>
  );
}

export function ProjectNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border-2 border-harness-accent bg-harness-accent/20 px-5 py-3 shadow-lg transition-shadow hover:shadow-harness-accent/20" style={{ minWidth: 180 }}>
      <Handle type="target" position={Position.Top} className="!bg-harness-accent" />
      {d.status && <StatusBadge status={d.status} />}
      <div className="text-[13px] font-semibold text-harness-accent" style={{ marginTop: d.status ? 4 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={60} />
      <Handle type="source" position={Position.Bottom} className="!bg-harness-accent" />
    </div>
  );
}

export function DomainNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border border-blue-500/60 bg-blue-500/10 px-4 py-2 shadow-md transition-shadow hover:shadow-blue-500/20" style={{ minWidth: 160 }}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      {d.status && <StatusBadge status={d.status} />}
      <div className="text-[12px] font-medium text-blue-400" style={{ marginTop: d.status ? 3 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={45} />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
}

export function FeatureNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-1.5 shadow-sm transition-shadow hover:shadow-green-500/20" style={{ minWidth: 140 }}>
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
      {d.status && <StatusBadge status={d.status} />}
      <div className="text-[11px] text-green-400" style={{ marginTop: d.status ? 2 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={40} />
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

- [ ] **Step 2: Update FlowGraph to pass status in node data**

Edit `apps/web/src/components/graph/FlowGraph.tsx`. In the `getLayoutedElements` function, update the nodes map to include status:

Replace the `nodes: Node[]` mapping block:
```typescript
  const nodes: Node[] = graphData.nodes.map((node) => {
    const pos = g.node(node.id);
    const height = NODE_HEIGHT_MAP[node.type] ?? 40;
    return {
      id: node.id,
      type: node.type,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - height / 2 },
      data: { label: node.title, content: node.content, level: node.level, status: node.status },
    };
  });
```

The `status: node.status` is the only addition to the data object.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/graph/GraphNodes.tsx apps/web/src/components/graph/FlowGraph.tsx
git commit -m "feat(web): update graph node cards with status badge and summary line"
```

---

### Task 8: Frontend — update SpecsGraph to use new data

**Files:**
- Modify: `apps/web/src/components/graph/SpecsGraph.tsx`

- [ ] **Step 1: Rewrite SpecsGraph to use specsTree**

Edit `apps/web/src/components/graph/SpecsGraph.tsx`. Replace content:

```typescript
import { useCallback, useMemo } from 'react';
import type { NodeMouseHandler } from '@xyflow/react';
import { FlowGraph } from './FlowGraph';
import { buildGraphFromTree } from './buildGraphFromTree';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphData } from '@harnesson/shared';

export function SpecsGraph() {
  const specsTree = useGraphStore((s) => s.specsTree);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);
  const selectNode = useGraphStore((s) => s.selectNode);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const graphData: GraphData | null = useMemo(() => {
    if (!specsTree || !specsNodeMap) return null;
    return buildGraphFromTree(specsTree, specsNodeMap);
  }, [specsTree, specsNodeMap]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs tree data available. Run sync-specs to generate.</p>
      </div>
    );
  }

  return <FlowGraph graphData={graphData} onNodeClick={handleNodeClick} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/graph/SpecsGraph.tsx
git commit -m "feat(web): switch SpecsGraph to use specsTree data source"
```

---

### Task 9: Frontend — update SpecsList to use new data

**Files:**
- Modify: `apps/web/src/components/graph/SpecsList.tsx`

- [ ] **Step 1: Rewrite SpecsList to use specsNodeMap**

Edit `apps/web/src/components/graph/SpecsList.tsx`. Replace content:

```typescript
import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraphStore } from '@/stores/graphStore';
import type { SpecTreeNode } from '@harnesson/shared';

const statusColors: Record<string, string> = {
  draft: 'text-yellow-400',
  review: 'text-blue-400',
  done: 'text-green-400',
};

function StatusDot({ status }: { status?: string }) {
  if (!status) return null;
  const color = statusColors[status] ?? 'text-gray-500';
  return (
    <span className={cn('flex items-center gap-1 text-[10px] font-medium', color)}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function TreeNodeRow({
  node,
  depth,
  onSelect,
}: {
  node: SpecTreeNode;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node.id);
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/[0.03]"
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
        <span className="text-[12px] font-medium text-gray-300">{node.name}</span>
        <StatusDot status={node.status} />
        <span className="ml-auto truncate text-[11px] text-gray-600 max-w-[200px]">
          {node.summary?.slice(0, 80)}{(node.summary?.length ?? 0) > 80 ? '…' : ''}
        </span>
      </button>
      {expanded &&
        node.children.map((childId) => {
          const { specsNodeMap } = useGraphStore.getState();
          const child = specsNodeMap?.[childId];
          if (!child) return null;
          return (
            <TreeNodeRow key={childId} node={child} depth={depth + 1} onSelect={onSelect} />
          );
        })}
    </div>
  );
}

export function SpecsList() {
  const specsTree = useGraphStore((s) => s.specsTree);
  const selectNode = useGraphStore((s) => s.selectNode);

  if (!specsTree) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs tree data available</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <TreeNodeRow node={specsTree} depth={0} onSelect={selectNode} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/graph/SpecsList.tsx
git commit -m "feat(web): switch SpecsList to use specsNodeMap data source with status column"
```

---

### Task 10: Frontend — update SpecsDocument to assemble markdown from nodes

**Files:**
- Modify: `apps/web/src/components/graph/SpecsDocument.tsx`

- [ ] **Step 1: Rewrite SpecsDocument to generate markdown from nodes**

Edit `apps/web/src/components/graph/SpecsDocument.tsx`. Replace content:

```typescript
import { useMemo } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { MarkdownViewer } from './MarkdownViewer';

function buildDocument(
  nodeId: string,
  nodeMap: Record<string, import('@harnesson/shared').SpecTreeNode>,
  depth: number,
): string {
  const node = nodeMap[nodeId];
  if (!node) return '';

  const prefix = '#'.repeat(Math.min(depth + 1, 6));
  let md = `${prefix} ${node.name}\n\n`;

  if (node.summary) {
    md += `> ${node.summary}\n\n`;
  }

  if (node.goals.length > 0) {
    md += `**Goals:**\n`;
    for (const goal of node.goals) {
      md += `- ${goal}\n`;
    }
    md += '\n';
  }

  if (node.acceptanceCriteria.length > 0) {
    md += `**Acceptance Criteria:**\n`;
    for (const ac of node.acceptanceCriteria) {
      md += `- Given ${ac.given}, when ${ac.when}, then ${ac.then}\n`;
    }
    md += '\n';
  }

  for (const childId of node.children) {
    md += buildDocument(childId, nodeMap, depth + 1);
  }

  return md;
}

export function SpecsDocument() {
  const specsTree = useGraphStore((s) => s.specsTree);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);

  const document = useMemo(() => {
    if (!specsTree || !specsNodeMap) return null;
    return buildDocument(specsTree.id, specsNodeMap, 0);
  }, [specsTree, specsNodeMap]);

  return <MarkdownViewer content={document} emptyMessage="No specs tree data available" />;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/graph/SpecsDocument.tsx
git commit -m "feat(web): switch SpecsDocument to assemble markdown from specs tree nodes"
```

---

### Task 11: Frontend — update DetailPanel with new fields

**Files:**
- Modify: `apps/web/src/components/graph/DetailPanel.tsx`

- [ ] **Step 1: Rewrite DetailPanel to look up from specsNodeMap and show new fields**

Edit `apps/web/src/components/graph/DetailPanel.tsx`. Replace content:

```typescript
import { X } from 'lucide-react';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphNode, SpecTreeNode } from '@harnesson/shared';

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

const statusColorMap: Record<string, string> = {
  draft: 'text-yellow-400',
  review: 'text-blue-400',
  done: 'text-green-400',
};

function findGraphNode(nodes: GraphNode[], id: string): GraphNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function DetailPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);
  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const specsTree = useGraphStore((s) => s.specsTree);
  const closeDetailPanel = useGraphStore((s) => s.closeDetailPanel);
  const selectNode = useGraphStore((s) => s.selectNode);

  if (!selectedNodeId) return null;

  // Priority: specsNodeMap → old specs graph nodes → architect graph nodes
  const specNode: SpecTreeNode | undefined = specsNodeMap?.[selectedNodeId];
  const graphNode: GraphNode | undefined =
    findGraphNode(specsData?.graph?.nodes ?? [], selectedNodeId) ??
    findGraphNode(architectData?.graph?.nodes ?? [], selectedNodeId);

  if (!specNode && !graphNode) return null;

  // Determine type from level
  const inferredType =
    specNode
      ? specNode.level === 1 ? 'project' : specNode.level <= 3 ? 'domain' : 'feature'
      : graphNode?.type ?? 'feature';

  const nodeTitle = specNode?.name ?? graphNode?.title ?? selectedNodeId;

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-harness-border bg-harness-sidebar overflow-y-auto">
      <div className="flex items-center justify-between border-b border-harness-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-[1px] text-[10px] font-semibold ${typeColorMap[inferredType] ?? 'bg-gray-500/15 text-gray-400'}`}>
            {typeLabelMap[inferredType] ?? inferredType}
          </span>
          <span className="text-[13px] font-medium text-gray-200">{nodeTitle}</span>
        </div>
        <button
          onClick={closeDetailPanel}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Status */}
        {specNode?.status && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Status</span>
            <p className={`mt-0.5 text-[12px] font-medium ${statusColorMap[specNode.status] ?? 'text-gray-400'}`}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
              {specNode.status}
            </p>
          </div>
        )}

        {/* Level */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Level</span>
          <p className="mt-0.5 text-[12px] text-gray-400">{specNode?.level ?? graphNode?.level}</p>
        </div>

        {/* ID */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">ID</span>
          <p className="mt-0.5 font-mono text-[11px] text-gray-400">{selectedNodeId}</p>
        </div>

        {/* Summary */}
        {specNode?.summary && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Summary</span>
            <div className="mt-1 rounded-md border border-harness-border bg-harness-bg p-3">
              <p className="text-[12px] leading-relaxed text-gray-300">{specNode.summary}</p>
            </div>
          </div>
        )}

        {/* Goals */}
        {specNode?.goals && specNode.goals.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Goals</span>
            <ul className="mt-1 space-y-1">
              {specNode.goals.map((goal, i) => (
                <li key={i} className="text-[12px] text-gray-400 pl-3 border-l-2 border-harness-border">
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Acceptance Criteria */}
        {specNode?.acceptanceCriteria && specNode.acceptanceCriteria.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Acceptance Criteria</span>
            <div className="mt-1 space-y-2">
              {specNode.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="rounded-md border border-harness-border bg-harness-bg p-2 text-[11px] text-gray-400">
                  <div><span className="text-gray-500">Given</span> {ac.given}</div>
                  <div><span className="text-gray-500">When</span> {ac.when}</div>
                  <div><span className="text-gray-500">Then</span> {ac.then}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Children */}
        {specNode?.children && specNode.children.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Children</span>
            <div className="mt-1 space-y-1">
              {specNode.children.map((childId) => {
                const child = specsNodeMap?.[childId];
                return (
                  <button
                    key={childId}
                    onClick={() => selectNode(childId)}
                    className="block w-full text-left text-[12px] text-harness-accent hover:text-harness-accent/80 truncate"
                  >
                    {child ? child.name : childId}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fallback: old-style content */}
        {!specNode && graphNode?.content && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Content</span>
            <div className="mt-1 rounded-md border border-harness-border bg-harness-bg p-3">
              <p className="text-[12px] leading-relaxed text-gray-300 whitespace-pre-wrap">{graphNode.content}</p>
            </div>
          </div>
        )}

        {/* Fallback: old-style children */}
        {!specNode && graphNode?.children && graphNode.children.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Children</span>
            <p className="mt-0.5 text-[12px] text-gray-400">{graphNode.children.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/graph/DetailPanel.tsx
git commit -m "feat(web): update DetailPanel with specs tree fields (goals, AC, status, children nav)"
```

---

### Task 12: Frontend — update GraphPage to load both data sources

**Files:**
- Modify: `apps/web/src/pages/GraphPage.tsx`

- [ ] **Step 1: Add loadSpecsTree call parallel to loadGraph**

Edit `apps/web/src/pages/GraphPage.tsx`. In the `useEffect`, change the load call:

The existing block:
```typescript
  useEffect(() => {
    if (projectPath) {
      setProjectPath(projectPath);
      loadGraph(projectPath).then(() => {
        checkAutoSync(projectPath);
      });
    }
  }, [projectPath, setProjectPath, loadGraph, checkAutoSync]);
```

Replace with:
```typescript
  useEffect(() => {
    if (projectPath) {
      setProjectPath(projectPath);
      Promise.all([
        loadGraph(projectPath),
        loadSpecsTree(projectPath),
      ]).then(() => {
        checkAutoSync(projectPath);
      });
    }
  }, [projectPath, setProjectPath, loadGraph, loadSpecsTree, checkAutoSync]);
```

Add `loadSpecsTree` to the destructured store selectors (after `loadGraph`):
```typescript
  const loadSpecsTree = useGraphStore((s) => s.loadSpecsTree);
```

- [ ] **Step 2: Update empty state check to consider specsTree**

The current `hasData` check:
```typescript
  const hasData = !!(specsData || architectData);
```

Replace with:
```typescript
  const hasData = !!(specsData || architectData || specsTree);
```

This way the SyncView is only shown when ALL data sources are empty.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/GraphPage.tsx
git commit -m "feat(web): load specs tree in parallel with graph data on GraphPage"
```

---

### Task 13: End-to-end verification

**Files:** None (verification only)

- [ ] **Step 1: Type-check the entire project**

```bash
cd packages/shared && npx tsc --noEmit 2>&1
cd apps/server && npx tsc --noEmit 2>&1
cd apps/web && npx tsc --noEmit 2>&1
```
Expected: All three packages compile without errors.

- [ ] **Step 2: Run all server tests**

```bash
cd apps/server && npx vitest run 2>&1
```
Expected: All tests pass (including new specs.test.ts).

- [ ] **Step 3: Run all web tests**

```bash
cd apps/web && npx vitest run 2>&1
```
Expected: All tests pass (including new graphStore.specsTree.test.ts and buildGraphFromTree.test.ts).

- [ ] **Step 4: Verify git status is clean**

```bash
git status
```
Expected: No unexpected untracked or modified files.

---

### Summary of all files touched

| Action | File |
|--------|------|
| Create | `apps/server/src/lib/specs-tree.ts` |
| Create | `apps/server/src/routes/specs.ts` |
| Create | `apps/server/src/routes/__tests__/specs.test.ts` |
| Create | `apps/web/src/components/graph/buildGraphFromTree.ts` |
| Create | `apps/web/src/components/graph/__tests__/buildGraphFromTree.test.ts` |
| Create | `apps/web/src/stores/__tests__/graphStore.specsTree.test.ts` |
| Modify | `packages/shared/src/types/spec-node.ts` |
| Modify | `packages/shared/src/types/graph.ts` |
| Modify | `apps/server/src/index.ts` |
| Modify | `apps/web/src/lib/serverApi.ts` |
| Modify | `apps/web/src/stores/graphStore.ts` |
| Modify | `apps/web/src/components/graph/GraphNodes.tsx` |
| Modify | `apps/web/src/components/graph/FlowGraph.tsx` |
| Modify | `apps/web/src/components/graph/SpecsGraph.tsx` |
| Modify | `apps/web/src/components/graph/SpecsList.tsx` |
| Modify | `apps/web/src/components/graph/SpecsDocument.tsx` |
| Modify | `apps/web/src/components/graph/DetailPanel.tsx` |
| Modify | `apps/web/src/pages/GraphPage.tsx` |
