# Design: Sync-Specs Pipeline Refactor

> Date: 2026-05-18
> Status: Draft
> Scope: AI instruction layer only (SKILL.md + references/)

## Problem

The current sync-specs skill jumps directly from code scanning to spec tree generation. This makes the process opaque — there's no intermediate artifact that captures the project's architecture or business concepts. Refactoring into a 4-stage pipeline with intermediate outputs improves traceability and enables incremental updates at each stage.

## Overview

Refactor the sync-specs skill into a linear 4-stage pipeline with dirty-check short-circuiting:

```
Stage 1: Code Scan → Stage 2: Architecture Docs → Stage 3: Concept Extraction → Stage 4: Spec Tree
```

Each stage uses sourceFiles mapping for incremental updates. If a stage's input has no changes (dirty check via file intersection), it is skipped.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Incremental strategy | sourceFiles mapping | Direct file→module/concept mapping, no ambiguity |
| Concept organization | Flat list with references | Simple to update, references provide structural hints for tree gen |
| Concept types | Fixed set (6 types) | Predictable, sufficient for tree position hints |
| Architecture granularity | Directory + key files | Balance between coverage and cost |
| Refactoring scope | AI instructions only | TypeScript scripts unchanged |
| Pipeline structure | Linear + dirty-check skip | Clear flow, deterministic skip logic |

## File Layout

```
.harnesson/
├── architecture/
│   ├── Architecture.md              # Project architecture overview
│   └── summaries/                   # Module summaries
│       ├── ai-agent.md              # One file per directory-level module
│       ├── project-management.md
│       └── ...
├── All-Concepts.md                  # Flat concept list with references
├── specs/
│   └── draft/                       # Existing spec tree (unchanged)
│       ├── project.json
│       ├── nodes/
│       └── design/
└── .sync-meta.json                  # Sync metadata
```

## Stage 1: Code Scan

**Goal:** Determine what changed and establish sync scope.

**Process:**
1. Read `.sync-meta.json` for `lastSyncCommit`
2. If file missing (first sync) → mark as full mode
3. Run `git diff --name-only <lastSyncCommit>..HEAD`
4. If no changes → exit early
5. Filter to source files (exclude `.harnesson/`, `node_modules/`, lock files, test files)
6. Output: changed file list + sync mode (incremental/full)

**Scan rules:**
- Include: `src/**/*.{ts,tsx,js,jsx,vue,py,go,java,rs}`
- Exclude: `**/node_modules/**`, `**/.harnesson/**`, `**/*.test.*`, `**/*.spec.*`

## Stage 2: Architecture Docs

**Goal:** Understand project from code structure perspective; generate module summaries.

**Output:**
- `.harnesson/architecture/Architecture.md` — project architecture overview
- `.harnesson/architecture/summaries/*.md` — per-module summaries

**Architecture.md structure:**
```markdown
# Architecture: [Project Name]

> Last synced: [date] | Commit: [hash]

## Module Map
| Module | Path | Key Files | Summary |
|--------|------|-----------|---------|

## Dependency Graph
[inter-module dependencies]
```

**Module summary (summaries/*.md) structure:**
```markdown
# Module: [name]

> Source files: [glob patterns]
> Last synced: [date] | Commit: [hash]

## Summary
[2-3 sentence overview]

## Key Files
### [filename]
[description of purpose and role]

## Exports
[public API surface]

## Dependencies
[references to other modules]
```

**Key file identification rules:**
- Entry files: `index.ts`, `main.ts`, `app.ts`
- Naming patterns: `*controller*`, `*manager*`, `*service*`, `*handler*`
- Files exporting 5+ symbols

**Incremental update:**
1. Dirty check: changed files ∩ module sourceFiles → affected modules
2. Regenerate only affected module summaries
3. Check for directory structure changes → update Module Map if needed
4. Unaffected summaries stay unchanged

## Stage 3: Concept Extraction

**Goal:** Extract business concepts from architecture docs and code.

**Output:** `.harnesson/All-Concepts.md`

**Concept entry format:**
```markdown
## CONC-001: [Name]

- **Type:** [domain|entity|feature|component|operation|interface]
- **Module:** [module-name] (→ [summaries/[module].md](architecture/summaries/[module].md))
- **Summary:** [1-2 sentence description]
- **References:** [CONC-NNN Name], [CONC-NNN Name]
- **Source files:** [glob pattern or file list]
- **Last synced:** [date] | Commit: [hash]

---
```

**Fixed type set:**

| Type | Meaning | Tree position hint |
|------|---------|-------------------|
| `domain` | High-level business area | Top-level (level 2) |
| `entity` | Business entity/object | Mid or leaf |
| `feature` | User-visible capability | Mid or leaf |
| `component` | UI or technical component | Leaf |
| `operation` | User action or API | Leaf |
| `interface` | API contract | Leaf |

**Extraction logic:**
1. AI traverses architecture docs (Architecture.md + affected summaries)
2. Per module, identify concepts:
   - Business domains and features from module summaries
   - Entities (data models) from key files
   - Interfaces (API contracts) from key files
   - Components (UI) from source code
   - Operations (events, API endpoints) from source code
3. Assign ID (CONC-NNN), type, module assignment
4. Build cross-concept references
5. Record sourceFiles per concept

**Incremental update:**
1. Dirty check: changed files ∩ concept sourceFiles → affected concepts
2. Re-extract concepts from affected modules only
3. New concepts get new IDs; removed concepts are deleted
4. Update references for concepts that reference changed concepts

## Stage 4: Spec Tree Generation

**Goal:** Generate/update hierarchical spec tree from concept list.

**Input:** All-Concepts.md, architecture docs, existing spec tree

**Tree hierarchy rules:**
```
Root (level 1) — project itself
└── domain concepts (level 2) — type: domain
    └── feature/entity concepts (level 3+) — type: feature, entity
        └── leaf concepts (final level) — type: component, operation, interface
```

**AI decision logic:**
1. Root → project itself (existing `project.json`)
2. Top-level nodes → `domain` concepts map to level 2
3. Mid-level nodes → `feature`/`entity` concepts placed under their domain, further subdivided if needed
4. Leaf nodes → `component`/`operation`/`interface` concepts placed under their parent feature/entity
5. Ambiguous concepts → AI infers position from references and module context

**Node generation:**
- Each concept maps 1:1 to a node
- `summary`, `goals`, `acceptanceCriteria` generated from concept's Summary and Type
- `sourceFiles` inherited from concept
- `design.md` path follows existing convention

**Incremental update:**
1. Diff new vs old All-Concepts.md:
   - New concepts → create nodes
   - Removed concepts → mark nodes for deletion
   - Modified concepts → update nodes
2. Parent `children` lists updated cascade
3. Unaffected nodes unchanged

**Compatibility with existing scripts:**
- Node JSON follows existing `schema.ts` structure
- File layout stays as `nodes/{node-id}/node.json`
- CLI commands (validate, read-tree, etc.) continue to work

## Sync Metadata (.sync-meta.json)

```json
{
  "lastSyncCommit": "abc1234",
  "branch": "feature/specs-page",
  "stages": {
    "scan": { "completedAt": "2026-05-18T10:00:00Z", "changedFiles": 12 },
    "architecture": { "completedAt": "2026-05-18T10:05:00Z", "affectedModules": ["ai-agent"] },
    "concepts": { "completedAt": "2026-05-18T10:10:00Z", "affectedConcepts": ["CONC-005", "CONC-012"] },
    "specTree": { "completedAt": "2026-05-18T10:15:00Z", "nodesCreated": 2, "nodesUpdated": 3, "nodesDeleted": 0 }
  }
}
```

Updated at the end of each successful sync run.

## SKILL.md Structure (After Refactor)

The refactored SKILL.md will have these sections:
1. **Overview** — skill purpose and the 4-stage pipeline
2. **Full Sync** — detailed instructions for `--full` mode (all 4 stages)
3. **Incremental Sync** — detailed instructions for default mode (dirty-check + affected stages only)
4. **Stage instructions** — separate subsections for each stage's AI instructions
5. **References** — pointers to reference docs (node-schema, templates, etc.)

Existing references/ content (design-doc-templates.md, node-schema.md, node-identification-examples.md) stays and gets updated as needed.

## Out of Scope

- TypeScript scripts (specs-cli, core/, utils/) — unchanged
- CLI commands — unchanged
- Validation logic — unchanged
- Test files — unchanged
