import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

function parseFileList(output?: string): string[] {
  if (!output) return [];
  return output.split('\n').filter((line) => line.trim().length > 0);
}

export function GlobCard({ event }: { event: PairedToolEvent }) {
  const pattern = (event.input.pattern as string) ?? '';
  const files = parseFileList(event.output);
  const fileCount = files.length;
  const displayFiles = files.slice(0, 20);
  const remaining = fileCount - displayFiles.length;

  return (
    <CollapsibleCard
      icon={<span>🔍</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Glob</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{pattern}</span>
        </>
      }
      badge={
        event.output ? (
          <span className="text-green-500">✓ {fileCount} files</span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {displayFiles.length > 0 && (
        <div className="space-y-0.5">
          {displayFiles.map((f, i) => (
            <div key={i} className="font-mono text-[11px] text-gray-500">{f}</div>
          ))}
          {remaining > 0 && (
            <div className="text-[11px] text-gray-600">... {remaining} more</div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
