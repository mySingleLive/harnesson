import { query } from '@anthropic-ai/claude-agent-sdk';
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
import type { AgentStreamEvent, ContentBlock } from '@harnesson/shared';
import type { AgentAdapter, ModelInfo, SessionConfig, AdapterSessionData } from './agent-adapter.js';

function buildSDKMessages(message: string, contentBlocks?: ContentBlock[]): AsyncIterable<SDKUserMessage> {
  if (!contentBlocks || contentBlocks.length === 0) {
    return (async function* () {
      yield {
        type: 'user' as const,
        message: {
          role: 'user' as const,
          content: message,
        },
        parent_tool_use_id: null,
      };
    })();
  }

  const content = contentBlocks.map((block) => {
    if (block.type === 'text') {
      return { type: 'text' as const, text: block.text ?? '' };
    }
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: block.image!.mediaType,
        data: block.image!.base64,
      },
    };
  }) as SDKUserMessage['message']['content'];

  return (async function* () {
    yield {
      type: 'user' as const,
      message: {
        role: 'user' as const,
        content,
      },
      parent_tool_use_id: null,
    };
  })();
}

const DEFAULT_ALLOWED_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent',
  'TodoWrite', 'AskUserQuestion',
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

  async *sendMessage(agentId: string, message: string, contentBlocks?: ContentBlock[]): AsyncIterable<AgentStreamEvent> {
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
        prompt: contentBlocks && contentBlocks.length > 0
          ? buildSDKMessages(message, contentBlocks)
          : message,
        options: sdkOptions,
      });

      let sessionId: string | undefined;
      const toolNameById = new Map<string, string>();
      const agentStack: string[] = [];

      function currentParent(): string | undefined {
        return agentStack.length > 0 ? agentStack[agentStack.length - 1] : undefined;
      }

      function currentDepth(): number {
        return agentStack.length;
      }

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
                const parent = currentParent();
                if (parent) {
                  yield { type: 'agent.text', text: block.text, parentToolUseId: parent, depth: currentDepth() };
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

                const parent = currentParent();

                if (toolName === 'Agent') {
                  agentStack.push(toolUseId);
                }

                // TodoWrite: always yield at root level for real-time UI
                if (toolName === 'TodoWrite') {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput, tool_use_id: toolUseId };
                } else if (parent) {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput, tool_use_id: toolUseId, parentToolUseId: parent, depth: currentDepth() };
                } else {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput, tool_use_id: toolUseId };
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

                const parent = currentParent();

                if (toolName === 'Agent') {
                  // Pop finished agent from stack
                  if (agentStack.length > 0 && agentStack[agentStack.length - 1] === toolId) {
                    agentStack.pop();
                  }

                  const newParent = currentParent();
                  if (newParent) {
                    yield {
                      type: 'agent.tool_result',
                      tool: 'Agent',
                      output,
                      isError,
                      parentToolUseId: newParent,
                      depth: currentDepth(),
                    };
                  } else {
                    yield {
                      type: 'agent.tool_result',
                      tool: 'Agent',
                      output,
                      isError,
                    };
                  }
                } else if (parent) {
                  if (toolName === 'TodoWrite') {
                    yield { type: 'agent.tool_result', tool: toolName, output, isError };
                  } else {
                    yield {
                      type: 'agent.tool_result',
                      tool: toolName,
                      output,
                      isError,
                      parentToolUseId: parent,
                      depth: currentDepth(),
                    };
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
