import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import {
  hasData,
  getManifest,
  getFullData,
  getHistoryList,
  getHistoryData,
  resolveBaseDir,
} from '../lib/graph-storage.js';
import { runSync, cancelSync } from '../lib/sync-engine.js';

export const graphRoute = new Hono();

// GET /api/graph/status — check if graph data exists
graphRoute.get('/api/graph/status', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const exists = await hasData(baseDir);
  const manifest = exists ? await getManifest(baseDir) : null;

  let needsSync = false;
  if (manifest?.lastSyncCommit) {
    try {
      const { execSync } = await import('node:child_process');
      const currentHead = execSync('git rev-parse HEAD', { cwd: projectPath, encoding: 'utf-8' }).trim();
      needsSync = currentHead !== manifest.lastSyncCommit;
    } catch {
      // Not a git repo
    }
  }

  return c.json({
    hasData: exists,
    lastSyncCommit: manifest?.lastSyncCommit ?? null,
    lastSyncTime: manifest?.lastSyncTime ?? null,
    syncStatus: manifest?.syncStatus ?? 'idle',
    needsSync,
  });
});

// GET /api/graph/manifest — get manifest
graphRoute.get('/api/graph/manifest', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const manifest = await getManifest(baseDir);
  if (!manifest) return c.json({ error: 'No manifest found' }, 404);

  return c.json(manifest);
});

// GET /api/graph/data — get all graph data
graphRoute.get('/api/graph/data', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const data = await getFullData(baseDir);
  return c.json(data);
});

// GET /api/graph/history — list history entries
graphRoute.get('/api/graph/history', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const entries = await getHistoryList(baseDir);
  return c.json(entries);
});

// GET /api/graph/history/:timestamp — get specific history data
graphRoute.get('/api/graph/history/:timestamp', async (c) => {
  const projectPath = c.req.query('projectPath');
  const timestamp = c.req.param('timestamp');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);
  if (!timestamp) return c.json({ error: 'timestamp is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const data = await getHistoryData(baseDir, timestamp);
  return c.json(data);
});

// POST /api/graph/sync — start sync with SSE streaming
graphRoute.post('/api/graph/sync', async (c) => {
  const body = await c.req.json();
  const { projectPath, storageLocation, syncType } = body;

  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  return streamSSE(c, async (stream) => {
    const sse = {
      write: (event: string, data: Record<string, unknown>) => {
        stream.writeSSE({ event, data: JSON.stringify(data) });
      },
    };

    await runSync(
      { projectPath, storageLocation: storageLocation ?? 'project', syncType: syncType ?? 'full' },
      sse,
    );

    stream.close();
  });
});

// POST /api/graph/sync/cancel — cancel active sync
graphRoute.post('/api/graph/sync/cancel', async (c) => {
  const body = await c.req.json();
  const { projectPath } = body;

  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const cancelled = cancelSync(projectPath);
  return c.json({ cancelled });
});
