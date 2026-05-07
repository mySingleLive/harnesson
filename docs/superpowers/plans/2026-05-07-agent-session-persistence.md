# Agent Session 上下文持久化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Agent Session 的上下文信息（聊天记录、Todo、元数据、SDK session）持久化到 SQLite，使服务重启和页面刷新后能完整恢复。

**Architecture:** 在现有 SQLite + Prisma 基础上新增 3 个表（AgentSession、Message、TodoItem）。AgentService 改为 DB + 内存混合模式：持久化数据写 SQLite，运行时状态（adapter 实例、SSE 连接）留在内存。通过 AgentAdapter 接口新增 `getSessionData()` / `restoreSession()` 实现 SDK session 恢复。前端改为懒加载模式 — 启动时加载 session 列表，激活时加载消息历史。

**Tech Stack:** Prisma 7 + SQLite (better-sqlite3), Hono.js, Zustand, Claude Agent SDK

---

### Task 1: Prisma Schema Migration

**Files:**
- Modify: `apps/server/prisma/schema.prisma`

- [ ] **Step 1: Add new models to schema**

Append after the existing `Project` model in `apps/server/prisma/schema.prisma`:

```prisma
model AgentSession {
  id             String    @id @default(uuid())
  name           String
  type           String
  status         String    @default("idle")
  projectId      String
  branch         String    @default("main")
  worktreePath   String?
  cwd            String
  model          String?
  permissionMode String    @default("auto")
  config         Json      @default("{}")
  sessionData    Json?
  error          String?
  lastMessageAt  DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  project        Project   @relation(fields: [projectId], references: [id])
  messages       Message[]
  todos          TodoItem[]

  @@index([projectId])
  @@index([status])
  @@index([updatedAt])
}

model Message {
  id        String   @id @default(uuid())
  agentId   String
  role      String
  content   String   @default("")
  events    Json?
  createdAt DateTime @default(now())

  agent     AgentSession @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([agentId, createdAt])
}

model TodoItem {
  id          String    @id @default(uuid())
  agentId     String
  subject     String
  description String?
  status      String    @default("pending")
  activeForm  String?
  createdAt   DateTime  @default(now())
  completedAt DateTime?

  agent       AgentSession @relation(fields: [agentId], references: [id], onDelete: Cascade)

  @@index([agentId])
}
```

Also add the reverse relation to the existing `Project` model — add `sessions AgentSession[]` inside the model block:

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  path        String   @unique
  description String?
  source      String   @default("local")
  agentCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  sessions    AgentSession[]
}
```

- [ ] **Step 2: Run migration**

```bash
cd apps/server && npx prisma migrate dev --name add-agent-session-persistence
```

Expected: Migration file created, client regenerated.

- [ ] **Step 3: Verify generated client**

```bash
cd apps/server && npx prisma generate
```

Expected: No errors, generated client includes AgentSession, Message, TodoItem types.

- [ ] **Step 4: Commit**

```bash
git add apps/server/prisma/
git commit -m "feat: add AgentSession, Message, TodoItem schema for persistence"
```

---

### Task 2: Extend Shared Types

**Files:**
- Modify: `packages/shared/src/types/agent.ts`

- [ ] **Step 1: Add new response types**

Add these types at the end of `packages/shared/src/types/agent.ts`:

```typescript
export interface PersistedAgentInfo extends AgentInfo {
  worktreePath?: string;
  cwd: string;
  lastMessageAt?: string;
}

export interface PersistedMessage {
  id: string;
  agentId: string;
  role: string;
  content: string;
  events?: AgentStreamEvent[];
  createdAt: string;
}

export interface PersistedTodoItem {
  id: string;
  agentId: string;
  subject: string;
  description?: string;
  status: string;
  activeForm?: string;
  createdAt: string;
  completedAt?: string;
}
```

Also update `CreateAgentResponse` to include `projectId` and `branch`:

```typescript
export interface CreateAgentResponse {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  cwd: string;
  model?: string;
  createdAt: string;
  permissionMode: 'auto' | 'manual';
  projectId: string;
  branch: string;
}
```

- [ ] **Step 2: Verify types compile**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat: add persisted agent/message/todo shared types"
```

---

### Task 3: Extend AgentAdapter Interface

**Files:**
- Modify: `apps/server/src/lib/agent-adapter.ts`

- [ ] **Step 1: Add persistence methods to interface**

Replace the entire `AgentAdapter` interface in `apps/server/src/lib/agent-adapter.ts` with:

```typescript
import type { AgentStreamEvent } from '@harnesson/shared';

export interface SessionConfig {
  cwd: string;
  model?: string;
  systemPrompt?: string;
  allowedTools?: string[];
  maxTurns?: number;
}

export interface ModelInfo {
  value: string;
  displayName: string;
  description: string;
}

export interface AdapterSessionData {
  sdkSessionId?: string;
  [key: string]: unknown;
}

export interface AgentAdapter {
  sendMessage(agentId: string, message: string): AsyncIterable<AgentStreamEvent>;
  createSession(agentId: string, config: SessionConfig): Promise<void>;
  destroySession(agentId: string): Promise<void>;
  abort(agentId: string): void;
  getSupportedModels(): Promise<ModelInfo[]>;
  updateSessionModel(agentId: string, model: string): void;

  // Persistence methods
  getSessionData(agentId: string): AdapterSessionData | null;
  restoreSession(agentId: string, sessionData: AdapterSessionData, config: SessionConfig): Promise<void>;
  getType(): string;
}
```

- [ ] **Step 2: Verify it compiles (will error until ClaudeCodeAdapter is updated — that's Task 4)**

Just confirm the interface file itself is syntactically valid:

```bash
cd apps/server && npx tsc --noEmit 2>&1 | head -20
```

Expected: Errors about missing methods in ClaudeCodeAdapter — that's expected, Task 4 will fix them.

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/agent-adapter.ts
git commit -m "feat: add getSessionData, restoreSession, getType to AgentAdapter interface"
```

---

### Task 4: Implement ClaudeCodeAdapter Persistence Methods

**Files:**
- Modify: `apps/server/src/lib/claude-code-adapter.ts`

- [ ] **Step 1: Add `getType()`, `getSessionData()`, `restoreSession()` methods**

Add these three methods to the `ClaudeCodeAdapter` class in `apps/server/src/lib/claude-code-adapter.ts`, right after `updateSessionModel()`:

```typescript
  getType(): string {
    return 'claude-code';
  }

  getSessionData(agentId: string): AdapterSessionData | null {
    const session = this.sessions.get(agentId);
    if (!session) return null;
    return {
      sdkSessionId: session.sdkSessionId,
    };
  }

  async restoreSession(agentId: string, sessionData: AdapterSessionData, config: SessionConfig): Promise<void> {
    this.sessions.set(agentId, {
      sdkSessionId: sessionData.sdkSessionId,
      abortController: null,
      config,
    });
  }
```

Also update the import at the top to include `AdapterSessionData`:

```typescript
import type { AgentAdapter, ModelInfo, SessionConfig, AdapterSessionData } from './agent-adapter.js';
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/server && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/claude-code-adapter.ts
git commit -m "feat: implement getSessionData, restoreSession, getType in ClaudeCodeAdapter"
```

---

### Task 5: Refactor AgentService — Core DB Layer

**Files:**
- Modify: `apps/server/src/lib/agent-service.ts`

This is the largest task. The AgentService is refactored to persist all state changes to SQLite while keeping runtime objects (adapter, SSE clients) in memory.

- [ ] **Step 1: Add Prisma import and runtime state type**

At the top of `apps/server/src/lib/agent-service.ts`, add the import:

```typescript
import { prisma } from './prisma.js';
```

Add the runtime state interface right after the existing `SSEClient` interface:

```typescript
interface RuntimeState {
  adapter: AgentAdapter;
  sseClients: Set<SSEClient>;
  eventBuffer: AgentStreamEvent[];
  messageQueue: Promise<void>;
}
```

- [ ] **Step 2: Replace `agents` Map with `runtimeState` Map**

In the `AgentService` class, replace the `agents` field:

```typescript
  private agents = new Map<string, AgentState>();
```

with:

```typescript
  private runtime = new Map<string, RuntimeState>();
```

- [ ] **Step 3: Rewrite `create()` method**

Replace the existing `create()` method with:

```typescript
  async create(req: CreateAgentRequest): Promise<CreateAgentResponse> {
    const id = crypto.randomUUID();
    const name = generateTitle(req.prompt ?? '');

    const adapter = new ClaudeCodeAdapter();
    const allowedTools = req.permissionMode === 'auto'
      ? ['Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent', 'TodoWrite', 'AskUserQuestion']
      : undefined;

    await adapter.createSession(id, {
      cwd: req.cwd,
      model: req.model,
      systemPrompt: req.systemPrompt,
      allowedTools,
      maxTurns: req.maxTurns ?? 50,
    });

    let branch = 'main';
    try {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const { stdout } = await promisify(execFile)('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: req.cwd });
      branch = stdout.trim();
    } catch {}

    // Resolve project by path
    const project = await prisma.project.findFirst({ where: { path: req.cwd } });
    const projectId = project?.id ?? '';

    const now = new Date().toISOString();

    // Persist to DB
    await prisma.agentSession.create({
      data: {
        id,
        name,
        type: req.type,
        status: 'idle',
        projectId,
        branch,
        worktreePath: req.cwd,
        cwd: req.cwd,
        model: req.model,
        permissionMode: req.permissionMode,
      },
    });

    // Store runtime state
    this.runtime.set(id, {
      adapter,
      sseClients: new Set(),
      eventBuffer: [],
      messageQueue: Promise.resolve(),
    });

    return {
      id,
      name,
      type: req.type,
      status: 'idle',
      cwd: req.cwd,
      model: req.model,
      createdAt: now,
      permissionMode: req.permissionMode,
      projectId,
      branch,
    };
  }
```

- [ ] **Step 4: Rewrite `sendMessage()` to persist messages**

Replace the existing `sendMessage()` method with:

```typescript
  async sendMessage(agentId: string, message: string, model?: string): Promise<void> {
    const runtime = this.runtime.get(agentId);
    if (!runtime) throw new Error('Agent not found');

    // Get current status from DB
    const session = await prisma.agentSession.findUnique({ where: { id: agentId } });
    if (!session) throw new Error('Agent not found');
    if (session.status === 'running') throw new Error('Agent is already processing');

    if (model !== undefined) {
      await prisma.agentSession.update({
        where: { id: agentId },
        data: { model },
      });
      runtime.adapter.updateSessionModel(agentId, model);
    }

    // Persist user message
    await prisma.message.create({
      data: {
        agentId,
        role: 'user',
        content: message,
      },
    });

    // Update status to running
    await prisma.agentSession.update({
      where: { id: agentId },
      data: { status: 'running' },
    });

    this.broadcast(agentId, { type: 'agent.thinking', text: '' });

    runtime.messageQueue = runtime.messageQueue.then(async () => {
      try {
        const events: AgentStreamEvent[] = [];
        let textContent = '';

        await this.processStreamWithQuestions(agentId, message, (event) => {
          events.push(event);
          if (event.type === 'agent.text' && event.text) {
            textContent += event.text;
          }
        });

        // Persist agent reply
        const finalSession = await prisma.agentSession.findUnique({ where: { id: agentId } });
        const newStatus = finalSession?.error ? 'error' : 'idle';

        await prisma.agentSession.update({
          where: { id: agentId },
          data: {
            status: newStatus,
            error: newStatus === 'error' ? finalSession?.error : null,
            lastMessageAt: new Date(),
            sessionData: runtime.adapter.getSessionData(agentId) ?? undefined,
          },
        });

        // Save agent message with events (only save if there's content or events)
        if (textContent || events.length > 0) {
          await prisma.message.create({
            data: {
              agentId,
              role: 'agent',
              content: textContent,
              events: events.length > 0 ? events : undefined,
            },
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await prisma.agentSession.update({
          where: { id: agentId },
          data: { status: 'error', error: errorMsg },
        });
        this.broadcast(agentId, {
          type: 'agent.error',
          message: errorMsg,
          code: 'PROCESSING_ERROR',
        });
      }
    });
  }
```

- [ ] **Step 5: Rewrite `processStreamWithQuestions()` to accept event collector**

Replace the existing `processStreamWithQuestions()` method. The key change: it now takes an `onEvent` callback to collect events for persistence, while still broadcasting via SSE.

```typescript
  private async processStreamWithQuestions(
    agentId: string,
    message: string,
    onEvent: (event: AgentStreamEvent) => void,
  ): Promise<void> {
    const runtime = this.runtime.get(agentId);
    if (!runtime) throw new Error('Agent not found');

    for await (const event of runtime.adapter.sendMessage(agentId, message)) {
      if (
        event.type === 'agent.tool_use' &&
        event.tool === 'AskUserQuestion' &&
        event.input
      ) {
        const questions = event.input.questions as Array<Record<string, unknown>> | undefined;
        const q = questions?.[0];
        if (!q) {
          this.broadcast(agentId, event);
          onEvent(event);
          continue;
        }

        const questionData: QuestionData = {
          question: String(q.question ?? ''),
          header: String(q.header ?? ''),
          options: (q.options as Array<Record<string, unknown>> | undefined)?.map((o) => ({
            label: String(o.label ?? ''),
            description: o.description ? String(o.description) : undefined,
            preview: o.preview ? String(o.preview) : undefined,
          })) ?? [],
          multiSelect: q.multiSelect === true,
        };

        const toolUseId = event.tool_use_id ?? crypto.randomUUID();

        this.broadcast(agentId, event);
        onEvent(event);

        this.broadcast(agentId, {
          type: 'agent.question',
          tool_use_id: toolUseId,
          question: questionData,
        } as unknown as AgentStreamEvent);

        runtime.adapter.abort(agentId);

        await prisma.agentSession.update({
          where: { id: agentId },
          data: { status: 'waiting_for_input' },
        });

        const answer = await new Promise<string | string[]>((resolve) => {
          this.pendingAnswers.set(agentId, { resolve, question: questionData });
        });

        this.pendingAnswers.delete(agentId);

        const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;

        const toolResultEvent: AgentStreamEvent = {
          type: 'agent.tool_result',
          tool: 'AskUserQuestion',
          tool_use_id: toolUseId,
          output: answerStr,
        };
        this.broadcast(agentId, toolResultEvent);
        onEvent(toolResultEvent);

        const doneEvent: AgentStreamEvent = { type: 'agent.done' };
        this.broadcast(agentId, doneEvent);
        onEvent(doneEvent);

        // Persist question + answer as messages
        await prisma.message.create({
          data: {
            agentId,
            role: 'agent',
            content: '',
            events: [event, toolResultEvent],
          },
        });
        await prisma.message.create({
          data: {
            agentId,
            role: 'user',
            content: `[Question answered: "${questionData.question}"]\nAnswer: ${answerStr}`,
          },
        });

        const contextMsg = `[User answered question: "${questionData.question}"]\nAnswer: ${answerStr}`;

        await prisma.agentSession.update({
          where: { id: agentId },
          data: { status: 'running', error: null },
        });

        this.broadcast(agentId, { type: 'agent.thinking', text: '' });

        await this.processStreamWithQuestions(agentId, contextMsg, onEvent);
        return;
      }

      this.broadcast(agentId, event);
      onEvent(event);
    }
  }
```

- [ ] **Step 6: Rewrite `addSSEClient()`, `removeSSEClient()`, `abort()`**

Replace the existing methods. Change `this.agents` references to `this.runtime`:

```typescript
  addSSEClient(agentId: string, client: SSEClient): void {
    const runtime = this.runtime.get(agentId);
    if (!runtime) return;
    runtime.sseClients.add(client);
    for (const event of runtime.eventBuffer) {
      client.write(event.type, event as unknown as Record<string, unknown>).catch(() => {});
    }
  }

  removeSSEClient(agentId: string, client: SSEClient): void {
    const runtime = this.runtime.get(agentId);
    if (!runtime) return;
    runtime.sseClients.delete(client);
  }

  abort(agentId: string): void {
    const runtime = this.runtime.get(agentId);
    if (!runtime) return;
    runtime.adapter.abort(agentId);
  }
```

- [ ] **Step 7: Rewrite `destroy()` as soft-delete**

Replace the existing `destroy()` method:

```typescript
  async destroy(agentId: string): Promise<void> {
    const runtime = this.runtime.get(agentId);

    if (runtime) {
      runtime.adapter.abort(agentId);

      const pending = this.pendingAnswers.get(agentId);
      if (pending) {
        pending.resolve('');
        this.pendingAnswers.delete(agentId);
      }

      await runtime.adapter.destroySession(agentId);

      for (const client of runtime.sseClients) {
        client.close();
      }

      this.runtime.delete(agentId);
    }

    // Soft delete in DB (even if no runtime state, e.g. failed restore)
    await prisma.agentSession.update({
      where: { id: agentId },
      data: { status: 'destroyed' },
    });
  }
```

- [ ] **Step 8: Rewrite `list()` and `get()` to read from DB**

Replace the existing `list()` and `get()` methods:

```typescript
  list(): AgentInfo[] {
    return Array.from(this.runtime.entries()).map(([id, rt]) => {
      // We need status from DB ideally, but for list we use runtime if available
      return {
        id,
        name: '',
        type: 'claude-code' as AgentInfo['type'],
        status: 'idle' as AgentStatus,
        cwd: '',
        branch: '',
        createdAt: new Date().toISOString(),
        permissionMode: 'auto' as const,
      };
    });
  }

  async listFromDB(): Promise<AgentInfo[]> {
    const sessions = await prisma.agentSession.findMany({
      where: { status: { not: 'destroyed' } },
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type as AgentInfo['type'],
      status: s.status as AgentStatus,
      cwd: s.cwd,
      branch: s.branch,
      model: s.model ?? undefined,
      createdAt: s.createdAt.toISOString(),
      error: s.error ?? undefined,
      permissionMode: s.permissionMode as 'auto' | 'manual',
      sessionContext: s.config as { taskTitle?: string; tokenUsage?: number } | undefined,
    }));
  }

  async getFromDB(agentId: string): Promise<AgentInfo | null> {
    const s = await prisma.agentSession.findUnique({ where: { id: agentId } });
    if (!s || s.status === 'destroyed') return null;
    return {
      id: s.id,
      name: s.name,
      type: s.type as AgentInfo['type'],
      status: s.status as AgentStatus,
      cwd: s.cwd,
      branch: s.branch,
      model: s.model ?? undefined,
      createdAt: s.createdAt.toISOString(),
      error: s.error ?? undefined,
      permissionMode: s.permissionMode as 'auto' | 'manual',
      sessionContext: s.config as { taskTitle?: string; tokenUsage?: number } | undefined,
    };
  }

  get(agentId: string): AgentInfo | undefined {
    const runtime = this.runtime.get(agentId);
    if (!runtime) return undefined;
    // Return minimal info — routes should use getFromDB for full data
    return {
      id: agentId,
      name: '',
      type: 'claude-code' as AgentInfo['type'],
      status: 'idle' as AgentStatus,
      cwd: '',
      branch: '',
      createdAt: new Date().toISOString(),
      permissionMode: 'auto' as const,
    };
  }
```

- [ ] **Step 9: Add query methods**

Add these methods to the class:

```typescript
  async getMessages(agentId: string, limit: number = 100, before?: string): Promise<Message[]> {
    const where: Record<string, unknown> = { agentId };
    if (before) {
      (where as { createdAt?: { lt: Date } }).createdAt = { lt: new Date(before) };
    }
    return prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTodos(agentId: string): Promise<TodoItem[]> {
    return prisma.todoItem.findMany({
      where: { agentId },
      orderBy: { createdAt: 'asc' },
    });
  }
```

Add the import for `TodoItem` at the top (from `@harnesson/shared` — it's already imported via `AgentStreamEvent`):

```typescript
import type { AgentStreamEvent, AgentInfo, CreateAgentRequest, CreateAgentResponse, AgentStatus, QuestionData, TodoItem } from '@harnesson/shared';
```

- [ ] **Step 10: Add `restoreAll()` method**

Add this method to the class:

```typescript
  async restoreAll(): Promise<void> {
    const sessions = await prisma.agentSession.findMany({
      where: { status: { notIn: ['destroyed'] } },
    });

    for (const session of sessions) {
      try {
        const adapter = new ClaudeCodeAdapter();
        const config: SessionConfig = {
          cwd: session.cwd,
          model: session.model ?? undefined,
        };

        if (session.sessionData) {
          await adapter.restoreSession(session.id, session.sessionData as AdapterSessionData, config);
        } else {
          await adapter.createSession(session.id, config);
        }

        // Reset status if it was mid-stream
        let restoredStatus = session.status;
        if (session.status === 'running' || session.status === 'thinking') {
          restoredStatus = 'idle';
        }

        if (restoredStatus !== session.status) {
          await prisma.agentSession.update({
            where: { id: session.id },
            data: { status: restoredStatus },
          });
        }

        this.runtime.set(session.id, {
          adapter,
          sseClients: new Set(),
          eventBuffer: [],
          messageQueue: Promise.resolve(),
        });
      } catch (err) {
        console.error(`Failed to restore agent ${session.id}:`, err);
        await prisma.agentSession.update({
          where: { id: session.id },
          data: { status: 'error', error: `Restore failed: ${err instanceof Error ? err.message : String(err)}` },
        });
      }
    }
  }
```

Add `AdapterSessionData` and `SessionConfig` to the import:

```typescript
import type { AgentAdapter, ModelInfo, SessionConfig, AdapterSessionData } from './agent-adapter.js';
```

- [ ] **Step 11: Rewrite `broadcast()` to use `this.runtime`**

Replace the existing `broadcast()` method:

```typescript
  private broadcast(agentId: string, event: AgentStreamEvent): void {
    const runtime = this.runtime.get(agentId);
    if (!runtime) return;

    runtime.eventBuffer.push(event);
    if (runtime.eventBuffer.length > 200) {
      runtime.eventBuffer = runtime.eventBuffer.slice(-100);
    }

    for (const client of runtime.sseClients) {
      client.write(event.type, event as unknown as Record<string, unknown>).catch(() => {
        runtime.sseClients.delete(client);
      });
    }
  }
```

- [ ] **Step 12: Verify it compiles**

```bash
cd apps/server && npx tsc --noEmit
```

Expected: No errors. Fix any type mismatches.

- [ ] **Step 13: Commit**

```bash
git add apps/server/src/lib/agent-service.ts
git commit -m "feat: refactor AgentService to persist sessions, messages, and todos to SQLite"
```

---

### Task 6: Update API Routes

**Files:**
- Modify: `apps/server/src/routes/agents.ts`

- [ ] **Step 1: Update `listAgents` route to use `listFromDB()`**

Change the GET `/api/agents` handler from:

```typescript
agentsRoute.get('/api/agents', (c) => {
  return c.json(agentService.list());
});
```

to:

```typescript
agentsRoute.get('/api/agents', async (c) => {
  return c.json(await agentService.listFromDB());
});
```

- [ ] **Step 2: Update `getAgent` route to use `getFromDB()`**

Change the GET `/api/agents/:id` handler from:

```typescript
agentsRoute.get('/api/agents/:id', (c) => {
  const agent = agentService.get(c.req.param('id'));
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  return c.json(agent);
});
```

to:

```typescript
agentsRoute.get('/api/agents/:id', async (c) => {
  const agent = await agentService.getFromDB(c.req.param('id'));
  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  return c.json(agent);
});
```

- [ ] **Step 3: Add messages endpoint**

Add after the existing `/api/agents/:id` GET route:

```typescript
// GET /api/agents/:id/messages — get message history
agentsRoute.get('/api/agents/:id/messages', async (c) => {
  const agentId = c.req.param('id');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '100'), 500);
  const before = c.req.query('before');

  const messages = await agentService.getMessages(agentId, limit, before);
  // Return in chronological order (oldest first)
  return c.json(messages.reverse());
});
```

- [ ] **Step 4: Add todos endpoint**

Add after the messages endpoint:

```typescript
// GET /api/agents/:id/todos — get todos
agentsRoute.get('/api/agents/:id/todos', async (c) => {
  const agentId = c.req.param('id');
  const todos = await agentService.getTodos(agentId);
  return c.json(todos);
});
```

- [ ] **Step 5: Update sendMessage route**

Change the `sendMessage` handler to use `getFromDB` for the existence check:

```typescript
agentsRoute.post('/api/agents/:id/message', async (c) => {
  const agentId = c.req.param('id');
  const agent = await agentService.getFromDB(agentId);
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
```

- [ ] **Step 6: Update other routes to use async getFromDB**

Update the SSE stream route check:

```typescript
  const agent = await agentService.getFromDB(agentId);
```

Update the abort route:

```typescript
  const agent = await agentService.getFromDB(agentId);
```

Update the tool-result route:

```typescript
  const agent = await agentService.getFromDB(agentId);
```

Update the command route:

```typescript
  const agent = await agentService.getFromDB(agentId);
```

- [ ] **Step 7: Verify it compiles**

```bash
cd apps/server && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/routes/agents.ts
git commit -m "feat: update agent API routes for DB-backed persistence"
```

---

### Task 7: Server Startup — Restore Sessions

**Files:**
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: Add restoreAll() call at startup**

In `apps/server/src/index.ts`, add the restore call after the routes are set up and before `serve()`:

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
import { agentService } from './lib/agent-service.js';

const app = new Hono();

app.use('/*', cors({ origin: 'http://localhost:5173' }));

app.route('/', healthRoute);
app.route('/', openFolderRoute);
app.route('/', projectsRoute);
app.route('/', branchesRoute);
app.route('/', graphRoute);
app.route('/', agentsRoute);

const PORT = Number(process.env.PORT ?? 3456);

// Restore persisted agent sessions on startup
agentService.restoreAll().then(() => {
  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`@harnesson/server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to restore agent sessions:', err);
  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`@harnesson/server running on http://localhost:${PORT} (session restore failed)`);
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/server/src/index.ts
git commit -m "feat: restore agent sessions from DB on server startup"
```

---

### Task 8: Frontend API Client Extension

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`

- [ ] **Step 1: Add API functions for messages and todos**

Add these functions at the end of the Agent API section (before the Slash Command API section) in `apps/web/src/lib/serverApi.ts`:

```typescript
export interface MessageResponse {
  id: string;
  agentId: string;
  role: string;
  content: string;
  events?: unknown[];
  createdAt: string;
}

export async function getAgentMessages(agentId: string, limit?: number): Promise<MessageResponse[]> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/messages?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

export async function getAgentTodos(agentId: string): Promise<unknown[]> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/todos`);
  if (!res.ok) return [];
  return res.json();
}
```

Also update the `AgentInfoResponse` type to include `projectId`:

```typescript
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
  projectId?: string;
}
```

Also update `CreateAgentResponse` to include `projectId` and `branch`:

```typescript
export interface CreateAgentResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  cwd: string;
  model?: string;
  createdAt: string;
  permissionMode: 'auto' | 'manual';
  projectId: string;
  branch: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/serverApi.ts
git commit -m "feat: add getAgentMessages and getAgentTodos API client functions"
```

---

### Task 9: Frontend Store — Persistence-Aware Loading

**Files:**
- Modify: `apps/web/src/stores/agentStore.ts`

- [ ] **Step 1: Update `loadAgents()` to populate projectId and branch from server data**

Replace the existing `loadAgents` implementation:

```typescript
  loadAgents: async () => {
    try {
      const agentsInfo = await api.listAgents();
      const agents: Agent[] = agentsInfo.map((info) => ({
        id: info.id,
        name: info.name,
        type: info.type as Agent['type'],
        status: info.status as Agent['status'],
        projectId: (info as { projectId?: string }).projectId ?? '',
        branch: info.branch,
        worktreePath: info.cwd,
        model: info.model,
        createdAt: info.createdAt,
        error: info.error,
        panelState: { isOpen: false, isMaximized: false },
        sessionContext: info.sessionContext,
      }));
      set({ agents });

      // Reconnect SSE for running agents
      for (const agent of agents) {
        if (agent.status === 'running') {
          get().connectSSE(agent.id);
        }
      }
    } catch {}
  },
```

- [ ] **Step 2: Add `initialize()` method and `activateAgent()` with lazy message loading**

Add these methods to the store interface and implementation:

```typescript
  initialize: async () => {
    await get().loadAgents();
  },

  activateAgent: async (id: string) => {
    set({ activeAgentId: id });

    // Lazy load messages if not already loaded
    const existingMessages = get().messages[id];
    if (!existingMessages || existingMessages.length === 0) {
      try {
        const msgs = await api.getAgentMessages(id);
        const agentMessages: AgentMessage[] = msgs.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'agent',
          content: m.content,
          timestamp: m.createdAt,
          events: m.events as AgentStreamEvent[] | undefined,
        }));
        set((s) => ({
          messages: { ...s.messages, [id]: agentMessages },
        }));
      } catch {
        // Failed to load messages — show empty
      }
    }

    // Connect SSE
    get().connectSSE(id);

    // Update panel state
    get().updatePanelState(id, { isOpen: true });
  },
```

Add `initialize` and `activateAgent` to the `AgentState` interface:

```typescript
interface AgentState {
  // ... existing fields ...

  initialize: () => Promise<void>;
  activateAgent: (id: string) => Promise<void>;

  // ... existing methods ...
}
```

- [ ] **Step 3: Update `createAgent()` to use projectId from response**

In the `createAgent` implementation, use the server-returned `projectId`:

```typescript
    const agent: Agent = {
      id: response.id,
      name: response.name,
      type: response.type as Agent['type'],
      status: 'idle',
      projectId: response.projectId ?? '',
      branch: response.branch ?? '',
      worktreePath: response.cwd,
      model: response.model,
      createdAt: response.createdAt,
      panelState: { isOpen: true, isMaximized: true },
      sessionContext: { taskTitle: opts.taskTitle ?? '', tokenUsage: 0 },
    };
```

- [ ] **Step 4: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/agentStore.ts
git commit -m "feat: add initialize and activateAgent with lazy message loading to store"
```

---

### Task 10: Title Bar Agent Switching

**Files:**
- Modify: `apps/web/src/components/layout/MainLayout.tsx`

- [ ] **Step 1: Update `handleAgentClick` to use `activateAgent` and switch project display**

Replace the existing `handleAgentClick`:

```typescript
  const handleAgentClick = async (agent: typeof agents[number]) => {
    await activateAgent(agent.id);
    switchProject(agent.projectId, agent.branch);
  };
```

Update the destructured store methods at the top:

```typescript
  const { agents, activeAgentId, setActiveAgent, updatePanelState, messages, isStreaming, loadAgents, activateAgent } = useAgentStore();
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/MainLayout.tsx
git commit -m "feat: switch project/branch display in title bar on agent click"
```

---

### Task 11: Integration Verification

- [ ] **Step 1: Start the dev server**

```bash
cd apps/server && npx prisma migrate dev && npm run dev
```

In another terminal:
```bash
cd apps/web && npm run dev
```

- [ ] **Step 2: Test basic flow**

1. Open `http://localhost:5173`
2. Create a new Agent session
3. Send a message, wait for response
4. Verify message appears in chat

- [ ] **Step 3: Test persistence — page refresh**

1. Refresh the page (F5)
2. Verify the agent appears in the sidebar
3. Click on the agent
4. Verify chat history loads

- [ ] **Step 4: Test persistence — server restart**

1. Stop the server (Ctrl+C)
2. Restart the server
3. Refresh the page
4. Verify agent sessions are restored
5. Click on an agent, verify chat history
6. Send a new message — verify the agent continues the conversation (SDK session resume)

- [ ] **Step 5: Test title bar switching**

1. Click on different agents in the sidebar
2. Verify the project name and branch update in the top bar

- [ ] **Step 6: Test agent destruction**

1. Delete an agent
2. Refresh the page
3. Verify the deleted agent no longer appears

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete Agent Session context persistence with SQLite"
```
