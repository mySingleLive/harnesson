# Sync-Specs Script Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract JSON read/write/validate operations from the sync-specs skill into TypeScript CLI scripts that enforce schema correctness.

**Architecture:** CLI tool (`specs-cli.ts`) with subcommands for each operation (create-node, read-tree, validate, etc.). Core modules provide shared types (schema.ts), file I/O (file-io.ts), path resolution (path-resolver.ts), validation (validator.ts), and git utilities (git.ts). The SKILL.md is updated to reference script calls instead of instructing LLM to write JSON directly.

**Tech Stack:** TypeScript, Node.js 22 native TS execution (`node --experimental-strip-types`), zero external dependencies.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `.claude/skills/sync-specs/scripts/specs-cli.ts` | CLI entry point: parse args, route to command |
| Create | `.claude/skills/sync-specs/scripts/core/schema.ts` | TypeScript types (`SpecNode`, `RootSpecNode`, etc.) + defaults + validators |
| Create | `.claude/skills/sync-specs/scripts/core/path-resolver.ts` | Node ID ↔ file path conversion |
| Create | `.claude/skills/sync-specs/scripts/core/file-io.ts` | Read/write JSON files, directory management |
| Create | `.claude/skills/sync-specs/scripts/core/validator.ts` | 6 validation checks + fix mode |
| Create | `.claude/skills/sync-specs/scripts/utils/git.ts` | Git operations (get HEAD commit, branch) |
| Create | `.claude/skills/sync-specs/scripts/commands/read-tree.ts` | `read-tree` command |
| Create | `.claude/skills/sync-specs/scripts/commands/read-node.ts` | `read-node` command |
| Create | `.claude/skills/sync-specs/scripts/commands/create-node.ts` | `create-node` command |
| Create | `.claude/skills/sync-specs/scripts/commands/update-node.ts` | `update-node` command |
| Create | `.claude/skills/sync-specs/scripts/commands/delete-node.ts` | `delete-node` command |
| Create | `.claude/skills/sync-specs/scripts/commands/validate.ts` | `validate` command |
| Create | `.claude/skills/sync-specs/scripts/commands/init-tree.ts` | `init-tree` command |
| Create | `.claude/skills/sync-specs/scripts/commands/promote-draft.ts` | `promote-draft` command |
| Modify | `.claude/skills/sync-specs/SKILL.md` | Update steps to use script calls |

---

### Task 1: Core Schema Types

**Files:**
- Create: `.claude/skills/sync-specs/scripts/core/schema.ts`

- [ ] **Step 1: Write the schema module**

Create `.claude/skills/sync-specs/scripts/core/schema.ts`:

```typescript
// ---- Enums ----
export const STATUS_VALUES = [
  'draft', 'backlog', 'todo', 'in-progress',
  'review', 'testing', 'dev-done', 'released',
] as const;
export type Status = (typeof STATUS_VALUES)[number];

export const TREE_SCENARIO_VALUES = [
  'single', 'flat', 'multi-functional', 'multi-domain',
] as const;
export type TreeScenario = (typeof TREE_SCENARIO_VALUES)[number];

export const TEST_CASE_LEVEL_VALUES = ['p0', 'p1', 'p2', 'p3'] as const;
export type TestCaseLevel = (typeof TEST_CASE_LEVEL_VALUES)[number];

// ---- Interfaces ----
export interface SyncMeta {
  lastSyncAt: string;
  baseCommit: string;
  baseCommitMessage: string;
  branch: string;
  sourceFiles: string[];
}

export interface SpecDetail {
  description: string;
  parameters: string[];
}

export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

export interface TestCase {
  level: TestCaseLevel;
  given: string;
  when: string;
  then: string;
}

export interface TestCases {
  'unit-test': TestCase[];
  'end-to-end': TestCase[];
  'script-test': TestCase[];
}

export interface SpecNode {
  id: string;
  name: string;
  level: number;
  parent: string | null;
  children: string[];
  isLeaf: boolean;
  summary: string;
  goals?: string[];
  design?: string | null;
  acceptanceCriteria?: AcceptanceCriterion[];
  testCases?: TestCases;
  specDetail?: SpecDetail | null;
  constraints?: string[];
  status: Status;
  syncMeta: SyncMeta;
}

export interface RootSpecNode extends SpecNode {
  id: 'project';
  level: 1;
  parent: null;
  treeDepth: number;
  treeScenario: TreeScenario;
}

// ---- Validation helpers ----
const KEBAB_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isKebabCase(s: string): boolean {
  return KEBAB_RE.test(s);
}

export function isStatus(s: string): s is Status {
  return (STATUS_VALUES as readonly string[]).includes(s);
}

export function isTreeScenario(s: string): s is TreeScenario {
  return (TREE_SCENARIO_VALUES as readonly string[]).includes(s);
}

// ---- Defaults ----
export function defaultSyncMeta(): SyncMeta {
  return {
    lastSyncAt: new Date().toISOString(),
    baseCommit: '',
    baseCommitMessage: '',
    branch: '',
    sourceFiles: [],
  };
}

export function defaultTestCases(): TestCases {
  return { 'unit-test': [], 'end-to-end': [], 'script-test': [] };
}

/**
 * Fill missing optional fields with defaults.
 * Mutates and returns the input object.
 */
export function fillDefaults(node: Partial<SpecNode>): SpecNode {
  if (!node.children) node.children = [];
  if (node.isLeaf === undefined) node.isLeaf = (node.children?.length ?? 0) === 0;
  if (!node.syncMeta) node.syncMeta = defaultSyncMeta();
  if (!node.status) node.status = 'draft';
  return node as SpecNode;
}
```

- [ ] **Step 2: Verify it loads**

Run: `node --experimental-strip-types .claude/skills/sync-specs/scripts/core/schema.ts`

Expected: No errors (empty script, just type definitions — should exit silently).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/scripts/core/schema.ts
git commit -m "feat(sync-specs): add core schema types and helpers"
```

---

### Task 2: Git Utilities

**Files:**
- Create: `.claude/skills/sync-specs/scripts/utils/git.ts`

- [ ] **Step 1: Write the git utility module**

Create `.claude/skills/sync-specs/scripts/utils/git.ts`:

```typescript
import { execSync } from 'node:child_process';

export interface GitInfo {
  shortHash: string;
  fullHash: string;
  branch: string;
  message: string;
}

export function getGitInfo(repoPath: string = process.cwd()): GitInfo {
  const opts = { cwd: repoPath, encoding: 'utf-8' as const };
  const fullHash = execSync('git rev-parse HEAD', opts).trim();
  const shortHash = execSync('git rev-parse --short HEAD', opts).trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', opts).trim();
  const message = execSync('git log -1 --format=%s', opts).trim();
  return { shortHash, fullHash, branch, message };
}

export function getShortHash(repoPath: string = process.cwd()): string {
  return execSync('git rev-parse --short HEAD', {
    cwd: repoPath, encoding: 'utf-8',
  }).trim();
}

export function getBranch(repoPath: string = process.cwd()): string {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: repoPath, encoding: 'utf-8',
  }).trim();
}
```

- [ ] **Step 2: Verify it loads and works**

Run: `node --experimental-strip-types -e "import { getGitInfo } from './.claude/skills/sync-specs/scripts/utils/git.ts'; console.log(JSON.stringify(getGitInfo(), null, 2));"`

Expected: JSON with `shortHash`, `branch`, `message` matching current repo state.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/scripts/utils/git.ts
git commit -m "feat(sync-specs): add git utility module"
```

---

### Task 3: Path Resolver

**Files:**
- Create: `.claude/skills/sync-specs/scripts/core/path-resolver.ts`

- [ ] **Step 1: Write the path resolver module**

This module converts between node IDs (with parent chain) and file system paths. The storage rules:
- Root node → `<root>/project.json`
- Intermediate node (has children) → `<root>/nodes/<parent-path>/<id>/index.json`
- Leaf node → `<root>/nodes/<parent-path>/<id>.json`

The challenge: resolving a node ID to a file path requires knowing the full parent chain. The resolver maintains a parent→children map loaded from the tree.

Create `.claude/skills/sync-specs/scripts/core/path-resolver.ts`:

```typescript
import * as path from 'node:path';
import type { SpecNode, RootSpecNode } from './schema.ts';

export interface PathResolverOptions {
  /** Root directory of specs tree, e.g. `.harnesson/specs` */
  specsRoot: string;
  /** Whether operating on draft (adds `draft/` prefix to node/design paths) */
  draft?: boolean;
}

/**
 * Resolve the file path for the root node.
 */
export function rootJsonPath(opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, 'project.json');
}

/**
 * Resolve the file path for a non-root node.
 * Requires the node object (to check isLeaf) and parent chain.
 *
 * @param nodePath - dot-separated ancestor IDs from root, e.g. "project.ai-agent.message-input"
 * @param isLeaf - whether the node is a leaf
 */
export function nodeJsonPath(nodePath: string, isLeaf: boolean, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');
  const parts = nodePath.split('.');
  // parts[0] = "project" (root), parts[1..n-1] = ancestors, parts[n] = this node's id
  const relativeDirs = parts.slice(1, -1); // ancestor dirs (between root and this node)
  const id = parts[parts.length - 1];

  const dir = path.join(base, ...relativeDirs);
  if (isLeaf) {
    return path.join(dir, `${id}.json`);
  }
  return path.join(dir, id, 'index.json');
}

/**
 * Resolve the directory that contains a node's children.
 * For root: `<root>/nodes/` (or draft equivalent)
 * For non-root non-leaf: the directory containing index.json
 * For leaf: never called (leaf has no children)
 */
export function nodeDirPath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');

  if (nodePath === 'project') return base;

  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1); // all non-root segments
  return path.join(base, ...relativeDirs);
}

/**
 * Resolve the design document path for a node.
 * @param designRelativePath - the `design` field value from the node, e.g. "design/ai-agent/message-input.md"
 */
export function designDocPath(designRelativePath: string, opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, designRelativePath);
}

/**
 * Build the full nodePath (dot-separated) for a node given its id and parentId.
 * Requires a lookup map of id→nodePath for all existing nodes.
 */
export function buildNodePath(
  nodeId: string,
  parentPath: string | null,
): string {
  if (parentPath === null) return nodeId;
  return `${parentPath}.${nodeId}`;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `node --experimental-strip-types -e "import * as pr from './.claude/skills/sync-specs/scripts/core/path-resolver.ts'; const opts = { specsRoot: '.harnesson/specs' }; console.log(pr.rootJsonPath(opts)); console.log(pr.nodeJsonPath('project.ai-agent', false, opts)); console.log(pr.nodeJsonPath('project.ai-agent.message-input.text-input.text-input-ui', true, opts));"`

Expected:
```
.harnesson/specs/project.json
.harnesson/specs/nodes/ai-agent/index.json
.harnesson/specs/nodes/ai-agent/message-input/text-input/text-input-ui.json
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/scripts/core/path-resolver.ts
git commit -m "feat(sync-specs): add path resolver for node file paths"
```

---

### Task 4: File I/O

**Files:**
- Create: `.claude/skills/sync-specs/scripts/core/file-io.ts`

- [ ] **Step 1: Write the file I/O module**

Create `.claude/skills/sync-specs/scripts/core/file-io.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SpecNode, RootSpecNode } from './schema.ts';
import { fillDefaults } from './schema.ts';
import {
  rootJsonPath,
  nodeJsonPath,
  nodeDirPath,
  designDocPath,
  type PathResolverOptions,
} from './path-resolver.ts';

// ---- Read operations ----

export function readRootNode(opts: PathResolverOptions): RootSpecNode | null {
  const filePath = rootJsonPath(opts);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Read a non-root node by its full dot-separated path.
 * Returns null if file doesn't exist.
 */
export function readNode(
  nodePath: string,
  opts: PathResolverOptions,
): SpecNode | null {
  // We need to know isLeaf to resolve the file path.
  // First try leaf path, then non-leaf path.
  const leafPath = nodeJsonPath(nodePath, true, opts);
  if (fs.existsSync(leafPath)) {
    return JSON.parse(fs.readFileSync(leafPath, 'utf-8'));
  }
  const nonLeafPath = nodeJsonPath(nodePath, false, opts);
  if (fs.existsSync(nonLeafPath)) {
    return JSON.parse(fs.readFileSync(nonLeafPath, 'utf-8'));
  }
  return null;
}

/**
 * Read the full tree starting from root.
 * Returns a flat map of nodePath → SpecNode.
 */
export function readTree(opts: PathResolverOptions): Map<string, SpecNode | RootSpecNode> {
  const result = new Map<string, SpecNode | RootSpecNode>();
  const root = readRootNode(opts);
  if (!root) return result;

  result.set('project', root);

  const queue: string[] = [...root.children];

  while (queue.length > 0) {
    const childPath = queue.shift()!;
    // childPath here is just an id like "ai-agent". We need to find its parent to build the full path.
    // We need a parent lookup. Build it from already-loaded nodes.
    const node = findAndReadNode(childPath, result, opts);
    if (node) {
      const fullNodePath = buildFullPath(node, result);
      result.set(fullNodePath, node);
      if (!node.isLeaf && node.children) {
        queue.push(...node.children.map(c => c)); // queue children by id
      }
    }
  }

  return result;
}

/**
 * Read a subtree starting from a given node path.
 */
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
    const queue: string[] = [...startNode.children];
    while (queue.length > 0) {
      const childId = queue.shift()!;
      const node = findAndReadNode(childId, result, opts);
      if (node) {
        const fullNodePath = buildFullPath(node, result);
        result.set(fullNodePath, node);
        if (!node.isLeaf && node.children) {
          queue.push(...node.children);
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
  const filePath = nodeJsonPath(nodePath, node.isLeaf, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function writeDesignDoc(designRelPath: string, content: string, opts: PathResolverOptions): string {
  const filePath = designDocPath(designRelPath, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ---- Delete operations ----

export function deleteNode(nodePath: string, isLeaf: boolean, opts: PathResolverOptions): boolean {
  const filePath = nodeJsonPath(nodePath, isLeaf, opts);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);

  // For non-leaf nodes, clean up the directory if empty
  if (!isLeaf) {
    const dir = path.dirname(filePath);
    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0) {
      fs.rmdirSync(dir);
    }
  }

  return true;
}

// ---- Merge operation (for update-node) ----

export function mergeNodeData(existing: SpecNode, updates: Partial<SpecNode>): SpecNode {
  const result = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const existingValue = (result as Record<string, unknown>)[key];

    // For array fields: append new items if both exist
    if (Array.isArray(value) && Array.isArray(existingValue)) {
      const existingArr = existingValue as unknown[];
      const newArr = value as unknown[];
      // Merge by concatenating and deduplicating by JSON string
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
      // For object fields: shallow merge
      (result as Record<string, unknown>)[key] = { ...(existingValue as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      // Primitive fields: overwrite
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
    path.join(base, 'design'),
    path.join(base, 'draft', 'nodes'),
    path.join(base, 'draft', 'design'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---- Internal helpers ----

/**
 * Find and read a child node when we know the parent path.
 * Searches all loaded nodes for one whose children array contains childId.
 */
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
  for (const [path, n] of loadedNodes) {
    if (n.id === node.parent) return `${path}.${node.id}`;
  }
  return node.id; // fallback
}
```

- [ ] **Step 2: Verify it compiles**

Run: `node --experimental-strip-types -e "import { readTree, initSpecsDir } from './.claude/skills/sync-specs/scripts/core/file-io.ts'; console.log('module loads ok');"`

Expected: `module loads ok`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/scripts/core/file-io.ts
git commit -m "feat(sync-specs): add file I/O module for specs tree"
```

---

### Task 5: Validator

**Files:**
- Create: `.claude/skills/sync-specs/scripts/core/validator.ts`

- [ ] **Step 1: Write the validator module**

Create `.claude/skills/sync-specs/scripts/core/validator.ts`:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SpecNode, RootSpecNode, Status } from './schema.ts';
import { isKebabCase, isStatus, isTreeScenario, fillDefaults, defaultTestCases } from './schema.ts';
import { getShortHash, getBranch } from '../utils/git.ts';
import {
  readRootNode,
  readTree,
  writeRootNode,
  writeNode,
  designDocPath,
} from './file-io.ts';
import type { PathResolverOptions } from './path-resolver.ts';

// ---- Validation types ----

export interface CheckResult {
  pass: boolean;
  errors: string[];
}

export interface NodeValidationResult {
  nodePath: string;
  nodeId: string;
  checks: {
    format: CheckResult;
    version: CheckResult;
    content: CheckResult;
    uniqueness: CheckResult;
    designDoc: CheckResult;
    coverage: CheckResult & { warnings: string[] };
  };
  needsReview: boolean; // true if leaf review requires LLM source analysis
}

export interface ValidateReport {
  totalNodes: number;
  passed: number;
  failed: number;
  results: NodeValidationResult[];
}

function pass(): CheckResult {
  return { pass: true, errors: [] };
}

function fail(...errors: string[]): CheckResult {
  return { pass: false, errors };
}

// ---- 6 Validation Checks ----

/** Check 1: Format validation */
function checkFormat(node: SpecNode | RootSpecNode): CheckResult {
  const errors: string[] = [];

  if (!node.id) errors.push('id is missing');
  else if (!isKebabCase(node.id) && node.id !== 'project') errors.push(`id "${node.id}" is not kebab-case`);

  if (!node.name) errors.push('name is missing');
  if (typeof node.level !== 'number' || node.level < 1) errors.push('level must be a positive integer');
  if (node.parent !== null && typeof node.parent !== 'string') errors.push('parent must be string or null');
  if (!Array.isArray(node.children)) errors.push('children must be an array');
  else if (node.isLeaf && node.children.length > 0) errors.push('leaf node must have empty children array');
  if (typeof node.isLeaf !== 'boolean') errors.push('isLeaf must be boolean');
  if (!node.summary) errors.push('summary is missing');
  if (!node.status) errors.push('status is missing');
  else if (!isStatus(node.status)) errors.push(`status "${node.status}" is not a valid enum value`);

  if (!node.syncMeta) errors.push('syncMeta is missing');
  else {
    if (!node.syncMeta.baseCommit) errors.push('syncMeta.baseCommit is missing');
    if (!node.syncMeta.branch) errors.push('syncMeta.branch is missing');
    if (!Array.isArray(node.syncMeta.sourceFiles)) errors.push('syncMeta.sourceFiles must be an array');
  }

  // Root node checks
  if ('treeDepth' in node) {
    const root = node as RootSpecNode;
    if (typeof root.treeDepth !== 'number') errors.push('root: treeDepth must be a number');
    if (!root.treeScenario || !isTreeScenario(root.treeScenario)) errors.push('root: treeScenario is invalid');
    if (root.id !== 'project') errors.push('root: id must be "project"');
    if (root.level !== 1) errors.push('root: level must be 1');
    if (root.parent !== null) errors.push('root: parent must be null');
  }

  // specDetail.parameters must be string[] not object[]
  if (node.specDetail) {
    if (Array.isArray(node.specDetail.parameters)) {
      for (let i = 0; i < node.specDetail.parameters.length; i++) {
        if (typeof node.specDetail.parameters[i] !== 'string') {
          errors.push(`specDetail.parameters[${i}] must be a string, got ${typeof node.specDetail.parameters[i]}`);
        }
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 2: Version validation */
function checkVersion(node: SpecNode | RootSpecNode, repoPath: string): CheckResult {
  const errors: string[] = [];
  try {
    const headHash = getShortHash(repoPath);
    if (node.syncMeta.baseCommit !== headHash) {
      errors.push(`baseCommit "${node.syncMeta.baseCommit}" !== HEAD "${headHash}"`);
    }
    const currentBranch = getBranch(repoPath);
    if ('treeScenario' in node) {
      // Root node: check branch
      if (node.syncMeta.branch !== currentBranch) {
        errors.push(`root branch "${node.syncMeta.branch}" !== current "${currentBranch}"`);
      }
    }
  } catch (e) {
    errors.push(`git check failed: ${(e as Error).message}`);
  }
  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 3: Content validation */
function checkContent(node: SpecNode | RootSpecNode): CheckResult {
  const errors: string[] = [];

  // Leaf nodes with sourceFiles must have specDetail and constraints
  if (node.isLeaf && node.syncMeta.sourceFiles && node.syncMeta.sourceFiles.length > 0) {
    if (!node.specDetail) {
      errors.push('leaf node with sourceFiles must have specDetail');
    } else {
      if (!node.specDetail.description) errors.push('specDetail.description is empty');
      if (!node.specDetail.parameters || node.specDetail.parameters.length === 0) {
        errors.push('specDetail.parameters must have at least 1 entry');
      }
    }
    if (!node.constraints || node.constraints.length === 0) {
      errors.push('leaf node with sourceFiles must have at least 1 constraint');
    } else {
      for (let i = 0; i < node.constraints.length; i++) {
        if (!node.constraints[i].trim()) errors.push(`constraints[${i}] is empty`);
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 4: Uniqueness validation */
function checkUniqueness(
  node: SpecNode | RootSpecNode,
  siblings: (SpecNode | RootSpecNode)[],
): CheckResult {
  const errors: string[] = [];

  for (const sibling of siblings) {
    if (sibling.id === node.id) continue;
    if (sibling.name === node.name) {
      errors.push(`duplicate name "${node.name}" with sibling ${sibling.id}`);
    }
    // Exact summary match is a strong signal of duplication
    if (sibling.summary === node.summary && node.summary.length > 0) {
      errors.push(`duplicate summary with sibling ${sibling.id}`);
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 5: Design document validation */
function checkDesignDoc(node: SpecNode | RootSpecNode, opts: PathResolverOptions): CheckResult {
  const errors: string[] = [];

  if (node.design) {
    const docPath = designDocPath(node.design, opts);
    if (!fs.existsSync(docPath)) {
      errors.push(`design file not found: ${docPath}`);
    } else {
      const content = fs.readFileSync(docPath, 'utf-8');
      if (content.trim().length === 0) {
        errors.push(`design file is empty: ${docPath}`);
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 6: Coverage validation */
function checkCoverage(node: SpecNode | RootSpecNode): CheckResult & { warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // acceptanceCriteria should exist for leaf nodes with sourceFiles
  if (node.isLeaf && node.syncMeta.sourceFiles && node.syncMeta.sourceFiles.length > 0) {
    if (!node.acceptanceCriteria || node.acceptanceCriteria.length === 0) {
      errors.push('leaf node with sourceFiles must have at least 1 acceptance criterion');
    } else {
      // Check GWT structure
      for (let i = 0; i < node.acceptanceCriteria.length; i++) {
        const ac = node.acceptanceCriteria[i];
        if (!ac.given || !ac.when || !ac.then) {
          errors.push(`acceptanceCriteria[${i}] must have given, when, then`);
        }
      }
    }

    // Check goals coverage (warning, not error)
    if (node.goals && node.goals.length > 0 && node.acceptanceCriteria) {
      if (node.acceptanceCriteria.length < node.goals.length) {
        warnings.push(`only ${node.acceptanceCriteria.length} acceptanceCriteria for ${node.goals.length} goals`);
      }
    }
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
  };
}

// ---- Main validate function ----

export function validateTree(opts: PathResolverOptions, repoPath: string = process.cwd()): ValidateReport {
  const tree = readTree(opts);
  const results: NodeValidationResult[] = [];

  // Group nodes by parent for uniqueness checks
  const byParent = new Map<string, (SpecNode | RootSpecNode)[]>();
  for (const [, node] of tree) {
    const parentKey = node.parent ?? '__root__';
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey)!.push(node);
  }

  for (const [nodePath, node] of tree) {
    const siblings = byParent.get(node.parent ?? '__root__')?.filter(s => s.id !== node.id) ?? [];

    const formatResult = checkFormat(node);
    const versionResult = checkVersion(node, repoPath);
    const contentResult = checkContent(node);
    const uniquenessResult = checkUniqueness(node, siblings);
    const designDocResult = checkDesignDoc(node, opts);
    const coverageResult = checkCoverage(node);

    const allPassed = formatResult.pass && versionResult.pass && contentResult.pass
      && uniquenessResult.pass && designDocResult.pass && coverageResult.pass;

    results.push({
      nodePath,
      nodeId: node.id,
      checks: {
        format: formatResult,
        version: versionResult,
        content: contentResult,
        uniqueness: uniquenessResult,
        designDoc: designDocResult,
        coverage: coverageResult,
      },
      needsReview: node.isLeaf && (node.syncMeta?.sourceFiles?.length ?? 0) > 0,
    });
  }

  const passed = results.filter(r =>
    Object.values(r.checks).every(c => c.pass)
  ).length;

  return {
    totalNodes: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

// ---- Fix mode ----

export function fixTree(opts: PathResolverOptions, repoPath: string = process.cwd()): ValidateReport {
  const tree = readTree(opts);
  const gitInfo = { shortHash: '', branch: '' };
  try {
    gitInfo.shortHash = getShortHash(repoPath);
    gitInfo.branch = getBranch(repoPath);
  } catch {}

  for (const [nodePath, node] of tree) {
    let modified = false;

    // Fill defaults for missing fields
    if (!node.children) { node.children = []; modified = true; }
    if (node.isLeaf === undefined) { node.isLeaf = node.children.length === 0; modified = true; }
    if (!node.syncMeta) {
      node.syncMeta = { lastSyncAt: new Date().toISOString(), baseCommit: '', baseCommitMessage: '', branch: '', sourceFiles: [] };
      modified = true;
    }
    if (!node.status) { node.status = 'draft'; modified = true; }

    // Fix testCases structure
    if (node.testCases) {
      if (!node.testCases['unit-test']) { node.testCases['unit-test'] = []; modified = true; }
      if (!node.testCases['end-to-end']) { node.testCases['end-to-end'] = []; modified = true; }
      if (!node.testCases['script-test']) { node.testCases['script-test'] = []; modified = true; }
    }

    // Fix specDetail.parameters: convert object[] to string[]
    if (node.specDetail?.parameters) {
      const fixed = node.specDetail.parameters.map(p =>
        typeof p === 'string' ? p : JSON.stringify(p)
      );
      if (fixed.some((f, i) => f !== node.specDetail!.parameters[i])) {
        node.specDetail.parameters = fixed;
        modified = true;
      }
    }

    // Update version info
    if (gitInfo.shortHash && node.syncMeta.baseCommit !== gitInfo.shortHash) {
      node.syncMeta.baseCommit = gitInfo.shortHash;
      modified = true;
    }
    if (gitInfo.branch && node.syncMeta.branch !== gitInfo.branch) {
      node.syncMeta.branch = gitInfo.branch;
      modified = true;
    }

    if (modified) {
      if (nodePath === 'project') {
        writeRootNode(node as RootSpecNode, opts);
      } else {
        writeNode(nodePath, node as SpecNode, opts);
      }
    }
  }

  // Re-validate after fixes
  return validateTree(opts, repoPath);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `node --experimental-strip-types -e "import { validateTree } from './.claude/skills/sync-specs/scripts/core/validator.ts'; console.log('validator loads ok');"`

Expected: `validator loads ok`

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/sync-specs/scripts/core/validator.ts
git commit -m "feat(sync-specs): add 6-check validator with fix mode"
```

---

### Task 6: CLI Entry Point

**Files:**
- Create: `.claude/skills/sync-specs/scripts/specs-cli.ts`

- [ ] **Step 1: Write the CLI entry point**

Create `.claude/skills/sync-specs/scripts/specs-cli.ts`:

```typescript
import * as fs from 'node:fs';

// ---- Minimal arg parser ----

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip node + script
  let command = '';
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

function output(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function error(msg: string): void {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

// ---- Main ----

async function main() {
  const { command, positional, flags } = parseArgs(process.argv);

  const root = flags.root ?? '.harnesson/specs';
  const opts = { specsRoot: root, draft: flags.draft === 'true' };

  switch (command) {
    case 'init-tree': {
      const { initSpecsDir } = await import('./core/file-io.ts');
      initSpecsDir(opts);
      output({ ok: true, message: `Initialized specs tree at ${root}` });
      break;
    }

    case 'read-tree': {
      const { readTree, readSubtree } = await import('./core/file-io.ts');
      const node = flags.node;
      const tree = node ? readSubtree(node, opts) : readTree(opts);
      const obj: Record<string, unknown> = {};
      for (const [path, n] of tree) {
        obj[path] = n;
      }
      output({ ok: true, nodes: obj });
      break;
    }

    case 'read-node': {
      const { readNode, readRootNode } = await import('./core/file-io.ts');
      const nodeId = positional[0];
      if (!nodeId) error('Usage: specs-cli.ts read-node <node-path>');
      const node = nodeId === 'project' ? readRootNode(opts) : readNode(nodeId, opts);
      if (!node) error(`Node not found: ${nodeId}`);
      output({ ok: true, node });
      break;
    }

    case 'create-node': {
      const { writeNode, writeRootNode } = await import('./core/file-io.ts');
      const { fillDefaults } = await import('./core/schema.ts');
      const input = fs.readFileSync(process.stdin.fd, 'utf-8');
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(input);
      } catch (e) {
        error(`Invalid JSON input: ${(e as Error).message}`);
      }

      const nodePath = (data as Record<string, unknown>)._nodePath as string;
      if (!nodePath) error('_nodePath is required in input JSON');

      delete (data as Record<string, unknown>)._nodePath;
      const filled = fillDefaults(data as any);

      if (nodePath === 'project') {
        const filePath = writeRootNode(filled as any, opts);
        output({ ok: true, path: filePath });
      } else {
        const filePath = writeNode(nodePath, filled, opts);
        output({ ok: true, path: filePath });
      }
      break;
    }

    case 'update-node': {
      const { readNode, readRootNode, mergeNodeData, writeNode, writeRootNode } = await import('./core/file-io.ts');
      const nodeId = positional[0];
      if (!nodeId) error('Usage: specs-cli.ts update-node <node-path>');

      const input = fs.readFileSync(process.stdin.fd, 'utf-8');
      let updates: Record<string, unknown>;
      try {
        updates = JSON.parse(input);
      } catch (e) {
        error(`Invalid JSON input: ${(e as Error).message}`);
      }

      const existing = nodeId === 'project' ? readRootNode(opts) : readNode(nodeId, opts);
      if (!existing) error(`Node not found: ${nodeId}`);

      const merged = mergeNodeData(existing as any, updates as any);

      if (nodeId === 'project') {
        const filePath = writeRootNode(merged as any, opts);
        output({ ok: true, path: filePath });
      } else {
        const filePath = writeNode(nodeId, merged, opts);
        output({ ok: true, path: filePath });
      }
      break;
    }

    case 'delete-node': {
      const { readNode, deleteNode, readRootNode, writeRootNode, writeNode } = await import('./core/file-io.ts');
      const nodeId = positional[0];
      if (!nodeId) error('Usage: specs-cli.ts delete-node <node-path>');

      const node = nodeId === 'project' ? readRootNode(opts) : readNode(nodeId, opts);
      if (!node) error(`Node not found: ${nodeId}`);

      // Remove from parent's children array
      if (node.parent) {
        // Find parent path: remove last segment from nodePath
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

      const isLeaf = node.isLeaf;
      if (nodeId !== 'project') {
        deleteNode(nodeId, isLeaf, opts);
      }
      output({ ok: true, deleted: nodeId });
      break;
    }

    case 'validate': {
      const { validateTree, fixTree } = await import('./core/validator.ts');
      const doFix = flags.fix === 'true';
      const report = doFix ? fixTree(opts) : validateTree(opts);
      output({ ok: report.failed === 0, ...report });
      break;
    }

    case 'promote-draft': {
      const { readTree, writeRootNode, writeNode, writeDesignDoc } = await import('./core/file-io.ts');
      const draftOpts = { ...opts, draft: true };
      const draftTree = readTree(draftOpts);

      if (draftTree.size === 0) {
        output({ ok: true, message: 'No draft nodes to promote' });
        break;
      }

      const promotedPaths: string[] = [];

      for (const [nodePath, node] of draftTree) {
        // Update lastSyncAt
        node.syncMeta.lastSyncAt = new Date().toISOString();

        if (nodePath === 'project') {
          const p = writeRootNode(node as any, opts);
          promotedPaths.push(p);
        } else {
          const p = writeNode(nodePath, node as any, opts);
          promotedPaths.push(p);
        }

        // Copy design doc if exists
        if (node.design) {
          const draftDocPath = `.harnesson/specs/draft/${node.design}`;
          if (fs.existsSync(draftDocPath)) {
            const content = fs.readFileSync(draftDocPath, 'utf-8');
            writeDesignDoc(node.design, content, opts);
            promotedPaths.push(node.design);
          }
        }
      }

      // Clean up draft directory
      const draftDir = `${root}/draft`;
      if (fs.existsSync(draftDir)) {
        fs.rmSync(draftDir, { recursive: true });
        fs.mkdirSync(draftDir, { recursive: true });
      }

      output({ ok: true, promoted: promotedPaths.length, paths: promotedPaths });
      break;
    }

    default:
      error(`Unknown command: ${command}\nAvailable: init-tree, read-tree, read-node, create-node, update-node, delete-node, validate, promote-draft`);
  }
}

main().catch((e) => {
  error(`Fatal: ${(e as Error).message}`);
});
```

- [ ] **Step 2: Test help output (invalid command)**

Run: `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts`

Expected: stderr containing "Unknown command:" with the list of available commands.

- [ ] **Step 3: Test read-tree on existing data**

Run: `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts read-tree --root .harnesson/specs/draft`

Expected: JSON output with `ok: true` and all draft nodes.

- [ ] **Step 4: Test validate on existing data**

Run: `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts validate --root .harnesson/specs/draft`

Expected: JSON report showing validation results for all draft nodes.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/sync-specs/scripts/specs-cli.ts
git commit -m "feat(sync-specs): add CLI entry point with all commands"
```

---

### Task 7: SKILL.md Update

**Files:**
- Modify: `.claude/skills/sync-specs/SKILL.md`

This task updates the SKILL.md to use script calls for JSON operations while preserving all non-JSON logic (source analysis, text generation, etc.).

- [ ] **Step 1: Update Step 1 — replace direct file reads with script calls**

In the "Step 1：扫描与变更分析" section, change item 2 from:

```
2. 读取现有规格树（如 `.harnesson/specs/project.json` 存在）
```

to:

```
2. 运行 `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts read-tree --root .harnesson/specs` 读取现有规格树。若 `ok: true` 但 nodes 为空 → 全量模式
```

- [ ] **Step 2: Update Step 2a — replace direct JSON writes with script calls**

Replace the entire "2a — 生成节点 JSON" section with:

```
#### 2a — 生成节点 JSON

对变更清单中每个节点：

1. 分析 `syncMeta.sourceFiles` 提取事实

2. **生成描述性字段**（基于源代码分析）：
   - `summary`：用户视角，1-3 句，禁止技术术语
   - `goals`：用户目标列表，每个一句话，禁止技术实现描述
   - `specDetail`（叶子节点 + 有 sourceFiles 时）：`description`（Markdown，1-3 段用户视角）+ `parameters`（string[]，≥1 条，覆盖 UI/数据/行为维度）。**注意：parameters 必须是 string[]，不是 object[]**
   - `constraints`（叶子节点 + 有 sourceFiles 时）：string[]，≥3 条（适用场景/不适用场景/错误条件各 1）

3. **基于已生成的 goals + specDetail + constraints，生成验收标准**：
   - `acceptanceCriteria`：至少 1 条 Given/When/Then
   - 应引用 specDetail.parameters 中的具体参数和 constraints 中的边界条件

4. 设置 `design`：设计文档相对路径（见 2b）

5. 运行脚本写入节点 JSON：
   ```bash
   echo '<节点数据 JSON>' | node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts create-node --root .harnesson/specs/draft
   ```
   节点数据 JSON 必须包含 `_nodePath` 字段（点分隔的完整路径，如 `project.ai-agent.message-input`）。
   脚本自动校验格式、创建目录、写入文件。
   如果返回 `{ok: false, error: "..."}` → 根据错误信息修复数据 → 重试。

**补全操作（仅增量）：**
运行 `read-node` 获取现有节点 → 仅生成缺失字段 → 运行 `update-node` 传入缺失字段的更新数据：
```bash
echo '<更新数据>' | node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts update-node <nodePath> --root .harnesson/specs
```
数组字段按条目比对去重，新条目追加到末尾。
```

- [ ] **Step 3: Update Step 3 — replace manual validation with script call**

Replace the entire "Step 3：统一校验" section with:

```
### Step 3：统一校验

运行校验脚本：
```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts validate --root .harnesson/specs/draft
```

脚本自动执行全部 6 项校验，输出结构化报告。每个校验项含义：

1. **格式校验**：JSON 可解析、必填字段存在且类型正确、id 为 kebab-case、status 为枚举值
2. **版本校验**：syncMeta.baseCommit 与当前 HEAD 一致、根节点 branch 正确
3. **内容校验**：叶子节点 specDetail/constraints 非空、parameters 为 string[]
4. **唯一性校验**：同 parent 下无重复 name
5. **设计文档校验**：design 路径对应文件存在且非空
6. **覆盖度校验**：acceptanceCriteria 覆盖 goals、GWT 结构完整

处理校验结果：
- 报告中 `needsReview: true` 的叶子节点 → LLM 需要读取其 sourceFiles 源码，按前后端叶子判定标准复核是否应拆分
- 校验失败 → 根据错误信息修复 → 运行 `update-node` 更新 → 重新校验
- 可自动修复的问题 → 加 `--fix` 参数自动修复后重新校验
- 全部通过后继续 Step 4
```

- [ ] **Step 4: Update Step 4 — replace direct reads with script calls**

In "Step 4：用户审核", change item 1 from reading `draft/README.md` to also include:

Add after item 1:
```
   运行 `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts read-tree --root .harnesson/specs/draft` 获取完整节点数据用于展示
```

- [ ] **Step 5: Update Step 5 — replace manual file moves with script call**

Replace the entire "Step 5：转正" section with:

```
### Step 5：转正

运行转正脚本：
```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts promote-draft --root .harnesson/specs
```

脚本自动执行：将 draft/ 文件移动到 specs/、清理 draft/、更新 lastSyncAt。

增量模式下未变更节点文件保持不变。
```

- [ ] **Step 6: Add script reference section at the bottom of SKILL.md**

Append after the "增量模式说明" section:

```
## 脚本工具

本 skill 使用 TypeScript CLI 脚本处理所有 JSON 文件的读写和校验操作，确保格式正确性。

**运行方式：** `node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts <command> [options]`

**命令：**
- `init-tree --root <path>` — 初始化规格目录结构
- `read-tree [--node <id>] [--root <path>]` — 读取规格树
- `read-node <nodePath> [--root <path>]` — 读取单个节点
- `create-node` (stdin JSON, 含 `_nodePath`) — 创建节点
- `update-node <nodePath>` (stdin JSON) — 更新节点
- `delete-node <nodePath>` — 删除节点
- `validate [--root <path>] [--fix]` — 校验规格树
- `promote-draft [--root <path>]` — 草稿转正

**全局选项：**
- `--root <path>` — 规格 root 路径，默认 `.harnesson/specs`
```

- [ ] **Step 7: Verify the updated SKILL.md reads correctly**

Read the full SKILL.md and verify:
- Step 1 references `read-tree`
- Step 2a references `create-node` and `update-node`
- Step 3 references `validate`
- Step 4 references `read-tree`
- Step 5 references `promote-draft`
- All original non-JSON logic (node identification, leaf determination, etc.) is preserved unchanged

- [ ] **Step 8: Commit**

```bash
git add .claude/skills/sync-specs/SKILL.md
git commit -m "feat(sync-specs): update SKILL.md to use CLI scripts for JSON operations"
```

---

### Task 8: End-to-End Verification

**Files:** None (testing only)

- [ ] **Step 1: Test init-tree**

Run:
```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts init-tree --root /tmp/test-specs
```

Expected: `{ok: true}` and `/tmp/test-specs/` directory created with `nodes/`, `design/`, `draft/` subdirs.

- [ ] **Step 2: Test create-node**

Run:
```bash
echo '{"_nodePath":"project","id":"project","name":"Test","level":1,"parent":null,"treeDepth":1,"treeScenario":"single","children":[],"isLeaf":false,"summary":"Test project","status":"draft","syncMeta":{"lastSyncAt":"2026-01-01T00:00:00Z","baseCommit":"abc123","baseCommitMessage":"test","branch":"main","sourceFiles":[]}}' | node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts create-node --root /tmp/test-specs
```

Expected: `{ok: true, path: "..."}` and `project.json` created.

- [ ] **Step 3: Test read-node**

Run:
```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts read-node project --root /tmp/test-specs
```

Expected: `{ok: true, node: {...}}` with the data from Step 2.

- [ ] **Step 4: Test update-node**

Run:
```bash
echo '{"summary":"Updated test project","goals":["New goal"]}' | node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts update-node project --root /tmp/test-specs
```

Expected: `{ok: true}` and re-reading shows updated summary and goals.

- [ ] **Step 5: Test validate on real draft data**

Run:
```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts validate --root .harnesson/specs/draft
```

Expected: Structured report with `totalNodes`, `passed`, `failed`, and per-node check results. Any existing format issues (like the `object[]` parameters problem) should be flagged.

- [ ] **Step 6: Test validate --fix on real draft data**

Run:
```bash
node --experimental-strip-types .claude/skills/sync-specs/scripts/specs-cli.ts validate --fix --root .harnesson/specs/draft
```

Expected: Auto-fixable issues resolved, re-validated report shows fewer failures than Step 5.

- [ ] **Step 7: Clean up test data**

Run: `rm -rf /tmp/test-specs`

- [ ] **Step 8: Final commit (if any fixes from testing)**

```bash
git add -A .claude/skills/sync-specs/scripts/
git commit -m "fix(sync-specs): apply fixes from end-to-end testing"
```

(Only if changes were needed; skip if everything passed cleanly.)
