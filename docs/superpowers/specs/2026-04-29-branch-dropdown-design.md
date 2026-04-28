# Branch Dropdown Design

## Overview

Add an interactive BranchDropdown component to the Topbar that displays the current git branch and allows switching branches within the active project. The component replaces the existing static GitBranch placeholder.

## Requirements

- Display current branch on the dropdown button when a project is active
- List all local and remote git branches, grouped separately
- Highlight the current branch with a checkmark
- Execute `git checkout` when a branch is selected
- For remote branches, auto-create a local tracking branch (`git checkout -b <name> origin/<name>`)
- Show "No Git" for non-git projects, with an option to initialize git
- Load branches when the active project changes

## Backend API

### GET /api/projects/:id/branches

Returns branch information for a project.

**Response (git repo):**
```json
{
  "local": ["main", "feature/auth", "fix/bug-123"],
  "remote": ["origin/main", "origin/develop"],
  "current": "feature/auth",
  "isGitRepo": true
}
```

**Response (non-git project):**
```json
{
  "local": [],
  "remote": [],
  "current": null,
  "isGitRepo": false
}
```

**Implementation:**
- Run `git branch --list` via `execAsync` in the project directory to get local branches
- Parse `* branch-name` to identify the current branch
- Run `git branch -r` to get remote branches, filter out `HEAD ->` entries
- Wrap in try/catch; if `git` commands fail, return `isGitRepo: false`

### POST /api/projects/:id/checkout

Switches to a different branch.

**Request:**
```json
{ "branch": "fix/bug-123" }
```

**Response (success):**
```json
{ "success": true, "branch": "fix/bug-123" }
```

**Response (error):**
```json
{ "success": false, "error": "Branch 'nonexistent' not found" }
```

**Implementation:**
- For local branches: `git checkout <branch>`
- For remote branches (prefixed `origin/`): `git checkout -b <name> origin/<name>` to create a local tracking branch
- Execute via `execAsync` in the project directory
- Return error if checkout fails (e.g., uncommitted changes conflict)

## Frontend

### BranchDropdown Component

**File:** `apps/web/src/components/layout/BranchDropdown.tsx`

A standalone dropdown component, structurally similar to ProjectDropdown:

**Button state:**
- Active git project: shows git branch icon + current branch name + chevron
- Non-git project: shows git branch icon + "No Git" + chevron
- No active project: disabled/hidden

**Dropdown content:**
- **Local Branches** section header — lists all local branches
- **Remote Branches** section header — lists remote branches (stripped `origin/` prefix for display, prefixed with a cloud/globe icon)
- Current branch: highlighted background + accent color + "✓ current" label
- Click a branch → call checkout API → on success, update store and close dropdown

**Non-git project dropdown:**
- Shows message "此项目不是 Git 仓库"
- Shows "初始化 Git" button that calls `POST /api/projects/:id/git-init`

### ProjectStore Extensions

Add to `projectStore.ts`:

```typescript
interface BranchInfo {
  local: string[];
  remote: string[];
  current: string | null;
  isGitRepo: boolean;
}

// New state fields:
branches: BranchInfo;
isBranchLoading: boolean;

// New actions:
loadBranches: (projectId: string) => Promise<void>;
checkoutBranch: (projectId: string, branch: string) => Promise<void>;
```

**loadBranches:** Calls `GET /api/projects/:id/branches`, stores result. Called automatically when `activeProjectId` changes.

**checkoutBranch:** Calls `POST /api/projects/:id/checkout`, on success refreshes branch list and updates `activeBranch`.

### Topbar Modification

**File:** `apps/web/src/components/layout/Topbar.tsx`

Replace the static GitBranch button with:
```tsx
<BranchDropdown />
```

The component reads `activeProjectId` and `branches` from the project store internally — no props needed.

### serverApi Additions

**File:** `apps/web/src/lib/serverApi.ts`

```typescript
export async function getProjectBranches(projectId: string): Promise<BranchInfo> {
  const res = await fetch(`/api/projects/${projectId}/branches`);
  return res.json();
}

export async function checkoutBranch(projectId: string, branch: string): Promise<...> {
  const res = await fetch(`/api/projects/${projectId}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch }),
  });
  return res.json();
}
```

## Error Handling

- **Checkout fails (uncommitted changes):** Show error toast/notification, keep current branch selected
- **Project not found:** 404 response, clear branch state
- **Git command timeout:** 10s timeout on exec, return error to frontend
- **Non-git project:** Graceful "No Git" state, no errors thrown

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `apps/server/src/routes/branches.ts` |
| Modify | `apps/server/src/index.ts` — register branch routes |
| Create | `apps/web/src/components/layout/BranchDropdown.tsx` |
| Modify | `apps/web/src/components/layout/Topbar.tsx` — replace static button |
| Modify | `apps/web/src/stores/projectStore.ts` — add branch state and actions |
| Modify | `apps/web/src/lib/serverApi.ts` — add branch API calls |
