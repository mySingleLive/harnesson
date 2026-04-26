import { Hono } from 'hono';
import {
  hasData,
  getManifest,
  getFullData,
  getHistoryList,
  getHistoryData,
  resolveBaseDir,
} from '../lib/graph-storage.js';

export const graphRoute = new Hono();

// GET /api/graph/status — check if graph data exists
graphRoute.get('/api/graph/status', async (c) => {
  const projectPath = c.req.query('projectPath');
  if (!projectPath) return c.json({ error: 'projectPath is required' }, 400);

  const baseDir = resolveBaseDir(projectPath);
  const exists = await hasData(baseDir);
  const manifest = exists ? await getManifest(baseDir) : null;

  return c.json({
    hasData: exists,
    lastSyncCommit: manifest?.lastSyncCommit ?? null,
    lastSyncTime: manifest?.lastSyncTime ?? null,
    syncStatus: manifest?.syncStatus ?? 'idle',
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
