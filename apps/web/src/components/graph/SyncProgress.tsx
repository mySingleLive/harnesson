import { useGraphStore } from '@/stores/graphStore';
import { Loader2 } from 'lucide-react';

const phaseLabels: Record<string, string> = {
  initializing: 'Initializing',
  scanning: 'Scanning source code',
  analyzing: 'AI analysis',
  generating: 'Generating graph data',
  completing: 'Completing sync',
};

export function SyncProgress() {
  const syncProgress = useGraphStore((s) => s.syncProgress);
  const syncPhase = useGraphStore((s) => s.syncPhase);
  const syncLogs = useGraphStore((s) => s.syncLogs);
  const cancelSync = useGraphStore((s) => s.cancelSync);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-harness-accent" />
          <h3 className="text-[14px] font-semibold text-gray-200">Syncing Project Graph</h3>
          <p className="mt-1 text-[12px] text-gray-500">
            {phaseLabels[syncPhase] ?? syncPhase} — {Math.round(syncProgress)}%
          </p>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-harness-border">
          <div
            className="h-full rounded-full bg-harness-accent transition-all duration-300"
            style={{ width: `${syncProgress}%` }}
          />
        </div>

        <div className="mb-6 flex justify-between text-[10px] text-gray-600">
          <span>Init</span>
          <span>Scan</span>
          <span>Analyze</span>
          <span>Generate</span>
          <span>Done</span>
        </div>

        {syncLogs.length > 0 && (
          <div className="max-h-[200px] overflow-y-auto rounded-md border border-harness-border bg-harness-bg p-3">
            {syncLogs.map((log, i) => (
              <p key={i} className="font-mono text-[11px] leading-relaxed text-gray-500">
                <span className="text-gray-700">{String(i + 1).padStart(2, '0')}</span>
                {' '}
                {log}
              </p>
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={cancelSync}
            className="rounded-md px-4 py-1.5 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300"
          >
            Cancel Sync
          </button>
        </div>
      </div>
    </div>
  );
}
