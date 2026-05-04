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
      content: 'Explore project',
      status: 'pending',
    };
    useAgentStore.getState().addTodo('agent-1', item);
    expect(useAgentStore.getState().todos['agent-1']).toEqual([item]);
  });

  it('updates a todo item status', () => {
    const item: TodoItem = { id: '1', content: 'Test', status: 'pending' };
    useAgentStore.getState().addTodo('agent-1', item);
    useAgentStore.getState().updateTodo('agent-1', '1', { status: 'in_progress' });
    expect(useAgentStore.getState().todos['agent-1'][0].status).toBe('in_progress');
  });

  it('clears todos for an agent', () => {
    const item: TodoItem = { id: '1', content: 'Test', status: 'pending' };
    useAgentStore.getState().addTodo('agent-1', item);
    useAgentStore.getState().clearTodos('agent-1');
    expect(useAgentStore.getState().todos['agent-1']).toEqual([]);
  });

  it('detects all completed', () => {
    const items: TodoItem[] = [
      { id: '1', content: 'A', status: 'completed' },
      { id: '2', content: 'B', status: 'completed' },
    ];
    for (const item of items) {
      useAgentStore.getState().addTodo('agent-1', item);
    }
    const todos = useAgentStore.getState().todos['agent-1'];
    const allDone = todos.length > 0 && todos.every((t) => t.status === 'completed');
    expect(allDone).toBe(true);
  });

  it('handles todos for multiple agents independently', () => {
    useAgentStore.getState().addTodo('agent-1', { id: '1', content: 'A', status: 'pending' });
    useAgentStore.getState().addTodo('agent-2', { id: '2', content: 'B', status: 'pending' });
    expect(useAgentStore.getState().todos['agent-1'].length).toBe(1);
    expect(useAgentStore.getState().todos['agent-2'].length).toBe(1);
  });
});

describe('agentStore TodoWrite SSE events', () => {
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

  it('sets todos from TodoWrite tool_use events', () => {
    const event: AgentStreamEvent = {
      type: 'agent.tool_use',
      tool: 'TodoWrite',
      input: {
        todos: [
          { content: 'Explore project', status: 'pending', activeForm: 'Exploring project' },
          { content: 'Write tests', status: 'in_progress', activeForm: 'Writing tests' },
        ],
      },
    };
    useAgentStore.getState().appendStreamEvent('agent-1', event);
    const todos = useAgentStore.getState().todos['agent-1'];
    expect(todos).toHaveLength(2);
    expect(todos[0].content).toBe('Explore project');
    expect(todos[0].status).toBe('pending');
    expect(todos[1].content).toBe('Write tests');
    expect(todos[1].status).toBe('in_progress');
  });

  it('replaces entire todo list on each TodoWrite call', () => {
    // First write
    useAgentStore.getState().appendStreamEvent('agent-1', {
      type: 'agent.tool_use',
      tool: 'TodoWrite',
      input: { todos: [{ content: 'Task A', status: 'pending' }] },
    });
    expect(useAgentStore.getState().todos['agent-1']).toHaveLength(1);

    // Second write replaces
    useAgentStore.getState().appendStreamEvent('agent-1', {
      type: 'agent.tool_use',
      tool: 'TodoWrite',
      input: { todos: [{ content: 'Task A', status: 'completed' }, { content: 'Task B', status: 'in_progress' }] },
    });
    expect(useAgentStore.getState().todos['agent-1']).toHaveLength(2);
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
