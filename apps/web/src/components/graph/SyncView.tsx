import { useState } from 'react';
import { Network, Folder, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraphStore } from '@/stores/graphStore';
import { SyncProgress } from './SyncProgress';
import type { StorageLocation } from '@harnesson/shared';

interface SyncViewProps {
  projectPath: string;
  onSync: (storageLocation: StorageLocation) => void;
}

export function SyncView({ projectPath, onSync }: SyncViewProps) {
  const syncStatus = useGraphStore((s) => s.syncStatus);
  const [storageLocation, setStorageLocation] = useState<StorageLocation>('project');

  if (syncStatus === 'syncing') {
    return <SyncProgress />;
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-harness-accent/10">
          <Network className="h-7 w-7 text-harness-accent" />
        </div>
        <h2 className="mb-2 text-[15px] font-semibold text-gray-200">
          Project Graph Not Synced
        </h2>
        <p className="mb-6 text-[12px] leading-relaxed text-gray-500">
          Sync the project to generate a knowledge graph with specs, architecture, and technical documentation.
        </p>

        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setStorageLocation('project')}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition-colors',
              storageLocation === 'project'
                ? 'border-harness-accent bg-harness-accent/10 text-harness-accent'
                : 'border-harness-border text-gray-500 hover:border-gray-500',
            )}
          >
            <Folder className="h-3.5 w-3.5" />
            Project Dir
          </button>
          <button
            onClick={() => setStorageLocation('user')}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] transition-colors',
              storageLocation === 'user'
                ? 'border-harness-accent bg-harness-accent/10 text-harness-accent'
                : 'border-harness-border text-gray-500 hover:border-gray-500',
            )}
          >
            <User className="h-3.5 w-3.5" />
            User Dir
          </button>
        </div>

        <p className="mb-4 text-[10px] text-gray-600">
          {storageLocation === 'project'
            ? `Data will be stored at ${projectPath}/.harnesson/`
            : `Data will be stored at ~/.harnesson/<project>/`}
        </p>

        <button
          onClick={() => onSync(storageLocation)}
          className="rounded-lg bg-harness-accent px-5 py-2 text-[12px] font-medium text-white hover:bg-harness-accent/90"
        >
          Sync Project Graph
        </button>

        {syncStatus === 'error' && (
          <p className="mt-3 text-[11px] text-red-400">Sync failed. Please try again.</p>
        )}
      </div>
    </div>
  );
}
