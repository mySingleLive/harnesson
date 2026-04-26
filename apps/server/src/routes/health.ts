import { Hono } from 'hono';

export const healthRoute = new Hono();

healthRoute.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
