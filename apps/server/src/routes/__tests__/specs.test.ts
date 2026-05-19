import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { createSpecsRoute } from '../../routes/specs.js';
import type { SpecTreeNode } from '@harnesson/shared';
import type { SpecsTreeData } from '../../lib/specs-tree.js';

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

function buildApp(readFn: (projectPath: string) => Promise<SpecsTreeData | null>) {
  const app = new Hono();
  app.route('/', createSpecsRoute(readFn));
  return app;
}

type ReadFn = (projectPath: string) => Promise<SpecsTreeData | null>;

describe('specs/tree API', () => {
  it('returns 400 when projectPath is missing', async () => {
    const res = await buildApp(vi.fn<ReadFn>()).fetch(new Request('http://localhost/api/specs/tree'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for relative projectPath', async () => {
    const res = await buildApp(vi.fn<ReadFn>()).fetch(new Request('http://localhost/api/specs/tree?projectPath=relative/path'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when readSpecsTree returns null', async () => {
    const res = await buildApp(vi.fn<ReadFn>().mockResolvedValue(null)).fetch(new Request('http://localhost/api/specs/tree?projectPath=/abs/path'));
    expect(res.status).toBe(404);
  });

  it('returns tree data on success', async () => {
    const mockFn = vi.fn<ReadFn>().mockResolvedValue({
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
