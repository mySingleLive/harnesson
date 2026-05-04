import { create } from 'zustand';
import type { Agent, AgentPanelState, AgentStreamEvent, AgentMessage, TodoItem } from '@harnesson/shared';
import * as api from '@/lib/serverApi';

const completionTimers: Record<string, ReturnType<typeof setTimeout>> = {};

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  messages: Record<string, AgentMessage[]>;
  eventSources: Record<string, EventSource>;
  isStreaming: Record<string, boolean>;
  todos: Record<string, TodoItem[]>;
  pendingQuestion: Record<string, import('@harnesson/shared').PendingQuestion | null>;

  setActiveAgent: (id: string | null) => void;
  updatePanelState: (id: string, state: Partial<AgentPanelState>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;

  createAgent: (opts: {
    cwd: string;
    type: string;
    model?: string;
    permissionMode?: 'auto' | 'manual';
    taskTitle?: string;
  }) => Promise<Agent>;

  sendMessage: (agentId: string, text: string, model?: string) => Promise<void>;
  appendStreamEvent: (agentId: string, event: AgentStreamEvent) => void;
  connectSSE: (agentId: string) => void;
  disconnectSSE: (agentId: string) => void;
  abortAgent: (agentId: string) => Promise<void>;
  destroyAgent: (agentId: string) => Promise<void>;
  loadAgents: () => Promise<void>;

  addTodo: (agentId: string, item: TodoItem) => void;
  updateTodo: (agentId: string, id: string, updates: Partial<TodoItem>) => void;
  clearTodos: (agentId: string) => void;

  submitQuestionAnswer: (agentId: string, answer: string | string[]) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  activeAgentId: null,
  messages: {},
  eventSources: {},
  isStreaming: {},
  todos: {},
  pendingQuestion: {},

  addTodo: (agentId, item) =>
    set((s) => ({
      todos: {
        ...s.todos,
        [agentId]: [...(s.todos[agentId] ?? []), item],
      },
    })),

  updateTodo: (agentId, id, updates) =>
    set((s) => ({
      todos: {
        ...s.todos,
        [agentId]: (s.todos[agentId] ?? []).map((t) =>
          t.id === id ? { ...t, ...updates } : t,
        ),
      },
    })),

  clearTodos: (agentId) =>
    set((s) => ({
      todos: { ...s.todos, [agentId]: [] },
    })),

  submitQuestionAnswer: async (agentId, answer) => {
    const pending = get().pendingQuestion[agentId];
    if (!pending) return;

    try {
      await fetch(`/api/agents/${encodeURIComponent(agentId)}/tool-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
    } catch {
      // Network error - still clear pending state
    }

    set((s) => ({
      pendingQuestion: {
        ...s.pendingQuestion,
        [agentId]: null,
      },
    }));
  },

  setActiveAgent: (id) => set({ activeAgentId: id }),

  updatePanelState: (id, state) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, panelState: { ...a.panelState, ...state } } : a,
      ),
    })),

  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),

  createAgent: async (opts) => {
    const response = await api.createAgent({
      cwd: opts.cwd,
      type: opts.type,
      model: opts.model,
      permissionMode: opts.permissionMode ?? 'auto',
      prompt: opts.taskTitle,
    });

    const agent: Agent = {
      id: response.id,
      name: response.name,
      type: response.type as Agent['type'],
      status: 'idle',
      projectId: '',
      branch: '',
      worktreePath: response.cwd,
      model: response.model,
      createdAt: response.createdAt,
      panelState: { isOpen: true, isMaximized: true },
      sessionContext: { taskTitle: opts.taskTitle ?? '', tokenUsage: 0 },
    };

    set((s) => ({
      agents: [...s.agents, agent],
      activeAgentId: agent.id,
      messages: { ...s.messages, [agent.id]: [] },
    }));

    get().connectSSE(agent.id);

    return agent;
  },

  sendMessage: async (agentId, text, model) => {
    // Cancel pending completion timer
    if (completionTimers[agentId]) {
      clearTimeout(completionTimers[agentId]);
      delete completionTimers[agentId];
    }
    // Snapshot any active todos into message flow before starting new reply
    const currentTodos = get().todos[agentId] ?? [];
    if (currentTodos.length > 0) {
      const snapshotMsg: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: '',
        timestamp: new Date().toISOString(),
        todoSnapshot: [...currentTodos],
      };
      set((s) => ({
        todos: { ...s.todos, [agentId]: [] },
        messages: {
          ...s.messages,
          [agentId]: [...(s.messages[agentId] ?? []), snapshotMsg],
        },
      }));
    }

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    set((s) => ({
      messages: {
        ...s.messages,
        [agentId]: [...(s.messages[agentId] ?? []), userMsg],
      },
      isStreaming: { ...s.isStreaming, [agentId]: true },
    }));

    try {
      await api.sendAgentMessage(agentId, text, model);
    } catch (err) {
      get().appendStreamEvent(agentId, {
        type: 'agent.error',
        message: err instanceof Error ? err.message : 'Failed to send message',
        code: 'SEND_ERROR',
      });
    }
  },

  appendStreamEvent: (agentId, event) => {
    // Handle AskUserQuestion events
    if (event.type === 'agent.question') {
      const questionData = event.question as unknown as import('@harnesson/shared').QuestionData;
      const toolUseId = (event as Record<string, unknown>).tool_use_id as string;
      if (questionData && toolUseId) {
        set((s) => ({
          pendingQuestion: {
            ...s.pendingQuestion,
            [agentId]: {
              toolUseId,
              question: questionData,
            },
          },
        }));
      }
      return;
    }

    // Handle TodoWrite tool events — replaces entire todo list each call
    if (event.type === 'agent.tool_use' && event.tool === 'TodoWrite' && event.input) {
      const inputTodos = event.input.todos;
      if (Array.isArray(inputTodos)) {
        const todos: TodoItem[] = inputTodos.map((t: Record<string, unknown>, i: number) => ({
          id: String(i),
          content: String(t.content ?? ''),
          status: (t.status as TodoItem['status']) ?? 'pending',
          activeForm: t.activeForm ? String(t.activeForm) : undefined,
        }));
        set((s) => ({ todos: { ...s.todos, [agentId]: todos } }));

        // Check if all todos are completed
        if (todos.length > 0 && todos.every((t) => t.status === 'completed')) {
          const snapshot = [...todos];
          if (completionTimers[agentId]) clearTimeout(completionTimers[agentId]);
          completionTimers[agentId] = setTimeout(() => {
            delete completionTimers[agentId];
            const todoMsg: AgentMessage = {
              id: crypto.randomUUID(),
              role: 'agent',
              content: '',
              timestamp: new Date().toISOString(),
              todoSnapshot: snapshot,
            };
            set((s) => ({
              messages: {
                ...s.messages,
                [agentId]: [...(s.messages[agentId] ?? []), todoMsg],
              },
              todos: { ...s.todos, [agentId]: [] },
            }));
          }, 1500);
        }
      }
    }
    set((s) => {
      const msgs = s.messages[agentId] ?? [];
      const lastMsg = msgs[msgs.length - 1];

      if (event.type === 'agent.done' || event.type === 'agent.error') {
        return {
          isStreaming: { ...s.isStreaming, [agentId]: false },
          agents: s.agents.map((a) =>
            a.id === agentId
              ? { ...a, status: event.type === 'agent.error' ? 'error' : 'idle', error: event.type === 'agent.error' ? event.message : undefined }
              : a,
          ),
        };
      }

      if (lastMsg && lastMsg.role === 'agent') {
        const updatedMsg = { ...lastMsg, events: [...(lastMsg.events ?? []), event] };
        if (event.type === 'agent.text' && event.text) {
          updatedMsg.content = (lastMsg.content ?? '') + event.text;
        }
        return {
          messages: {
            ...s.messages,
            [agentId]: [...msgs.slice(0, -1), updatedMsg],
          },
        };
      }

      const agentMsg: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: event.type === 'agent.text' ? (event.text ?? '') : '',
        timestamp: new Date().toISOString(),
        events: [event],
      };
      return {
        messages: {
          ...s.messages,
          [agentId]: [...msgs, agentMsg],
        },
      };
    });
  },

  connectSSE: (agentId) => {
    const existing = get().eventSources[agentId];
    if (existing) {
      existing.close();
    }

    const es = new EventSource(`/api/agents/${encodeURIComponent(agentId)}/stream`);

    const eventTypes = [
      'agent.thinking',
      'agent.text',
      'agent.tool_use',
      'agent.tool_result',
      'agent.error',
      'agent.done',
      'agent.question',
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as AgentStreamEvent;
          get().appendStreamEvent(agentId, data);
        } catch {}
      });
    }

    es.onerror = () => {};

    set((s) => ({
      eventSources: { ...s.eventSources, [agentId]: es },
    }));
  },

  disconnectSSE: (agentId) => {
    const es = get().eventSources[agentId];
    if (es) {
      es.close();
      set((s) => {
        const { [agentId]: _, ...rest } = s.eventSources;
        return { eventSources: rest };
      });
    }
  },

  abortAgent: async (agentId) => {
    await api.abortAgent(agentId);
  },

  destroyAgent: async (agentId) => {
    if (completionTimers[agentId]) {
      clearTimeout(completionTimers[agentId]);
      delete completionTimers[agentId];
    }
    get().disconnectSSE(agentId);
    await api.destroyAgent(agentId);
    set((s) => {
      const { [agentId]: _msg, ...restMsgs } = s.messages;
      const { [agentId]: _stream, ...restStreams } = s.isStreaming;
      const { [agentId]: _todos, ...restTodos } = s.todos;
      return {
        agents: s.agents.filter((a) => a.id !== agentId),
        messages: restMsgs,
        isStreaming: restStreams,
        todos: restTodos,
        activeAgentId: s.activeAgentId === agentId ? null : s.activeAgentId,
      };
    });
  },

  loadAgents: async () => {
    try {
      const agentsInfo = await api.listAgents();
      const agents: Agent[] = agentsInfo.map((info) => ({
        id: info.id,
        name: info.name,
        type: info.type as Agent['type'],
        status: info.status as Agent['status'],
        projectId: '',
        branch: info.branch,
        worktreePath: info.cwd,
        model: info.model,
        createdAt: info.createdAt,
        error: info.error,
        panelState: { isOpen: false, isMaximized: false },
        sessionContext: info.sessionContext,
      }));
      set({ agents });

      for (const agent of agents) {
        if (agent.status === 'running') {
          get().connectSSE(agent.id);
        }
      }
    } catch {}
  },
}));
