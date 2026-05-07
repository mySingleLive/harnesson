# Agent Session Project Sync Design

## Problem

When a user selects an Agent Session from the sidebar, `handleAgentClick` calls `switchProject(agent.projectId, agent.branch)`, which correctly sets `activeProjectId` and `activeBranch`. However, `switchProject` also calls `loadBranches`, and `loadBranches` overwrites `activeBranch` with `branches.current` (the repo's actual checkout branch). This means the ProjectDropdown and BranchDropdown revert to showing the repo's current state instead of the agent's bound project/branch.

## Solution

Add a `skipBranchOverride` flag to the project store. When switching project via agent selection, pass `skipBranchOverride: true` so that `loadBranches` preserves the agent's branch instead of overwriting it.

## Changes

### `apps/web/src/stores/projectStore.ts`

1. Add `skipBranchOverride: boolean` to `ProjectState` interface
2. Initialize `skipBranchOverride: false` in store defaults
3. Update `switchProject` signature: `(projectId, branch, skipBranchOverride = false)`
4. In `switchProject`, include `skipBranchOverride` in the `set()` call
5. In `loadBranches`, check `skipBranchOverride` before setting `activeBranch`:
   - If `true`: set branches and isLoading, but keep current `activeBranch`, reset flag to `false`
   - If `false`: existing behavior (set `activeBranch` to `branches.current`)

### `apps/web/src/components/layout/MainLayout.tsx`

Update `handleAgentClick` to pass `true` as the third argument:

```ts
switchProject(agent.projectId, agent.branch, true);
```

## What Does NOT Change

- `ProjectDropdown.handleSelect` calls `switchProject(projectId, 'main')` — default `skipBranchOverride = false`, behavior unchanged
- `BranchDropdown` — reads `activeBranch` from store, no changes needed
- No visual changes to any component

## Scope

Display-only sync. No git checkout happens when selecting an agent session. The dropdowns show the agent's context for informational purposes.
