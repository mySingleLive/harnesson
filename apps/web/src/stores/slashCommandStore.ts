import { create } from 'zustand';
import type { SlashCommand } from '@harnesson/shared';
import * as api from '@/lib/serverApi';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface SlashCommandState {
  commands: SlashCommand[];
  isLoading: boolean;
  lastFetched: number | null;
  lastCwd: string | undefined;

  fetchCommands: (cwd?: string) => Promise<void>;
  invalidateCache: () => void;
}

export const useSlashCommandStore = create<SlashCommandState>((set, get) => ({
  commands: [],
  isLoading: false,
  lastFetched: null,
  lastCwd: undefined,

  fetchCommands: async (cwd?: string) => {
    const { lastFetched, isLoading, lastCwd } = get();
    if (isLoading) return;
    if (lastFetched && cwd === lastCwd && Date.now() - lastFetched < CACHE_DURATION) return;

    set({ isLoading: true });
    try {
      const commands = await api.getSlashCommands(cwd);
      set({ commands, lastFetched: Date.now(), lastCwd: cwd });
    } catch {
      // Keep existing commands on error
    } finally {
      set({ isLoading: false });
    }
  },

  invalidateCache: () => {
    set({ lastFetched: null, lastCwd: undefined });
  },
}));
