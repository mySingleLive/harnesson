import type { AgentStreamEvent } from '@harnesson/shared';

export interface PairedToolEvent {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  duration?: number;
  subEvents?: PairedToolEvent[];
  subTexts?: string[];
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
      const toolName = event.tool;
      if (pending.length > 0) {
        const { tool, input } = pending.shift()!;
        const pairedEvent: PairedToolEvent = {
          tool: toolName && toolName !== 'unknown' ? toolName : tool,
          input,
          output: event.output,
          isError: event.isError,
          duration: event.duration,
        };

        if (pairedEvent.tool === 'Agent' && event.output) {
          try {
            const parsed = JSON.parse(event.output);
            if (parsed.subEvents || parsed.subTexts) {
              pairedEvent.subEvents = parsed.subEvents;
              pairedEvent.subTexts = parsed.subTexts;
              pairedEvent.output = parsed.textOutput;
            }
          } catch {
            // output is plain text, not nested JSON
          }
        }

        paired.push(pairedEvent);
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
