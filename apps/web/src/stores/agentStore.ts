import { create } from 'zustand';
import type { Agent } from '@harnesson/shared';

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  setActiveAgent: (id: string | null) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
}

// Mock 数据 — 后续由 API 替换
const mockAgents: Agent[] = [
  {
    id: 'agent-a',
    name: 'Agent A',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'main',
    worktreePath: '/tmp/worktree-a',
    model: 'sonnet-4.7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent-b',
    name: 'Agent B',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'tree-1',
    worktreePath: '/tmp/worktree-b',
    model: 'sonnet-4.7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent-c',
    name: 'Agent C',
    type: 'gpt',
    status: 'completed',
    projectId: 'My Project B',
    branch: 'dev',
    worktreePath: '/tmp/worktree-c',
    createdAt: new Date().toISOString(),
  },
];

export const useAgentStore = create<AgentState>((set) => ({
  agents: mockAgents,
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
}));