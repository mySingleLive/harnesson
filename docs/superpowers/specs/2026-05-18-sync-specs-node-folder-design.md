# Sync-Specs Node Folder Restructuring

**Date:** 2026-05-18
**Status:** Draft
**Scope:** `.claude/skills/sync-specs/scripts/` — path-resolver, file-io, validator, CLI, schema, tests

## Problem

Current spec tree has inconsistent node file naming:
- Non-leaf nodes: `<id>/index.json`
- Leaf nodes: `<id>.json` (flat file, no folder)
- Design docs: separate `design/` tree, `design` field is a manual path reference

This creates special-case logic everywhere (try-leaf-then-non-leaf reads, `isLeaf` parameter passed through call chains, design doc paths maintained separately).

## Solution

Unify all nodes to a single pattern:

```
draft/
  project.json                        ← root stays at base
  nodes/
    ai-agent/
      node.json                       ← always node.json
      design.md                       ← always design.md (optional)
      agent-control/
        node.json
        design.md
        abort-execution/
          node.json                   ← leaf nodes also get folders
          design.md
```

### Rules

1. Every non-root node lives in `<ancestors>/<id>/node.json`
2. Design docs live at `<ancestors>/<id>/design.md`
3. Root node stays at `project.json` (unchanged)
4. `design` field in schema auto-fills to `nodes/<ancestors>/<id>/design.md`
5. The `isLeaf` parameter is removed from path resolution (no longer needed for file paths)

## File Changes

### 1. `path-resolver.ts`

**`nodeJsonPath(nodePath, opts)`** — remove `isLeaf` param:
```
// Before: two branches (leaf vs non-leaf)
// After: single path
nodes/<ancestors>/<id>/node.json
```

**`nodeDirPath(nodePath, opts)`** — unchanged behavior, minor simplification.

**`designDocPath(nodePath, opts)`** — new signature. Instead of taking a `designRelativePath` string, compute from nodePath:
```
nodes/<ancestors>/<id>/design.md
```

Add helper `designDocPathFromNodePath(nodePath, opts)` that derives the design doc path directly.

Keep the old `designDocPath(designRelativePath, opts)` for reading the `design` field value.

### 2. `file-io.ts`

**`readNode(nodePath, opts)`** — remove dual-path try. Single `nodeJsonPath(nodePath, opts)` call.

**`writeNode(nodePath, node, opts)`** — remove `isLeaf` from path resolution. Always creates `<id>/node.json`.

**`writeDesignDoc(designRelPath, content, opts)`** — keep for backward compat. Add `writeDesignDocForNode(nodePath, content, opts)` using new path.

**`deleteNode(nodePath, opts)`** — remove `isLeaf`. Delete the entire `<id>/` folder (recursive) since it contains `node.json` + optional `design.md`.

**`initSpecsDir(opts)`** — remove `design/` directory creation. Only create `nodes/`.

**New: `migrateStructure(opts)`** — one-time migration:
1. Read entire tree (old paths)
2. For each leaf node: `<id>.json` → `<id>/node.json`
3. For each non-leaf node: `<id>/index.json` → `<id>/node.json`
4. For each node with design doc: move from `design/<path>.md` to `nodes/<ancestors>/<id>/design.md`
5. Update `design` field in each node to new path
6. Write all nodes back
7. Remove empty `design/` directories

### 3. `validator.ts`

**`checkDesignDoc(node, opts)`** — use new `designDocPathFromNodePath()` to locate design doc instead of relying on the `design` field value. Fall back to `design` field for backward compat during migration.

### 4. `specs-cli.ts`

**All commands** — remove `isLeaf` from `nodeJsonPath` calls.

**New: `migrate` command** — calls `migrateStructure()`.

**`promote-draft`** — update design doc copy to use new paths.

### 5. `schema.ts`

No structural changes. `design` field remains optional string. Auto-fill logic belongs in file-io, not schema.

### 6. Tests

Update all test fixtures to use new paths (`node.json` instead of `index.json` or `<id>.json`). Remove `isLeaf` parameter from all `nodeJsonPath` test calls.

## Migration Strategy

The `migrate` CLI command handles the one-time conversion:
1. Read the tree using old path logic (dual try)
2. Write all nodes using new path logic
3. Move design docs
4. Clean up old files

After migration, the old dual-path read code in `readNode` can be removed in a follow-up, or kept temporarily as a fallback.

## Impact on SKILL.md

The SKILL.md references the storage structure. Update the "Storage Structure" section to reflect the new unified pattern. The node schema section remains unchanged.
