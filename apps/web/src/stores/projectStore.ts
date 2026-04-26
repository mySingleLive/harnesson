import { create } from 'zustand';
import type { Project } from '@harnesson/shared';
import * as serverApi from '@/lib/serverApi';

interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  projects: Project[];
  viewMode: 'card' | 'list';
  searchQuery: string;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  switchProject: (projectId: string, branch: string) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  addProjectToList: (project: Project) => void;
}

const VIEW_MODE_KEY = 'harnesson_view_mode';

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjectId: null,
  activeBranch: null,
  projects: [],
  viewMode: (localStorage.getItem(VIEW_MODE_KEY) as 'card' | 'list') ?? 'card',
  searchQuery: '',
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await serverApi.getProjects();
      set({ projects, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  removeProject: async (id) => {
    await serverApi.removeProject(id);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },

  switchProject: (projectId, branch) => {
    const s = get();
    if (s.activeProjectId === projectId && s.activeBranch === branch) return;
    set({ activeProjectId: projectId, activeBranch: branch });
  },

  setViewMode: (mode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    set({ viewMode: mode });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  addProjectToList: (project) => {
    set({ projects: [...get().projects, project] });
  },
}));
