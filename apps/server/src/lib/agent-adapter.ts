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