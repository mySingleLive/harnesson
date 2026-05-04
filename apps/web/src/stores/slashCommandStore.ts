import { create } from 'zustand';
import type { SlashCommand } from '@harnesson/shared';
import * as api from '@/lib/serverApi';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface SlashCommandState {
  commands: SlashCommand[];
  isLoading: boolean;
  lastFetched: number | null;

  fetchCommands: () => Promise<void>;
  invalidateCache: () => void;
}

export const useSlashCommandStore = create<SlashCommandState>((set, get) => ({
  commands: [],
  isLoading: false,
  lastFetched: null,

  fetchCommands: async () => {
    const { lastFetched, isLoading } = get();
    if (isLoading) return;
    if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) return;

    set({ isLoading: true });
    try {
      const commands = await api.getSlashCommands();
      set({ commands, lastFetched: Date.now() });
    } catch {
      // Keep existing commands on error
    } finally {
      set({ isLoading: false });
    }
  },

  invalidateCache: () => {
    set({ lastFetched: null });
  },
}));