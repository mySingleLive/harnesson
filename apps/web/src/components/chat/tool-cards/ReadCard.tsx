import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function ReadCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const outputLines = (event.output ?? '').split('\n');
  const displayLines = outputLines.slice(0, 50);
  const remaining = outputLines.length - displayLines.length;

  return (
    <CollapsibleCard
      icon={<span>📄</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Read</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{filePath}</span>
        </>
      }
      badge={event.output ? <span className="text-green-500">✓</span> : undefined}
      isRunning={!event.output}
    >
      {displayLines.length > 0 && (
        <div className="space-y-0.5">
          {displayLines.map((line, i) => (
            <div key={i} className="flex gap-2 font-mono text-[11px]">
              <span className="w-8 shrink-0 text-right text-gray-600 select-none">{i + 1}</span>
              <span className="text-gray-500 whitespace-pre">{line}</span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-[11px] text-gray-600">... {remaining} more lines</div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
