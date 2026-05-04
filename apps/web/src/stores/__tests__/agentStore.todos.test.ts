import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '../agentStore';
import type { TodoItem, AgentStreamEvent } from '@harnesson/shared';

describe('agentStore todos', () => {
  beforeEach(() => {
    useAgentStore.setState({
      agents: [],
      activeAgentId: null,
      messages: {},
      eventSources: {},
      isStreaming: {},
      todos: {},
    });
  });

  it('adds a todo item', () => {
    const item: TodoItem = {
      id: '1',
      subject: 'Explore project',
      status: 'pending',
    };
    useAgentStore.getState().addTodo('agent-1', item);
    expect(useAgentStore.getState().todos['agent-1']).toEqual([item]);
  });

  it('updates a todo item status', () => {
    const item: TodoItem = { id: '1', subject: 'Test', status: 'pending' };
    useAgentStore.getState().addTodo('agent-1', item);
    useAgentStore.getState().updateTodo('agent-1', '1', { status: 'in_progress' });
    expect(useAgentStore.getState().todos['agent-1'][0].status).toBe('in_progress');
  });

  it('clears todos for an agent', () => {
    const item: TodoItem = { id: '1', subject: 'Test', status: 'pending' };
    useAgentStore.getState().addTodo('agent-1', item);
    useAgentStore.getState().clearTodos('agent-1');
    expect(useAgentStore.getState().todos['agent-1']).toEqual([]);
  });

  it('detects all completed', () => {
    const items: TodoItem[] = [
      { id: '1', subject: 'A', status: 'completed' },
      { id: '2', subject: 'B', status: 'completed' },
    ];
    for (const item of items) {
      useAgentStore.getState().addTodo('agent-1', item);
    }
    const todos = useAgentStore.getState().todos['agent-1'];
    const allDone = todos.length > 0 && todos.every((t) => t.status === 'completed');
    expect(allDone).toBe(true);
  });

  it('handles todos for multiple agents independently', () => {
    useAgentStore.getState().addTodo('agent-1', { id: '1', subject: 'A', status: 'pending' });
    useAgentStore.getState().addTodo('agent-2', { id: '2', subject: 'B', status: 'pending' });
    expect(useAgentStore.getState().todos['agent-1'].length).toBe(1);
    expect(useAgentStore.getState().todos['agent-2'].length).toBe(1);
  });
});

describe('agentStore SSE todo events', () => {
  beforeEach(() => {
    useAgentStore.setState({
      agents: [{ id: 'agent-1', name: 'Test', type: 'claude-code', status: 'running', projectId: '', branch: 'main', worktreePath: '/tmp', createdAt: '', panelState: { isOpen: true, isMaximized: false } }],
      activeAgentId: 'agent-1',
      messages: {},
      eventSources: {},
      isStreaming: {},
      todos: {},
    });
  });

  it('creates todos from TaskCreate tool_use events', () => {
    const event: AgentStreamEvent = {
      type: 'agent.tool_use',
      tool: 'TaskCreate',
      input: { subject: 'Explore project', taskId: '1', description: 'Check files', activeForm: 'Exploring project' },
    };
    useAgentStore.getState().appendStreamEvent('agent-1', event);
    const todos = useAgentStore.getState().todos['agent-1'];
    expect(todos).toHaveLength(1);
    expect(todos[0].subject).toBe('Explore project');
    expect(todos[0].status).toBe('pending');
  });

  it('updates todos from TaskUpdate tool_use events', () => {
    useAgentStore.getState().addTodo('agent-1', { id: '1', subject: 'Test', status: 'pending' });
    const event: AgentStreamEvent = {
      type: 'agent.tool_use',
      tool: 'TaskUpdate',
      input: { taskId: '1', status: 'in_progress' },
    };
    useAgentStore.getState().appendStreamEvent('agent-1', event);
    expect(useAgentStore.getState().todos['agent-1'][0].status).toBe('in_progress');
  });

  it('marks todo as completed via TaskUpdate', () => {
    useAgentStore.getState().addTodo('agent-1', { id: '1', subject: 'Test', status: 'in_progress' });
    const event: AgentStreamEvent = {
      type: 'agent.tool_use',
      tool: 'TaskUpdate',
      input: { taskId: '1', status: 'completed' },
    };
    useAgentStore.getState().appendStreamEvent('agent-1', event);
    expect(useAgentStore.getState().todos['agent-1'][0].status).toBe('completed');
  });

  it('does not create todos for other tool types', () => {
    const event: AgentStreamEvent = {
      type: 'agent.tool_use',
      tool: 'Bash',
      input: { command: 'ls' },
    };
    useAgentStore.getState().appendStreamEvent('agent-1', event);
    expect(useAgentStore.getState().todos['agent-1']).toBeUndefined();
  });
});
