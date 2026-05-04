import type { AgentStreamEvent, AgentInfo, CreateAgentRequest, CreateAgentResponse, AgentStatus, QuestionData } from '@harnesson/shared';
import type { AgentAdapter, ModelInfo } from './agent-adapter.js';
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

function generateTitle(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return '新会话';
  if (trimmed.length <= 12) return trimmed;
  return trimmed.slice(0, 12) + '...';
}

export class AgentService {
  private agents = new Map<string, AgentState>();
  private pendingAnswers = new Map<string, {
    resolve: (answer: string | string[]) => void;
    question: QuestionData;
  }>();
  private sharedAdapter = new ClaudeCodeAdapter();

  async create(req: CreateAgentRequest): Promise<CreateAgentResponse> {
    const id = crypto.randomUUID();
    const name = generateTitle(req.prompt ?? '');

    const adapter = new ClaudeCodeAdapter();
    const allowedTools = req.permissionMode === 'auto'
      ? ['Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent']
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

  async sendMessage(agentId: string, message: string, model?: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');
    if (agent.status === 'running') throw new Error('Agent is already processing');

    if (model !== undefined) {
      agent.model = model;
      agent.adapter.updateSessionModel(agentId, model);
    }

    agent.status = 'running';
    this.broadcast(agentId, { type: 'agent.thinking', text: '' });

    agent.messageQueue = agent.messageQueue.then(async () => {
      try {
        for await (const event of agent.adapter.sendMessage(agentId, message)) {
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

            // Broadcast agent.question event to trigger popup
            this.broadcast(agentId, {
              type: 'agent.question',
              tool_use_id: toolUseId,
              question: questionData,
            } as unknown as AgentStreamEvent);

            // Abort current stream
            agent.adapter.abort(agentId);

            // Wait for user answer
            agent.status = 'waiting_for_input';
            const answer = await new Promise<string | string[]>((resolve) => {
              this.pendingAnswers.set(agentId, { resolve, question: questionData });
            });

            // User answered, clear pending
            this.pendingAnswers.delete(agentId);

            // Broadcast done for current turn
            this.broadcast(agentId, {
              type: 'agent.done',
            });

            // Send answer as new message to Agent
            const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;
            const contextMsg = `[User answered question: "${questionData.question}"]\nAnswer: ${answerStr}`;

            agent.status = 'running';
            agent.error = undefined;
            this.broadcast(agentId, { type: 'agent.thinking', text: '' });

            for await (const answerEvent of agent.adapter.sendMessage(agentId, contextMsg)) {
              this.broadcast(agentId, answerEvent);
              if (answerEvent.type === 'agent.done') {
                agent.tokenUsage = answerEvent.tokenUsage ?? agent.tokenUsage;
              }
              if (answerEvent.type === 'agent.error') {
                agent.error = answerEvent.message;
              }
            }

            agent.status = agent.error ? 'error' : 'idle';
            if (agent.status === 'idle') {
              agent.error = undefined;
            }
            return;
          }

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
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.adapter.abort(agentId);

    // Clean up pending answers
    const pending = this.pendingAnswers.get(agentId);
    if (pending) {
      pending.resolve('');
      this.pendingAnswers.delete(agentId);
    }

    await agent.adapter.destroySession(agentId);

    for (const client of agent.sseClients) {
      client.close();
    }

    this.agents.delete(agentId);
  }

  async getSupportedModels(): Promise<ModelInfo[]> {
    return this.sharedAdapter.getSupportedModels();
  }

  async executeCommand(agentId: string, command: string, args?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const agent = this.agents.get(agentId);
    if (!agent) return { success: false, error: 'Agent not found' };

    switch (command) {
      case 'clear': {
        agent.eventBuffer = [];
        agent.sessionContext = { taskTitle: agent.sessionContext?.taskTitle, tokenUsage: 0 };
        return { success: true, message: '对话已清空' };
      }
      case 'compact': {
        return { success: true, message: '上下文已压缩' };
      }
      case 'model': {
        if (!args) return { success: false, error: '请指定模型名称，如: /model sonnet' };
        agent.model = args;
        agent.adapter.updateSessionModel(agentId, args);
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

export const agentService = new AgentService();
