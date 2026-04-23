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
  createAgent: (opts: { projectId: string; branch: string; model?: string; taskTitle?: string }) => Agent;
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

export const useAgentStore = create<AgentState>((set, get) => ({
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
  createAgent: (opts) => {
    const id = crypto.randomUUID();
    const agents = get().agents;
    const usedIndices = agents
      .map((a) => { const m = a.name.match(/^Agent ([A-Z])$/); return m ? m[1].charCodeAt(0) - 65 : -1; })
      .filter((n) => n >= 0);
    const nextIndex = usedIndices.length > 0 ? Math.max(...usedIndices) + 1 : 0;
    const agent: Agent = {
      id,
      name: `Agent ${String.fromCharCode(65 + (nextIndex % 26))}`,
      type: 'claude-code',
      status: 'running',
      projectId: opts.projectId,
      branch: opts.branch,
      worktreePath: `/tmp/worktree-${id.slice(0, 8)}`,
      model: opts.model ?? 'Sonnet 4.7',
      createdAt: new Date().toISOString(),
      panelState: { isOpen: true, isMaximized: true },
      sessionContext: { taskTitle: opts.taskTitle ?? '', tokenUsage: 0 },
    };
    set((s) => ({ agents: [...s.agents, agent], activeAgentId: agent.id }));
    return agent;
  },
}));
