# Agent Chat 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现从前端到 Claude Code SDK 的完整 Agent 聊天闭环，支持多轮对话、实时流式输出、多 Agent 并发。

**Architecture:** 后端通过 AgentAdapter 抽象接口封装 Claude Code SDK，AgentService 管理会话生命周期并通过 SSE 广播流式事件。前端通过 EventSource 接收 SSE 事件，agentStore 管理状态，MessageRenderer 渲染不同消息类型。

**Tech Stack:** Hono.js (SSE streaming), @anthropic-ai/claude-code SDK, Zustand, EventSource API, React

---

## File Structure

### Shared Package
- **Modify** `packages/shared/src/types/agent.ts` — 添加 AgentStreamEvent、AgentMessage、CreateAgentRequest 类型

### Server
- **Modify** `apps/server/package.json` — 添加 @anthropic-ai/claude-code 依赖
- **Create** `apps/server/src/lib/agent-adapter.ts` — AgentAdapter 抽象接口定义
- **Create** `apps/server/src/lib/claude-code-adapter.ts` — ClaudeCodeAdapter SDK 实现
- **Create** `apps/server/src/lib/agent-service.ts` — AgentService 会话管理器
- **Create** `apps/server/src/routes/agents.ts` — Agent API 路由 (6 个端点)
- **Modify** `apps/server/src/index.ts` — 注册 agent 路由

### Web
- **Modify** `apps/web/src/lib/serverApi.ts` — 添加 Agent API 客户端函数
- **Modify** `apps/web/src/stores/agentStore.ts` — 重写为真实后端集成
- **Modify** `apps/web/src/pages/NewSessionPage.tsx` — 连接真实 Agent 创建流程
- **Create** `apps/web/src/components/chat/MessageRenderer.tsx` — 流式消息渲染组件
- **Modify** `apps/web/src/components/layout/AgentPanel.tsx` — 连接真实消息发送
- **Modify** `apps/web/src/components/layout/MainLayout.tsx` — 移除 mock 数据，接入真实 Agent

---

### Task 1: Shared Types — 扩展 Agent 类型定义

**Files:**
- Modify: `packages/shared/src/types/agent.ts`

- [ ] **Step 1: 添加 AgentStreamEvent 和相关类型**

在 `packages/shared/src/types/agent.ts` 末尾追加：

```typescript
export interface AgentStreamEvent {
  type: 'agent.thinking' | 'agent.text' | 'agent.tool_use' | 'agent.tool_result' | 'agent.error' | 'agent.done';
  text?: string;
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  duration?: number;
  message?: string;
  code?: string;
  sessionId?: string;
  tokenUsage?: number;
  reason?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  events?: AgentStreamEvent[];
}

export interface CreateAgentRequest {
  cwd: string;
  type: AgentType;
  model?: string;
  systemPrompt?: string;
  permissionMode: 'auto' | 'manual';
  maxTurns?: number;
}

export interface CreateAgentResponse {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  cwd: string;
  model?: string;
  createdAt: string;
  permissionMode: 'auto' | 'manual';
}

export interface SendMessageRequest {
  message: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  cwd: string;
  branch: string;
  model?: string;
  createdAt: string;
  error?: string;
  permissionMode: 'auto' | 'manual';
  sessionContext?: AgentSessionContext;
}
```

- [ ] **Step 2: 验证类型导出正常**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/shared exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat: add AgentStreamEvent and related types for agent chat"
```

---

### Task 2: Install SDK + AgentAdapter Interface

**Files:**
- Modify: `apps/server/package.json`
- Create: `apps/server/src/lib/agent-adapter.ts`

- [ ] **Step 1: 安装 Claude Code SDK**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server add @anthropic-ai/claude-code`

- [ ] **Step 2: 创建 AgentAdapter 抽象接口**

Create `apps/server/src/lib/agent-adapter.ts`:

```typescript
import type { AgentStreamEvent } from '@harnesson/shared';

export interface SessionConfig {
  cwd: string;
  systemPrompt?: string;
  allowedTools?: string[];
  maxTurns?: number;
}

export interface AgentAdapter {
  sendMessage(agentId: string, message: string): AsyncIterable<AgentStreamEvent>;
  createSession(agentId: string, config: SessionConfig): Promise<void>;
  destroySession(agentId: string): Promise<void>;
  abort(agentId: string): void;
}
```

- [ ] **Step 3: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: Commit**

```bash
git add apps/server/package.json apps/server/pnpm-lock.yaml apps/server/src/lib/agent-adapter.ts
git commit -m "feat: add AgentAdapter interface and install claude-code SDK"
```

---

### Task 3: ClaudeCodeAdapter 实现

**Files:**
- Create: `apps/server/src/lib/claude-code-adapter.ts`

- [ ] **Step 1: 实现 ClaudeCodeAdapter**

Create `apps/server/src/lib/claude-code-adapter.ts`:

```typescript
import { query } from '@anthropic-ai/claude-code';
import type { AgentStreamEvent } from '@harnesson/shared';
import type { AgentAdapter, SessionConfig } from './agent-adapter.js';

const DEFAULT_ALLOWED_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent',
];

interface SessionState {
  sdkSessionId: string | undefined;
  abortController: AbortController | null;
  config: SessionConfig;
}

export class ClaudeCodeAdapter implements AgentAdapter {
  private sessions = new Map<string, SessionState>();

  async createSession(agentId: string, config: SessionConfig): Promise<void> {
    this.sessions.set(agentId, {
      sdkSessionId: undefined,
      abortController: null,
      config,
    });
  }

  async destroySession(agentId: string): Promise<void> {
    this.abort(agentId);
    this.sessions.delete(agentId);
  }

  abort(agentId: string): void {
    const session = this.sessions.get(agentId);
    if (session?.abortController) {
      session.abortController.abort();
      session.abortController = null;
    }
  }

  async *sendMessage(agentId: string, message: string): AsyncIterable<AgentStreamEvent> {
    const session = this.sessions.get(agentId);
    if (!session) {
      yield { type: 'agent.error', message: 'Session not found', code: 'SESSION_NOT_FOUND' };
      return;
    }

    const abortController = new AbortController();
    session.abortController = abortController;

    try {
      yield { type: 'agent.thinking', text: '' };

      const sdkOptions: Record<string, unknown> = {
        cwd: session.config.cwd,
        abortController,
      };

      if (session.sdkSessionId) {
        sdkOptions.resumeSessionId = session.sdkSessionId;
      }

      if (session.config.allowedTools) {
        sdkOptions.allowedTools = session.config.allowedTools;
      } else {
        sdkOptions.allowedTools = DEFAULT_ALLOWED_TOOLS;
      }

      if (session.config.maxTurns) {
        sdkOptions.maxTurns = session.config.maxTurns;
      }

      if (session.config.systemPrompt) {
        sdkOptions.systemPrompt = session.config.systemPrompt;
      }

      const messageStream = query({
        prompt: message,
        options: sdkOptions,
      });

      let sessionId: string | undefined;

      for await (const sdkMessage of messageStream) {
        if (abortController.signal.aborted) break;

        // SDK returns objects with type field
        const msg = sdkMessage as Record<string, unknown>;

        // Capture session ID from init or result messages
        if (msg.sessionId && typeof msg.sessionId === 'string') {
          sessionId = msg.sessionId;
        }

        if (msg.type === 'assistant') {
          const content = msg.content as Array<Record<string, unknown>> | undefined;
          if (content) {
            for (const block of content) {
              if (block.type === 'text' && typeof block.text === 'string') {
                yield { type: 'agent.text', text: block.text };
              } else if (block.type === 'tool_use') {
                yield {
                  type: 'agent.tool_use',
                  tool: block.name as string,
                  input: block.input as Record<string, unknown>,
                };
              }
            }
          }
        } else if (msg.type === 'tool_result') {
          yield {
            type: 'agent.tool_result',
            tool: (msg.toolUseId as string) ?? 'unknown',
            output: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            isError: msg.isError === true,
          };
        } else if (msg.type === 'result') {
          if (msg.sessionId && typeof msg.sessionId === 'string') {
            sessionId = msg.sessionId as string;
          }
        }
      }

      // Persist session ID for resume
      if (sessionId) {
        session.sdkSessionId = sessionId;
      }

      yield {
        type: 'agent.done',
        sessionId,
      };
    } catch (err) {
      if (abortController.signal.aborted) {
        yield { type: 'agent.done', reason: 'aborted' };
      } else {
        yield {
          type: 'agent.error',
          message: err instanceof Error ? err.message : String(err),
          code: 'SDK_ERROR',
        };
      }
    } finally {
      session.abortController = null;
    }
  }
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server exec tsc --noEmit`
Expected: 无错误（可能有 SDK 类型警告，忽略）

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/claude-code-adapter.ts
git commit -m "feat: implement ClaudeCodeAdapter with SDK integration"
```

---

### Task 4: AgentService 会话管理器

**Files:**
- Create: `apps/server/src/lib/agent-service.ts`

- [ ] **Step 1: 实现 AgentService**

Create `apps/server/src/lib/agent-service.ts`:

```typescript
import type { AgentStreamEvent, AgentInfo, CreateAgentRequest, CreateAgentResponse, AgentStatus } from '@harnesson/shared';
import type { AgentAdapter } from './agent-adapter.js';
import { ClaudeCodeAdapter } from './claude-code-adapter.js';

interface SSEClient {
  write: (event: string, data: Record<string, unknown>) => Promise<void>;
  close: () => void;
}

interface AgentState {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  cwd: string;
  branch: string;
  model?: string;
  createdAt: string;
  error?: string;
  permissionMode: 'auto' | 'manual';
  tokenUsage: number;
  sessionContext?: { taskTitle?: string; tokenUsage?: number };
  adapter: AgentAdapter;
  sseClients: Set<SSEClient>;
  eventBuffer: AgentStreamEvent[];
  messageQueue: Promise<void>;
}

let agentCounter = 0;

function nextAgentName(): string {
  agentCounter++;
  return `Agent ${String.fromCharCode(65 + ((agentCounter - 1) % 26))}`;
}

export class AgentService {
  private agents = new Map<string, AgentState>();

  async create(req: CreateAgentRequest): Promise<CreateAgentResponse> {
    const id = crypto.randomUUID();
    const name = nextAgentName();

    const adapter = new ClaudeCodeAdapter();
    const allowedTools = req.permissionMode === 'auto'
      ? ['Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent']
      : undefined;

    await adapter.createSession(id, {
      cwd: req.cwd,
      systemPrompt: req.systemPrompt,
      allowedTools,
      maxTurns: req.maxTurns ?? 50,
    });

    // Determine branch from cwd
    let branch = 'main';
    try {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const { stdout } = await promisify(execFile)('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: req.cwd });
      branch = stdout.trim();
    } catch {}

    const state: AgentState = {
      id,
      name,
      type: req.type,
      status: 'idle',
      cwd: req.cwd,
      branch,
      model: req.model,
      createdAt: new Date().toISOString(),
      permissionMode: req.permissionMode,
      tokenUsage: 0,
      adapter,
      sseClients: new Set(),
      eventBuffer: [],
      messageQueue: Promise.resolve(),
    };

    this.agents.set(id, state);

    return {
      id,
      name,
      type: req.type,
      status: 'idle',
      cwd: req.cwd,
      model: req.model,
      createdAt: state.createdAt,
      permissionMode: req.permissionMode,
    };
  }

  async sendMessage(agentId: string, message: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');
    if (agent.status === 'running') throw new Error('Agent is already processing');

    agent.status = 'running';
    this.broadcast(agentId, { type: 'agent.thinking', text: '' });

    // Chain onto the message queue to ensure serial processing
    agent.messageQueue = agent.messageQueue.then(async () => {
      try {
        for await (const event of agent.adapter.sendMessage(agentId, message)) {
          this.broadcast(agentId, event);

          if (event.type === 'agent.done') {
            agent.tokenUsage = event.tokenUsage ?? agent.tokenUsage;
          }
          if (event.type === 'agent.error') {
            agent.error = event.message;
          }
        }

        agent.status = agent.error ? 'error' : 'idle';
        if (agent.status === 'idle') {
          agent.error = undefined;
        }
      } catch (err) {
        agent.status = 'error';
        agent.error = err instanceof Error ? err.message : String(err);
        this.broadcast(agentId, {
          type: 'agent.error',
          message: agent.error,
          code: 'PROCESSING_ERROR',
        });
      }
    });
  }

  addSSEClient(agentId: string, client: SSEClient): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.sseClients.add(client);

    // Send buffered events to new client
    for (const event of agent.eventBuffer) {
      client.write(event.type, event as unknown as Record<string, unknown>).catch(() => {});
    }
  }

  removeSSEClient(agentId: string, client: SSEClient): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.sseClients.delete(client);
  }

  abort(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    agent.adapter.abort(agentId);
  }

  async destroy(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.adapter.abort(agentId);
    await agent.adapter.destroySession(agentId);

    for (const client of agent.sseClients) {
      client.close();
    }

    this.agents.delete(agentId);
  }

  list(): AgentInfo[] {
    return Array.from(this.agents.values()).map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type as AgentInfo['type'],
      status: a.status,
      cwd: a.cwd,
      branch: a.branch,
      model: a.model,
      createdAt: a.createdAt,
      error: a.error,
      permissionMode: a.permissionMode,
      sessionContext: a.sessionContext,
    }));
  }

  get(agentId: string): AgentInfo | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;
    return {
      id: agent.id,
      name: agent.name,
      type: agent.type as AgentInfo['type'],
      status: agent.status,
      cwd: agent.cwd,
      branch: agent.branch,
      model: agent.model,
      createdAt: agent.createdAt,
      error: agent.error,
      permissionMode: agent.permissionMode,
      sessionContext: agent.sessionContext,
    };
  }

  private broadcast(agentId: string, event: AgentStreamEvent): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Buffer events for reconnecting clients
    agent.eventBuffer.push(event);
    if (agent.eventBuffer.length > 200) {
      agent.eventBuffer = agent.eventBuffer.slice(-100);
    }

    for (const client of agent.sseClients) {
      client.write(event.type, event as unknown as Record<string, unknown>).catch(() => {
        agent.sseClients.delete(client);
      });
    }
  }
}

// Singleton instance
export const agentService = new AgentService();
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/agent-service.ts
git commit -m "feat: implement AgentService session manager with SSE broadcasting"
```

---

### Task 5: Agent API 路由

**Files:**
- Create: `apps/server/src/routes/agents.ts`
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: 创建 Agent 路由**

Create `apps/server/src/routes/agents.ts`:

```typescript
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { isAbsolute, normalize } from 'node:path';
import { agentService } from '../lib/agent-service.js';
import type { CreateAgentRequest, SendMessageRequest } from '@harnesson/shared';

function validatePath(path: string | undefined): string | null {
  if (!path || !isAbsolute(path) || normalize(path).includes('..')) return null;
  return path;
}

export const agentsRoute = new Hono();

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
    await agentService.sendMessage(agentId, body.message);
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

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: 'heartbeat', data: '{}' }).catch(() => {
        clearInterval(heartbeat);
      });
    }, 30_000);

    // Wait until stream closes (client disconnects)
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

// DELETE /api/agents/:id — destroy agent
agentsRoute.delete('/api/agents/:id', async (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  await agentService.destroy(agentId);
  return c.json({ status: 'destroyed' });
});
```

- [ ] **Step 2: 注册路由到 server**

Modify `apps/server/src/index.ts` — 添加 agents route import 和注册：

```typescript
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
```

- [ ] **Step 3: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 4: 手动测试 API 端点**

启动服务器:
Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server run dev`

在另一个终端测试创建 Agent (用一个不存在的路径验证错误处理):
Run: `curl -s -X POST http://localhost:3456/api/agents -H 'Content-Type: application/json' -d '{"cwd":"/tmp","type":"claude-code","permissionMode":"auto"}'`
Expected: 201, 返回 `{id, name, type, status, cwd, createdAt, permissionMode}`

测试列出 Agents:
Run: `curl -s http://localhost:3456/api/agents`
Expected: 200, 返回包含刚创建 Agent 的数组

测试删除:
Run: `curl -s -X DELETE http://localhost:3456/api/agents/<ID_FROM_CREATE>`
Expected: 200, `{status: "destroyed"}`

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/routes/agents.ts apps/server/src/index.ts
git commit -m "feat: add agent API routes with SSE streaming"
```

---

### Task 6: Frontend API Layer — Agent API 客户端

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`

- [ ] **Step 1: 添加 Agent API 函数**

在 `apps/web/src/lib/serverApi.ts` 末尾追加：

```typescript
// --- Agent API ---

export interface CreateAgentResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  cwd: string;
  model?: string;
  createdAt: string;
  permissionMode: 'auto' | 'manual';
}

export interface AgentInfoResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  cwd: string;
  branch: string;
  model?: string;
  createdAt: string;
  error?: string;
  permissionMode: 'auto' | 'manual';
  sessionContext?: { taskTitle?: string; tokenUsage?: number };
}

export async function createAgent(opts: {
  cwd: string;
  type: string;
  model?: string;
  permissionMode?: 'auto' | 'manual';
  systemPrompt?: string;
  maxTurns?: number;
}): Promise<CreateAgentResponse> {
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cwd: opts.cwd,
      type: opts.type,
      model: opts.model,
      permissionMode: opts.permissionMode ?? 'auto',
      systemPrompt: opts.systemPrompt,
      maxTurns: opts.maxTurns,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to create agent: ${res.status}`);
  }
  return res.json();
}

export async function listAgents(): Promise<AgentInfoResponse[]> {
  const res = await fetch('/api/agents');
  if (!res.ok) throw new Error(`Failed to list agents: ${res.status}`);
  return res.json();
}

export async function sendAgentMessage(agentId: string, message: string): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to send message: ${res.status}`);
  }
}

export async function abortAgent(agentId: string): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/abort`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to abort agent: ${res.status}`);
}

export async function destroyAgent(agentId: string): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to destroy agent: ${res.status}`);
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/serverApi.ts
git commit -m "feat: add agent API client functions"
```

---

### Task 7: agentStore 重写 — 真实后端集成

**Files:**
- Modify: `apps/web/src/stores/agentStore.ts`

- [ ] **Step 1: 重写 agentStore**

Replace the entire contents of `apps/web/src/stores/agentStore.ts` with:

```typescript
import { create } from 'zustand';
import type { Agent, AgentPanelState, AgentStreamEvent, AgentMessage } from '@harnesson/shared';
import * as api from '@/lib/serverApi';

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  messages: Record<string, AgentMessage[]>;
  eventSources: Record<string, EventSource>;
  isStreaming: Record<string, boolean>;

  setActiveAgent: (id: string | null) => void;
  updatePanelState: (id: string, state: Partial<AgentPanelState>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;

  createAgent: (opts: {
    cwd: string;
    type: string;
    model?: string;
    permissionMode?: 'auto' | 'manual';
    taskTitle?: string;
  }) => Promise<Agent>;

  sendMessage: (agentId: string, text: string) => Promise<void>;
  appendStreamEvent: (agentId: string, event: AgentStreamEvent) => void;
  connectSSE: (agentId: string) => void;
  disconnectSSE: (agentId: string) => void;
  abortAgent: (agentId: string) => Promise<void>;
  destroyAgent: (agentId: string) => Promise<void>;
  loadAgents: () => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  activeAgentId: null,
  messages: {},
  eventSources: {},
  isStreaming: {},

  setActiveAgent: (id) => set({ activeAgentId: id }),

  updatePanelState: (id, state) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, panelState: { ...a.panelState, ...state } } : a,
      ),
    })),

  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  createAgent: async (opts) => {
    const response = await api.createAgent({
      cwd: opts.cwd,
      type: opts.type,
      model: opts.model,
      permissionMode: opts.permissionMode ?? 'auto',
    });

    const agent: Agent = {
      id: response.id,
      name: response.name,
      type: response.type as Agent['type'],
      status: 'idle',
      projectId: '', // will be populated from cwd
      branch: '',
      worktreePath: response.cwd,
      model: response.model,
      createdAt: response.createdAt,
      panelState: { isOpen: true, isMaximized: true },
      sessionContext: { taskTitle: opts.taskTitle ?? '', tokenUsage: 0 },
    };

    set((s) => ({
      agents: [...s.agents, agent],
      activeAgentId: agent.id,
      messages: { ...s.messages, [agent.id]: [] },
    }));

    get().connectSSE(agent.id);

    return agent;
  },

  sendMessage: async (agentId, text) => {
    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    set((s) => ({
      messages: {
        ...s.messages,
        [agentId]: [...(s.messages[agentId] ?? []), userMsg],
      },
      isStreaming: { ...s.isStreaming, [agentId]: true },
    }));

    try {
      await api.sendAgentMessage(agentId, text);
    } catch (err) {
      get().appendStreamEvent(agentId, {
        type: 'agent.error',
        message: err instanceof Error ? err.message : 'Failed to send message',
        code: 'SEND_ERROR',
      });
    }
  },

  appendStreamEvent: (agentId, event) => {
    // Accumulate agent events into the last agent message
    set((s) => {
      const msgs = s.messages[agentId] ?? [];
      const lastMsg = msgs[msgs.length - 1];

      if (event.type === 'agent.done' || event.type === 'agent.error') {
        return {
          isStreaming: { ...s.isStreaming, [agentId]: false },
          agents: s.agents.map((a) =>
            a.id === agentId
              ? { ...a, status: event.type === 'agent.error' ? 'error' : 'idle', error: event.type === 'agent.error' ? event.message : undefined }
              : a,
          ),
        };
      }

      if (lastMsg && lastMsg.role === 'agent') {
        const updatedMsg = { ...lastMsg, events: [...(lastMsg.events ?? []), event] };
        // Update content from text events
        if (event.type === 'agent.text' && event.text) {
          updatedMsg.content = (lastMsg.content ?? '') + event.text;
        }
        return {
          messages: {
            ...s.messages,
            [agentId]: [...msgs.slice(0, -1), updatedMsg],
          },
        };
      }

      // Create new agent message
      const agentMsg: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: event.type === 'agent.text' ? (event.text ?? '') : '',
        timestamp: new Date().toISOString(),
        events: [event],
      };
      return {
        messages: {
          ...s.messages,
          [agentId]: [...msgs, agentMsg],
        },
      };
    });
  },

  connectSSE: (agentId) => {
    const existing = get().eventSources[agentId];
    if (existing) {
      existing.close();
    }

    const es = new EventSource(`/api/agents/${encodeURIComponent(agentId)}/stream`);

    const eventTypes = [
      'agent.thinking',
      'agent.text',
      'agent.tool_use',
      'agent.tool_result',
      'agent.error',
      'agent.done',
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as AgentStreamEvent;
          get().appendStreamEvent(agentId, data);
        } catch {}
      });
    }

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    set((s) => ({
      eventSources: { ...s.eventSources, [agentId]: es },
    }));
  },

  disconnectSSE: (agentId) => {
    const es = get().eventSources[agentId];
    if (es) {
      es.close();
      set((s) => {
        const { [agentId]: _, ...rest } = s.eventSources;
        return { eventSources: rest };
      });
    }
  },

  abortAgent: async (agentId) => {
    await api.abortAgent(agentId);
  },

  destroyAgent: async (agentId) => {
    get().disconnectSSE(agentId);
    await api.destroyAgent(agentId);
    set((s) => {
      const { [agentId]: _msg, ...restMsgs } = s.messages;
      const { [agentId]: _stream, ...restStreams } = s.isStreaming;
      return {
        agents: s.agents.filter((a) => a.id !== agentId),
        messages: restMsgs,
        isStreaming: restStreams,
        activeAgentId: s.activeAgentId === agentId ? null : s.activeAgentId,
      };
    });
  },

  loadAgents: async () => {
    try {
      const agentsInfo = await api.listAgents();
      const agents: Agent[] = agentsInfo.map((info) => ({
        id: info.id,
        name: info.name,
        type: info.type as Agent['type'],
        status: info.status as Agent['status'],
        projectId: '',
        branch: info.branch,
        worktreePath: info.cwd,
        model: info.model,
        createdAt: info.createdAt,
        error: info.error,
        panelState: { isOpen: false, isMaximized: false },
        sessionContext: info.sessionContext,
      }));
      set({ agents });

      // Reconnect SSE for active agents
      for (const agent of agents) {
        if (agent.status === 'running') {
          get().connectSSE(agent.id);
        }
      }
    } catch {}
  },
}));
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/agentStore.ts
git commit -m "feat: rewrite agentStore with real backend integration and SSE"
```

---

### Task 8: NewSessionPage — 真实 Agent 创建

**Files:**
- Modify: `apps/web/src/pages/NewSessionPage.tsx`

- [ ] **Step 1: 更新 NewSessionPage 使用真实 API**

Replace the entire contents of `apps/web/src/pages/NewSessionPage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Layers, GitBranch, ChevronDown, ArrowUp, Sparkles, Bug, Code, TestTube } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

const quickActions = [
  { label: '创建新功能', icon: Sparkles, prompt: 'Help me create a new feature: ' },
  { label: '修复 Bug', icon: Bug, prompt: 'Help me fix a bug: ' },
  { label: '代码审查', icon: Code, prompt: 'Review the code changes in this project' },
  { label: '编写测试', icon: TestTube, prompt: 'Write tests for the main modules: ' },
];

export function NewSessionPage() {
  const [input, setInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const createAgent = useAgentStore((s) => s.createAgent);
  const { activeProjectId, activeBranch, projects } = useProjectStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === activeProjectId);
  const projectPath = project?.path ?? '';
  const branch = activeBranch ?? 'main';

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !projectPath || isCreating) return;

    setIsCreating(true);
    try {
      await createAgent({
        cwd: projectPath,
        type: 'claude-code',
        taskTitle: text,
      });
      // Send the first message after creation
      const agentId = useAgentStore.getState().activeAgentId;
      if (agentId) {
        await useAgentStore.getState().sendMessage(agentId, text);
      }
      navigate('/projects');
      setInput('');
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-harness-content px-4">
      <h1 className="mb-8 text-[42px] font-bold tracking-wide text-harness-accent">
        HARNESSON
      </h1>

      <div className="w-full max-w-[700px]">
        <div className="rounded-2xl border border-white/10 bg-harness-sidebar transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={projectPath ? "Message Harnesson...  Type @ for files, / for commands" : "请先选择或创建一个项目"}
            className="h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-harness-text outline-none placeholder:text-gray-600"
            rows={1}
            disabled={!projectPath || isCreating}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Plus className="h-[18px] w-[18px]" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">Claude Code</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{branch}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                Sonnet 4.7
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || !projectPath || isCreating}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:brightness-110 disabled:opacity-40"
              >
                <ArrowUp className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {quickActions.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              onClick={() => handleQuickAction(prompt)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-gray-400 transition-colors hover:border-harness-accent/30 hover:bg-harness-accent/[0.05] hover:text-harness-accent"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-2 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-harness-sidebar px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-harness-sidebar px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/NewSessionPage.tsx
git commit -m "feat: wire NewSessionPage to real agent creation API"
```

---

### Task 9: MessageRenderer 组件 — 流式消息渲染

**Files:**
- Create: `apps/web/src/components/chat/MessageRenderer.tsx`

- [ ] **Step 1: 创建 MessageRenderer 组件**

Create directory and file `apps/web/src/components/chat/MessageRenderer.tsx`:

```typescript
import type { AgentMessage, AgentStreamEvent } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface MessageRendererProps {
  message: AgentMessage;
  agentName: string;
  isStreaming: boolean;
}

export function MessageRenderer({ message, agentName, isStreaming }: MessageRendererProps) {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />;
  }

  return <AgentMessageBubble events={message.events ?? []} content={message.content} agentName={agentName} isStreaming={isStreaming} />;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="border-b border-white/[0.04] bg-harness-accent/[0.04] px-4 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-harness-accent">You</div>
      <div className="text-[13px] leading-relaxed text-gray-300">{content}</div>
    </div>
  );
}

function AgentMessageBubble({ events, content, agentName, isStreaming }: {
  events: AgentStreamEvent[];
  content: string;
  agentName: string;
  isStreaming: boolean;
}) {
  return (
    <div className="border-b border-white/[0.04] px-4 py-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-green-500">{agentName}</span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-[11px] text-purple-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            thinking...
          </span>
        )}
      </div>

      {/* Text content */}
      {content && (
        <div className="border-l-2 border-green-500/40 pl-3 text-[13px] leading-relaxed text-gray-300">
          {content}
        </div>
      )}

      {/* Tool events */}
      <div className="mt-2 space-y-2">
        {events
          .filter((e) => e.type === 'agent.tool_use' || e.type === 'agent.tool_result')
          .map((event, i) => (
            <ToolEventCard key={i} event={event} />
          ))}
      </div>

      {/* Error */}
      {events.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={i} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}

function ToolEventCard({ event }: { event: AgentStreamEvent }) {
  if (event.type === 'agent.tool_use') {
    return (
      <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
        <div className="flex items-center gap-2 bg-[#1a1a2e] px-2.5 py-1 text-[11px] text-gray-500">
          <span>🔧</span>
          <span className="font-medium text-gray-400">{event.tool}</span>
          {event.input?.file_path && (
            <span className="text-gray-600">{event.input.file_path as string}</span>
          )}
          {event.input?.command && (
            <span className="truncate text-gray-600 font-mono">{event.input.command as string}</span>
          )}
        </div>
        {event.input && !event.input.file_path && !event.input.command && (
          <div className="px-2.5 py-1.5 font-mono text-[11px] text-gray-600">
            {JSON.stringify(event.input, null, 2).slice(0, 200)}
          </div>
        )}
      </div>
    );
  }

  if (event.type === 'agent.tool_result') {
    return (
      <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
        <div className="flex items-center justify-between bg-[#1a1a2e] px-2.5 py-1 text-[11px]">
          <span className={event.isError ? 'text-red-400' : 'text-green-500'}>
            {event.isError ? '✗' : '✓'} Result
          </span>
          {event.duration != null && (
            <span className="text-gray-600">{event.duration}ms</span>
          )}
        </div>
        {event.output && (
          <div className="max-h-[200px] overflow-auto px-2.5 py-1.5 font-mono text-[11px] text-gray-500 whitespace-pre-wrap">
            {event.output.slice(0, 1000)}
          </div>
        )}
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "feat: add MessageRenderer for agent stream events"
```

---

### Task 10: AgentPanel + MainLayout 集成

**Files:**
- Modify: `apps/web/src/components/layout/AgentPanel.tsx`
- Modify: `apps/web/src/components/layout/MainLayout.tsx`

- [ ] **Step 1: 更新 AgentPanel 使用真实消息发送**

Replace the entire contents of `apps/web/src/components/layout/AgentPanel.tsx`:

```typescript
import { useState } from 'react';
import { Plus, Layers, GitBranch, ImageIcon, FileText, Terminal, Wrench, Network, ChevronDown, ArrowUp, StopCircle } from 'lucide-react';
import type { Agent, AgentMessage } from '@harnesson/shared';
import { useAgentStore } from '@/stores/agentStore';
import { AgentContextHeader } from './AgentContextHeader';
import { MessageRenderer } from '@/components/chat/MessageRenderer';

interface AgentPanelProps {
  agent: Agent;
  messages: AgentMessage[];
  isStreaming: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function AgentPanel({ agent, messages, isStreaming, isMaximized, onToggleMaximize, onClose }: AgentPanelProps) {
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const abortAgent = useAgentStore((s) => s.abortAgent);
  const destroyAgent = useAgentStore((s) => s.destroyAgent);

  const width = isMaximized ? 'flex-1' : 'w-[440px] flex-shrink-0';

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(agent.id, text);
  };

  const handleAbort = async () => {
    await abortAgent(agent.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`relative flex h-full flex-col border-r border-harness-border bg-harness-chat ${width}`}>
      <AgentContextHeader
        agent={agent}
        onToggleMaximize={onToggleMaximize}
        onClose={onClose}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <MessageRenderer
            key={msg.id}
            message={msg}
            agentName={agent.name}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'agent'}
          />
        ))}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-600">
            Waiting for response...
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
        <div className="rounded-2xl border border-white/10 bg-harness-sidebar transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agent.name}...  Type @ for files, / for commands`}
            className="h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-harness-text outline-none placeholder:text-gray-600"
            rows={1}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300"
                >
                  <Plus className="h-[18px] w-[18px]" />
                </button>
                {showPlusMenu && (
                  <div className="absolute bottom-[38px] left-0 z-[9999] min-w-[200px] rounded-lg border border-white/10 bg-[#252540] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    <DropdownItem icon={ImageIcon} label="Add Image" shortcut="⌘ V" />
                    <DropdownItem icon={FileText} label="Reference File" shortcut="@" />
                    <DropdownItem icon={Terminal} label="Slash Command" shortcut="/" />
                    <DropdownItem icon={Wrench} label="Tools" />
                    <DropdownItem icon={Network} label="MCP Servers" />
                  </div>
                )}
              </div>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">{agent.type === 'claude-code' ? 'Claude Code' : agent.type}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{agent.branch}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                {agent.model ?? 'Sonnet 4.7'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isStreaming ? (
                <button
                  onClick={handleAbort}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <StopCircle className="h-[15px] w-[15px]" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:brightness-110 disabled:opacity-40"
                >
                  <ArrowUp className="h-[15px] w-[15px]" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行
        </div>
      </div>
    </div>
  );
}

function DropdownItem({ icon: Icon, label, shortcut }: { icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string }) {
  return (
    <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200">
      <Icon className="h-3.5 w-3.5 text-gray-500" />
      {label}
      {shortcut && <span className="ml-auto text-[11px] text-gray-600">{shortcut}</span>}
    </button>
  );
}
```

- [ ] **Step 2: 更新 MainLayout 移除 mock 数据，接入真实 Agent**

Replace the entire contents of `apps/web/src/components/layout/MainLayout.tsx`:

```typescript
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { AgentPanel } from './AgentPanel';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { useProjectActions } from '@/hooks/useProjectActions';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

export function MainLayout() {
  const { agents, activeAgentId, setActiveAgent, updatePanelState, messages, isStreaming, loadAgents, destroyAgent } = useAgentStore();
  const switchProject = useProjectStore((s) => s.switchProject);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const runningCount = agents.filter((a) => a.status === 'running').length;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createProject, openFolder, isCreating } = useProjectActions();

  const handleAgentClick = (agent: typeof agents[number]) => {
    setActiveAgent(agent.id);
    updatePanelState(agent.id, { isOpen: true });
    switchProject(agent.projectId, agent.branch);
  };

  const handleClose = () => {
    if (activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: false });
    }
    setActiveAgent(null);
  };

  const handleToggleMaximize = () => {
    if (activeAgent) {
      updatePanelState(activeAgent.id, { isMaximized: !activeAgent.panelState.isMaximized });
    }
  };

  const location = useLocation();

  useEffect(() => {
    loadProjects();
    loadAgents();
  }, [loadProjects, loadAgents]);

  useEffect(() => {
    if (location.pathname === '/' && activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: false });
      setActiveAgent(null);
    }
  }, [location.pathname]);

  const showPanel = activeAgent && activeAgent.panelState.isOpen;

  return (
    <div className="flex h-screen flex-col">
      <Topbar
        runningAgentCount={runningCount}
        onCreateProject={() => setShowCreateModal(true)}
        onOpenFolder={() => { openFolder(); }}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          agents={agents}
          activeAgentId={activeAgentId ?? undefined}
          onAgentClick={handleAgentClick}
        />
        {showPanel && (
          <AgentPanel
            agent={activeAgent}
            messages={messages[activeAgent.id] ?? []}
            isStreaming={isStreaming[activeAgent.id] ?? false}
            isMaximized={activeAgent.panelState.isMaximized}
            onToggleMaximize={handleToggleMaximize}
            onClose={handleClose}
          />
        )}
        {!activeAgent?.panelState.isMaximized && (
          <main className="flex-1 overflow-auto bg-harness-content">
            <Outlet />
          </main>
        )}
      </div>
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createProject}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: 修复 MainLayout 中缺失的 useState import**

检查 MainLayout.tsx 第一行是否包含 `useState`。如果缺少，添加到 import 中：
```typescript
import { useState, useEffect } from 'react';
```

- [ ] **Step 4: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx apps/web/src/components/layout/MainLayout.tsx
git commit -m "feat: wire AgentPanel and MainLayout to real agent backend"
```

---

### Task 11: 端到端集成测试

**Files:** 无新文件

- [ ] **Step 1: 启动完整应用**

Terminal 1 — 启动后端:
Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server run dev`
Expected: `@harnesson/server running on http://localhost:3456`

Terminal 2 — 启动前端:
Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web run dev`
Expected: Vite dev server on http://localhost:5173

- [ ] **Step 2: 测试创建 Agent 流程**

1. 打开 http://localhost:5173
2. 确保已有项目（如果没有，先创建一个）
3. 在 NewSessionPage 输入一条提示词
4. 点击发送

Expected:
- Agent 创建成功，跳转到主页
- AgentPanel 打开，显示 Agent 名称和状态
- SSE 连接建立
- 如果 `ANTHROPIC_API_KEY` 已设置，Claude Code 开始处理并流式返回结果
- 如果未设置 API key，收到 error 事件

- [ ] **Step 3: 测试多轮对话**

1. 在 AgentPanel 输入第二条消息
2. 点击发送

Expected:
- 第一轮结束后 Agent 状态变为 idle
- 第二条消息发送后 Agent 状态变为 running
- 收到新的流式响应

- [ ] **Step 4: 测试中止功能**

1. 发送一条消息
2. 处理过程中点击停止按钮

Expected:
- Agent 处理被中止
- 状态变为 idle
- 显示 "已中止" 提示

- [ ] **Step 5: 测试 Agent 列表和多 Agent**

1. 创建第二个 Agent
2. 在侧边栏切换查看

Expected:
- 两个 Agent 都显示在侧边栏
- 切换时面板内容更新
- 各自独立运行

- [ ] **Step 6: 最终 Commit**

如果有任何在集成测试中发现的小修复：
```bash
git add -A
git commit -m "fix: integration fixes from end-to-end testing"
```
