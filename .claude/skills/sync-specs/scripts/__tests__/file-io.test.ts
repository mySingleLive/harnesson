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
