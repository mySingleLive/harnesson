import { describe, it, expect } from 'vitest';
import { segmentEvents, type Segment } from '../segmentEvents';
import type { AgentStreamEvent } from '@harnesson/shared';

function textEvent(text: string): AgentStreamEvent {
  return { type: 'agent.text', text };
}

function toolUseEvent(tool: string, input: Record<string, unknown> = {}): AgentStreamEvent {
  return { type: 'agent.tool_use', tool, input };
}

function toolResultEvent(tool: string, output?: string): AgentStreamEvent {
  return { type: 'agent.tool_result', tool, output };
}

function thinkingEvent(): AgentStreamEvent {
  return { type: 'agent.thinking' };
}

describe('segmentEvents', () => {
  it('returns empty array for empty events', () => {
    expect(segmentEvents([])).toEqual([]);
  });

  it('returns a single text segment for text-only events', () => {
    const events = [textEvent('Hello world')];
    const result = segmentEvents(events);
    expect(result).toEqual([
      { type: 'text', content: 'Hello world' },
    ]);
  });

  it('concatenates consecutive text events into one segment', () => {
    const events = [textEvent('Hello '), textEvent('world')];
    const result = segmentEvents(events);
    expect(result).toEqual([
      { type: 'text', content: 'Hello world' },
    ]);
  });

  it('produces a tool segment from paired tool_use + tool_result', () => {
    const events = [
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'file contents'),
    ];
    const result = segmentEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('tool');
    if (result[0].type === 'tool') {
      expect(result[0].event.tool).toBe('Read');
      expect(result[0].event.input).toEqual({ file_path: '/a.ts' });
      expect(result[0].event.output).toBe('file contents');
    }
  });

  it('interleaves text and tool segments in chronological order', () => {
    const events = [
      textEvent('Let me read the file.'),
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents'),
      textEvent('Here is what I found.'),
    ];
    const result = segmentEvents(events);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', content: 'Let me read the file.' });
    expect(result[1].type).toBe('tool');
    expect(result[2]).toEqual({ type: 'text', content: 'Here is what I found.' });
  });

  it('renders multiple tool calls with text between them', () => {
    const events = [
      toolUseEvent('Glob', { pattern: '*.ts' }),
      toolResultEvent('Glob', 'a.ts\nb.ts'),
      textEvent('Now let me read a.ts'),
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents of a'),
    ];
    const result = segmentEvents(events);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('tool');
    expect(result[1]).toEqual({ type: 'text', content: 'Now let me read a.ts' });
    expect(result[2].type).toBe('tool');
  });

  it('ignores thinking events', () => {
    const events = [thinkingEvent(), textEvent('Hello'), thinkingEvent()];
    const result = segmentEvents(events);
    expect(result).toEqual([{ type: 'text', content: 'Hello' }]);
  });

  it('handles tool_use without tool_result as incomplete tool segment', () => {
    const events = [toolUseEvent('Read', { file_path: '/a.ts' })];
    const result = segmentEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('tool');
    if (result[0].type === 'tool') {
      expect(result[0].event.tool).toBe('Read');
      expect(result[0].event.output).toBeUndefined();
    }
  });

  it('skips empty text segments', () => {
    const events = [
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents'),
      textEvent(''),
      toolUseEvent('Write', { file_path: '/b.ts' }),
      toolResultEvent('Write', 'ok'),
    ];
    const result = segmentEvents(events);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('tool');
    expect(result[1].type).toBe('tool');
  });

  it('handles a full conversation with multiple interleaved segments', () => {
    const events = [
      textEvent('I will search for files.'),
      toolUseEvent('Glob', { pattern: '*.ts' }),
      toolResultEvent('Glob', 'a.ts\nb.ts'),
      textEvent('Let me read them.'),
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents a'),
      textEvent('Now I will edit.'),
      toolUseEvent('Edit', { file_path: '/a.ts' }),
      toolResultEvent('Edit', 'ok'),
      textEvent('Done!'),
    ];
    const result = segmentEvents(events);

    const types = result.map((s) => s.type);
    expect(types).toEqual(['text', 'tool', 'text', 'tool', 'text', 'tool', 'text']);
  });
});
