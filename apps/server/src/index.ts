import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { openFolderRoute } from './routes/open-folder.js';
import { healthRoute } from './routes/health.js';
import { projectsRoute } from './routes/projects.js';
import { branchesRoute } from './routes/branches.js';
import { graphRoute } from './routes/graph.js';
import { agentsRoute } from './routes/agents.js';

const app = new Hono();

app.use('/*', cors({ origin: 'http://localhost:5173' }));

app.route('/', healthRoute);
app.route('/', openFolderRoute);
app.route('/', projectsRoute);
app.route('/', branchesRoute);
app.route('/', graphRoute);
app.route('/', agentsRoute);

const PORT = Number(process.env.PORT ?? 3456);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`@harnesson/server running on http://localhost:${PORT}`);
});
