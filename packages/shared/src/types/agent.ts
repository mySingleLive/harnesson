export type AgentType = 'claude-code' | 'gpt' | 'cursor' | string;

export type AgentStatus = 'running' | 'waiting' | 'completed' | 'error' | 'idle';

export interface AgentPanelState {
  isOpen: boolean;
  isMaximized: boolean;
}

export interface AgentSessionContext {
  taskTitle?: string;
  tokenUsage?: number;
}

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
  panelState: AgentPanelState;
  sessionContext?: AgentSessionContext;
}

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
  parentToolUseId?: string;
  depth?: number;
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
  prompt?: string;
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
  model?: string;
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

