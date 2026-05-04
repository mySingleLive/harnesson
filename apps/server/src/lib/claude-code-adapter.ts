import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentStreamEvent } from '@harnesson/shared';
import type { AgentAdapter, ModelInfo, SessionConfig } from './agent-adapter.js';

function pairSubEvents(buffer: { texts: string[]; toolEvents: Array<{ tool: string; input: Record<string, unknown>; output?: string; isError?: boolean; duration?: number }> }): Array<{ tool: string; input: Record<string, unknown>; output?: string; isError?: boolean; duration?: number; subEvents?: unknown[]; subTexts?: string[] }> {
  return buffer.toolEvents.map((e) => ({
    tool: e.tool,
    input: e.input,
    output: e.output,
    isError: e.isError,
    duration: e.duration,
    subEvents: (e as { subEvents?: unknown[] }).subEvents,
    subTexts: (e as { subTexts?: string[] }).subTexts,
  }));
}

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
  private cachedModels: ModelInfo[] | null = null;

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
        sdkOptions.resume = session.sdkSessionId;
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

      if (session.config.model) {
        sdkOptions.model = session.config.model;
      }

      const messageStream = query({
        prompt: message,
        options: sdkOptions,
      });

      let sessionId: string | undefined;
      const toolNameById = new Map<string, string>();
      const agentStack: string[] = [];
      const subEventBuffers = new Map<string, { texts: string[]; toolEvents: Array<{ tool: string; input: Record<string, unknown>; output?: string; isError?: boolean; duration?: number; subEvents?: unknown[]; subTexts?: string[] }> }>();

      for await (const sdkMessage of messageStream) {
        if (abortController.signal.aborted) break;

        const msg = sdkMessage as Record<string, unknown>;

        if (msg.session_id && typeof msg.session_id === 'string') {
          sessionId = msg.session_id;
        }

        if (msg.type === 'assistant') {
          const betaMessage = msg.message as Record<string, unknown> | undefined;
          const content = betaMessage?.content as Array<Record<string, unknown>> | undefined;
          if (content) {
            for (const block of content) {
              if (block.type === 'text' && typeof block.text === 'string') {
                if (agentStack.length > 0) {
                  const buffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                  if (buffer) buffer.texts.push(block.text);
                } else {
                  yield { type: 'agent.text', text: block.text };
                }
              } else if (block.type === 'tool_use') {
                const toolName = block.name as string;
                const toolInput = block.input as Record<string, unknown>;
                const toolUseId = typeof block.id === 'string' ? block.id : '';

                if (toolUseId) {
                  toolNameById.set(toolUseId, toolName);
                }

                if (toolName === 'Agent') {
                  agentStack.push(toolUseId);
                  subEventBuffers.set(toolUseId, { texts: [], toolEvents: [] });
                }

                if (agentStack.length > 0) {
                  const buffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                  if (buffer) buffer.toolEvents.push({ tool: toolName, input: toolInput });
                } else {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput };
                }
              }
            }
          }
        } else if (msg.type === 'user') {
          const betaMessage = msg.message as Record<string, unknown> | undefined;
          const content = betaMessage?.content as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'tool_result') {
                const toolId = block.tool_use_id as string;
                const toolName = toolNameById.get(toolId) ?? 'unknown';
                const blockContent = block.content;
                const output = typeof blockContent === 'string' ? blockContent : JSON.stringify(blockContent);
                const isError = block.is_error === true;

                if (toolName === 'Agent' && agentStack.length > 0) {
                  const finishedId = agentStack.pop()!;
                  const buffer = subEventBuffers.get(finishedId);
                  subEventBuffers.delete(finishedId);

                  if (agentStack.length > 0) {
                    const parentBuffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                    if (parentBuffer) {
                      parentBuffer.toolEvents.push({
                        tool: 'Agent',
                        input: buffer ? { description: '', prompt: '' } : {},
                        output,
                        isError,
                        subEvents: buffer ? pairSubEvents(buffer) : undefined,
                        subTexts: buffer?.texts,
                      });
                    }
                  } else {
                    yield {
                      type: 'agent.tool_use',
                      tool: 'Agent',
                      input: {},
                    };
                    yield {
                      type: 'agent.tool_result',
                      tool: 'Agent',
                      output: JSON.stringify({
                        textOutput: output,
                        subTexts: buffer?.texts ?? [],
                        subEvents: buffer ? pairSubEvents(buffer) : [],
                      }),
                      isError,
                    };
                  }
                } else {
                  if (agentStack.length > 0) {
                    const buffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                    let pendingIdx = -1;
                    if (buffer) {
                      for (let i = buffer.toolEvents.length - 1; i >= 0; i--) {
                        if (buffer.toolEvents[i].tool === toolName && buffer.toolEvents[i].output === undefined) {
                          pendingIdx = i;
                          break;
                        }
                      }
                    }
                    if (pendingIdx >= 0 && buffer) {
                      buffer.toolEvents[pendingIdx].output = output;
                      buffer.toolEvents[pendingIdx].isError = isError;
                    }
                  } else {
                    yield {
                      type: 'agent.tool_result',
                      tool: toolName,
                      output,
                      isError,
                    };
                  }
                }
              }
            }
          }
        } else if (msg.type === 'result') {
          if (msg.session_id && typeof msg.session_id === 'string') {
            sessionId = msg.session_id as string;
          }
        }
      }

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

  updateSessionModel(agentId: string, model: string): void {
    const session = this.sessions.get(agentId);
    if (session) {
      session.config.model = model;
    }
  }

  async getSupportedModels(): Promise<ModelInfo[]> {
    if (this.cachedModels) return this.cachedModels;

    const messageStream = query({
      prompt: '__list_models__',
      options: { abortController: new AbortController() },
    });

    const models = await messageStream.supportedModels();
    this.cachedModels = models.map((m) => ({
      value: m.value,
      displayName: m.displayName,
      description: m.description,
    }));
    (messageStream as unknown as { abort?: () => void }).abort?.();
    return this.cachedModels;
  }
}
