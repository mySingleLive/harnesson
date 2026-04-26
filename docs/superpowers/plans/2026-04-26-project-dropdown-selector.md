# Project Dropdown Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Topbar project button with an interactive dropdown that lists projects, supports search, and provides quick-action entries for creating/opening projects.

**Architecture:** New `ProjectDropdown` component uses pure CSS positioning with `useState`/`useRef` for open/close and click-outside behavior. Reads projects from Zustand store. Topbar receives callback props from MainLayout, which also manages the CreateProjectModal.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Lucide React icons

---

### Task 1: Create ProjectDropdown component

**Files:**
- Create: `apps/web/src/components/layout/ProjectDropdown.tsx`

- [ ] **Step 1: Write the ProjectDropdown component**

```tsx
// apps/web/src/components/layout/ProjectDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { Folder, ChevronDown, Search, Plus, FolderOpen } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface ProjectDropdownProps {
  onCreateProject: () => void;
  onOpenFolder: () => void;
}

export function ProjectDropdown({ onCreateProject, onOpenFolder }: ProjectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const switchProject = useProjectStore((s) => s.switchProject);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const projectName = activeProject?.name ?? 'No Project';

  const filtered = query
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.path.toLowerCase().includes(query.toLowerCase()),
      )
    : projects;

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (projectId: string) => {
    switchProject(projectId, 'main');
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300"
      >
        <Folder className="h-3 w-3" />
        <span className="font-medium text-gray-400">{projectName}</span>
        <ChevronDown className={`h-3 w-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-harness-border bg-harness-sidebar shadow-xl">
          {/* Search */}
          <div className="border-b border-harness-border p-2">
            <div className="flex items-center gap-2 rounded-md bg-harness-content px-2 py-1.5">
              <Search className="h-3 w-3 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索项目..."
                className="flex-1 bg-transparent text-xs text-gray-200 outline-none placeholder-gray-600"
              />
            </div>
          </div>

          {/* Project list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-600">
                {query ? '无匹配项目' : '暂无项目'}
              </div>
            ) : (
              filtered.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/5 ${
                    project.id === activeProjectId ? 'bg-white/5 text-gray-200' : 'text-gray-400'
                  }`}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{project.name}</div>
                    <div className="truncate text-[10px] text-gray-600">{project.path}</div>
                  </div>
                  {project.id === activeProjectId && (
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-harness-accent" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Quick actions */}
          <div className="border-t border-harness-border p-1">
            <button
              onClick={() => {
                setOpen(false);
                setQuery('');
                onCreateProject();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
            >
              <Plus className="h-3.5 w-3.5" />
              新建项目
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setQuery('');
                onOpenFolder();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              打开文件夹
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web exec tsc --noEmit`
Expected: No errors related to `ProjectDropdown.tsx`

---

### Task 2: Update Topbar to use ProjectDropdown

**Files:**
- Modify: `apps/web/src/components/layout/Topbar.tsx`

- [ ] **Step 1: Replace Topbar with updated version**

Replace the entire content of `apps/web/src/components/layout/Topbar.tsx` with:

```tsx
import { Settings, GitBranch, ChevronDown } from 'lucide-react';
import { ProjectDropdown } from './ProjectDropdown';

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
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
          <GitBranch className="h-3 w-3" />
          <span className="font-medium text-gray-400">—</span>
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </button>
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

Changes from original:
- Removed `Folder` from lucide imports (no longer needed in Topbar)
- Removed `useProjectStore` import (ProjectDropdown handles its own store access)
- Removed `activeProjectId`, `activeBranch`, `projectName`, `branch` local variables
- Replaced the Folder project button with `<ProjectDropdown />`
- Added `onCreateProject` and `onOpenFolder` props to `TopbarProps`
- Branch button now shows `—` directly since `activeBranch` was removed from this scope (branch dropdown is out of scope per spec)

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web exec tsc --noEmit`
Expected: No errors related to `Topbar.tsx`

---

### Task 3: Update MainLayout to wire callbacks and manage CreateProjectModal

**Files:**
- Modify: `apps/web/src/components/layout/MainLayout.tsx`

- [ ] **Step 1: Update MainLayout**

Add state and handlers for the create project modal, wire Topbar's new props, and render CreateProjectModal. Replace the MainLayout component body with:

Add these imports at the top of `apps/web/src/components/layout/MainLayout.tsx`:

```tsx
import { useState } from 'react';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { useProjectActions } from '@/hooks/useProjectActions';
```

Note: `useState` import may already exist — check before adding. `useEffect` is already imported from React. Merge the React import if needed (e.g., `import { useState, useEffect } from 'react';`).

Then add these lines inside the `MainLayout` function, before `const activeAgent`:

```tsx
const [showCreateModal, setShowCreateModal] = useState(false);
const { createProject, openFolder, isCreating } = useProjectActions();
```

Update the `<Topbar>` JSX from:

```tsx
<Topbar runningAgentCount={runningCount} />
```

to:

```tsx
<Topbar
  runningAgentCount={runningCount}
  onCreateProject={() => setShowCreateModal(true)}
  onOpenFolder={() => { openFolder(); }}
/>
```

Add the modal at the end of the return JSX, just before the closing `</div>`:

```tsx
{showCreateModal && (
  <CreateProjectModal
    onClose={() => setShowCreateModal(false)}
    onCreate={createProject}
    isCreating={isCreating}
  />
)}
```

The final component should look like:

```tsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { AgentPanel } from './AgentPanel';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { useProjectActions } from '@/hooks/useProjectActions';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

export function MainLayout() {
  const { agents, activeAgentId, setActiveAgent, updatePanelState } = useAgentStore();
  const switchProject = useProjectStore((s) => s.switchProject);
  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const runningCount = agents.filter((a) => a.status === 'running').length;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createProject, openFolder, isCreating } = useProjectActions();

  const handleAgentClick = (agent: typeof agents[number]) => {
    setActiveAgent(agent.id);
    updatePanelState(agent.id, { isOpen: true });
    switchProject(agent.projectId, agent.branch);
  };

  const handleClose = () => {
    if (activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: false });
    }
    setActiveAgent(null);
  };

  const handleToggleMaximize = () => {
    if (activeAgent) {
      updatePanelState(activeAgent.id, { isMaximized: !activeAgent.panelState.isMaximized });
    }
  };

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: false });
      setActiveAgent(null);
    }
  }, [location.pathname]);

  const showPanel = activeAgent && activeAgent.panelState.isOpen;

  return (
    <div className="flex h-screen flex-col">
      <Topbar
        runningAgentCount={runningCount}
        onCreateProject={() => setShowCreateModal(true)}
        onOpenFolder={() => { openFolder(); }}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          agents={agents}
          activeAgentId={activeAgentId ?? undefined}
          onAgentClick={handleAgentClick}
        />
        {showPanel && (
          <AgentPanel
            agent={activeAgent}
            messages={mockMessages}
            isMaximized={activeAgent.panelState.isMaximized}
            onToggleMaximize={handleToggleMaximize}
            onClose={handleClose}
          />
        )}
        {!activeAgent?.panelState.isMaximized && (
          <main className="flex-1 overflow-auto bg-harness-content">
            <Outlet />
          </main>
        )}
      </div>
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createProject}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}

const mockMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Implement JWT authentication for the login API endpoint.',
  },
  {
    id: '2',
    role: 'agent' as const,
    content: "I'll implement JWT authentication. Let me update the auth module:",
    diffBlocks: [
      {
        fileName: 'auth/jwt.ts',
        added: 5,
        removed: 2,
        lines: [
          { type: 'context' as const, lineNum: ' 5', content: "import express from 'express';" },
          { type: 'removed' as const, lineNum: ' 6', content: "import crypto from 'crypto';" },
          { type: 'removed' as const, lineNum: ' 7', content: "const SECRET = 'hardcoded-secret';" },
          { type: 'added' as const, lineNum: ' 6', content: "import jwt from 'jsonwebtoken';" },
          { type: 'added' as const, lineNum: ' 7', content: "import bcrypt from 'bcryptjs';" },
          { type: 'added' as const, lineNum: ' 8', content: 'const SECRET = config().JWT_SECRET;' },
          { type: 'added' as const, lineNum: ' 9', content: "const EXPIRES = '24h';" },
          { type: 'added' as const, lineNum: '10', content: "const REFRESH_EXPIRES = '7d';" },
        ],
      },
    ],
  },
];
```

- [ ] **Step 2: Verify full compilation**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web exec tsc --noEmit`
Expected: No type errors

---

### Task 4: Visual verification and commit

- [ ] **Step 1: Start the dev server**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web dev`

- [ ] **Step 2: Manually verify in browser**

Check these scenarios:
1. **Topbar shows project name** — Button displays active project name (or "No Project"), not a UUID
2. **Dropdown opens/closes** — Click the project button to toggle the dropdown
3. **Click outside closes** — Click anywhere outside the dropdown to close it
4. **Search filtering** — Type in the search box to filter the project list
5. **Select a project** — Click a project item to activate it; dropdown closes; button updates
6. **Active project highlight** — Current project has accent dot and lighter text
7. **New Project button** — Opens the CreateProjectModal
8. **Open Folder button** — Triggers folder selection flow
9. **Post-creation** — After creating a project in the modal, it appears in the dropdown and is auto-selected
10. **Empty state** — When no projects match search, shows "无匹配项目"
11. **ChevronDown rotates** — Arrow rotates 180° when dropdown is open

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/ProjectDropdown.tsx apps/web/src/components/layout/Topbar.tsx apps/web/src/components/layout/MainLayout.tsx
git commit -m "feat: add interactive project dropdown selector in Topbar

Replace static project button with ProjectDropdown component that
lists all projects, supports search filtering, and provides quick
actions for creating projects and opening folders. Fixes bug where
Topbar displayed project UUID instead of name."
```
