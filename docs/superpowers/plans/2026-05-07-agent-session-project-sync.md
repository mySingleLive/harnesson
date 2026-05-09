# Agent Session Project Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user selects an Agent Session, the ProjectDropdown and BranchDropdown in the topbar show the agent's bound project and branch instead of being overwritten by the repo's current checkout state.

**Architecture:** Add a `skipBranchOverride` flag to the zustand project store. When an agent session is clicked, `switchProject` is called with `skipBranchOverride: true`, preventing the async `loadBranches` response from overwriting the agent's branch. This is display-only — no git checkout occurs.

**Tech Stack:** React, Zustand, Vitest, TypeScript

---

### Task 1: Add failing test for skipBranchOverride behavior

**Files:**
- Create: `apps/web/src/stores/__tests__/projectStore.branch-override.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/stores/__tests__/projectStore.branch-override.test.ts`
Expected: FAIL — `switchProject` only accepts 2 args, `skipBranchOverride` not in state

---

### Task 2: Implement skipBranchOverride in projectStore

**Files:**
- Modify: `apps/web/src/stores/projectStore.ts`

- [ ] **Step 1: Update the `ProjectState` interface**

Add `skipBranchOverride: boolean` after `isBranchLoading`:

```ts
interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  projects: Project[];
  viewMode: 'card' | 'list';
  searchQuery: string;
  isLoading: boolean;
  branches: BranchInfo;
  isBranchLoading: boolean;
  skipBranchOverride: boolean;
  loadProjects: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  switchProject: (projectId: string, branch: string, skipBranchOverride?: boolean) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  addProjectToList: (project: Project) => void;
  loadBranches: (projectId: string) => Promise<void>;
  checkoutBranch: (projectId: string, branch: string) => Promise<CheckoutResponse>;
}
```

- [ ] **Step 2: Add initial value**

Add `skipBranchOverride: false` after `isBranchLoading: false` in the store defaults.

- [ ] **Step 3: Update `switchProject` to accept and pass the flag**

```ts
switchProject: (projectId, branch, skipBranchOverride = false) => {
  const s = get();
  if (s.activeProjectId === projectId && s.activeBranch === branch) return;
  set({ activeProjectId: projectId, activeBranch: branch, skipBranchOverride });
  get().loadBranches(projectId);
},
```

- [ ] **Step 4: Update `loadBranches` to respect the flag**

```ts
loadBranches: async (projectId) => {
  set({ isBranchLoading: true });
  try {
    const branches = await serverApi.getProjectBranches(projectId);
    const { skipBranchOverride } = get();
    if (skipBranchOverride) {
      set({ branches, isBranchLoading: false, skipBranchOverride: false });
    } else {
      set({ branches, activeBranch: branches.current, isBranchLoading: false });
    }
  } catch {
    set({ branches: { local: [], remote: [], current: null, isGitRepo: false }, isBranchLoading: false });
  }
},
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/web && npx vitest run src/stores/__tests__/projectStore.branch-override.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/stores/projectStore.ts apps/web/src/stores/__tests__/projectStore.branch-override.test.ts
git commit -m "feat: add skipBranchOverride to preserve agent branch on session select"
```

---

### Task 3: Pass skipBranchOverride from MainLayout

**Files:**
- Modify: `apps/web/src/components/layout/MainLayout.tsx:20-23`

- [ ] **Step 1: Update `handleAgentClick`**

Change line 22 from:
```ts
switchProject(agent.projectId, agent.branch);
```
to:
```ts
switchProject(agent.projectId, agent.branch, true);
```

- [ ] **Step 2: Verify manually**

Run the dev server, create two agents on different branches, click between them and confirm the BranchDropdown updates to each agent's branch without reverting.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/MainLayout.tsx
git commit -m "feat: pass skipBranchOverride when selecting agent session"
```
