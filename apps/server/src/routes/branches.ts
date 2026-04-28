import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const branchesRoute = new Hono();

// GET /api/projects/:id/branches — list git branches
branchesRoute.get('/api/projects/:id/branches', async (c) => {
  const { id } = c.req.param();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return c.json({ error: 'Project not found' }, 404);

  try {
    const [{ stdout: localRaw }, { stdout: remoteRaw }] = await Promise.all([
      execFileAsync('git', ['branch', '--list'], { cwd: project.path, timeout: 10_000 }),
      execFileAsync('git', ['branch', '-r'], { cwd: project.path, timeout: 10_000 }),
    ]);

    const local: string[] = [];
    let current: string | null = null;

    for (const line of localRaw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('* ')) {
        const name = trimmed.slice(2);
        current = name;
        local.push(name);
      } else {
        local.push(trimmed);
      }
    }

    const remote = remoteRaw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.includes('->'));

    return c.json({ local, remote, current, isGitRepo: true });
  } catch {
    return c.json({ local: [], remote: [], current: null, isGitRepo: false });
  }
});

// POST /api/projects/:id/checkout — switch branch
branchesRoute.post('/api/projects/:id/checkout', async (c) => {
  const { id } = c.req.param();
  const { branch } = await c.req.json();

  if (!branch || typeof branch !== 'string' || /[\n\r\0]/.test(branch)) {
    return c.json({ error: 'branch is required' }, 400);
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return c.json({ error: 'Project not found' }, 404);

  try {
    const isRemote = branch.startsWith('origin/');
    const localName = isRemote ? branch.replace('origin/', '') : branch;

    if (isRemote) {
      await execFileAsync('git', ['checkout', '-b', localName, branch], {
        cwd: project.path,
        timeout: 10_000,
      });
    } else {
      await execFileAsync('git', ['checkout', localName], {
        cwd: project.path,
        timeout: 10_000,
      });
    }

    return c.json({ success: true, branch: localName });
  } catch (err: any) {
    const msg = err.stderr?.toString().trim() || err.message || 'Checkout failed';
    return c.json({ success: false, error: msg }, 400);
  }
});
