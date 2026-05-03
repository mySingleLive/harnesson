import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function WriteCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const content = (event.input.content as string) ?? '';
  const contentLines = content.split('\n');
  const displayLines = contentLines.slice(0, 30);
  const remaining = contentLines.length - displayLines.length;
  const size = formatBytes(new Blob([content]).size);
  const previewLines = contentLines.slice(0, 2);

  return (
    <CollapsibleCard
      icon={<span>✏️</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Write</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{filePath}</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">{size}</span>
        </>
      }
      preview={
        previewLines.length > 0 && previewLines[0].trim().length > 0 ? (
          <div className="space-y-0.5">
            {previewLines.map((line, i) => (
              <div key={i} className="flex gap-2 font-mono text-[11px]">
                <span className="w-8 shrink-0 text-right text-gray-700 select-none">{i + 1}</span>
                <span className="text-gray-600 truncate">{line}</span>
              </div>
            ))}
            {contentLines.length > 2 && (
              <div className="text-[11px] text-gray-500 italic">... +{contentLines.length - 2} lines (click to expand)</div>
            )}
          </div>
        ) : undefined
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
