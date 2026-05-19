import { Hono } from 'hono';
import { isAbsolute } from 'node:path';
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
