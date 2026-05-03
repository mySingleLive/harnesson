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
      const toolName = event.tool ?? 'unknown';
      const idx = pending.findIndex((p) => p.tool === toolName);
      if (idx !== -1) {
        const { tool, input } = pending.splice(idx, 1)[0];
        paired.push({
          tool,
          input,
          output: event.output,
          isError: event.isError,
          duration: event.duration,
        });
      } else {
        paired.push({
          tool: toolName,
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
