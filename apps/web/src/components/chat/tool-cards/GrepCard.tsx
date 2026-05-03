import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function GrepCard({ event }: { event: PairedToolEvent }) {
  const pattern = (event.input.pattern as string) ?? '';
  const path = (event.input.path as string) ?? '';
  const lines = (event.output ?? '').split('\n').filter((l) => l.trim().length > 0);
  const matchCount = lines.length;
  const displayLines = lines.slice(0, 20);
  const remaining = matchCount - displayLines.length;

  return (
    <CollapsibleCard
      icon={<span>🔍</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Grep</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">&quot;{pattern}&quot;</span>
          {path && (
            <>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500">{path}</span>
            </>
          )}
        </>
      }
      badge={
        event.output ? (
          <span className="text-green-500">✓ {matchCount} matches</span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {displayLines.length > 0 && (
        <div className="space-y-0.5">
          {displayLines.map((l, i) => (
            <div key={i} className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{l}</div>
          ))}
          {remaining > 0 && (
            <div className="text-[11px] text-gray-600">... {remaining} more</div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
