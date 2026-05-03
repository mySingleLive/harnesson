import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function LSPCard({ event }: { event: PairedToolEvent }) {
  const operation = (event.input.operation as string) ?? '';
  const filePath = (event.input.filePath as string) ?? '';
  const line = event.input.line as number | undefined;

  return (
    <CollapsibleCard
      icon={<span>🔗</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">LSP</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">{operation}</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">
            {filePath}{line != null ? `:${line}` : ''}
          </span>
        </>
      }
      badge={event.output ? <span className="text-green-500">✓</span> : undefined}
      isRunning={!event.output}
    >
      {event.output && (
        <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 2000)}</pre>
      )}
    </CollapsibleCard>
  );
}
