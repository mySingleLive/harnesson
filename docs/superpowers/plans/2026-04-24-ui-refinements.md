# UI Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three targeted UI refinements: rename Specs→Graph, auto-maximize new sessions, and beautify topbar dropdowns.

**Architecture:** Direct edits to existing React components. No new components or state management patterns. Each change is independent — tasks can be executed in any order.

**Tech Stack:** React, React Router, Zustand, Tailwind CSS, Lucide icons

---

### Task 1: Rename Specs → Graph (Sidebar + Route + Page)

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx:20-27`
- Modify: `apps/web/src/App.tsx:5,18`
- Rename: `apps/web/src/pages/SpecsPage.tsx` → `apps/web/src/pages/GraphPage.tsx`

- [ ] **Step 1: Update Sidebar navItems**

In `apps/web/src/components/layout/Sidebar.tsx`, replace the Specs nav item:

```typescript
// Before
import { FileText, ... } from 'lucide-react';
...
{ to: '/specs', icon: FileText, label: 'Specs' },

// After
import { Network, ... } from 'lucide-react';   // replace FileText import
...
{ to: '/graph', icon: Network, label: 'Graph' },
```

- [ ] **Step 2: Update App.tsx route**

In `apps/web/src/App.tsx`, update import and route:

```typescript
// Before
import { SpecsPage } from './pages/SpecsPage';
...
<Route path="specs" element={<SpecsPage />} />

// After
import { GraphPage } from './pages/GraphPage';
...
<Route path="graph" element={<GraphPage />} />
```

- [ ] **Step 3: Rename page file and component**

Rename `apps/web/src/pages/SpecsPage.tsx` to `apps/web/src/pages/GraphPage.tsx` and update its content:

```typescript
export function GraphPage() {
  return <div className="p-6"><h1 className="mb-4 text-lg font-semibold">Graph</h1></div>;
}
```

- [ ] **Step 4: Verify in browser**

Run dev server, confirm:
- Sidebar shows "Graph" with network icon
- Clicking it navigates to `/graph`
- Old `/specs` route returns 404
- No console errors

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx apps/web/src/App.tsx apps/web/src/pages/GraphPage.tsx
git rm apps/web/src/pages/SpecsPage.tsx
git commit -m "refactor(nav): rename Specs to Graph with route and icon update"
```

---

### Task 2: Auto-Maximize Agent Panel on Session Creation

**Files:**
- Modify: `apps/web/src/stores/agentStore.ts:89`

- [ ] **Step 1: Change default panel state**

In `apps/web/src/stores/agentStore.ts`, inside the `createAgent` function, change the `panelState` initialization:

```typescript
// Before (line 89)
panelState: { isOpen: true, isMaximized: false },

// After
panelState: { isOpen: true, isMaximized: true },
```

- [ ] **Step 2: Verify in browser**

Run dev server, confirm:
- On NewSessionPage, type a message and press Enter
- Agent panel opens filling the entire content area (no sidebar content visible)
- Clicking the minimize button in AgentContextHeader shrinks the panel back to 440px
- Re-opening an existing agent from sidebar does NOT auto-maximize (only new sessions)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/agentStore.ts
git commit -m "feat(session): auto-maximize agent panel on new session creation"
```

---

### Task 3: Topbar Dropdown Buttons Unified Style

**Files:**
- Modify: `apps/web/src/components/layout/Topbar.tsx`

- [ ] **Step 1: Replace Topbar component**

Replace the entire Topbar component with unified dropdown button styling:

```typescript
import { Settings, Folder, GitBranch, ChevronDown } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface TopbarProps {
  runningAgentCount: number;
}

export function Topbar({ runningAgentCount }: TopbarProps) {
  const { activeProjectId, activeBranch } = useProjectStore();
  const projectName = activeProjectId ?? 'No Project';
  const branch = activeBranch ?? '—';

  return (
    <header className="flex items-center justify-between border-b border-harness-border bg-[#1a1a2e] px-4 py-2 text-[13px]">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold text-harness-accent">Harnesson</span>
        <span className="text-gray-600">|</span>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
          <Folder className="h-3 w-3" />
          <span className="font-medium text-gray-400">{projectName}</span>
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </button>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
          <GitBranch className="h-3 w-3" />
          <span className="font-medium text-gray-400">{branch}</span>
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

- [ ] **Step 2: Verify in browser**

Run dev server, confirm:
- Both project and branch buttons have transparent backgrounds by default
- On hover, a subtle white/5 background appears
- Both buttons show icon + text + chevron arrow
- Button sizes, spacing, and font match each other exactly
- Layout doesn't break at different project/branch name lengths

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/Topbar.tsx
git commit -m "feat(topbar): unify project and branch dropdown button styles"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Run full smoke test**

Run dev server and verify all three changes work together:
1. Sidebar "Graph" navigates correctly, icon is Network
2. New session from welcome page opens maximized panel
3. Topbar project + branch buttons have matching transparent/hover style
4. No regressions: sidebar agents list, agent panel minimize/restore, other nav items still work

- [ ] **Step 2: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address final verification issues"
```
