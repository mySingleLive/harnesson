import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function GenericCard({ event }: { event: PairedToolEvent }) {
  const inputStr = JSON.stringify(event.input, null, 2);

  return (
    <CollapsibleCard
      icon={<span>🔧</span>}
      summary={<span className="font-medium text-gray-400">{event.tool}</span>}
      badge={event.isError ? <span className="text-red-400">✗</span> : undefined}
      isRunning={!event.output}
    >
      {event.input && Object.keys(event.input).length > 0 && (
        <div className="mb-1">
          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Input</div>
          <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{inputStr}</pre>
        </div>
      )}
      {event.output && (
        <div>
          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Output</div>
          <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 2000)}</pre>
        </div>
      )}
    </CollapsibleCard>
  );
}
