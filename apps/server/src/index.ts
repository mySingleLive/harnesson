import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { openFolderRoute } from './routes/open-folder.js';
import { healthRoute } from './routes/health.js';
import { projectsRoute } from './routes/projects.js';
import { branchesRoute } from './routes/branches.js';
import { graphRoute } from './routes/graph.js';
import { agentsRoute } from './routes/agents.js';
import { agentService } from './lib/agent-service.js';
import { findAvailablePort } from './lib/find-port.js';

const app = new Hono();

app.use('/*', cors({ origin: 'http://localhost:5173' }));

app.route('/', healthRoute);
app.route('/', openFolderRoute);
app.route('/', projectsRoute);
app.route('/', branchesRoute);
app.route('/', graphRoute);
app.route('/', agentsRoute);

const preferredPort = Number(process.env.PORT ?? 3456);

async function startServer() {
  const PORT = await findAvailablePort(preferredPort);

  if (PORT !== preferredPort) {
    console.log(`Port ${preferredPort} is in use, using ${PORT} instead`);
  }

  const start = () => {
    serve({ fetch: app.fetch, port: PORT }, () => {
      console.log(`@harnesson/server running on http://localhost:${PORT}`);
    });
  };

  try {
    await agentService.restoreAll();
  } catch (err) {
    console.error('Failed to restore agent sessions:', err);
  }
  start();
}

startServer();
