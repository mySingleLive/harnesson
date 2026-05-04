import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { isAbsolute, normalize } from 'node:path';
import { agentService } from '../lib/agent-service.js';
import { getAvailableCommands } from '../lib/slash-commands.js';
import type { CreateAgentRequest, SendMessageRequest } from '@harnesson/shared';

function validatePath(path: string | undefined): string | null {
  if (!path || !isAbsolute(path) || normalize(path).includes('..')) return null;
  return path;
}

export const agentsRoute = new Hono();

// GET /api/models — list available models
agentsRoute.get('/api/models', async (c) => {
  try {
    const models = await agentService.getSupportedModels();
    return c.json(models);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to fetch models' }, 500);
  }
});

// POST /api/agents — create new agent
agentsRoute.post('/api/agents', async (c) => {
  const body = await c.req.json() as CreateAgentRequest;

  const cwd = validatePath(body.cwd);
  if (!cwd) return c.json({ error: 'cwd must be an absolute path' }, 400);

  if (!body.type) return c.json({ error: 'type is required' }, 400);

  try {
    const agent = await agentService.create({ ...body, cwd });
    return c.json(agent, 201);
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to create agent' }, 500);
  }
});

// GET /api/agents — list all agents
agentsRoute.get('/api/agents', (c) => {
  return c.json(agentService.list());
});

// GET /api/agents/:id — get single agent
agentsRoute.get('/api/agents/:id', (c) => {
  const agent = agentService.get(c.req.param('id'));
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  return c.json(agent);
});

// POST /api/agents/:id/message — send message to agent
agentsRoute.post('/api/agents/:id/message', async (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const body = await c.req.json() as SendMessageRequest;
  if (!body.message?.trim()) return c.json({ error: 'message is required' }, 400);

  try {
    await agentService.sendMessage(agentId, body.message, body.model);
    return c.json({ status: 'accepted' }, 202);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('already processing') ? 409 : 500;
    return c.json({ error: message }, status);
  }
});

// GET /api/agents/:id/stream — SSE stream
agentsRoute.get('/api/agents/:id/stream', async (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  return streamSSE(c, async (stream) => {
    const client = {
      write: async (event: string, data: Record<string, unknown>) => {
        await stream.writeSSE({ event, data: JSON.stringify(data) });
      },
      close: () => {
        stream.close();
      },
    };

    agentService.addSSEClient(agentId, client);

    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: 'heartbeat', data: '{}' }).catch(() => {
        clearInterval(heartbeat);
      });
    }, 30_000);

    await new Promise<void>((resolve) => {
      stream.onAbort(() => {
        agentService.removeSSEClient(agentId, client);
        clearInterval(heartbeat);
        resolve();
      });
    });
  });
});

// POST /api/agents/:id/abort — abort current processing
agentsRoute.post('/api/agents/:id/abort', (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  agentService.abort(agentId);
  return c.json({ status: 'aborted' });
});

// GET /api/slash-commands — list available slash commands
agentsRoute.get('/api/slash-commands', async (c) => {
  try {
    const commands = await getAvailableCommands();
    return c.json({ commands });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to fetch commands' }, 500);
  }
});

// POST /api/agents/:id/command — execute a slash command
agentsRoute.post('/api/agents/:id/command', async (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const body = await c.req.json() as { command: string; args?: string };
  if (!body.command?.trim()) return c.json({ error: 'command is required' }, 400);

  try {
    const result = await agentService.executeCommand(agentId, body.command, body.args);
    return c.json(result, result.success ? 200 : 400);
  } catch (err) {
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Command failed' }, 500);
  }
});

// DELETE /api/agents/:id — destroy agent
agentsRoute.delete('/api/agents/:id', async (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  await agentService.destroy(agentId);
  return c.json({ status: 'destroyed' });
});
