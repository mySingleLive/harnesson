import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function BashCard({ event }: { event: PairedToolEvent }) {
  const command = (event.input.command as string) ?? '';
  const truncatedCmd = command.length > 60 ? command.slice(0, 60) + '...' : command;
  const outputLines = (event.output ?? '').split('\n').filter((l) => l.trim().length > 0);
  const previewLines = outputLines.slice(0, 2);

  return (
    <CollapsibleCard
      icon={<span>⚡</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Bash</span>
          <span className="text-gray-600">·</span>
          <span className="truncate font-mono text-gray-500">{truncatedCmd}</span>
        </>
      }
      preview={
        previewLines.length > 0 ? (
          <div className="space-y-0.5">
            {previewLines.map((line, i) => (
              <div key={i} className="font-mono text-[11px] text-gray-600 truncate">{line}</div>
            ))}
          </div>
        ) : undefined
      }
      badge={
        event.output ? (
          <span className={event.isError ? 'text-red-400' : 'text-green-500'}>
            {event.isError ? '✗' : '✓'}
            {event.duration != null ? ` ${formatDuration(event.duration)}` : ''}
          </span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {event.output && (
        <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 3000)}</pre>
      )}
    </CollapsibleCard>
  );
}
