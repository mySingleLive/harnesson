import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.hoisted is executed before imports are resolved, so localStorage is available
// when the zustand store module initializes.
vi.hoisted(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  });
});

import { useProjectStore } from '../projectStore';
import * as serverApi from '@/lib/serverApi';

vi.mock('@/lib/serverApi', () => ({
  getProjects: vi.fn().mockResolvedValue([]),
  getProjectBranches: vi.fn().mockResolvedValue({
    local: ['main', 'feature/a'],
    remote: [],
    current: 'main',
    isGitRepo: true,
  }),
  removeProject: vi.fn().mockResolvedValue(undefined),
  checkoutBranch: vi.fn().mockResolvedValue({ success: true }),
}));

describe('projectStore branch override', () => {
  beforeEach(() => {
    useProjectStore.setState({
      activeProjectId: null,
      activeBranch: null,
      skipBranchOverride: false,
      branches: { local: [], remote: [], current: null, isGitRepo: false },
    });
  });

  it('preserves activeBranch when skipBranchOverride is true', async () => {
    const store = useProjectStore.getState();
    store.switchProject('project-1', 'feature/a', true);

    expect(useProjectStore.getState().activeProjectId).toBe('project-1');
    expect(useProjectStore.getState().activeBranch).toBe('feature/a');
    expect(useProjectStore.getState().skipBranchOverride).toBe(true);

    // Wait for loadBranches to complete
    await vi.waitFor(() => {
      expect(useProjectStore.getState().isBranchLoading).toBe(false);
    });

    // activeBranch should NOT be overwritten by branches.current ('main')
    expect(useProjectStore.getState().activeBranch).toBe('feature/a');
    expect(useProjectStore.getState().skipBranchOverride).toBe(false);
  });

  it('overwrites activeBranch when skipBranchOverride is false (default)', async () => {
    const store = useProjectStore.getState();
    store.switchProject('project-1', 'feature/a');

    await vi.waitFor(() => {
      expect(useProjectStore.getState().isBranchLoading).toBe(false);
    });

    // activeBranch should be overwritten by branches.current ('main')
    expect(useProjectStore.getState().activeBranch).toBe('main');
  });
});
