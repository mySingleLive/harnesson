import { create } from 'zustand';

interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  switchProject: (projectId: string, branch: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjectId: null,
  activeBranch: null,
  switchProject: (projectId, branch) => {
    const s = get();
    if (s.activeProjectId === projectId && s.activeBranch === branch) return;
    set({ activeProjectId: projectId, activeBranch: branch });
  },
}));