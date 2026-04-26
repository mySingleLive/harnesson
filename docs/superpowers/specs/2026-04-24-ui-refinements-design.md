# UI Refinements Design Spec

Date: 2026-04-24

## Overview

Three targeted UI refinements: sidebar label rename, session panel auto-maximize, and topbar dropdown beautification.

## Change 1: Sidebar "Specs" → "Graph"

Rename the sidebar navigation item from "Specs" to "Graph" (项目图谱), including route and icon.

**Files affected:**
- `apps/web/src/components/layout/Sidebar.tsx` — navItems array: `label: 'Specs'` → `'Graph'`, `to: '/specs'` → `'/graph'`, icon `FileText` → `Network`
- `apps/web/src/App.tsx` — route path `/specs` → `/graph`, import `SpecsPage` → `GraphPage`
- `apps/web/src/pages/SpecsPage.tsx` → rename to `GraphPage.tsx`, update component name

## Change 2: New Session Opens Maximized Panel

When a user starts a session from the NewSessionPage welcome screen, the Agent chat panel opens in maximized state (occupying the full content area).

**Files affected:**
- `apps/web/src/stores/agentStore.ts` — `createAgent`: change `panelState: { isOpen: true, isMaximized: false }` to `{ isOpen: true, isMaximized: true }`

**Behavior:** Panel fills the main content area on creation. Users can toggle back to normal size via the existing maximize/minimize button in AgentContextHeader.

## Change 3: Topbar Dropdown Buttons Unified Style

Beautify the project and branch dropdowns in the top bar to match the Agent panel's dropdown style, with consistent visual treatment.

**Current state:** Project dropdown uses plain `▼ ProjectName` button. Branch is plain `<span>` text with no interactivity.

**New design:** Both buttons share a unified template:
- Transparent background by default, `hover:bg-white/5` on mouse hover
- Icon + label text + ChevronDown arrow
- Shared classes: `flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300`
- Project button: `Folder` icon + project name + ChevronDown
- Branch button: `GitBranch` icon + branch name + ChevronDown

**Files affected:**
- `apps/web/src/components/layout/Topbar.tsx` — replace project `<button>` and branch `<span>` with unified styled buttons, add `Folder` and `GitBranch` icon imports

## Scope

No new components, no state changes beyond `isMaximized` default, no new dependencies. All changes are visual/label adjustments to existing components.
