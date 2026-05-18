import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { validateTree, fixTree } from '../core/validator.ts';
import { writeRootNode, writeNode, writeDesignDocForNode, initSpecsDir } from '../core/file-io.ts';
import type { PathResolverOptions } from '../core/path-resolver.ts';
import type { SpecNode, RootSpecNode } from '../core/schema.ts';

// ---- Mock git module ----

const mockGetShortHash = vi.fn(() => 'abc1234');
const mockGetBranch = vi.fn(() => 'main');

vi.mock('../utils/git.ts', () => ({
  getShortHash: (...args: unknown[]) => mockGetShortHash(...args),
  getBranch: (...args: unknown[]) => mockGetBranch(...args),
}));

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

function makeValidLeaf(overrides: Partial<SpecNode> = {}): SpecNode {
  return makeNode({
    isLeaf: true,
    specDetail: {
      description: 'A detailed description of the feature',
      parameters: ['param1: string', 'param2: number'],
    },
    constraints: ['Must handle errors', 'Must validate input', 'Must not exceed limits'],
    acceptanceCriteria: [
      { given: 'a user', when: 'they do something', then: 'it should work' },
    ],
    ...overrides,
  });
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-specs-test-'));
  opts = { specsRoot: tmpDir };
  initSpecsDir(opts);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
  mockGetShortHash.mockReturnValue('abc1234');
  mockGetBranch.mockReturnValue('main');
});

// ---- Format check (Check 1) ----

describe('checkFormat', () => {
  it('passes for a valid root node', () => {
    writeRootNode(makeRoot(), opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(true);
  });

  it('fails for missing id', () => {
    const root = makeRoot();
    delete (root as any).id;
    writeRootNode(root, opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(false);
    expect(report.results[0].checks.format.errors).toContainEqual(expect.stringContaining('id is missing'));
  });

  it('fails for non-kebab-case id', () => {
    const root = makeRoot();
    // Root id is "project" which is allowed. Test with a child node.
    const node = makeNode({ id: 'BadId' });
    writeRootNode(makeRoot({ children: ['BadId'] }), opts);
    writeNode('project.BadId', node, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'BadId')!;
    expect(nodeResult.checks.format.pass).toBe(false);
    expect(nodeResult.checks.format.errors).toEqual([expect.stringContaining('not kebab-case')]);
  });

  it('fails for missing name', () => {
    const root = makeRoot();
    delete (root as any).name;
    writeRootNode(root, opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(false);
    expect(report.results[0].checks.format.errors).toContainEqual(expect.stringContaining('name is missing'));
  });

  it('fails for invalid status', () => {
    const root = makeRoot({ status: 'unknown' as any });
    writeRootNode(root, opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(false);
  });

  it('fails for leaf node with non-empty children', () => {
    const node = makeNode({ isLeaf: true, children: ['child1'] });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', node, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.format.pass).toBe(false);
  });

  it('passes for root with correct treeScenario', () => {
    writeRootNode(makeRoot(), opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(true);
  });

  it('fails for root with invalid treeScenario', () => {
    writeRootNode(makeRoot({ treeScenario: 'invalid' as any }), opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(false);
  });

  it('fails for root with wrong id', () => {
    const root = makeRoot();
    root.id = 'not-project';
    // This root has treeDepth/treeScenario so root checks apply
    writeRootNode(root as any, opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(false);
  });

  it('fails for root with non-null parent', () => {
    const root = makeRoot();
    root.parent = 'something';
    writeRootNode(root as any, opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.format.pass).toBe(false);
  });
});

// ---- Version check (Check 2) ----

describe('checkVersion', () => {
  it('passes when baseCommit matches HEAD', () => {
    writeRootNode(makeRoot(), opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.version.pass).toBe(true);
  });

  it('fails when baseCommit differs from HEAD', () => {
    mockGetShortHash.mockReturnValue('different');

    writeRootNode(makeRoot(), opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.version.pass).toBe(false);
  });

  it('fails when root branch differs from current', () => {
    mockGetBranch.mockReturnValue('feature-branch');

    writeRootNode(makeRoot(), opts);
    const report = validateTree(opts, tmpDir);
    expect(report.results[0].checks.version.pass).toBe(false);
  });
});

// ---- Content check (Check 3) ----

describe('checkContent', () => {
  it('passes for leaf node with specDetail and constraints', () => {
    const leaf = makeValidLeaf();
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.content.pass).toBe(true);
  });

  it('fails for leaf node with sourceFiles but no specDetail', () => {
    const leaf = makeNode({ isLeaf: true, sourceFiles: ['src/test.ts'] } as any);
    delete leaf.specDetail;
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.content.pass).toBe(false);
  });

  it('fails for leaf with empty constraints', () => {
    const leaf = makeNode({ isLeaf: true, constraints: [] });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.content.pass).toBe(false);
  });

  it('passes for non-leaf node (no content check)', () => {
    const node = makeNode({ isLeaf: false, children: [] });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', node, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.content.pass).toBe(true);
  });
});

// ---- Uniqueness check (Check 4) ----

describe('checkUniqueness', () => {
  it('passes when siblings have unique names and summaries', () => {
    writeRootNode(makeRoot({ children: ['node-a', 'node-b'] }), opts);
    writeNode('project.node-a', makeValidLeaf({ id: 'node-a', name: 'Node A', summary: 'Summary A' }), opts);
    writeNode('project.node-b', makeValidLeaf({ id: 'node-b', name: 'Node B', summary: 'Summary B' }), opts);
    const report = validateTree(opts, tmpDir);
    for (const r of report.results.filter(r => r.nodeId !== 'project')) {
      expect(r.checks.uniqueness.pass).toBe(true);
    }
  });

  it('fails when siblings have duplicate names', () => {
    writeRootNode(makeRoot({ children: ['node-a', 'node-b'] }), opts);
    writeNode('project.node-a', makeValidLeaf({ id: 'node-a', name: 'Same Name' }), opts);
    writeNode('project.node-b', makeValidLeaf({ id: 'node-b', name: 'Same Name' }), opts);
    const report = validateTree(opts, tmpDir);
    const dupResults = report.results.filter(r => r.nodeId !== 'project');
    for (const r of dupResults) {
      expect(r.checks.uniqueness.pass).toBe(false);
    }
  });

  it('fails when siblings have duplicate summaries', () => {
    writeRootNode(makeRoot({ children: ['node-a', 'node-b'] }), opts);
    writeNode('project.node-a', makeValidLeaf({ id: 'node-a', name: 'Node A', summary: 'Same summary' }), opts);
    writeNode('project.node-b', makeValidLeaf({ id: 'node-b', name: 'Node B', summary: 'Same summary' }), opts);
    const report = validateTree(opts, tmpDir);
    const dupResults = report.results.filter(r => r.nodeId !== 'project');
    for (const r of dupResults) {
      expect(r.checks.uniqueness.pass).toBe(false);
    }
  });
});

// ---- Design doc check (Check 5) ----

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

// ---- Coverage check (Check 6) ----

describe('checkCoverage', () => {
  it('passes for leaf with valid acceptanceCriteria', () => {
    const leaf = makeValidLeaf();
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.coverage.pass).toBe(true);
  });

  it('fails for leaf with sourceFiles but no acceptanceCriteria', () => {
    const leaf = makeNode({ isLeaf: true });
    delete leaf.acceptanceCriteria;
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.coverage.pass).toBe(false);
  });

  it('fails for incomplete GWT structure', () => {
    const leaf = makeValidLeaf({
      acceptanceCriteria: [{ given: '', when: 'something', then: 'result' }],
    });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.coverage.pass).toBe(false);
  });

  it('warns when fewer acceptanceCriteria than goals', () => {
    const leaf = makeValidLeaf({
      goals: ['goal 1', 'goal 2', 'goal 3'],
      acceptanceCriteria: [{ given: 'a', when: 'b', then: 'c' }],
    });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.coverage.warnings.length).toBeGreaterThan(0);
  });

  it('passes for non-leaf node', () => {
    const node = makeNode({ isLeaf: false });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', node, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.checks.coverage.pass).toBe(true);
  });
});

// ---- Validate Report structure ----

describe('validateTree report', () => {
  it('counts passed and failed correctly', () => {
    // Only root, which should pass all checks
    writeRootNode(makeRoot(), opts);
    const report = validateTree(opts, tmpDir);
    expect(report.totalNodes).toBe(1);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(0);
  });

  it('marks leaf nodes with sourceFiles as needsReview', () => {
    const leaf = makeValidLeaf();
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.needsReview).toBe(true);
  });

  it('does not mark nodes without sourceFiles as needsReview', () => {
    const leaf = makeValidLeaf({ syncMeta: { ...makeNode().syncMeta, sourceFiles: [] } });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', leaf, opts);
    const report = validateTree(opts, tmpDir);
    const nodeResult = report.results.find(r => r.nodeId === 'test-node')!;
    expect(nodeResult.needsReview).toBe(false);
  });
});

// ---- Fix mode ----

describe('fixTree', () => {
  it('fills missing defaults', () => {
    const root = makeRoot();
    delete (root as any).children;
    delete (root as any).syncMeta;
    delete (root as any).status;
    writeRootNode(root, opts);

    const report = fixTree(opts, tmpDir);
    // Re-read to verify fixes
    const rootJson = JSON.parse(fs.readFileSync(path.join(tmpDir, 'project.json'), 'utf-8'));
    expect(rootJson.children).toEqual([]);
    expect(rootJson.status).toBe('draft');
    expect(rootJson.syncMeta).toBeDefined();
  });

  it('updates stale baseCommit', () => {
    mockGetShortHash.mockReturnValue('newhash');

    writeRootNode(makeRoot(), opts);
    const report = fixTree(opts, tmpDir);
    const rootJson = JSON.parse(fs.readFileSync(path.join(tmpDir, 'project.json'), 'utf-8'));
    expect(rootJson.syncMeta.baseCommit).toBe('newhash');
  });

  it('updates stale branch', () => {
    mockGetBranch.mockReturnValue('new-branch');

    writeRootNode(makeRoot(), opts);
    fixTree(opts, tmpDir);
    const rootJson = JSON.parse(fs.readFileSync(path.join(tmpDir, 'project.json'), 'utf-8'));
    expect(rootJson.syncMeta.branch).toBe('new-branch');
  });

  it('fixes specDetail.parameters with non-string items', () => {
    const node = makeValidLeaf({
      specDetail: {
        description: 'test',
        parameters: [{ name: 'param1' } as any, 'param2'],
      },
    });
    writeRootNode(makeRoot({ children: ['test-node'] }), opts);
    writeNode('project.test-node', node, opts);

    fixTree(opts, tmpDir);
    const nodeJson = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'nodes', 'test-node', 'node.json'), 'utf-8'),
    );
    expect(nodeJson.specDetail.parameters).toEqual(['{"name":"param1"}', 'param2']);
  });
});
