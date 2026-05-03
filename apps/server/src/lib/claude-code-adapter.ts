import { query } from '@anthropic-ai/claude-agent-sdk';
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

      const messageStream = query({
        prompt: message,
        options: sdkOptions,
      });

      let sessionId: string | undefined;

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
        } else if (msg.type === 'user' && msg.tool_use_result) {
          const result = msg.tool_use_result as Record<string, unknown>;
          yield {
            type: 'agent.tool_result',
            tool: (msg.parent_tool_use_id as string) ?? 'unknown',
            output: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
            isError: result.is_error === true,
          };
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
}
