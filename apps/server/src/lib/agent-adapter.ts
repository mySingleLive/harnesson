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

export interface AgentAdapter {
  sendMessage(agentId: string, message: string): AsyncIterable<AgentStreamEvent>;
  createSession(agentId: string, config: SessionConfig): Promise<void>;
  destroySession(agentId: string): Promise<void>;
  abort(agentId: string): void;
  getSupportedModels(): Promise<ModelInfo[]>;
  updateSessionModel(agentId: string, model: string): void;
}