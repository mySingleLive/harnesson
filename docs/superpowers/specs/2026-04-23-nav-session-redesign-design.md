# Navigation & New Session Page Redesign

## Overview

Redesign the sidebar navigation to include 6 menu items and add a New Session welcome page that serves as the entry point for creating new Agent sessions.

## Sidebar Navigation

### Menu Items (top to bottom)

| # | Label | Icon | Route |
|---|-------|------|-------|
| 1 | New Session | `MessageSquarePlus` | `/` (index) |
| 2 | Projects | `FolderKanban` | `/projects` |
| 3 | Specs | `FileText` | `/specs` |
| 4 | Tasks | `CheckSquare` | `/tasks` |
| 5 | Files | `FolderOpen` | `/files` |
| 6 | Git | `GitBranch` | `/git` |

### Changes from Current

- Remove "Dashboard" menu item (replaced by "New Session" as index route)
- Remove "New Agent" button (replaced by "New Session" page)
- Add "Projects" and "Files" as new navigation items
- Agent list section below navigation remains unchanged

### NavLink Style

Keep existing style: icon + label, left border highlight on active state, hover effect.

## New Session Page (`NewSessionPage.tsx`)

### Layout

Full right-side content area, vertically and horizontally centered content.

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           HARNESSON                 │  ← Large brand title
│                                     │
│    ┌──────────────────────────┐     │
│    │  Chat input textarea     │     │  ← Centered input
│    │  [+] [Model] [Branch] [↑]│     │  ← Toolbar row
│    └──────────────────────────┘     │
│                                     │
│   ┌─────┐  ┌─────┐  ┌─────┐       │
│   │创建新功能│  │修复Bug │  │代码审查│       │  ← Quick action cards
│   └─────┘  └─────┘  └─────┘       │
│                                     │
│        Keyboard shortcut hints       │
│                                     │
└─────────────────────────────────────┘
```

### HARNESSON Title

- Large text, brand color (`harness-accent`)
- Centered above input box
- Uppercase or title-case with generous letter-spacing

### Chat Input

- Same input component style as AgentPanel textarea
- Centered with max-width (~700px)
- Bottom toolbar: plus menu, model selector, branch selector, send button
- Placeholder text: "Message Harnesson... Type @ for files, / for commands"

### Quick Action Cards

4 clickable cards below the input in a horizontal row:

| Label | Icon | Preset Prompt |
|-------|------|--------------|
| 创建新功能 | `Sparkles` | "Help me create a new feature..." |
| 修复 Bug | `Bug` | "Help me fix a bug..." |
| 代码审查 | `Code` | "Review the code changes..." |
| 编写测试 | `TestTube` | "Write tests for..." |

Clicking a card fills the input with the preset prompt text. User can modify before sending.

### Interaction Flow

1. User navigates to New Session (default `/` route)
2. Right side shows HARNESSON welcome page
3. User types message or clicks a quick action card
4. On send: system creates a new Agent via `agentStore.createAgent()`
5. New Agent card appears in sidebar
6. Right side switches to Agent Panel showing the conversation
7. User can click sidebar Agent cards to switch between sessions, or click New Session to create another

## New Placeholder Pages

### ProjectsPage (`/projects`)

Empty placeholder with title "Projects" — no content yet.

### FilesPage (`/files`)

Empty placeholder with title "Files" — no content yet.

## File Changes

### New Files

- `apps/web/src/pages/NewSessionPage.tsx` — New Session welcome page component
- `apps/web/src/pages/ProjectsPage.tsx` — Projects placeholder page
- `apps/web/src/pages/FilesPage.tsx` — Files placeholder page

### Modified Files

- `apps/web/src/components/layout/Sidebar.tsx` — Replace nav items with 6 new items, remove New Agent button
- `apps/web/src/components/layout/MainLayout.tsx` — Update routing, New Session as index, handle Agent creation from New Session
- `apps/web/src/App.tsx` — Add `/projects` and `/files` routes, change index route to NewSessionPage
- `apps/web/src/stores/agentStore.ts` — Add `createAgent` method if not present

### Unchanged Files

- `AgentPanel.tsx` — No changes
- `Topbar.tsx` — No changes
- `SpecsPage.tsx` / `TasksPage.tsx` / `GitPage.tsx` — No changes
