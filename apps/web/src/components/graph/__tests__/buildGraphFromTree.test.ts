import { describe, it, expect } from 'vitest';
import { buildGraphFromTree } from '../buildGraphFromTree';
import type { SpecTreeNode } from '@harnesson/shared';

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

  it('maps type from level: 1 -> project, 2 -> domain, 3+ -> feature', () => {
    const result = buildGraphFromTree(root, nodeMap);
    const types = result.nodes.map(n => n.type);
    expect(types).toEqual(['project', 'domain', 'feature', 'domain']);
  });

  it('maps name -> title and summary -> content', () => {
    const result = buildGraphFromTree(root, nodeMap);
    const rootNode = result.nodes.find(n => n.id === 'root')!;
    expect(rootNode.title).toBe('Root');
    expect(rootNode.content).toBe('root node');
    expect(rootNode.status).toBe('draft');
  });

  it('generates edges from parent->child relationships', () => {
    const result = buildGraphFromTree(root, nodeMap);
    const edgeIds = result.edges.map(e => `${e.source}->${e.target}`).sort();
    expect(edgeIds).toEqual(['a->leaf', 'root->a', 'root->b']);
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
