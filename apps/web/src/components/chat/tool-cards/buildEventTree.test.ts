import { describe, it, expect } from 'vitest';
import type { AgentStreamEvent } from '@harnesson/shared';
import { buildEventTree } from './buildEventTree';

describe('buildEventTree', () => {
  it('returns empty array for empty events', () => {
    expect(buildEventTree([])).toEqual([]);
  });

  it('segments root-level text events', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.text', text: 'Hello ' },
      { type: 'agent.text', text: 'world' },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toEqual({ type: 'text', content: 'Hello world' });
  });

  it('pairs root-level tool_use and tool_result', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.tool_use', tool: 'Read', input: { file: 'a.ts' }, tool_use_id: 'r1' },
      { type: 'agent.tool_result', tool: 'Read', output: 'file content', duration: 100 },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('tool');
    expect(tree[0].event?.tool).toBe('Read');
    expect(tree[0].event?.output).toBe('file content');
  });

  it('builds children for Agent tool with parentToolUseId events', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.text', text: 'I will use an agent' },
      { type: 'agent.tool_use', tool: 'Agent', input: { description: 'explore' }, tool_use_id: 'agent-1' },
      { type: 'agent.text', text: 'sub text', parentToolUseId: 'agent-1', depth: 1 },
      { type: 'agent.tool_use', tool: 'Read', input: { file: 'b.ts' }, tool_use_id: 'r1', parentToolUseId: 'agent-1', depth: 1 },
      { type: 'agent.tool_result', tool: 'Read', output: 'content', parentToolUseId: 'agent-1', depth: 1 },
      { type: 'agent.tool_result', tool: 'Agent', output: 'done' },
    ];
    const tree = buildEventTree(events);
    // Root: text + Agent tool
    expect(tree).toHaveLength(2);
    expect(tree[0].type).toBe('text');
    expect(tree[0].content).toBe('I will use an agent');
    expect(tree[1].type).toBe('tool');
    expect(tree[1].event?.tool).toBe('Agent');
    // Agent has children
    expect(tree[1].children).toBeDefined();
    expect(tree[1].children).toHaveLength(2);
    expect(tree[1].children![0].type).toBe('text');
    expect(tree[1].children![0].content).toBe('sub text');
    expect(tree[1].children![1].type).toBe('tool');
    expect(tree[1].children![1].event?.tool).toBe('Read');
  });

  it('expands legacy nested JSON format for backward compat', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.tool_use', tool: 'Agent', input: { description: 'test' }, tool_use_id: 'agent-old' },
      {
        type: 'agent.tool_result',
        tool: 'Agent',
        output: JSON.stringify({
          textOutput: 'final result',
          subTexts: ['thinking...'],
          subEvents: [
            { tool: 'Glob', input: { pattern: '**/*.ts' }, output: 'a.ts\nb.ts', duration: 50 },
          ],
        }),
        tool_use_id: 'agent-old',
      },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].event?.tool).toBe('Agent');
    // output 应该是 textOutput，不是嵌套 JSON
    expect(tree[0].event?.output).toBe('final result');
    // 应该有展开的 children
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![0].type).toBe('text');
    expect(tree[0].children![0].content).toBe('thinking...');
    expect(tree[0].children![1].type).toBe('tool');
    expect(tree[0].children![1].event?.tool).toBe('Glob');
  });

  it('skips TodoWrite events', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.tool_use', tool: 'TodoWrite', input: { todos: [] }, tool_use_id: 'tw1' },
      { type: 'agent.text', text: 'hello' },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('text');
  });

  it('handles qa-result from AskUserQuestion', () => {
    const events: AgentStreamEvent[] = [
      {
        type: 'agent.tool_use',
        tool: 'AskUserQuestion',
        input: { questions: [{ question: 'Pick one?' }] },
        tool_use_id: 'q1',
      },
      { type: 'agent.tool_result', tool: 'AskUserQuestion', output: 'Option A' },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('qa-result');
    expect(tree[0].question).toBe('Pick one?');
    expect(tree[0].answer).toBe('Option A');
  });

  it('correctly assigns children to multiple Agent tools', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.tool_use', tool: 'Agent', input: { description: 'agent A' }, tool_use_id: 'a1' },
      { type: 'agent.text', text: 'text from A', parentToolUseId: 'a1', depth: 1 },
      { type: 'agent.tool_result', tool: 'Agent', output: 'A done' },
      { type: 'agent.tool_use', tool: 'Agent', input: { description: 'agent B' }, tool_use_id: 'b2' },
      { type: 'agent.text', text: 'text from B', parentToolUseId: 'b2', depth: 1 },
      { type: 'agent.tool_result', tool: 'Agent', output: 'B done' },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(2);
    // Agent A
    expect(tree[0].event?.tool).toBe('Agent');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children![0].content).toBe('text from A');
    // Agent B
    expect(tree[1].event?.tool).toBe('Agent');
    expect(tree[1].children).toHaveLength(1);
    expect(tree[1].children![0].content).toBe('text from B');
  });
});
