# Project Dropdown Selector

**Date:** 2026-04-26
**Status:** Approved

## Summary

Replace the static project button in the Topbar with an interactive dropdown selector that lists all projects, supports search filtering, and provides quick-access entries for creating or opening projects. After project creation, the new project automatically appears in the dropdown and is selected as the current project.

## Motivation

- The Topbar project button currently displays `activeProjectId` (a UUID) instead of the project name — this is a bug.
- The button has a `ChevronDown` icon but no dropdown functionality — it's a placeholder.
- Users need a way to switch projects without navigating to the Projects page.

## Requirements

1. **Project list dropdown** — clicking the project button opens a dropdown listing all projects from the store
2. **Project name display** — the trigger button shows the active project's name (not UUID)
3. **Search filtering** — input field filters projects by name or path
4. **Quick actions** — bottom section with "New Project" and "Open Folder" buttons
5. **Switch behavior** — selecting a project activates it and closes the dropdown (no page navigation)
6. **Post-creation auto-select** — after creating a project, the new project appears in the dropdown and is auto-selected (already works via `addProjectToList()` + `activateProject()` in `useProjectActions`)
7. **Active project highlight** — current project is visually marked in the list
8. **Click-outside close** — clicking outside the dropdown closes it

## Design

### Approach: Pure CSS dropdown (no new dependencies)

Use `useState` for open/close state, absolute positioning for the dropdown panel, and a `useRef` + `mousedown` listener for click-outside behavior.

### Data Layer Fix

Topbar reads `projects` from the store and resolves the active project name:

```ts
const projects = useProjectStore((s) => s.projects);
const activeProject = projects.find((p) => p.id === activeProjectId);
const projectName = activeProject?.name ?? 'No Project';
```

### Component: `ProjectDropdown`

**File:** `apps/web/src/components/layout/ProjectDropdown.tsx`

Structure:

```
ProjectDropdown
├── Trigger button (Folder icon + project name + ChevronDown)
├── Dropdown panel (absolute, z-50)
│   ├── Search input (auto-focus on open)
│   ├── Scrollable project list (max-h-60)
│   │   └── Project item (name + path, hover highlight, active marker)
│   ├── Divider
│   └── Quick actions
│       ├── + New Project button
│       └── Open Folder button
```

Props:

```ts
interface ProjectDropdownProps {
  onCreateProject: () => void;
  onOpenFolder: () => void;
}
```

Interactions:

- **Toggle**: Click trigger button → open/close dropdown
- **Click outside**: `useRef` on the container + `useEffect` with `mousedown` listener
- **Search**: Filter projects by name or path (case-insensitive)
- **Select project**: Call `switchProject(projectId, 'main')` → close dropdown
- **Quick actions**: Call the respective callback prop → close dropdown
- **Empty state**: Show "No matching projects" when search yields no results
- **Auto-focus**: Search input receives focus when dropdown opens

### Topbar Integration

**File:** `apps/web/src/components/layout/Topbar.tsx`

Changes:

- Remove the hardcoded project button
- Import and render `<ProjectDropdown />`
- Add `onCreateProject` and `onOpenFolder` to Topbar props

```ts
interface TopbarProps {
  runningAgentCount: number;
  onCreateProject: () => void;
  onOpenFolder: () => void;
}
```

### Parent Component Update

The component that renders `<Topbar />` must pass the new props, wiring up modal open callbacks for project creation and folder opening.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/layout/ProjectDropdown.tsx` | **New** | Dropdown selector component (~80-100 lines) |
| `components/layout/Topbar.tsx` | **Modify** | Replace static button with `<ProjectDropdown />`, add props |
| Parent of Topbar | **Modify** | Pass `onCreateProject` / `onOpenFolder` callbacks |

## Out of Scope

- Branch selector dropdown (remains as-is)
- Keyboard navigation within the dropdown
- Project deletion from the dropdown
- Drag-and-drop reordering
