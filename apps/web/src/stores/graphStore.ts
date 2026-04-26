import { create } from 'zustand';
import type {
  GraphTab,
  Manifest,
  SpecsData,
  ArchitectData,
  SyncOptions,
  SyncStatus,
} from '@harnesson/shared';
import * as serverApi from '@/lib/serverApi';

interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

function parseSSEBuffer(buffer: string): { parsed: SSEEvent[]; remaining: string } {
  const parsed: SSEEvent[] = [];
  const lines = buffer.split('\n');
  const remaining = lines.pop() ?? '';

  let currentEvent = '';
  let currentData = '';

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      currentEvent = line.slice(7);
    } else if (line.startsWith('data: ')) {
      currentData = line.slice(6);
    } else if (line === '' && currentEvent && currentData) {
      parsed.push({ event: currentEvent, data: JSON.parse(currentData) });
      currentEvent = '';
      currentData = '';
    }
  }

  return { parsed, remaining };
}

interface GraphState {
  projectPath: string | null;
  manifest: Manifest | null;
  specsData: SpecsData | null;
  architectData: ArchitectData | null;

  syncStatus: SyncStatus;
  syncProgress: number;
  syncPhase: string;
  syncLogs: string[];

  activeTab: GraphTab;
  selectedNodeId: string | null;
  isDetailPanelOpen: boolean;

  setProjectPath: (path: string | null) => void;
  loadGraph: (projectPath: string) => Promise<void>;
  startSync: (options: SyncOptions) => Promise<void>;
  cancelSync: () => Promise<void>;
  selectNode: (nodeId: string) => void;
  closeDetailPanel: () => void;
  setActiveTab: (tab: GraphTab) => void;
  checkAutoSync: (projectPath: string) => Promise<void>;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  projectPath: null,
  manifest: null,
  specsData: null,
  architectData: null,

  syncStatus: 'idle',
  syncProgress: 0,
  syncPhase: '',
  syncLogs: [],

  activeTab: 'specs-graph',
  selectedNodeId: null,
  isDetailPanelOpen: false,

  setProjectPath: (path) => set({ projectPath: path }),

  loadGraph: async (projectPath: string) => {
    try {
      const data = await serverApi.getGraphData(projectPath);
      set({
        projectPath,
        manifest: data.manifest,
        specsData: data.specs,
        architectData: data.architect,
      });
    } catch {
      set({ projectPath, manifest: null, specsData: null, architectData: null });
    }
  },

  startSync: async (options: SyncOptions) => {
    set({ syncStatus: 'syncing', syncProgress: 0, syncPhase: 'initializing', syncLogs: [] });

    try {
      const response = await fetch('/api/graph/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Sync request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { parsed, remaining } = parseSSEBuffer(buffer);
        buffer = remaining;

        for (const evt of parsed) {
          switch (evt.event) {
            case 'progress':
              set({
                syncProgress: (evt.data.progress as number) ?? get().syncProgress,
                syncPhase: (evt.data.phase as string) ?? get().syncPhase,
                syncLogs: [...get().syncLogs, (evt.data.message as string) ?? ''],
              });
              break;
            case 'node-generated':
              break;
            case 'complete':
              set({ syncStatus: 'completed', syncProgress: 100 });
              await get().loadGraph(options.projectPath);
              break;
            case 'error':
              set({
                syncStatus: 'error',
                syncLogs: [...get().syncLogs, `Error: ${evt.data.message}`],
              });
              break;
          }
        }
      }
    } catch (err) {
      set({
        syncStatus: 'error',
        syncLogs: [...get().syncLogs, `Connection error: ${err instanceof Error ? err.message : String(err)}`],
      });
    }
  },

  cancelSync: async () => {
    const { projectPath } = get();
    if (!projectPath) return;
    try {
      await fetch('/api/graph/sync/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath }),
      });
    } catch {
      // Ignore cancel errors
    }
    set({ syncStatus: 'idle', syncProgress: 0 });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, isDetailPanelOpen: true }),

  closeDetailPanel: () => set({ isDetailPanelOpen: false, selectedNodeId: null }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  checkAutoSync: async (projectPath: string) => {
    try {
      const status = await serverApi.getGraphStatus(projectPath);
      if (!status.hasData || !status.lastSyncCommit) return;
      if ((status as Record<string, unknown>).needsSync) {
        await get().startSync({
          projectPath,
          storageLocation: 'project',
          syncType: 'incremental',
        });
      }
    } catch {
      // Auto-sync check failure is non-critical
    }
  },
}));
