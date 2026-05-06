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

export interface QAResultSegment {
  type: 'qa-result';
  question: string;
  answer: string;
}

export type Segment = TextSegment | ToolSegment | QAResultSegment;

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
      if (event.tool !== 'TodoWrite') {
        pendingTools.push({ tool: event.tool ?? 'unknown', input: event.input ?? {} });
      }
    } else if (event.type === 'agent.tool_result') {
      flushText();

      // Handle AskUserQuestion: generate qa-result segment
      if (event.tool === 'AskUserQuestion') {
        const question = (() => {
          const paired = pendingTools.find(p => p.tool === 'AskUserQuestion');
          if (paired) {
            const questions = paired.input?.questions as Array<Record<string, unknown>> | undefined;
            return String(questions?.[0]?.question ?? '');
          }
          return '';
        })();
        // Remove from pendingTools
        const idx = pendingTools.findIndex(p => p.tool === 'AskUserQuestion');
        if (idx >= 0) pendingTools.splice(idx, 1);

        segments.push({
          type: 'qa-result',
          question,
          answer: String(event.output ?? ''),
        });
        continue;
      }

      if (event.tool === 'TodoWrite') continue;
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
