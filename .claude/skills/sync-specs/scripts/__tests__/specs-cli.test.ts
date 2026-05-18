import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

const CLI = path.resolve(__dirname, '..', 'specs-cli.ts');
const NODE_ARGS = '--experimental-strip-types';

let tmpDir: string;
let specsRoot: string;

function run(cmd: string, stdin?: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const spawnOpts: { cwd: string; encoding: 'utf-8'; input?: string } = {
      cwd: tmpDir,
      encoding: 'utf-8',
    };
    if (stdin) spawnOpts.input = stdin;

    const stdout = execSync(`node ${NODE_ARGS} "${CLI}" ${cmd}`, spawnOpts);
    return { stdout: stdout.trim(), stderr: '', exitCode: 0 };
  } catch (e: any) {
    return {
      stdout: (e.stdout ?? '').toString().trim(),
      stderr: (e.stderr ?? '').toString().trim(),
      exitCode: e.status ?? 1,
    };
  }
}

function parseJson<T = any>(str: string): T {
  return JSON.parse(str);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-specs-cli-'));
  specsRoot = path.join(tmpDir, '.harnesson', 'specs');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---- init-tree ----

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

// ---- create-node / read-node ----

describe('create-node / read-node', () => {
  it('creates and reads a root node', () => {
    run(`init-tree --root "${specsRoot}"`);

    const rootData = JSON.stringify({
      _nodePath: 'project',
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
        baseCommitMessage: 'init',
        branch: 'main',
        sourceFiles: [],
      },
    });

    const createResult = run(`create-node --root "${specsRoot}"`, rootData);
    expect(createResult.exitCode).toBe(0);
    const created = parseJson(createResult.stdout);
    expect(created.ok).toBe(true);

    const readResult = run(`read-node project --root "${specsRoot}"`);
    expect(readResult.exitCode).toBe(0);
    const read = parseJson(readResult.stdout);
    expect(read.ok).toBe(true);
    expect(read.node.name).toBe('Test Project');
  });

  it('creates and reads a child node', () => {
    run(`init-tree --root "${specsRoot}"`);

    // Create root first
    const rootData = JSON.stringify({
      _nodePath: 'project',
      id: 'project',
      name: 'Test Project',
      level: 1,
      parent: null,
      children: ['child-a'],
      isLeaf: false,
      summary: 'A test project',
      treeDepth: 3,
      treeScenario: 'single',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, rootData);

    // Create child
    const childData = JSON.stringify({
      _nodePath: 'project.child-a',
      id: 'child-a',
      name: 'Child A',
      level: 2,
      parent: 'project',
      children: [],
      isLeaf: true,
      summary: 'A child node',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    const createResult = run(`create-node --root "${specsRoot}"`, childData);
    expect(createResult.exitCode).toBe(0);

    const readResult = run(`read-node project.child-a --root "${specsRoot}"`);
    expect(readResult.exitCode).toBe(0);
    const read = parseJson(readResult.stdout);
    expect(read.node.name).toBe('Child A');
  });

  it('errors on missing _nodePath', () => {
    run(`init-tree --root "${specsRoot}"`);
    const result = run(`create-node --root "${specsRoot}"`, JSON.stringify({ id: 'test' }));
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('_nodePath');
  });

  it('errors on invalid JSON', () => {
    run(`init-tree --root "${specsRoot}"`);
    const result = run(`create-node --root "${specsRoot}"`, 'not json');
    expect(result.exitCode).not.toBe(0);
  });
});

// ---- read-tree ----

describe('read-tree', () => {
  it('returns empty tree when no root exists', () => {
    run(`init-tree --root "${specsRoot}"`);
    const result = run(`read-tree --root "${specsRoot}"`);
    expect(result.exitCode).toBe(0);
    const data = parseJson(result.stdout);
    expect(data.ok).toBe(true);
    expect(data.nodes).toEqual({});
  });

  it('reads a full tree with children', () => {
    run(`init-tree --root "${specsRoot}"`);

    const rootData = JSON.stringify({
      _nodePath: 'project',
      id: 'project',
      name: 'Test Project',
      level: 1,
      parent: null,
      children: ['child-a'],
      isLeaf: false,
      summary: 'A test project',
      treeDepth: 2,
      treeScenario: 'flat',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, rootData);

    const childData = JSON.stringify({
      _nodePath: 'project.child-a',
      id: 'child-a',
      name: 'Child A',
      level: 2,
      parent: 'project',
      children: [],
      isLeaf: true,
      summary: 'A child',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, childData);

    const result = run(`read-tree --root "${specsRoot}"`);
    const data = parseJson(result.stdout);
    expect(data.ok).toBe(true);
    expect(Object.keys(data.nodes)).toContain('project');
    expect(Object.keys(data.nodes)).toContain('project.child-a');
  });
});

// ---- update-node ----

describe('update-node', () => {
  it('updates a node with merge behavior', () => {
    run(`init-tree --root "${specsRoot}"`);

    const rootData = JSON.stringify({
      _nodePath: 'project',
      id: 'project',
      name: 'Test Project',
      level: 1,
      parent: null,
      children: [],
      isLeaf: false,
      summary: 'A test project',
      treeDepth: 2,
      treeScenario: 'flat',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, rootData);

    const updateData = JSON.stringify({ name: 'Updated Project', summary: 'New summary' });
    const updateResult = run(`update-node project --root "${specsRoot}"`, updateData);
    expect(updateResult.exitCode).toBe(0);

    const readResult = run(`read-node project --root "${specsRoot}"`);
    const read = parseJson(readResult.stdout);
    expect(read.node.name).toBe('Updated Project');
    expect(read.node.summary).toBe('New summary');
  });

  it('errors on nonexistent node', () => {
    run(`init-tree --root "${specsRoot}"`);
    const result = run(`update-node nonexistent --root "${specsRoot}"`, JSON.stringify({ name: 'test' }));
    expect(result.exitCode).not.toBe(0);
  });
});

// ---- delete-node ----

describe('delete-node', () => {
  it('deletes a leaf node', () => {
    run(`init-tree --root "${specsRoot}"`);

    const rootData = JSON.stringify({
      _nodePath: 'project',
      id: 'project',
      name: 'Test Project',
      level: 1,
      parent: null,
      children: ['child-a'],
      isLeaf: false,
      summary: 'A test project',
      treeDepth: 2,
      treeScenario: 'flat',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, rootData);

    const childData = JSON.stringify({
      _nodePath: 'project.child-a',
      id: 'child-a',
      name: 'Child A',
      level: 2,
      parent: 'project',
      children: [],
      isLeaf: true,
      summary: 'A child',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, childData);

    const deleteResult = run(`delete-node project.child-a --root "${specsRoot}"`);
    expect(deleteResult.exitCode).toBe(0);
    const deleted = parseJson(deleteResult.stdout);
    expect(deleted.ok).toBe(true);

    // Verify child is gone
    const readResult = run(`read-node project.child-a --root "${specsRoot}"`);
    expect(readResult.exitCode).not.toBe(0);
  });

  it('errors when deleting node with children', () => {
    run(`init-tree --root "${specsRoot}"`);

    const rootData = JSON.stringify({
      _nodePath: 'project',
      id: 'project',
      name: 'Test Project',
      level: 1,
      parent: null,
      children: ['parent-a'],
      isLeaf: false,
      summary: 'A test project',
      treeDepth: 3,
      treeScenario: 'flat',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, rootData);

    const parentData = JSON.stringify({
      _nodePath: 'project.parent-a',
      id: 'parent-a',
      name: 'Parent A',
      level: 2,
      parent: 'project',
      children: ['child-b'],
      isLeaf: false,
      summary: 'A parent',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, parentData);

    const result = run(`delete-node project.parent-a --root "${specsRoot}"`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('children');
  });

  it('removes deleted node from parent children array', () => {
    run(`init-tree --root "${specsRoot}"`);

    const rootData = JSON.stringify({
      _nodePath: 'project',
      id: 'project',
      name: 'Test Project',
      level: 1,
      parent: null,
      children: ['child-a', 'child-b'],
      isLeaf: false,
      summary: 'A test project',
      treeDepth: 2,
      treeScenario: 'flat',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${specsRoot}"`, rootData);

    for (const id of ['child-a', 'child-b']) {
      const childData = JSON.stringify({
        _nodePath: `project.${id}`,
        id,
        name: id,
        level: 2,
        parent: 'project',
        children: [],
        isLeaf: true,
        summary: `Node ${id}`,
        status: 'draft',
        syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
      });
      run(`create-node --root "${specsRoot}"`, childData);
    }

    run(`delete-node project.child-a --root "${specsRoot}"`);

    const readResult = run(`read-node project --root "${specsRoot}"`);
    const root = parseJson(readResult.stdout).node;
    expect(root.children).toEqual(['child-b']);
  });
});

// ---- validate ----

describe('validate', () => {
  it('validates an empty tree', () => {
    run(`init-tree --root "${specsRoot}"`);
    const result = run(`validate --root "${specsRoot}"`);
    expect(result.exitCode).toBe(0);
    const data = parseJson(result.stdout);
    // Empty tree, no nodes to validate
    expect(data.totalNodes).toBe(0);
  });
});

// ---- promote-draft ----

describe('promote-draft', () => {
  it('promotes draft to official', () => {
    run(`init-tree --root "${specsRoot}"`);

    // Create a draft root
    const draftRoot = path.join(specsRoot, 'draft');
    const rootData = JSON.stringify({
      _nodePath: 'project',
      id: 'project',
      name: 'Draft Project',
      level: 1,
      parent: null,
      children: [],
      isLeaf: false,
      summary: 'A draft project',
      treeDepth: 1,
      treeScenario: 'single',
      status: 'draft',
      syncMeta: { lastSyncAt: new Date().toISOString(), baseCommit: 'abc', baseCommitMessage: '', branch: 'main', sourceFiles: [] },
    });
    run(`create-node --root "${draftRoot}"`, rootData);

    const promoteResult = run(`promote-draft --root "${specsRoot}"`);
    expect(promoteResult.exitCode).toBe(0);
    const promoted = parseJson(promoteResult.stdout);
    expect(promoted.ok).toBe(true);
    expect(promoted.promoted).toBeGreaterThanOrEqual(1);

    // Verify official tree has the node
    const readResult = run(`read-tree --root "${specsRoot}"`);
    const data = parseJson(readResult.stdout);
    expect(Object.keys(data.nodes)).toContain('project');
    expect(data.nodes['project'].name).toBe('Draft Project');
  });

  it('handles empty draft gracefully', () => {
    run(`init-tree --root "${specsRoot}"`);
    const result = run(`promote-draft --root "${specsRoot}"`);
    expect(result.exitCode).toBe(0);
    const data = parseJson(result.stdout);
    expect(data.ok).toBe(true);
    expect(data.message).toContain('No draft');
  });
});

// ---- migrate ----

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

// ---- unknown command ----

describe('unknown command', () => {
  it('errors on unknown command', () => {
    const result = run(`unknown-cmd --root "${specsRoot}"`);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Unknown command');
  });
});
