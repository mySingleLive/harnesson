# Branch Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive git branch dropdown to the Topbar that lists local/remote branches and switches branches via `git checkout`.

**Architecture:** New backend route handles git branch queries and checkout. Frontend gets a BranchDropdown component that reads branch state from an extended projectStore. Branches load when the active project changes.

**Tech Stack:** Hono (backend), React + Zustand (frontend), `child_process.execFile` (git commands)

---

### Task 1: Backend — Branches API Route

**Files:**
- Create: `apps/server/src/routes/branches.ts`
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: Create `apps/server/src/routes/branches.ts`**

```typescript
import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const branchesRoute = new Hono();

// GET /api/projects/:id/branches — list git branches
branchesRoute.get('/api/projects/:id/branches', async (c) => {
  const { id } = c.req.param();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return c.json({ error: 'Project not found' }, 404);

  try {
    const { stdout: localRaw } = await execFileAsync('git', ['branch', '--list'], {
      cwd: project.path,
      timeout: 10_000,
    });

    const local: string[] = [];
    let current: string | null = null;

    for (const line of localRaw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('* ')) {
        const name = trimmed.slice(2);
        current = name;
        local.push(name);
      } else {
        local.push(trimmed);
      }
    }

    const { stdout: remoteRaw } = await execFileAsync('git', ['branch', '-r'], {
      cwd: project.path,
      timeout: 10_000,
    });

    const remote = remoteRaw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.includes('->'));

    return c.json({ local, remote, current, isGitRepo: true });
  } catch {
    return c.json({ local: [], remote: [], current: null, isGitRepo: false });
  }
});

// POST /api/projects/:id/checkout — switch branch
branchesRoute.post('/api/projects/:id/checkout', async (c) => {
  const { id } = c.req.param();
  const { branch } = await c.req.json();

  if (!branch || typeof branch !== 'string') {
    return c.json({ error: 'branch is required' }, 400);
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return c.json({ error: 'Project not found' }, 404);

  try {
    const isRemote = branch.startsWith('origin/');
    const localName = isRemote ? branch.replace('origin/', '') : branch;

    if (isRemote) {
      await execFileAsync('git', ['checkout', '-b', localName, branch], {
        cwd: project.path,
        timeout: 10_000,
      });
    } else {
      await execFileAsync('git', ['checkout', localName], {
        cwd: project.path,
        timeout: 10_000,
      });
    }

    return c.json({ success: true, branch: localName });
  } catch (err: any) {
    const msg = err.stderr?.toString().trim() || err.message || 'Checkout failed';
    return c.json({ success: false, error: msg }, 400);
  }
});
```

- [ ] **Step 2: Register the route in `apps/server/src/index.ts`**

Add import and route registration. The file currently has:

```typescript
import { graphRoute } from './routes/graph.js';
```

Add after it:

```typescript
import { branchesRoute } from './routes/branches.js';
```

And add route registration after `app.route('/', graphRoute);`:

```typescript
app.route('/', branchesRoute);
```

- [ ] **Step 3: Verify the server compiles**

Run: `pnpm --filter @harnesson/server exec tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Start the server and test the endpoints manually**

Run: `pnpm --filter @harnesson/server dev`

Then in another terminal test with curl (replace `<project-id>` and `<project-path>` with real values from the DB):

```bash
# Get branches
curl http://localhost:3456/api/projects/<project-id>/branches

# Checkout branch
curl -X POST http://localhost:3456/api/projects/<project-id>/checkout \
  -H 'Content-Type: application/json' \
  -d '{"branch":"main"}'
```

Expected: JSON with `local`, `remote`, `current`, `isGitRepo` fields

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/routes/branches.ts apps/server/src/index.ts
git commit -m "feat: add git branch listing and checkout API endpoints"
```

---

### Task 2: Frontend — serverApi Branch Functions

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`

- [ ] **Step 1: Add BranchInfo type and API functions to `apps/web/src/lib/serverApi.ts`**

Add after the existing `GraphStatusResponse` interface (around line 86):

```typescript
// --- Branch API ---

export interface BranchInfo {
  local: string[];
  remote: string[];
  current: string | null;
  isGitRepo: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  branch?: string;
  error?: string;
}

export async function getProjectBranches(projectId: string): Promise<BranchInfo> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/branches`);
  if (!res.ok) throw new Error(`Failed to fetch branches: ${res.status}`);
  return res.json();
}

export async function checkoutBranch(projectId: string, branch: string): Promise<CheckoutResponse> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch }),
  });
  return res.json();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/serverApi.ts
git commit -m "feat: add branch API client functions"
```

---

### Task 3: Frontend — Extend projectStore with Branch State

**Files:**
- Modify: `apps/web/src/stores/projectStore.ts`

- [ ] **Step 1: Add BranchInfo import and new state/actions to projectStore**

The current file has `activeBranch: string | null` and `switchProject`. Modify it to add branch-related state and actions.

Add import at top:

```typescript
import type { BranchInfo } from '@/lib/serverApi';
```

Replace the `ProjectState` interface (lines 5-17) with:

```typescript
interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  branches: BranchInfo;
  isBranchLoading: boolean;
  projects: Project[];
  viewMode: 'card' | 'list';
  searchQuery: string;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  switchProject: (projectId: string, branch: string) => void;
  loadBranches: (projectId: string) => Promise<void>;
  checkoutBranch: (projectId: string, branch: string) => Promise<void>;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  addProjectToList: (project: Project) => void;
}
```

Add initial state fields after `activeBranch: null,`:

```typescript
  branches: { local: [], remote: [], current: null, isGitRepo: false },
  isBranchLoading: false,
```

Add new actions before `setViewMode`:

```typescript
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
```

- [ ] **Step 2: Update `switchProject` to also load branches**

The current `switchProject` only sets state. Modify it to also call `loadBranches`:

```typescript
  switchProject: (projectId, branch) => {
    const s = get();
    if (s.activeProjectId === projectId && s.activeBranch === branch) return;
    set({ activeProjectId: projectId, activeBranch: branch });
    get().loadBranches(projectId);
  },
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/projectStore.ts
git commit -m "feat: add branch state and actions to projectStore"
```

---

### Task 4: Frontend — BranchDropdown Component

**Files:**
- Create: `apps/web/src/components/layout/BranchDropdown.tsx`

- [ ] **Step 1: Create `apps/web/src/components/layout/BranchDropdown.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Globe } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

export function BranchDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const branches = useProjectStore((s) => s.branches);
  const isBranchLoading = useProjectStore((s) => s.isBranchLoading);
  const doCheckout = useProjectStore((s) => s.checkoutBranch);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!activeProjectId) return null;

  const label = isBranchLoading ? '...' : branches.isGitRepo ? (branches.current ?? 'No Git') : 'No Git';

  const handleSelect = async (branch: string) => {
    if (!activeProjectId || branch === branches.current) {
      setOpen(false);
      return;
    }
    const result = await doCheckout(activeProjectId, branch);
    if (result.success) {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300"
      >
        <GitBranch className="h-3 w-3" />
        <span className="font-medium text-gray-400">{label}</span>
        <ChevronDown className={`h-3 w-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-harness-border bg-harness-sidebar shadow-xl">
          {!branches.isGitRepo ? (
            <div className="p-4 text-center">
              <p className="text-xs text-gray-500">此项目不是 Git 仓库</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto p-1">
              {/* Local branches */}
              {branches.local.length > 0 && (
                <>
                  <div className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                    Local
                  </div>
                  {branches.local.map((branch) => (
                    <button
                      key={branch}
                      onClick={() => handleSelect(branch)}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5 ${
                        branch === branches.current ? 'bg-white/5 text-harness-accent' : 'text-gray-400'
                      }`}
                    >
                      <GitBranch className="h-3 w-3 shrink-0" />
                      <span className="flex-1 truncate">{branch}</span>
                      {branch === branches.current && (
                        <span className="text-[10px]">✓</span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* Remote branches */}
              {branches.remote.length > 0 && (
                <>
                  <div className="mt-1 border-t border-harness-border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                    Remote
                  </div>
                  {branches.remote.map((branch) => {
                    const displayName = branch.replace(/^origin\//, '');
                    return (
                      <button
                        key={branch}
                        onClick={() => handleSelect(branch)}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="flex-1 truncate">{displayName}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {branches.local.length === 0 && branches.remote.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-gray-600">无分支</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/BranchDropdown.tsx
git commit -m "feat: add BranchDropdown component"
```

---

### Task 5: Frontend — Integrate BranchDropdown into Topbar

**Files:**
- Modify: `apps/web/src/components/layout/Topbar.tsx`

- [ ] **Step 1: Replace static GitBranch button with BranchDropdown component**

Add import at top of file:

```typescript
import { BranchDropdown } from './BranchDropdown';
```

Remove `GitBranch` and `ChevronDown` from the lucide import (they are no longer used directly in Topbar).

Replace the static button (lines 17-21):

```tsx
<button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
  <GitBranch className="h-3 w-3" />
  <span className="font-medium text-gray-400">—</span>
  <ChevronDown className="h-3 w-3 text-gray-600" />
</button>
```

With:

```tsx
<BranchDropdown />
```

The full Topbar component should become:

```tsx
import { Settings } from 'lucide-react';
import { ProjectDropdown } from './ProjectDropdown';
import { BranchDropdown } from './BranchDropdown';

interface TopbarProps {
  runningAgentCount: number;
  onCreateProject: () => void;
  onOpenFolder: () => void;
}

export function Topbar({ runningAgentCount, onCreateProject, onOpenFolder }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-harness-border bg-[#1a1a2e] px-4 py-2 text-[13px]">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold text-harness-accent">Harnesson</span>
        <span className="text-gray-600">|</span>
        <ProjectDropdown onCreateProject={onCreateProject} onOpenFolder={onOpenFolder} />
        <BranchDropdown />
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-green-500 px-2 py-[2px] text-[11px] font-semibold text-black">
          {runningAgentCount} Agents Running
        </span>
        <button className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-gray-400">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm --filter @harnesson/web exec tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Start the dev server and test in browser**

Run: `pnpm dev`

Test in browser:
1. Select a project from the project dropdown
2. Verify the branch dropdown appears with the current branch name
3. Click the branch dropdown — verify local and remote branches are listed
4. Click a different branch — verify it switches and the button updates
5. Select a non-git project — verify "No Git" is shown

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/Topbar.tsx
git commit -m "feat: integrate BranchDropdown into Topbar"
```
