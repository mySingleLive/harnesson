import { CollapsibleCard } from './CollapsibleCard';
import { AgentEventTree } from './AgentEventTree';
import type { PairedToolEvent } from './pairEvents';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AgentCard({ event }: { event: PairedToolEvent }) {
  const description = (event.input.description as string) ?? 'Agent';
  const model = event.input.model as string | undefined;
  const hasSubEvents = (event.subEvents?.length ?? 0) > 0 || (event.subTexts?.length ?? 0) > 0;

  return (
    <CollapsibleCard
      icon={<span>🤖</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Agent</span>
          <span className="text-gray-600">·</span>
          <span className="truncate text-gray-500">{description}</span>
        </>
      }
      badge={
        event.output ? (
          <span className="flex items-center gap-1.5">
            {model && (
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">{model}</span>
            )}
            <span className={event.isError ? 'text-red-400' : 'text-green-500'}>
              {event.isError ? '✗' : '✓'}
              {event.duration != null ? ` ${formatDuration(event.duration)}` : ''}
            </span>
          </span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {hasSubEvents && (
        <AgentEventTree subEvents={event.subEvents ?? []} subTexts={event.subTexts ?? []} />
      )}
      {!hasSubEvents && event.output && (
        <div className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 2000)}</div>
      )}
    </CollapsibleCard>
  );
}
