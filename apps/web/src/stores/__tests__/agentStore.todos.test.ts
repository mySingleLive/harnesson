import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '../agentStore';
import type { TodoItem } from '@harnesson/shared';

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
