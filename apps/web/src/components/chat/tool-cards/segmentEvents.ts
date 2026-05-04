import type { AgentStreamEvent } from '@harnesson/shared';
import type { PairedToolEvent } from './pairEvents';

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface ToolSegment {
  type: 'tool';
  event: PairedToolEvent;
}

export type Segment = TextSegment | ToolSegment;

export function segmentEvents(events: AgentStreamEvent[]): Segment[] {
  const segments: Segment[] = [];
  let textBuffer = '';
  const pendingTools: Array<{ tool: string; input: Record<string, unknown> }> = [];

  function flushText() {
    if (textBuffer) {
      segments.push({ type: 'text', content: textBuffer });
      textBuffer = '';
    }
  }

  function flushPendingTools() {
    for (const { tool, input } of pendingTools) {
      segments.push({ type: 'tool', event: { tool, input } });
    }
    pendingTools.length = 0;
  }

  for (const event of events) {
    if (event.type === 'agent.text') {
      if (event.text) {
        textBuffer += event.text;
      }
    } else if (event.type === 'agent.tool_use') {
      flushText();
      if (event.tool !== 'TaskCreate' && event.tool !== 'TaskUpdate') {
        pendingTools.push({ tool: event.tool ?? 'unknown', input: event.input ?? {} });
      }
    } else if (event.type === 'agent.tool_result') {
      flushText();
      if (event.tool === 'TaskCreate' || event.tool === 'TaskUpdate') continue;
      const toolName = event.tool;
      if (pendingTools.length > 0) {
        const { tool, input } = pendingTools.shift()!;
        segments.push({
          type: 'tool',
          event: {
            tool: toolName && toolName !== 'unknown' ? toolName : tool,
            input,
            output: event.output,
            isError: event.isError,
            duration: event.duration,
          },
        });
      } else {
        segments.push({
          type: 'tool',
          event: {
            tool: toolName ?? 'unknown',
            input: {},
            output: event.output,
            isError: event.isError,
            duration: event.duration,
          },
        });
      }
    }
    // agent.thinking, agent.error, agent.done — ignored for segmentation
  }

  flushText();
  flushPendingTools();

  return segments;
}
