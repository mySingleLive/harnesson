import { create } from 'zustand';
import type { Agent, AgentPanelState } from '@harnesson/shared';

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  setActiveAgent: (id: string | null) => void;
  updatePanelState: (id: string, state: Partial<AgentPanelState>) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
}

const mockAgents: Agent[] = [
  {
    id: 'agent-a',
    name: 'Agent A',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'main',
    worktreePath: '/tmp/worktree-a',
    model: 'Sonnet 4.7',
    createdAt: new Date(Date.now() - 754_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
    sessionContext: { taskTitle: '实现 JWT 认证', tokenUsage: 2400 },
  },
  {
    id: 'agent-b',
    name: 'Agent B',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'tree-1',
    worktreePath: '/tmp/worktree-b',
    model: 'Sonnet 4.7',
    createdAt: new Date(Date.now() - 320_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
    sessionContext: { taskTitle: '添加用户注册接口', tokenUsage: 1200 },
  },
  {
    id: 'agent-c',
    name: 'Agent C',
    type: 'gpt',
    status: 'idle',
    projectId: 'My Project B',
    branch: 'dev',
    worktreePath: '/tmp/worktree-c',
    createdAt: new Date(Date.now() - 180_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
  },
];

export const useAgentStore = create<AgentState>((set) => ({
  agents: mockAgents,
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  updatePanelState: (id, state) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, panelState: { ...a.panelState, ...state } } : a,
      ),
    })),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
}));