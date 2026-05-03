import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function EditCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const oldStr = (event.input.old_string as string) ?? '';
  const newStr = (event.input.new_string as string) ?? '';
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  return (
    <CollapsibleCard
      icon={<span>✏️</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Edit</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{filePath}</span>
        </>
      }
      badge={event.output ? <span className="text-green-500">✓</span> : event.isError ? <span className="text-red-400">✗</span> : undefined}
      isRunning={!event.output}
    >
      <div className="space-y-1">
        {oldLines.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Remove</div>
            {oldLines.map((line, i) => (
              <div key={i} className="font-mono text-[11px] bg-red-500/10 text-red-400 px-1 whitespace-pre">
                - {line}
              </div>
            ))}
          </div>
        )}
        {newLines.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Add</div>
            {newLines.map((line, i) => (
              <div key={i} className="font-mono text-[11px] bg-green-500/10 text-green-400 px-1 whitespace-pre">
                + {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
