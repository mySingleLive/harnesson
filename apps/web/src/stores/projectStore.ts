import { create } from 'zustand';
import type { Project } from '@harnesson/shared';
import type { BranchInfo, CheckoutResponse } from '@/lib/serverApi';
import * as serverApi from '@/lib/serverApi';

interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  projects: Project[];
  viewMode: 'card' | 'list';
  searchQuery: string;
  isLoading: boolean;
  branches: BranchInfo;
  isBranchLoading: boolean;
  loadProjects: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  switchProject: (projectId: string, branch: string) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  addProjectToList: (project: Project) => void;
  loadBranches: (projectId: string) => Promise<void>;
  checkoutBranch: (projectId: string, branch: string) => Promise<CheckoutResponse>;
}

const VIEW_MODE_KEY = 'harnesson_view_mode';

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjectId: null,
  activeBranch: null,
  branches: { local: [], remote: [], current: null, isGitRepo: false },
  isBranchLoading: false,
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
    get().loadBranches(projectId);
  },

  loadBranches: async (projectId) => {
    set({ isBranchLoading: true });
    try {
      const branches = await serverApi.getProjectBranches(projectId);
      set({ branches, activeBranch: branches.current, isBranchLoading: false });
    } catch {
      set({ branches: { local: [], remote: [], current: null, isGitRepo: false }, isBranchLoading: false });
    }
  },

  checkoutBranch: async (projectId, branch) => {
    const result = await serverApi.checkoutBranch(projectId, branch);
    if (result.success) {
      await get().loadBranches(projectId);
    }
    return result;
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