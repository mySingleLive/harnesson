export type AgentType = 'claude-code' | 'gpt' | 'cursor' | string;

export type AgentStatus = 'running' | 'waiting' | 'completed' | 'error' | 'idle';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  projectId: string;
  branch: string;
  worktreePath: string;
  taskId?: string;
  pid?: number;
  model?: string;
  createdAt: string;
  error?: string;
}