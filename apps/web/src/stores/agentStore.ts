import { create } from 'zustand';
import type { Agent, AgentPanelState, AgentStreamEvent, AgentMessage, TodoItem, ImageAttachment, ContentBlock } from '@harnesson/shared';
import * as api from '@/lib/serverApi';

const completionTimers: Record<string, ReturnType<typeof setTimeout>> = {};

const PANEL_WIDTH_KEY = 'harnesson_agent_panel_width';
const PANEL_COLLAPSED_KEY = 'harnesson_agent_panel_collapsed';

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  initialized: boolean;
  messages: Record<string, AgentMessage[]>;
  eventSources: Record<string, EventSource>;
  isStreaming: Record<string, boolean>;
  todos: Record<string, TodoItem[]>;
  pendingQuestion: Record<string, import('@harnesson/shared').PendingQuestion | null>;
  panelWidth: number;
  panelCollapsed: boolean;

  setPanelWidth: (width: number) => void;
  setPanelCollapsed: (collapsed: boolean) => void;

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

  sendMessage: (agentId: string, text: string, model?: string, extra?: { contentBlocks?: ContentBlock[]; images?: ImageAttachment[] }) => Promise<void>;
  appendStreamEvent: (agentId: string, event: AgentStreamEvent) => void;
  connectSSE: (agentId: string) => void;
  disconnectSSE: (agentId: string) => void;
  abortAgent: (agentId: string) => Promise<void>;
  destroyAgent: (agentId: string) => Promise<void>;
  loadAgents: () => Promise<void>;
  initialize: () => Promise<void>;
  activateAgent: (id: string) => Promise<void>;

  addTodo: (agentId: string, item: TodoItem) => void;
  updateTodo: (agentId: string, id: string, updates: Partial<TodoItem>) => void;
  clearTodos: (agentId: string) => void;

  submitQuestionAnswer: (agentId: string, answer: string | string[]) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  activeAgentId: null,
  initialized: false,
  messages: {},
  eventSources: {},
  isStreaming: {},
  todos: {},
  pendingQuestion: {},
  panelWidth: (() => { const v = parseInt(localStorage.getItem(PANEL_WIDTH_KEY) ?? '440', 10); return Number.isFinite(v) && v > 0 ? v : 440; })(),
  panelCollapsed: localStorage.getItem(PANEL_COLLAPSED_KEY) === 'true',

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

    set((s) => ({
      pendingQuestion: {
        ...s.pendingQuestion,
        [agentId]: null,
      },
      isStreaming: { ...s.isStreaming, [agentId]: true },
    }));

    try {
      await fetch(`/api/agents/${encodeURIComponent(agentId)}/tool-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
    } catch {
      // Network error - already cleared pending state
    }
  },

  setActiveAgent: (id) => set({ activeAgentId: id }),

  setPanelWidth: (width) => {
    try { localStorage.setItem(PANEL_WIDTH_KEY, String(width)); } catch {}
    set({ panelWidth: width });
  },

  setPanelCollapsed: (collapsed) => {
    try { localStorage.setItem(PANEL_COLLAPSED_KEY, String(collapsed)); } catch {}
    set({ panelCollapsed: collapsed });
  },

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
      projectId: response.projectId ?? '',
      branch: response.branch ?? '',
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

  sendMessage: async (agentId, text, model, extra) => {
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
      images: extra?.images,
      contentBlocks: extra?.contentBlocks,
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
      await api.sendAgentMessage(agentId, text, model, extra);
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

      if (event.type === 'agent.thinking') {
        return {
          isStreaming: { ...s.isStreaming, [agentId]: true },
          agents: s.agents.map((a) =>
            a.id === agentId ? { ...a, status: 'running' } : a,
          ),
        };
      }

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
    // Close all other SSE connections to avoid browser HTTP/1.1 connection pool exhaustion (max 6 per origin).
    // Only one agent's SSE stream should be active at a time.
    for (const [id, source] of Object.entries(get().eventSources)) {
      if (id !== agentId) {
        source.close();
      }
    }
    set((s) => {
      const { [agentId]: _, ...rest } = s.eventSources;
      return { eventSources: rest };
    });

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
    try {
      await api.destroyAgent(agentId);
    } catch (err) {
      throw new Error(`Failed to destroy agent: ${err instanceof Error ? err.message : String(err)}`);
    }
    get().disconnectSSE(agentId);
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
        projectId: (info as { projectId?: string }).projectId ?? '',
        branch: info.branch,
        worktreePath: info.cwd,
        model: info.model,
        createdAt: info.createdAt,
        error: info.error,
        panelState: { isOpen: false, isMaximized: false },
        sessionContext: info.sessionContext,
      }));
      set({ agents });

      // Restore pending questions for sessions waiting for input
      const pendingQuestions: Record<string, import('@harnesson/shared').PendingQuestion | null> = {};
      for (const info of agentsInfo) {
        if (info.status === 'waiting_for_input' && (info as { pendingQuestion?: unknown }).pendingQuestion) {
          const q = (info as { pendingQuestion: import('@harnesson/shared').QuestionData }).pendingQuestion;
          pendingQuestions[info.id] = {
            toolUseId: '',
            question: q,
          };
        }
      }
      if (Object.keys(pendingQuestions).length > 0) {
        set((s) => ({ pendingQuestion: { ...s.pendingQuestion, ...pendingQuestions } }));
      }

      for (const agent of agents) {
        if (agent.status === 'running') {
          get().connectSSE(agent.id);
        }
      }
    } catch {}
  },

  initialize: async () => {
    if (get().initialized) return;
    await get().loadAgents();
    set({ initialized: true });
  },

  activateAgent: async (id: string) => {
    set({ activeAgentId: id });
    const existingMessages = get().messages[id];
    if (!existingMessages || existingMessages.length === 0) {
      try {
        const msgs = await api.getAgentMessages(id);
        const agentMessages: AgentMessage[] = msgs.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'agent',
          content: m.content,
          images: m.images ?? undefined,
          contentBlocks: m.contentBlocks ?? undefined,
          timestamp: m.createdAt,
          events: m.events as AgentStreamEvent[] | undefined,
        }));
        set((s) => ({
          messages: { ...s.messages, [id]: agentMessages },
        }));
      } catch {}
    }

    // Restore pending question if session is waiting for input
    if (!get().pendingQuestion[id]) {
      try {
        const res = await fetch(`/api/agents/${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json() as { status?: string; pendingQuestion?: import('@harnesson/shared').QuestionData };
          if (data.status === 'waiting_for_input' && data.pendingQuestion) {
            set((s) => ({
              pendingQuestion: {
                ...s.pendingQuestion,
                [id]: { toolUseId: '', question: data.pendingQuestion },
              },
            }));
          }
        }
      } catch {}
    }

    get().connectSSE(id);
    get().updatePanelState(id, { isOpen: true });
  },
}));
