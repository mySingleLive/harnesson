import type { AgentStreamEvent } from '@harnesson/shared';

export interface PairedToolEvent {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  duration?: number;
}

export function pairEvents(events: AgentStreamEvent[]): PairedToolEvent[] {
  const toolEvents = events.filter(
    (e) => e.type === 'agent.tool_use' || e.type === 'agent.tool_result'
  );

  const paired: PairedToolEvent[] = [];
  const pending: Array<{ tool: string; input: Record<string, unknown> }> = [];

  for (const event of toolEvents) {
    if (event.type === 'agent.tool_use') {
      pending.push({ tool: event.tool ?? 'unknown', input: event.input ?? {} });
    } else if (event.type === 'agent.tool_result') {
      // Sequential pairing: match with the oldest pending tool_use.
      // Claude Code runs tools one at a time, so FIFO is reliable.
      const toolName = event.tool;
      if (pending.length > 0) {
        const { tool, input } = pending.shift()!;
        paired.push({
          tool: toolName && toolName !== 'unknown' ? toolName : tool,
          input,
          output: event.output,
          isError: event.isError,
          duration: event.duration,
        });
      } else {
        paired.push({
          tool: toolName ?? 'unknown',
          input: {},
          output: event.output,
          isError: event.isError,
          duration: event.duration,
        });
      }
    }
  }

  for (const { tool, input } of pending) {
    paired.push({ tool, input });
  }

  return paired;
}
