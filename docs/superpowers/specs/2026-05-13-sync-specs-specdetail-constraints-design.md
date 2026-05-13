# Sync-Specs: specDetail + Constraints + Incremental Completeness Detection

## Overview

Add two new optional fields to the spec tree node schema — `specDetail` (detailed feature specification with testable parameters) and `constraints` (boundary conditions and applicability rules). Enhance incremental sync to detect and fill missing attributes, data, and reference documents on existing nodes.

## Motivation

- Current nodes describe **what** a feature does (summary/goals) and **how to verify it** (acceptanceCriteria/testCases), but lack **quantifiable parameters** (layout, colors, sizes, limits) and **boundary conditions** (when it works, when it fails, what it depends on)
- Incremental sync currently only reacts to code changes (git diff); it does not detect incomplete nodes that are missing fields or have broken references

## Design

### 1. New JSON Fields

Both fields are **optional** in schema. Leaf nodes with source files are expected to fill them; intermediate/root nodes may omit them.

#### specDetail

```json
{
  "specDetail": {
    "description": "Markdown string describing what the feature does and how it works",
    "parameters": [
      "Max input length 10000 chars; truncated if exceeded",
      "Enter sends message, Shift+Enter inserts newline",
      "Min textarea height 40px, max 200px auto-expand",
      "Send button: PaperPlaneIcon, 20x20px, color #6B7280"
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string (Markdown) | yes (if specDetail present) | Detailed feature description |
| `parameters` | string[] | yes (if specDetail present) | Flat list of quantifiable specs. Each entry describes one measurable/observable characteristic: UI layout, font size, color, max/min values, timing thresholds, etc. |

#### constraints

```json
{
  "constraints": [
    "When input is empty, pressing Enter does nothing",
    "When network is disconnected, sending shows 'Send failed' toast and message stays in input",
    "Supports plain text and Markdown only; rich text paste is stripped",
    "Input is read-only when the conversation is not active"
  ]
}
```

A flat string array. Each entry describes a boundary condition, error condition, applicable scenario, inapplicable scenario, precondition, postcondition, or invariant. No sub-categorization — the list is the single source of truth.

### 2. Design Document Sections

In Step 3, when generating a design doc for a node with `specDetail` or `constraints`, append:

```markdown
## Specification Details

{specDetail.description}

### Parameters

- Parameter 1
- Parameter 2

## Constraints

- Constraint 1
- Constraint 2
```

- If `specDetail` is null/empty → skip "Specification Details" section
- If `constraints` is null/empty → skip "Constraints" section
- During incremental sync updates, only regenerate changed sections; do not rewrite the entire design doc

### 3. Incremental Completeness Detection

In incremental mode, after Step 1 (scan) and before Step 2 (plan generation), run a completeness audit on every existing node. Results feed into the sync plan as "补全" (补全/gap-fill) change entries.

**Five audit checks:**

| # | Check | What it detects | Missing → Action |
|---|-------|-----------------|-------------------|
| 1 | **Field completeness** | Node JSON is missing `specDetail`, `constraints`, `goals`, `acceptanceCriteria`, or other fields | Mark "补全" in plan; Step 3 generates missing content from code analysis |
| 2 | **Reference integrity** | `design` file does not exist on disk; `sourceFiles` paths no longer valid | Missing design → mark for next full sync; invalid paths → remove from sourceFiles |
| 3 | **Content freshness** | `sourceFiles` have git changes newer than `syncMeta.lastSyncAt` | Mark "更新" in plan; Step 3 re-analyzes changed files |
| 4 | **Child consistency** | Filesystem has child node files not listed in parent's `children`; or `children` references node files that don't exist | Fix `children` array; mark orphan children as "已废弃" |
| 5 | **Design content completeness** | Design doc exists but is missing "Specification Details" or "Constraints" sections | Mark "补全" in plan; Step 3 appends missing sections (rendered from JSON fields) |

**Sync plan representation:**

```
ai-chat (L2, 补全) — missing specDetail, constraints
├── message-input (L3, 补全) — missing specDetail
│   └── text-input-send (L4, 补全) — design doc missing Constraints section
└── message-display (L3, 不变)
```

**Step 3 behavior for "补全" entries:** Only generate missing fields; do not rewrite the entire node JSON or design doc. Merge generated content into existing files.

### 4. Validation Rules (Step 4)

Add three content validation rules to the existing Step 4 loop:

**3a. specDetail completeness (leaf nodes)**
- Leaf nodes (`isLeaf: true` + non-empty `sourceFiles`) should have `specDetail` not null
- `specDetail.description` must be non-empty string
- `specDetail.parameters` must have at least 1 entry
- Each parameter entry should contain quantifiable detail (not just vague text like "looks good")

**3b. constraints completeness (leaf nodes)**
- Leaf nodes should have `constraints` with at least 1 entry
- Each entry is a non-empty string

**3c. JSON ↔ Markdown consistency**
- `specDetail.description` content matches the design doc's "Specification Details" section
- `constraints` entries match the design doc's "Constraints" section

### 5. Final Node Schema (additions only)

Two new optional fields appended to the existing schema:

```json
{
  "specDetail": {
    "description": "string (Markdown)",
    "parameters": ["string"]
  },
  "constraints": ["string"]
}
```

- Both fields are optional — not added to the required-fields list in `node-schema.md`
- Root node: optional (project-level specs have little value at this granularity)
- Intermediate nodes: optional
- Leaf nodes: strongly encouraged, validated in Step 4 check 3a/3b

### 6. Files to Modify

| File | Change |
|------|--------|
| `skill.md` | Step 1: add completeness audit sub-step. Step 2: add "补全" operation. Step 3: add specDetail/constraints generation + design doc section rendering. Step 4: add checks 3a/3b/3c. |
| `references/node-schema.md` | Add `specDetail` and `constraints` to optional fields table, add examples |

No new files needed.
