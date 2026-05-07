import type { AgentStreamEvent, AgentInfo, CreateAgentRequest, CreateAgentResponse, AgentStatus, QuestionData } from '@harnesson/shared';
import type { AgentAdapter, ModelInfo, SessionConfig, AdapterSessionData } from './agent-adapter.js';
import { ClaudeCodeAdapter } from './claude-code-adapter.js';
import { prisma } from './prisma.js';

interface SSEClient {
  write: (event: string, data: Record<string, unknown>) => Promise<void>;
  close: () => void;
}

interface RuntimeState {
  adapter: AgentAdapter;
  sseClients: Set<SSEClient>;
  eventBuffer: AgentStreamEvent[];
  messageQueue: Promise<void>;
}

function generateTitle(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return '新会话';
  if (trimmed.length <= 12) return trimmed;
  return trimmed.slice(0, 12) + '...';
}

export class AgentService {
  private runtime = new Map<string, RuntimeState>();
  private pendingAnswers = new Map<string, {
    resolve: (answer: string | string[]) => void;
    question: QuestionData;
  }>();
  private sharedAdapter = new ClaudeCodeAdapter();

  async create(req: CreateAgentRequest): Promise<CreateAgentResponse> {
    const id = crypto.randomUUID();
    const name = generateTitle(req.prompt ?? '');

    // Resolve project by path
    const project = await prisma.project.findFirst({ where: { path: req.cwd } });
    if (!project) {
      throw new Error(`No project found for path: ${req.cwd}`);
    }

    const adapter = new ClaudeCodeAdapter();
    const allowedTools = req.permissionMode === 'auto'
      ? ['Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent']
      : undefined;

    const config: SessionConfig = {
      cwd: req.cwd,
      model: req.model,
      systemPrompt: req.systemPrompt,
      allowedTools,
      maxTurns: req.maxTurns ?? 50,
    };

    await adapter.createSession(id, config);

    let branch = 'main';
    try {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const { stdout } = await promisify(execFile)('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: req.cwd });
      branch = stdout.trim();
    } catch {}

    // Write to DB
    await prisma.agentSession.create({
      data: {
        id,
        name,
        type: req.type,
        status: 'idle',
        projectId: project.id,
        branch,
        cwd: req.cwd,
        model: req.model ?? null,
        permissionMode: req.permissionMode,
        config: JSON.stringify({ allowedTools, systemPrompt: req.systemPrompt, maxTurns: req.maxTurns ?? 50 }),
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
      createdAt: new Date().toISOString(),
      permissionMode: req.permissionMode,
      projectId: project.id,
      branch,
    };
  }

  async sendMessage(agentId: string, message: string, model?: string): Promise<void> {
    const runtime = this.runtime.get(agentId);
    if (!runtime) throw new Error('Agent not found');

    // Get current status from DB
    const session = await prisma.agentSession.findUnique({ where: { id: agentId } });
    if (!session) throw new Error('Agent session not found in DB');
    if (session.status === 'running') throw new Error('Agent is already processing');

    if (model !== undefined) {
      await prisma.agentSession.update({ where: { id: agentId }, data: { model } });
      runtime.adapter.updateSessionModel(agentId, model);
    }

    // Persist user message
    await prisma.message.create({
      data: { agentId, role: 'user', content: message },
    });

    // Update status to running
    await prisma.agentSession.update({ where: { id: agentId }, data: { status: 'running' } });

    const collectedEvents: AgentStreamEvent[] = [];

    runtime.messageQueue = runtime.messageQueue.then(async () => {
      try {
        await this.processStreamWithQuestions(agentId, message, (event) => {
          collectedEvents.push(event);
        });
        // Determine final status
        const finalSession = await prisma.agentSession.findUnique({ where: { id: agentId } });
        const finalStatus: AgentStatus = finalSession?.error ? 'error' : 'idle';

        // Persist agent message with events
        await prisma.message.create({
          data: {
            agentId,
            role: 'agent',
            content: '',
            events: collectedEvents.length > 0 ? JSON.stringify(collectedEvents) : undefined,
          },
        });

        // Update session status and sessionData
        const sessionData = runtime.adapter.getSessionData(agentId);
        await prisma.agentSession.update({
          where: { id: agentId },
          data: {
            status: finalStatus,
            error: finalStatus === 'idle' ? null : (finalSession?.error ?? null),
            sessionData: sessionData ? JSON.stringify(sessionData) : undefined,
            lastMessageAt: new Date(),
          },
        });
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

  private async processStreamWithQuestions(
    agentId: string,
    message: string,
    onEvent: (event: AgentStreamEvent) => void,
  ): Promise<void> {
    const runtime = this.runtime.get(agentId);
    if (!runtime) throw new Error('Agent not found');

    for await (const event of runtime.adapter.sendMessage(agentId, message)) {
      // Intercept AskUserQuestion tool_use
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

        // Broadcast tool_use event for message history
        this.broadcast(agentId, event);
        onEvent(event);

        // Broadcast agent.question event to trigger popup
        this.broadcast(agentId, {
          type: 'agent.question',
          tool_use_id: toolUseId,
          question: questionData,
        } as unknown as AgentStreamEvent);

        // Abort current stream
        runtime.adapter.abort(agentId);

        // Persist question message
        await prisma.message.create({
          data: {
            agentId,
            role: 'agent',
            content: `[Question: ${questionData.question}]`,
            events: JSON.stringify([event, { type: 'agent.question', tool_use_id: toolUseId, question: questionData }]),
          },
        });

        // Wait for user answer
        await prisma.agentSession.update({ where: { id: agentId }, data: { status: 'waiting_for_input' } });
        const answer = await new Promise<string | string[]>((resolve) => {
          this.pendingAnswers.set(agentId, { resolve, question: questionData });
        });

        // User answered, clear pending
        this.pendingAnswers.delete(agentId);

        const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;

        // Broadcast tool_result so client can render qa-result segment
        const toolResultEvent: AgentStreamEvent = {
          type: 'agent.tool_result',
          tool: 'AskUserQuestion',
          tool_use_id: toolUseId,
          output: answerStr,
        };
        this.broadcast(agentId, toolResultEvent);
        onEvent(toolResultEvent);

        // Broadcast done for current turn
        this.broadcast(agentId, { type: 'agent.done' });

        // Persist answer message
        await prisma.message.create({
          data: { agentId, role: 'user', content: `[Answer: ${answerStr}]` },
        });

        // Send answer as new message to Agent and recursively handle further questions
        const contextMsg = `[User answered question: "${questionData.question}"]\nAnswer: ${answerStr}`;

        await prisma.agentSession.update({ where: { id: agentId }, data: { status: 'running' } });
        this.broadcast(agentId, { type: 'agent.thinking', text: '' });

        await this.processStreamWithQuestions(agentId, contextMsg, onEvent);
        return;
      }

      this.broadcast(agentId, event);
      onEvent(event);

      // Persist TodoWrite tool events
      if (event.type === 'agent.tool_use' && event.tool === 'TodoWrite' && event.input) {
        const inputTodos = event.input.todos as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(inputTodos)) {
          await prisma.todoItem.deleteMany({ where: { agentId } });
          for (const t of inputTodos) {
            await prisma.todoItem.create({
              data: {
                agentId,
                subject: String(t.content ?? ''),
                status: String(t.status ?? 'pending'),
                activeForm: t.activeForm ? String(t.activeForm) : null,
              },
            });
          }
        }
      }
    }
  }

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

  submitAnswer(agentId: string, answer: string | string[]): boolean {
    const pending = this.pendingAnswers.get(agentId);
    if (!pending) return false;
    pending.resolve(answer);
    this.pendingAnswers.delete(agentId);
    return true;
  }

  getPendingQuestion(agentId: string): QuestionData | undefined {
    return this.pendingAnswers.get(agentId)?.question;
  }

  async destroy(agentId: string): Promise<void> {
    const runtime = this.runtime.get(agentId);
    if (runtime) {
      runtime.adapter.abort(agentId);

      // Clean up pending answers
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

    // Soft delete in DB
    await prisma.agentSession.update({ where: { id: agentId }, data: { status: 'destroyed' } });
  }

  async getSupportedModels(): Promise<ModelInfo[]> {
    return this.sharedAdapter.getSupportedModels();
  }

  async executeCommand(agentId: string, command: string, args?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const runtime = this.runtime.get(agentId);
    if (!runtime) return { success: false, error: 'Agent not found' };

    switch (command) {
      case 'clear': {
        runtime.eventBuffer = [];
        return { success: true, message: '对话已清空' };
      }
      case 'compact': {
        return { success: true, message: '上下文已压缩' };
      }
      case 'model': {
        if (!args) return { success: false, error: '请指定模型名称，如: /model sonnet' };
        runtime.adapter.updateSessionModel(agentId, args);
        await prisma.agentSession.update({ where: { id: agentId }, data: { model: args } });
        return { success: true, message: `模型已切换为 ${args}` };
      }
      case 'help': {
        return { success: true, message: '可用命令: /clear, /compact, /model <name>, /help' };
      }
      default:
        return { success: false, error: `未知命令: /${command}` };
    }
  }

  list(): AgentInfo[] {
    // Synchronous list from runtime — for backward compat with routes
    // Full data should come from listFromDB()
    return [];
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
      sessionContext: s.config ? JSON.parse(s.config) as { taskTitle?: string; tokenUsage?: number } : undefined,
    }));
  }

  async getFromDB(id: string): Promise<AgentInfo | null> {
    const s = await prisma.agentSession.findUnique({ where: { id } });
    if (!s) return null;
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
      sessionContext: s.config ? JSON.parse(s.config) as { taskTitle?: string; tokenUsage?: number } : undefined,
    };
  }

  get(agentId: string): AgentInfo | undefined {
    // Minimal runtime check — returns truthy if runtime state exists
    // Full data should come from getFromDB()
    const runtime = this.runtime.get(agentId);
    if (!runtime) return undefined;
    return { id: agentId } as AgentInfo;
  }

  async getMessages(agentId: string, limit = 100, before?: string) {
    const where: { agentId: string; id?: { lt: string } } = { agentId };
    if (before) {
      where.id = { lt: before };
    }
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return messages.map((m) => ({ ...m, events: m.events ? JSON.parse(m.events) : null }));
  }

  async getTodos(agentId: string) {
    return prisma.todoItem.findMany({ where: { agentId }, orderBy: { createdAt: 'asc' } });
  }

  async restoreAll(): Promise<void> {
    const sessions = await prisma.agentSession.findMany({
      where: { status: { notIn: ['destroyed'] } },
    });
    for (const session of sessions) {
      try {
        const adapter = new ClaudeCodeAdapter();
        const storedConfig = session.config ? JSON.parse(session.config) as Record<string, unknown> : {};
        const config: SessionConfig = {
          cwd: session.cwd,
          model: session.model ?? undefined,
          systemPrompt: storedConfig.systemPrompt as string | undefined,
          allowedTools: storedConfig.allowedTools as string[] | undefined,
          maxTurns: storedConfig.maxTurns as number | undefined,
        };
        if (session.sessionData) {
          await adapter.restoreSession(session.id, JSON.parse(session.sessionData) as AdapterSessionData, config);
        } else {
          await adapter.createSession(session.id, config);
        }
        let restoredStatus = session.status;
        if (session.status === 'running' || session.status === 'thinking') restoredStatus = 'idle';
        if (restoredStatus !== session.status) {
          await prisma.agentSession.update({ where: { id: session.id }, data: { status: restoredStatus } });
        }
        this.runtime.set(session.id, { adapter, sseClients: new Set(), eventBuffer: [], messageQueue: Promise.resolve() });
      } catch (err) {
        console.error(`Failed to restore agent ${session.id}:`, err);
        await prisma.agentSession.update({
          where: { id: session.id },
          data: { status: 'error', error: `Restore failed: ${err instanceof Error ? err.message : String(err)}` },
        });
      }
    }
  }

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
}

export const agentService = new AgentService();
