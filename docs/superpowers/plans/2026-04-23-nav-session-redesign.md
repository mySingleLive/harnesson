# Navigation & New Session Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign sidebar navigation to 6 items and add a New Session welcome page that creates new Agents on first message.

**Architecture:** New Session is an independent route page (`/`) that replaces Dashboard as the index. It renders a centered HARNESSON branded welcome page with chat input and quick action cards. Sending the first message creates a new Agent via agentStore and switches to the AgentPanel view. Placeholder pages are added for Projects and Files.

**Tech Stack:** React 19, TypeScript, React Router v7, Zustand, Tailwind CSS v4, Lucide React

---

### Task 1: Add `createAgent` to agentStore

**Files:**
- Modify: `apps/web/src/stores/agentStore.ts`

This adds the `createAgent` method that generates a unique Agent with auto-incrementing name and default values.

- [ ] **Step 1: Add `createAgent` method to agentStore**

In `apps/web/src/stores/agentStore.ts`, add `createAgent` to the `AgentState` interface and the store implementation:

```typescript
// In AgentState interface, add:
createAgent: (opts: { projectId: string; branch: string; model?: string }) => Agent;
```

```typescript
// In store implementation, add:
createAgent: (opts) => {
  const agent: Agent = {
    id: `agent-${Date.now()}`,
    name: `Agent ${String.fromCharCode(65 + (s().agents.length % 26))}`, // A, B, C...
    type: 'claude-code',
    status: 'running',
    projectId: opts.projectId,
    branch: opts.branch,
    worktreePath: `/tmp/worktree-${Date.now()}`,
    model: opts.model ?? 'Sonnet 4.7',
    createdAt: new Date().toISOString(),
    panelState: { isOpen: true, isMaximized: false },
    sessionContext: { taskTitle: '', tokenUsage: 0 },
  };
  set((s) => ({ agents: [...s.agents, agent], activeAgentId: agent.id }));
  return agent;
},
```

Note: the `set((s) => ...)` call already exists in the store pattern. The `createAgent` uses `s()` (via `get()`) to count existing agents for naming. Update the store creator to use `(...a) => set((s) => ...)` pattern — the store already destructures `set` and `get` in `create<AgentState>((set) => ...)`, but `createAgent` needs `get` to read current state. Change the signature to `create<AgentState>((set, get) => ...)`.

Full updated store:

```typescript
import { create } from 'zustand';
import type { Agent, AgentPanelState } from '@harnesson/shared';

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  setActiveAgent: (id: string | null) => void;
  updatePanelState: (id: string, state: Partial<AgentPanelState>) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  createAgent: (opts: { projectId: string; branch: string; model?: string }) => Agent;
}

const mockAgents: Agent[] = [
  {
    id: 'agent-a',
    name: 'Agent A',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'main',
    worktreePath: '/tmp/worktree-a',
    model: 'Sonnet 4.7',
    createdAt: new Date(Date.now() - 754_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
    sessionContext: { taskTitle: '实现 JWT 认证', tokenUsage: 2400 },
  },
  {
    id: 'agent-b',
    name: 'Agent B',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'tree-1',
    worktreePath: '/tmp/worktree-b',
    model: 'Sonnet 4.7',
    createdAt: new Date(Date.now() - 320_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
    sessionContext: { taskTitle: '添加用户注册接口', tokenUsage: 1200 },
  },
  {
    id: 'agent-c',
    name: 'Agent C',
    type: 'gpt',
    status: 'idle',
    projectId: 'My Project B',
    branch: 'dev',
    worktreePath: '/tmp/worktree-c',
    createdAt: new Date(Date.now() - 180_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
  },
];

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: mockAgents,
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  updatePanelState: (id, state) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, panelState: { ...a.panelState, ...state } } : a,
      ),
    })),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  createAgent: (opts) => {
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name: `Agent ${String.fromCharCode(65 + (get().agents.length % 26))}`,
      type: 'claude-code',
      status: 'running',
      projectId: opts.projectId,
      branch: opts.branch,
      worktreePath: `/tmp/worktree-${Date.now()}`,
      model: opts.model ?? 'Sonnet 4.7',
      createdAt: new Date().toISOString(),
      panelState: { isOpen: true, isMaximized: false },
      sessionContext: { taskTitle: '', tokenUsage: 0 },
    };
    set((s) => ({ agents: [...s.agents, agent], activeAgentId: agent.id }));
    return agent;
  },
}));
```

- [ ] **Step 2: Verify the app compiles**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/agentStore.ts
git commit -m "feat(store): add createAgent method to agentStore"
```

---

### Task 2: Update Sidebar navigation

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`

Replace the 4 nav items with 6 new items, remove the "New Agent" button, and update icons.

- [ ] **Step 1: Update Sidebar navItems and remove New Agent button**

Replace the entire `Sidebar.tsx` with:

```typescript
import { NavLink } from 'react-router';
import {
  MessageSquarePlus,
  FolderKanban,
  FileText,
  CheckSquare,
  FolderOpen,
  GitBranch,
} from 'lucide-react';
import { AgentStatusDot } from './AgentStatusDot';
import type { Agent } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface SidebarProps {
  agents: Agent[];
  activeAgentId?: string;
  onAgentClick: (agent: Agent) => void;
}

const navItems = [
  { to: '/', icon: MessageSquarePlus, label: 'New Session' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/specs', icon: FileText, label: 'Specs' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/git', icon: GitBranch, label: 'Git' },
];

export function Sidebar({ agents, activeAgentId, onAgentClick }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-harness-border bg-harness-sidebar">
      <nav className="py-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors',
                isActive
                  ? 'border-l-[3px] border-harness-accent bg-harness-accent/10 text-harness-accent'
                  : 'text-gray-400 hover:bg-white/[0.02] hover:text-gray-300',
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-4 h-px bg-harness-border" />

      <div className="flex-1 overflow-y-auto py-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent)}
            className={cn(
              'w-full px-4 py-2 text-left transition-colors',
              activeAgentId === agent.id
                ? 'border-l-[3px] border-harness-accent bg-harness-accent/[0.08]'
                : 'hover:bg-white/[0.02]',
            )}
          >
            <div className="flex items-center gap-2">
              <AgentStatusDot status={agent.status} />
              <span className="text-[13px] font-medium text-gray-300">{agent.name}</span>
              <span className="ml-auto rounded bg-white/5 px-1.5 py-[1px] text-[10px] text-gray-500">
                {agent.type === 'claude-code' ? 'Claude' : agent.type === 'gpt' ? 'GPT' : agent.type}
              </span>
            </div>
            <div className="mt-0.5 pl-4 text-[11px] text-gray-500">
              {agent.projectId} · <span className="font-medium text-harness-accent">{agent.branch}</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
```

Key changes:
- Removed `onNewAgent` prop and "New Agent" button
- Replaced nav items: `LayoutGrid`→`MessageSquarePlus`, added `FolderKanban`/`FolderOpen`
- Added `end` prop to NavLink for `/` route (so it only matches exact `/`, not `/specs` etc.)

- [ ] **Step 2: Verify compilation**

Run: `pnpm --filter @harnesson/web build`
Expected: Build succeeds. Note: `MainLayout.tsx` still passes `onNewAgent` — we'll fix that in Task 4.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx
git commit -m "refactor(sidebar): update nav items to 6-menu layout, remove New Agent button"
```

---

### Task 3: Create placeholder pages and update routes

**Files:**
- Create: `apps/web/src/pages/ProjectsPage.tsx`
- Create: `apps/web/src/pages/FilesPage.tsx`
- Create: `apps/web/src/pages/NewSessionPage.tsx` (placeholder only — full implementation in Task 5)
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Create ProjectsPage placeholder**

Create `apps/web/src/pages/ProjectsPage.tsx`:

```typescript
export function ProjectsPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[15px] text-gray-500">Projects — coming soon</p>
    </div>
  );
}
```

- [ ] **Step 2: Create FilesPage placeholder**

Create `apps/web/src/pages/FilesPage.tsx`:

```typescript
export function FilesPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[15px] text-gray-500">Files — coming soon</p>
    </div>
  );
}
```

- [ ] **Step 3: Create NewSessionPage placeholder**

Create `apps/web/src/pages/NewSessionPage.tsx` with a minimal placeholder:

```typescript
export function NewSessionPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[15px] text-gray-500">New Session</p>
    </div>
  );
}
```

- [ ] **Step 4: Update App.tsx routes**

Replace `apps/web/src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { NewSessionPage } from './pages/NewSessionPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SpecsPage } from './pages/SpecsPage';
import { TasksPage } from './pages/TasksPage';
import { FilesPage } from './pages/FilesPage';
import { GitPage } from './pages/GitPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<NewSessionPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="specs" element={<SpecsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="git" element={<GitPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 5: Update MainLayout to remove `onNewAgent` prop**

In `apps/web/src/components/layout/MainLayout.tsx`, remove the `onNewAgent` prop from `<Sidebar>`:

Change:
```tsx
<Sidebar
  agents={agents}
  activeAgentId={activeAgentId ?? undefined}
  onAgentClick={handleAgentClick}
  onNewAgent={() => {}}
/>
```

To:
```tsx
<Sidebar
  agents={agents}
  activeAgentId={activeAgentId ?? undefined}
  onAgentClick={handleAgentClick}
/>
```

- [ ] **Step 6: Verify compilation**

Run: `pnpm --filter @harnesson/web build`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/ProjectsPage.tsx apps/web/src/pages/FilesPage.tsx apps/web/src/pages/NewSessionPage.tsx apps/web/src/App.tsx apps/web/src/components/layout/MainLayout.tsx
git commit -m "feat(routes): add New Session, Projects, Files pages; update routes and sidebar"
```

---

### Task 4: Implement NewSessionPage

**Files:**
- Modify: `apps/web/src/pages/NewSessionPage.tsx`
- Modify: `apps/web/src/components/layout/MainLayout.tsx`

This is the core UI task — the HARNESSON welcome page with centered chat input and quick action cards.

- [ ] **Step 1: Implement NewSessionPage component**

Replace `apps/web/src/pages/NewSessionPage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Layers, GitBranch, ChevronDown, ArrowUp, Sparkles, Bug, Code, TestTube } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

const quickActions = [
  { label: '创建新功能', icon: Sparkles, prompt: 'Help me create a new feature...' },
  { label: '修复 Bug', icon: Bug, prompt: 'Help me fix a bug...' },
  { label: '代码审查', icon: Code, prompt: 'Review the code changes...' },
  { label: '编写测试', icon: TestTube, prompt: 'Write tests for...' },
];

export function NewSessionPage() {
  const [input, setInput] = useState('');
  const createAgent = useAgentStore((s) => s.createAgent);
  const { activeProjectId, activeBranch } = useProjectStore();
  const navigate = useNavigate();

  const project = activeProjectId ?? 'My Project A';
  const branch = activeBranch ?? 'main';

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    createAgent({ projectId: project, branch });
    setInput('');
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-harness-content px-4">
      <h1 className="mb-8 text-[42px] font-bold tracking-wide text-harness-accent">
        HARNESSON
      </h1>

      <div className="w-full max-w-[700px]">
        <div className="rounded-2xl border border-white/10 bg-harness-sidebar transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Harnesson...  Type @ for files, / for commands"
            className="h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-harness-text outline-none placeholder:text-gray-600"
            rows={1}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Plus className="h-[18px] w-[18px]" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">Claude Code</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{branch}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                Sonnet 4.7
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                onClick={handleSend}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:bg-[#7c3aed]"
              >
                <ArrowUp className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {quickActions.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              onClick={() => handleQuickAction(prompt)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-gray-400 transition-colors hover:border-harness-accent/30 hover:bg-harness-accent/[0.05] hover:text-harness-accent"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-2 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update MainLayout — hide main content when New Session page is active without agent panel**

In `apps/web/src/components/layout/MainLayout.tsx`, the `<Outlet />` renders the current route. When user is on New Session and hasn't created an agent yet, `<Outlet />` renders `NewSessionPage`. When an agent panel is open (from clicking an agent card or after creating from New Session), the layout should show the AgentPanel. When AgentPanel is maximized, hide the main content. This logic already exists and works correctly. No changes needed to MainLayout beyond what was done in Task 3.

- [ ] **Step 3: Verify compilation and visual check**

Run: `pnpm --filter @harnesson/web dev`

Expected: Navigate to `http://localhost:5173/` and see:
- Left sidebar with 6 nav items (New Session highlighted)
- Right side: centered "HARNESSON" title, chat input box, 4 quick action cards, keyboard hints

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/NewSessionPage.tsx
git commit -m "feat(pages): implement NewSessionPage with HARNESSON welcome UI"
```

---

### Task 5: Update MainLayout — agent creation flow from New Session

**Files:**
- Modify: `apps/web/src/components/layout/MainLayout.tsx`

When `createAgent` is called from NewSessionPage, the agent gets added to the store with `panelState.isOpen: true` and `activeAgentId` set. The MainLayout already reads these to show the AgentPanel. We need to make sure the AgentPanel shows correctly after creation and that navigating away to New Session clears the panel.

- [ ] **Step 1: Update MainLayout to handle New Session navigation clearing agent panel**

In `apps/web/src/components/layout/MainLayout.tsx`, add logic so that when the user navigates to `/` (New Session), the active agent panel is closed. We do this by using `useLocation`:

```typescript
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { AgentPanel } from './AgentPanel';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

export function MainLayout() {
  const { agents, activeAgentId, setActiveAgent, updatePanelState } = useAgentStore();
  const switchProject = useProjectStore((s) => s.switchProject);
  const location = useLocation();
  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const runningCount = agents.filter((a) => a.status === 'running').length;

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

  const showPanel = activeAgent && activeAgent.panelState.isOpen;

  return (
    <div className="flex h-screen flex-col">
      <Topbar runningAgentCount={runningCount} />
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

Key changes from current:
- Removed `useNavigate` import (not needed — `createAgent` handles state directly)
- Removed the `onNewAgent` prop pass
- Kept existing panel show/hide logic (it already works with the new createAgent flow)

- [ ] **Step 2: Verify full flow**

Run: `pnpm --filter @harnesson/web dev`

Test the flow:
1. Navigate to `/` — see HARNESSON welcome page
2. Click agent cards in sidebar — AgentPanel opens on right, main content shows behind
3. Click "New Session" in sidebar — AgentPanel closes, HARNESSON welcome page shows
4. Type message in New Session input, press Enter — new Agent created, AgentPanel opens with conversation

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/MainLayout.tsx
git commit -m "refactor(layout): update MainLayout for new nav and agent creation flow"
```

---

### Task 6: Remove DashboardPage (no longer used)

**Files:**
- Delete: `apps/web/src/pages/DashboardPage.tsx`

The Dashboard page is replaced by NewSessionPage as the index route. It's no longer referenced.

- [ ] **Step 1: Delete DashboardPage**

```bash
rm apps/web/src/pages/DashboardPage.tsx
```

- [ ] **Step 2: Verify build succeeds**

Run: `pnpm --filter @harnesson/web build`
Expected: Build succeeds. No remaining imports of DashboardPage (App.tsx was updated in Task 3).

- [ ] **Step 3: Commit**

```bash
git add -u apps/web/src/pages/DashboardPage.tsx
git commit -m "chore: remove unused DashboardPage"
```

---

### Task 7: Final visual verification

- [ ] **Step 1: Start dev server**

Run: `pnpm --filter @harnesson/web dev`

- [ ] **Step 2: Verify all navigation items**

Click each nav item in sidebar:
- **New Session** (`/`) → HARNESSON welcome page with centered input and quick action cards
- **Projects** (`/projects`) → "Projects — coming soon" placeholder
- **Specs** (`/specs`) → existing Specs page
- **Tasks** (`/tasks`) → existing Tasks page
- **Files** (`/files`) → "Files — coming soon" placeholder
- **Git** (`/git`) → existing Git page

- [ ] **Step 3: Verify New Session → Agent creation flow**

1. Click "New Session" → HARNESSON welcome page shows
2. Type "Test message" in input → press Enter
3. New Agent card appears in sidebar
4. AgentPanel opens on right side with mock conversation
5. Click another sidebar Agent → panel switches
6. Click "New Session" again → panel closes, welcome page shows

- [ ] **Step 4: Verify quick action cards**

Click each quick action card → input fills with preset prompt text.
