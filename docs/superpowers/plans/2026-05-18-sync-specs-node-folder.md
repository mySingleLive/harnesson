# Sync-Specs Node Folder Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all spec tree nodes to a consistent folder-based structure where every node lives in `<id>/node.json` with optional `<id>/design.md`, eliminating the leaf-vs-non-leaf file naming distinction.

**Architecture:** Change `path-resolver.ts` to remove the `isLeaf` parameter from `nodeJsonPath`, add `designDocPathFromNodePath`. Propagate through `file-io.ts`, `validator.ts`, and `specs-cli.ts`. Add a one-time `migrateStructure` function that converts existing files. All changes are backwards-incompatible — migration must run before the new code is used on existing data.

**Tech Stack:** TypeScript, Node.js (with `--experimental-strip-types`), Vitest for tests

---

### Task 1: path-resolver.ts — Update nodeJsonPath and add designDocPathFromNodePath

**Files:**
- Modify: `.claude/skills/sync-specs/scripts/core/path-resolver.ts`
- Modify: `.claude/skills/sync-specs/scripts/__tests__/path-resolver.test.ts`

- [ ] **Step 1: Update path-resolver.ts implementation**

Replace the entire content of `path-resolver.ts`:

```typescript
import * as path from 'node:path';

export interface PathResolverOptions {
  specsRoot: string;
  draft?: boolean;
}

export function rootJsonPath(opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, 'project.json');
}

/**
 * Resolve the file path for a non-root node.
 * All nodes now use the same pattern: <ancestors>/<id>/node.json
 *
 * @param nodePath - dot-separated ancestor IDs from root, e.g. "project.ai-agent.message-input"
 */
export function nodeJsonPath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');
  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1);
  return path.join(base, ...relativeDirs, 'node.json');
}

/**
 * Resolve the directory that contains a node's children.
 */
export function nodeDirPath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');

  if (nodePath === 'project') return base;

  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1);
  return path.join(base, ...relativeDirs);
}

/**
 * Resolve the design document path for a node, derived from its nodePath.
 * Always resolves to nodes/<ancestors>/<id>/design.md
 */
export function designDocPathFromNodePath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');
  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1);
  return path.join(base, ...relativeDirs, 'design.md');
}

/**
 * Resolve a design document path from a relative path string.
 * Used for reading the `design` field value from node JSON.
 */
export function designDocPath(designRelativePath: string, opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, designRelativePath);
}

export function buildNodePath(
  nodeId: string,
  parentPath: string | null,
): string {
  if (parentPath === null) return nodeId;
  return `${parentPath}.${nodeId}`;
}
```

Key changes:
- `nodeJsonPath` loses the `isLeaf` parameter; always returns `.../<id>/node.json`
- New `designDocPathFromNodePath(nodePath, opts)` derives design doc path from node path
- `designDocPath` kept for backward compat (reads `design` field values)

- [ ] **Step 2: Update path-resolver.test.ts**

Replace the entire content of `path-resolver.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  rootJsonPath,
  nodeJsonPath,
  nodeDirPath,
  designDocPath,
  designDocPathFromNodePath,
  buildNodePath,
  type PathResolverOptions,
} from '../core/path-resolver.ts';

const opts: PathResolverOptions = { specsRoot: '.harnesson/specs' };
const draftOpts: PathResolverOptions = { specsRoot: '.harnesson/specs', draft: true };

// ---- rootJsonPath ----

describe('rootJsonPath', () => {
  it('resolves to project.json in specs root', () => {
    const p = rootJsonPath(opts);
    expect(p).toMatch(/\.harnesson[\\/]specs[\\/]project\.json$/);
  });

  it('resolves to draft/project.json when draft mode', () => {
    const p = rootJsonPath(draftOpts);
    expect(p).toMatch(/\.harnesson[\\/]specs[\\/]draft[\\/]project\.json$/);
  });
});

// ---- nodeJsonPath ----

describe('nodeJsonPath', () => {
  it('resolves to <id>/node.json for any node', () => {
    const p = nodeJsonPath('project.ai-agent', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]node\.json$/);
  });

  it('resolves deeply nested node', () => {
    const p = nodeJsonPath('project.ai-agent.message-input', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]message-input[\\/]node\.json$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = nodeJsonPath('project.ai-agent', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes[\\/]ai-agent[\\/]node\.json$/);
  });

  it('handles 4-level deep path', () => {
    const p = nodeJsonPath('project.ai-agent.session-control.abort-execution', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]session-control[\\/]abort-execution[\\/]node\.json$/);
  });
});

// ---- nodeDirPath ----

describe('nodeDirPath', () => {
  it('returns nodes/ for root', () => {
    const p = nodeDirPath('project', opts);
    expect(p).toMatch(/[\\/]nodes$/);
  });

  it('returns directory for a non-root node', () => {
    const p = nodeDirPath('project.ai-agent', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = nodeDirPath('project', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes$/);
  });
});

// ---- designDocPathFromNodePath ----

describe('designDocPathFromNodePath', () => {
  it('resolves to <id>/design.md from nodePath', () => {
    const p = designDocPathFromNodePath('project.ai-agent', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]design\.md$/);
  });

  it('resolves deeply nested design doc', () => {
    const p = designDocPathFromNodePath('project.ai-agent.message-input', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]message-input[\\/]design\.md$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = designDocPathFromNodePath('project.ai-agent', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes[\\/]ai-agent[\\/]design\.md$/);
  });
});

// ---- designDocPath (legacy) ----

describe('designDocPath', () => {
  it('resolves design doc via relative path', () => {
    const p = designDocPath('nodes/ai-agent/design.md', opts);
    expect(p).toMatch(/\.harnesson[\\/]specs[\\/]nodes[\\/]ai-agent[\\/]design\.md$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = designDocPath('nodes/ai-agent/design.md', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes[\\/]ai-agent[\\/]design\.md$/);
  });
});

// ---- buildNodePath ----

describe('buildNodePath', () => {
  it('returns just nodeId when parentPath is null', () => {
    expect(buildNodePath('project', null)).toBe('project');
  });

  it('concatenates parent and node id', () => {
    expect(buildNodePath('ai-agent', 'project')).toBe('project.ai-agent');
  });

  it('handles deeply nested paths', () => {
    expect(buildNodePath('abort', 'project.ai-agent.session')).toBe('project.ai-agent.session.abort');
  });
});
```

- [ ] **Step 3: Run tests to verify**

Run: `cd .claude/skills/sync-specs/scripts && npx vitest run __tests__/path-resolver.test.ts`
Expected: All path-resolver tests PASS

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/scripts/core/path-resolver.ts .claude/skills/sync-specs/scripts/__tests__/path-resolver.test.ts
git commit -m "refactor(sync-specs): update path-resolver — unified node.json path, add designDocPathFromNodePath"
```

---

### Task 2: file-io.ts — Update read/write/delete, add writeDesignDocForNode

**Files:**
- Modify: `.claude/skills/sync-specs/scripts/core/file-io.ts`
- Modify: `.claude/skills/sync-specs/scripts/__tests__/file-io.test.ts`

- [ ] **Step 1: Update file-io.ts implementation**

Replace the entire content of `file-io.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SpecNode, RootSpecNode } from './schema.ts';
import {
  rootJsonPath,
  nodeJsonPath,
  nodeDirPath,
  designDocPathFromNodePath,
  type PathResolverOptions,
} from './path-resolver.ts';

// ---- Read operations ----

export function readRootNode(opts: PathResolverOptions): RootSpecNode | null {
  const filePath = rootJsonPath(opts);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function readNode(
  nodePath: string,
  opts: PathResolverOptions,
): SpecNode | null {
  const filePath = nodeJsonPath(nodePath, opts);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function readTree(opts: PathResolverOptions): Map<string, SpecNode | RootSpecNode> {
  const result = new Map<string, SpecNode | RootSpecNode>();
  const root = readRootNode(opts);
  if (!root) return result;

  result.set('project', root);

  const visited = new Set<string>(root.children ?? []);
  const queue: string[] = [...(root.children ?? [])];

  while (queue.length > 0) {
    const childId = queue.shift()!;
    const node = findAndReadNode(childId, result, opts);
    if (node) {
      const fullNodePath = buildFullPath(node, result);
      result.set(fullNodePath, node);
      if (!node.isLeaf && node.children) {
        for (const c of node.children) {
          if (!visited.has(c)) {
            visited.add(c);
            queue.push(c);
          }
        }
      }
    }
  }

  return result;
}

export function readSubtree(
  startPath: string,
  opts: PathResolverOptions,
): Map<string, SpecNode | RootSpecNode> {
  const result = new Map<string, SpecNode | RootSpecNode>();
  const startNode = startPath === 'project'
    ? readRootNode(opts)
    : readNode(startPath, opts);

  if (!startNode) return result;

  result.set(startPath, startNode);

  if (!startNode.isLeaf && startNode.children) {
    const visited = new Set<string>(startNode.children);
    const queue: string[] = [...startNode.children];
    while (queue.length > 0) {
      const childId = queue.shift()!;
      const node = findAndReadNode(childId, result, opts);
      if (node) {
        const fullNodePath = buildFullPath(node, result);
        result.set(fullNodePath, node);
        if (!node.isLeaf && node.children) {
          for (const c of node.children) {
            if (!visited.has(c)) {
              visited.add(c);
            }
          }
        }
      }
    }
  }

  return result;
}

// ---- Write operations ----

export function writeRootNode(node: RootSpecNode, opts: PathResolverOptions): string {
  const filePath = rootJsonPath(opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function writeNode(nodePath: string, node: SpecNode, opts: PathResolverOptions): string {
  const filePath = nodeJsonPath(nodePath, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function writeDesignDocForNode(nodePath: string, content: string, opts: PathResolverOptions): string {
  const filePath = designDocPathFromNodePath(nodePath, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ---- Delete operations ----

export function deleteNode(nodePath: string, opts: PathResolverOptions): boolean {
  const dir = nodeDirPath(nodePath, opts);
  if (!fs.existsSync(dir)) return false;
  fs.rmSync(dir, { recursive: true });
  return true;
}

// ---- Merge operation ----

export function mergeNodeData(existing: SpecNode, updates: Partial<SpecNode>): SpecNode {
  const result = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const existingValue = (result as Record<string, unknown>)[key];

    if (Array.isArray(value) && Array.isArray(existingValue)) {
      const existingArr = existingValue as unknown[];
      const newArr = value as unknown[];
      const merged = [...existingArr];
      for (const item of newArr) {
        const json = JSON.stringify(item);
        if (!merged.some(e => JSON.stringify(e) === json)) {
          merged.push(item);
        }
      }
      (result as Record<string, unknown>)[key] = merged;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)
               && typeof existingValue === 'object' && existingValue !== null && !Array.isArray(existingValue)) {
      (result as Record<string, unknown>)[key] = { ...(existingValue as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

// ---- Directory operations ----

export function initSpecsDir(opts: PathResolverOptions): void {
  const base = opts.specsRoot;
  const dirs = [
    base,
    path.join(base, 'nodes'),
    path.join(base, 'draft', 'nodes'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---- Migration ----

export interface MigrationResult {
  migrated: number;
  errors: string[];
}

export function migrateStructure(opts: PathResolverOptions): MigrationResult {
  const errors: string[] = [];
  let migrated = 0;

  const nodesBase = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');

  if (!fs.existsSync(nodesBase)) return { migrated: 0, errors };

  // Phase 1 & 2: Migrate all node files
  scanAndMigrate(nodesBase);

  // Phase 3: Move design docs and update design fields
  const designBase = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'design')
    : path.join(opts.specsRoot, 'design');

  if (fs.existsSync(designBase)) {
    const tree = readTree(opts);
    for (const [nodePath, node] of tree) {
      if (nodePath === 'project' || !node.design) continue;

      const oldDesignPath = path.join(
        opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot,
        node.design,
      );

      if (fs.existsSync(oldDesignPath)) {
        const newDesignPath = designDocPathFromNodePath(nodePath, opts);
        fs.mkdirSync(path.dirname(newDesignPath), { recursive: true });
        fs.renameSync(oldDesignPath, newDesignPath);
        migrated++;

        // Update design field to new path
        const parts = nodePath.split('.');
        node.design = path.join('nodes', ...parts.slice(1), 'design.md').replace(/\\/g, '/');
        writeNode(nodePath, node, opts);
      }
    }

    // Clean up design directory
    try {
      if (fs.existsSync(designBase)) {
        const remaining = fs.readdirSync(designBase);
        if (remaining.length === 0) {
          fs.rmSync(designBase, { recursive: true });
        }
      }
    } catch {
      // Directory not empty, that's fine
    }
  }

  function scanAndMigrate(dir: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check for old non-leaf format: <id>/index.json
        const indexPath = path.join(dir, entry.name, 'index.json');
        const newNodePath = path.join(dir, entry.name, 'node.json');

        if (fs.existsSync(indexPath) && !fs.existsSync(newNodePath)) {
          fs.renameSync(indexPath, newNodePath);
          migrated++;
        }

        // Recurse into children
        scanAndMigrate(path.join(dir, entry.name));
      } else if (
        entry.isFile()
        && entry.name !== 'index.json'
        && entry.name !== 'node.json'
        && entry.name !== 'design.md'
        && entry.name.endsWith('.json')
      ) {
        // Old leaf format: <id>.json → <id>/node.json
        const oldFilePath = path.join(dir, entry.name);
        const id = entry.name.replace('.json', '');
        const newDir = path.join(dir, id);
        const newFilePath = path.join(newDir, 'node.json');

        fs.mkdirSync(newDir, { recursive: true });
        fs.renameSync(oldFilePath, newFilePath);
        migrated++;
      }
    }
  }

  return { migrated, errors };
}

// ---- Internal helpers ----

function findAndReadNode(
  childId: string,
  loadedNodes: Map<string, SpecNode | RootSpecNode>,
  opts: PathResolverOptions,
): SpecNode | null {
  for (const [parentPath, parentNode] of loadedNodes) {
    if (parentNode.children?.includes(childId)) {
      const childFullPath = `${parentPath}.${childId}`;
      return readNode(childFullPath, opts);
    }
  }
  return null;
}

function buildFullPath(
  node: SpecNode,
  loadedNodes: Map<string, SpecNode | RootSpecNode>,
): string {
  if (node.parent === null) return node.id;
  for (const [p, n] of loadedNodes) {
    if (n.id === node.parent) return `${p}.${node.id}`;
  }
  return node.id;
}
```

Key changes from previous version:
- `readNode` — single path lookup (no leaf/non-leaf try)
- `writeNode` — uses `nodeJsonPath(nodePath, opts)` without `isLeaf`
- `deleteNode(nodePath, opts)` — no `isLeaf` param, deletes entire node directory
- New `writeDesignDocForNode(nodePath, content, opts)`
- `initSpecsDir` — no longer creates `design/` directories
- New `migrateStructure(opts)` — one-time filesystem migration
- Removed `writeDesignDoc` (replaced by `writeDesignDocForNode`)

- [ ] **Step 2: Update file-io.test.ts**

Replace the entire content of `file-io.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  readRootNode,
  readNode,
  readTree,
  readSubtree,
  writeRootNode,
  writeNode,
  writeDesignDocForNode,
  deleteNode,
  mergeNodeData,
  initSpecsDir,
  migrateStructure,
} from '../core/file-io.ts';
import type { PathResolverOptions } from '../core/path-resolver.ts';
import type { SpecNode, RootSpecNode } from '../core/schema.ts';

// ---- Helpers ----

let tmpDir: string;
let opts: PathResolverOptions;

function makeRoot(overrides: Partial<RootSpecNode> = {}): RootSpecNode {
  return {
    id: 'project',
    name: 'Test Project',
    level: 1,
    parent: null,
    children: [],
    isLeaf: false,
    summary: 'A test project',
    treeDepth: 3,
    treeScenario: 'multi-functional',
    status: 'draft',
    syncMeta: {
      lastSyncAt: new Date().toISOString(),
      baseCommit: 'abc1234',
      baseCommitMessage: 'initial',
      branch: 'main',
      sourceFiles: [],
    },
    ...overrides,
  };
}

function makeNode(overrides: Partial<SpecNode> = {}): SpecNode {
  return {
    id: 'test-node',
    name: 'Test Node',
    level: 2,
    parent: 'project',
    children: [],
    isLeaf: true,
    summary: 'A test node',
    status: 'draft',
    syncMeta: {
      lastSyncAt: new Date().toISOString(),
      baseCommit: 'abc1234',
      baseCommitMessage: 'initial',
      branch: 'main',
      sourceFiles: ['src/test.ts'],
    },
    ...overrides,
  };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-specs-test-'));
  opts = { specsRoot: tmpDir };
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---- initSpecsDir ----

describe('initSpecsDir', () => {
  it('creates nodes directories but not design', () => {
    initSpecsDir(opts);
    expect(fs.existsSync(path.join(tmpDir, 'nodes'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'draft', 'nodes'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'design'))).toBe(false);
  });

  it('is idempotent', () => {
    initSpecsDir(opts);
    initSpecsDir(opts);
    expect(fs.existsSync(path.join(tmpDir, 'nodes'))).toBe(true);
  });
});

// ---- writeRootNode / readRootNode ----

describe('writeRootNode / readRootNode', () => {
  it('writes and reads back a root node', () => {
    const root = makeRoot();
    writeRootNode(root, opts);
    const read = readRootNode(opts);
    expect(read).toEqual(root);
  });

  it('returns null when no root file exists', () => {
    expect(readRootNode(opts)).toBeNull();
  });
});

// ---- writeNode / readNode ----

describe('writeNode / readNode', () => {
  it('writes leaf node to <id>/node.json', () => {
    const node = makeNode();
    const filePath = writeNode('project.test-node', node, opts);
    expect(filePath).toMatch(/test-node[\\/]node\.json$/);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('writes non-leaf node to <id>/node.json', () => {
    const node = makeNode({ isLeaf: false, children: ['child1'] });
    const filePath = writeNode('project.test-node', node, opts);
    expect(filePath).toMatch(/test-node[\\/]node\.json$/);
  });

  it('reads back a leaf node', () => {
    const node = makeNode();
    writeNode('project.test-node', node, opts);
    const read = readNode('project.test-node', opts);
    expect(read).toEqual(node);
  });

  it('reads back a non-leaf node', () => {
    const node = makeNode({ isLeaf: false, children: ['child1'] });
    writeNode('project.test-node', node, opts);
    const read = readNode('project.test-node', opts);
    expect(read).toEqual(node);
  });

  it('returns null when node does not exist', () => {
    expect(readNode('project.nonexistent', opts)).toBeNull();
  });
});

// ---- readTree ----

describe('readTree', () => {
  it('returns empty map when no root exists', () => {
    const tree = readTree(opts);
    expect(tree.size).toBe(0);
  });

  it('reads a tree with root only', () => {
    const root = makeRoot();
    writeRootNode(root, opts);
    const tree = readTree(opts);
    expect(tree.size).toBe(1);
    expect(tree.get('project')).toEqual(root);
  });

  it('reads a tree with root and children', () => {
    const root = makeRoot({ children: ['ai-agent'] });
    writeRootNode(root, opts);

    const child = makeNode({ id: 'ai-agent', name: 'AI Agent', parent: 'project', isLeaf: true });
    writeNode('project.ai-agent', child, opts);

    const tree = readTree(opts);
    expect(tree.size).toBe(2);
    expect(tree.get('project')).toEqual(root);
    expect(tree.get('project.ai-agent')).toEqual(child);
  });

  it('reads a multi-level tree', () => {
    const root = makeRoot({ children: ['ai-agent'] });
    writeRootNode(root, opts);

    const agent = makeNode({
      id: 'ai-agent',
      name: 'AI Agent',
      parent: 'project',
      isLeaf: false,
      children: ['message-input'],
    });
    writeNode('project.ai-agent', agent, opts);

    const msgInput = makeNode({
      id: 'message-input',
      name: 'Message Input',
      parent: 'ai-agent',
      isLeaf: true,
      level: 3,
    });
    writeNode('project.ai-agent.message-input', msgInput, opts);

    const tree = readTree(opts);
    expect(tree.size).toBe(3);
    expect(tree.get('project.ai-agent.message-input')).toEqual(msgInput);
  });
});

// ---- readSubtree ----

describe('readSubtree', () => {
  it('reads subtree starting from a specific node', () => {
    const root = makeRoot({ children: ['ai-agent', 'other'] });
    writeRootNode(root, opts);

    const agent = makeNode({
      id: 'ai-agent',
      name: 'AI Agent',
      parent: 'project',
      isLeaf: false,
      children: ['message-input'],
    });
    writeNode('project.ai-agent', agent, opts);

    const msgInput = makeNode({
      id: 'message-input',
      name: 'Message Input',
      parent: 'ai-agent',
      isLeaf: true,
      level: 3,
    });
    writeNode('project.ai-agent.message-input', msgInput, opts);

    const other = makeNode({ id: 'other', name: 'Other', parent: 'project', isLeaf: true });
    writeNode('project.other', other, opts);

    const subtree = readSubtree('project.ai-agent', opts);
    expect(subtree.size).toBe(2);
    expect(subtree.has('project.ai-agent')).toBe(true);
    expect(subtree.has('project.ai-agent.message-input')).toBe(true);
    expect(subtree.has('project.other')).toBe(false);
  });

  it('returns empty map for nonexistent start path', () => {
    const subtree = readSubtree('project.nonexistent', opts);
    expect(subtree.size).toBe(0);
  });
});

// ---- deleteNode ----

describe('deleteNode', () => {
  it('deletes a node folder', () => {
    const node = makeNode();
    writeNode('project.test-node', node, opts);
    const nodeDir = path.join(tmpDir, 'nodes', 'test-node');
    expect(fs.existsSync(nodeDir)).toBe(true);

    const result = deleteNode('project.test-node', opts);
    expect(result).toBe(true);
    expect(fs.existsSync(nodeDir)).toBe(false);
  });

  it('returns false when node does not exist', () => {
    const result = deleteNode('project.nonexistent', opts);
    expect(result).toBe(false);
  });

  it('also removes design.md in the folder', () => {
    const node = makeNode();
    writeNode('project.test-node', node, opts);
    writeDesignDocForNode('project.test-node', '# Design', opts);

    const nodeDir = path.join(tmpDir, 'nodes', 'test-node');
    expect(fs.existsSync(path.join(nodeDir, 'design.md'))).toBe(true);

    deleteNode('project.test-node', opts);
    expect(fs.existsSync(nodeDir)).toBe(false);
  });
});

// ---- mergeNodeData ----

describe('mergeNodeData', () => {
  it('overwrites primitive fields', () => {
    const existing = makeNode({ name: 'Old Name' });
    const merged = mergeNodeData(existing, { name: 'New Name' });
    expect(merged.name).toBe('New Name');
  });

  it('concatenates and deduplicates array fields', () => {
    const existing = makeNode({ children: ['a', 'b'] });
    const merged = mergeNodeData(existing, { children: ['b', 'c'] });
    expect(merged.children).toEqual(['a', 'b', 'c']);
  });

  it('shallow-merges object fields', () => {
    const existing = makeNode();
    existing.syncMeta = { ...existing.syncMeta, baseCommit: 'old' };
    const merged = mergeNodeData(existing, {
      syncMeta: { ...existing.syncMeta, baseCommit: 'new' },
    });
    expect(merged.syncMeta.baseCommit).toBe('new');
  });

  it('ignores undefined values in updates', () => {
    const existing = makeNode({ name: 'Existing' });
    const merged = mergeNodeData(existing, { name: undefined });
    expect(merged.name).toBe('Existing');
  });

  it('sets new primitive fields from updates', () => {
    const existing = makeNode();
    const merged = mergeNodeData(existing, { summary: 'New summary' });
    expect(merged.summary).toBe('New summary');
  });
});

// ---- writeDesignDocForNode ----

describe('writeDesignDocForNode', () => {
  it('writes design.md inside node folder', () => {
    const node = makeNode();
    writeNode('project.test-node', node, opts);
    const filePath = writeDesignDocForNode('project.test-node', '# Test Doc', opts);
    expect(filePath).toMatch(/test-node[\\/]design\.md$/);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('# Test Doc');
  });

  it('creates parent directories', () => {
    const filePath = writeDesignDocForNode('project.deep.nested.node', 'content', opts);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toMatch(/nested[\\/]node[\\/]design\.md$/);
  });
});

// ---- migrateStructure ----

describe('migrateStructure', () => {
  it('migrates leaf nodes from <id>.json to <id>/node.json', () => {
    const nodesDir = path.join(tmpDir, 'nodes');
    fs.mkdirSync(nodesDir, { recursive: true });

    // Write old-style leaf node
    const leafNode = makeNode({ id: 'my-leaf' });
    fs.writeFileSync(path.join(nodesDir, 'my-leaf.json'), JSON.stringify(leafNode, null, 2));

    // Set up root to reference it
    writeRootNode(makeRoot({ children: ['my-leaf'] }), opts);

    const result = migrateStructure(opts);
    expect(result.migrated).toBeGreaterThanOrEqual(1);

    // Verify new path exists
    expect(fs.existsSync(path.join(nodesDir, 'my-leaf', 'node.json'))).toBe(true);
    // Verify old path gone
    expect(fs.existsSync(path.join(nodesDir, 'my-leaf.json'))).toBe(false);
  });

  it('migrates non-leaf nodes from index.json to node.json', () => {
    const nodesDir = path.join(tmpDir, 'nodes');
    fs.mkdirSync(nodesDir, { recursive: true });

    // Write old-style non-leaf node
    const nonLeafNode = makeNode({ id: 'parent-node', isLeaf: false, children: [] });
    const parentDir = path.join(nodesDir, 'parent-node');
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(path.join(parentDir, 'index.json'), JSON.stringify(nonLeafNode, null, 2));

    writeRootNode(makeRoot({ children: ['parent-node'] }), opts);

    const result = migrateStructure(opts);
    expect(result.migrated).toBeGreaterThanOrEqual(1);

    expect(fs.existsSync(path.join(parentDir, 'node.json'))).toBe(true);
    expect(fs.existsSync(path.join(parentDir, 'index.json'))).toBe(false);
  });

  it('is idempotent on already-migrated structure', () => {
    const root = makeRoot({ children: ['test-node'] });
    writeRootNode(root, opts);
    const node = makeNode();
    writeNode('project.test-node', node, opts);

    const result = migrateStructure(opts);
    expect(result.migrated).toBe(0);
    expect(readNode('project.test-node', opts)).toEqual(node);
  });
});
```

- [ ] **Step 3: Run tests to verify**

Run: `cd .claude/skills/sync-specs/scripts && npx vitest run __tests__/file-io.test.ts`
Expected: All file-io tests PASS

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/scripts/core/file-io.ts .claude/skills/sync-specs/scripts/__tests__/file-io.test.ts
git commit -m "refactor(sync-specs): update file-io — unified node folders, add migrateStructure"
```

---

### Task 3: validator.ts — Update checkDesignDoc to use nodePath-derived path

**Files:**
- Modify: `.claude/skills/sync-specs/scripts/core/validator.ts`
- Modify: `.claude/skills/sync-specs/scripts/__tests__/validator.test.ts`

- [ ] **Step 1: Update validator.ts**

The key changes in `validator.ts`:

1. Update import to add `designDocPathFromNodePath`
2. Change `checkDesignDoc` signature to accept `nodePath`
3. Update the `checkDesignDoc` call in `validateTree` and `fixTree`

In `validator.ts`, update the import from path-resolver:

```typescript
import {
  designDocPath,
  designDocPathFromNodePath,
  type PathResolverOptions,
} from './path-resolver.ts';
```

Replace the `checkDesignDoc` function:

```typescript
function checkDesignDoc(nodePath: string, node: SpecNode | RootSpecNode, opts: PathResolverOptions): CheckResult {
  const errors: string[] = [];

  if (node.design) {
    if (nodePath === 'project') return pass();

    // Try new path (derived from nodePath) first
    const docPath = designDocPathFromNodePath(nodePath, opts);
    if (fs.existsSync(docPath)) {
      const content = fs.readFileSync(docPath, 'utf-8');
      if (content.trim().length === 0) {
        errors.push(`design file is empty: ${docPath}`);
      }
    } else {
      // Fallback to old-style design field path
      const fieldPath = designDocPath(node.design!, opts);
      if (!fs.existsSync(fieldPath)) {
        errors.push(`design file not found: ${docPath}`);
      } else {
        const content = fs.readFileSync(fieldPath, 'utf-8');
        if (content.trim().length === 0) {
          errors.push(`design file is empty: ${fieldPath}`);
        }
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}
```

Update the call in `validateTree` (line ~242):

```typescript
const designDocResult = checkDesignDoc(nodePath, node, opts);
```

Also update the `fixTree` function call if it calls `checkDesignDoc` (it doesn't directly, but update for consistency).

Remove the `writeDesignDoc` import since it's no longer exported. Update the import from file-io:

```typescript
import {
  readRootNode,
  readTree,
  writeRootNode,
  writeNode,
} from './file-io.ts';
```

The `fixTree` function does not need changes — it calls `writeRootNode` and `writeNode` with the same signatures.

- [ ] **Step 2: Update validator.test.ts**

Key changes:
1. Remove `writeDesignDoc` import (replaced by `writeDesignDocForNode`)
2. Import `writeDesignDocForNode` from file-io
3. Update `initSpecsDir` test expectations (no `design/` dir)
4. Update design doc tests to write design docs inside node folders
5. Update the `fixTree` test that reads `nodes/test-node.json` → `nodes/test-node/node.json`

Update imports:

```typescript
import { writeRootNode, writeNode, writeDesignDocForNode, initSpecsDir } from '../core/file-io.ts';
```

Replace the design doc test section (`checkDesignDoc` describe block):

```typescript
describe('checkDesignDoc', () => {
  it('passes when design doc exists at node-derived path', () => {
    const leaf = makeValidLeaf({ design: 'nodes/test-node/design.md' });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    writeDesignDocForNode('project.test-node', '# Design', opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.designDoc.pass).toBe(true);
  });

  it('fails when design doc does not exist', () => {
    const leaf = makeValidLeaf({ design: 'nodes/missing/design.md' });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.designDoc.pass).toBe(false);
  });

  it('fails when design doc is empty', () => {
    const leaf = makeValidLeaf({ design: 'nodes/test-node/design.md' });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    writeDesignDocForNode('project.test-node', '   ', opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.designDoc.pass).toBe(false);
  });

  it('passes when no design field is set', () => {
    const leaf = makeValidLeaf();
    leaf.design = null;
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.designDoc.pass).toBe(true);
  });
});
```

Update the `fixTree` test that reads node file directly. Change this line:

```typescript
// OLD:
const nodeJson = JSON.parse(
  fs.readFileSync(path.join(tmpDir, 'nodes', 'test-node.json'), 'utf-8'),
);

// NEW:
const nodeJson = JSON.parse(
  fs.readFileSync(path.join(tmpDir, 'nodes', 'test-node', 'node.json'), 'utf-8'),
);
```

- [ ] **Step 3: Run tests to verify**

Run: `cd .claude/skills/sync-specs/scripts && npx vitest run __tests__/validator.test.ts`
Expected: All validator tests PASS

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/scripts/core/validator.ts .claude/skills/sync-specs/scripts/__tests__/validator.test.ts
git commit -m "refactor(sync-specs): update validator — design doc check uses nodePath-derived path"
```

---

### Task 4: specs-cli.ts — Update function calls, add migrate command

**Files:**
- Modify: `.claude/skills/sync-specs/scripts/specs-cli.ts`
- Modify: `.claude/skills/sync-specs/scripts/__tests__/specs-cli.test.ts`

- [ ] **Step 1: Update specs-cli.ts**

Key changes:
1. `delete-node` — remove `isLeaf` variable and argument
2. `promote-draft` — use `writeDesignDocForNode` instead of `writeDesignDoc`
3. Add `migrate` command
4. Remove `writeDesignDoc` import, add `writeDesignDocForNode` and `migrateStructure`

Update imports at the top of the `promote-draft` case:

```typescript
case 'promote-draft': {
  const { readTree, writeRootNode, writeNode, writeDesignDocForNode } = await import('./core/file-io.ts');
  const draftOpts = { ...opts, draft: true };
  const draftTree = readTree(draftOpts);

  if (draftTree.size === 0) {
    output({ ok: true, message: 'No draft nodes to promote' });
    break;
  }

  const promotedPaths: string[] = [];

  for (const [nodePath, node] of draftTree) {
    node.syncMeta.lastSyncAt = new Date().toISOString();

    if (nodePath === 'project') {
      const p = writeRootNode(node as any, opts);
      promotedPaths.push(p);
    } else {
      const p = writeNode(nodePath, node as any, opts);
      promotedPaths.push(p);
    }

    // Copy design doc if exists at node-derived path
    if (nodePath !== 'project') {
      const { designDocPathFromNodePath } = await import('./core/path-resolver.ts');
      const draftDesignPath = designDocPathFromNodePath(nodePath, draftOpts);
      if (fs.existsSync(draftDesignPath)) {
        const content = fs.readFileSync(draftDesignPath, 'utf-8');
        writeDesignDocForNode(nodePath, content, opts);
        promotedPaths.push(`${nodePath}/design.md`);
      }
    }
  }

  // Clean up draft directory
  const draftDir = path.join(root, 'draft');
  if (fs.existsSync(draftDir)) {
    fs.rmSync(draftDir, { recursive: true });
    fs.mkdirSync(draftDir, { recursive: true });
  }

  output({ ok: true, promoted: promotedPaths.length, paths: promotedPaths });
  break;
}
```

Update `delete-node` — remove the `isLeaf` variable and argument:

```typescript
case 'delete-node': {
  const { readNode, deleteNode, readRootNode, writeRootNode, writeNode } = await import('./core/file-io.ts');
  const nodeId = positional[0];
  if (!nodeId) error('Usage: specs-cli.ts delete-node <node-path>');

  const node = nodeId === 'project' ? readRootNode(opts) : readNode(nodeId, opts);
  if (!node) error(`Node not found: ${nodeId}`);

  if (node.children && node.children.length > 0) {
    error(`Cannot delete non-leaf node with children. Remove children first.`);
  }

  if (node.parent) {
    const parts = nodeId.split('.');
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join('.') : 'project';
    const parentNode = parentPath === 'project' ? readRootNode(opts) : readNode(parentPath, opts);
    if (parentNode) {
      parentNode.children = parentNode.children.filter((c: string) => c !== node.id);
      if (parentPath === 'project') {
        writeRootNode(parentNode as any, opts);
      } else {
        writeNode(parentPath, parentNode, opts);
      }
    }
  }

  if (nodeId !== 'project') {
    deleteNode(nodeId, opts);
  }
  output({ ok: true, deleted: nodeId });
  break;
}
```

Add `migrate` command before the `default` case:

```typescript
case 'migrate': {
  const { migrateStructure } = await import('./core/file-io.ts');
  const result = migrateStructure(opts);
  output({ ok: true, ...result });
  break;
}
```

Update the `default` case help text:

```typescript
default:
  error(`Unknown command: ${command}\nAvailable: init-tree, read-tree, read-node, create-node, update-node, delete-node, validate, promote-draft, migrate`);
```

- [ ] **Step 2: Update specs-cli.test.ts**

Key changes:
1. `init-tree` test — remove `design` directory assertions
2. `delete-node` test — leaf nodes are now in folders
3. `promote-draft` test — use new design doc paths
4. Add `migrate` command test

Update `init-tree` test:

```typescript
describe('init-tree', () => {
  it('creates directory structure', () => {
    const result = run(`init-tree --root "${specsRoot}"`);
    expect(result.exitCode).toBe(0);
    const data = parseJson(result.stdout);
    expect(data.ok).toBe(true);

    expect(fs.existsSync(path.join(specsRoot, 'nodes'))).toBe(true);
    expect(fs.existsSync(path.join(specsRoot, 'draft', 'nodes'))).toBe(true);
  });
});
```

Update `delete-node` test — the child node is now at `nodes/child-a/node.json`:

No changes needed to the delete test logic — it uses `read-node` and `delete-node` commands which abstract the file paths. The test verifies the node is gone by reading it back.

Update `promote-draft` test — no functional changes needed; it creates/reads through the CLI which handles paths internally.

Add `migrate` command test:

```typescript
describe('migrate', () => {
  it('migrates old leaf node format', () => {
    run(`init-tree --root "${specsRoot}"`);

    // Create old-style leaf node directly on filesystem
    const nodesDir = path.join(specsRoot, 'nodes');
    const leafData = {
      id: 'old-leaf',
      name: 'Old Leaf',
      level: 2,
      parent: 'project',
      children: [],
      isLeaf: true,
      summary: 'An old leaf node',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    };
    fs.writeFileSync(path.join(nodesDir, 'old-leaf.json'), JSON.stringify(leafData, null, 2));

    const result = run(`migrate --root "${specsRoot}"`);
    expect(result.exitCode).toBe(0);
    const data = parseJson(result.stdout);
    expect(data.ok).toBe(true);
    expect(data.migrated).toBeGreaterThanOrEqual(1);

    // Verify old file is gone
    expect(fs.existsSync(path.join(nodesDir, 'old-leaf.json'))).toBe(false);
    // Verify new file exists
    expect(fs.existsSync(path.join(nodesDir, 'old-leaf', 'node.json'))).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify**

Run: `cd .claude/skills/sync-specs/scripts && npx vitest run __tests__/specs-cli.test.ts`
Expected: All CLI tests PASS

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/sync-specs/scripts/specs-cli.ts .claude/skills/sync-specs/scripts/__tests__/specs-cli.test.ts
git commit -m "refactor(sync-specs): update CLI — remove isLeaf from deleteNode, add migrate command"
```

---

### Task 5: Full test suite verification

**Files:** All test files

- [ ] **Step 1: Run full test suite**

Run: `cd .claude/skills/sync-specs/scripts && npx vitest run`
Expected: All tests PASS (path-resolver, file-io, schema, validator, specs-cli)

If any tests fail, fix the specific test and re-run. Common issues:
- Stale `isLeaf` arguments in test code
- Old file path assertions (`<id>.json` instead of `<id>/node.json`)
- Missing `writeDesignDocForNode` import

- [ ] **Step 2: Commit any fixes**

```bash
git add -A .claude/skills/sync-specs/scripts/
git commit -m "fix(sync-specs): fix remaining test issues from restructuring"
```

---

### Task 6: Update SKILL.md storage structure

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

- [ ] **Step 1: Update the storage structure section**

Find the section starting with `## 存储结构` (around line 205) and replace the structure block:

```markdown
## 存储结构

```
.harnesson/specs/
├── project.json                     # 根节点（level 1）
├── nodes/                           # 非根节点
│   └── {id}/                        # 每个节点一个文件夹
│       ├── node.json                # 节点数据（统一命名）
│       ├── design.md                # 设计文档（可选）
│       └── {child-id}/              # 子节点，递归展开
│           ├── node.json
│           └── design.md
├── draft/                           # 草稿（审核中，结构同上）
│   ├── README.md                    # 变更清单
│   └── nodes/
└── sync-plans/                      # 历史同步计划（保留目录，优化后不再新增）
```
```

Also update the CLI command references in SKILL.md that use `read-tree` etc. — these don't change functionally, but verify they still work.

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "docs(sync-specs): update SKILL.md storage structure to unified node folders"
```

---

### Task 7: Migrate existing specs

**Files:** `.harnesson/specs/draft/` tree

- [ ] **Step 1: Run migration on draft specs**

Run: `cd C:\Projects\harnesson && node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts migrate --root .harnesson/specs`

Expected output: `{ ok: true, migrated: N, errors: [] }` where N > 0

- [ ] **Step 2: Verify migrated structure**

Run: `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts read-tree --root .harnesson/specs`

Verify all nodes are readable and the tree structure is intact.

- [ ] **Step 3: Clean up old design directory**

Check if `design/` directories under `.harnesson/specs/draft/` are empty or removed. If files remain, investigate and handle.

- [ ] **Step 4: Commit migration**

```bash
git add .harnesson/specs/
git commit -m "refactor(specs): migrate spec tree to unified node folder structure"
```
