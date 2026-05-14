# Sync-Specs TypeScript Script Extraction Design

Date: 2026-05-14

## Goal

Extract JSON read/write/validate operations from the sync-specs skill prompt into TypeScript CLI scripts, eliminating JSON format errors caused by LLM free-form text generation.

## Problem

The current sync-specs skill relies entirely on the LLM to directly generate and write JSON files. This causes:

- **Type mismatches**: `specDetail.parameters` defined as `string[]` in schema but generated as `object[]` in practice
- **Missing required fields**: Optional fields like `testCases` three-key structure not enforced
- **Inconsistent structure**: Directory layout (index.json vs direct .json) not always respected
- **Validation gaps**: Step 3 validation depends on LLM self-checking, which is unreliable

## Design Decision: CLI Command Architecture

Each operation is a standalone CLI subcommand invoked via `npx tsx .claude/skills/sync-specs/scripts/specs-cli.ts <command>`.

**Why CLI over library:** Skill prompts can directly specify command invocations. Each command has a single responsibility. Commands are independently testable.

### Command List

| Command | Input | Output | Purpose |
|---------|-------|--------|---------|
| `init-tree` | `--root <path>` | stdout JSON | Initialize specs directory structure |
| `read-tree` | `[--node <id>] [--root <path>]` | stdout JSON | Read full tree or subtree |
| `read-node` | `<id> [--root <path>]` | stdout JSON | Read single node |
| `create-node` | stdin JSON + `[--root <path>]` | stdout JSON `{path}` | Create node file |
| `update-node` | `<id> --data stdin JSON` | stdout JSON | Update node (merge) |
| `delete-node` | `<id> [--root <path>]` | stdout JSON | Delete node and clean references |
| `validate` | `[--root <path>] [--fix]` | stdout JSON report | Execute 6 validation checks |
| `promote-draft` | `[--root <path>]` | stdout JSON | Move draft/ to specs/ |

**Conventions:**
- All output to stdout as JSON, errors to stderr
- `--root` defaults to `.harnesson/specs`
- Success: `{ok: true, ...}`, failure: `{ok: false, error: "..."}`

## Directory Structure

```
.claude/skills/sync-specs/
├── SKILL.md
├── scripts/
│   ├── specs-cli.ts            # CLI entry (command routing)
│   ├── commands/
│   │   ├── read-tree.ts
│   │   ├── read-node.ts
│   │   ├── create-node.ts
│   │   ├── update-node.ts
│   │   ├── delete-node.ts
│   │   ├── validate.ts
│   │   ├── init-tree.ts
│   │   └── promote-draft.ts
│   ├── core/
│   │   ├── schema.ts           # TypeScript types + defaults
│   │   ├── file-io.ts          # File read/write (path resolution, JSON serialization)
│   │   ├── validator.ts        # 6 validation checks
│   │   └── path-resolver.ts    # Node ID <-> file path conversion
│   └── utils/
│       └── git.ts              # Git operations
├── references/
│   ├── node-schema.md
│   ├── design-doc-templates.md
│   └── node-identification-examples.md
```

## Core Type System (schema.ts)

```typescript
type Status = 'draft' | 'backlog' | 'todo' | 'in-progress' | 'review' | 'testing' | 'dev-done' | 'released';
type TreeScenario = 'single' | 'flat' | 'multi-functional' | 'multi-domain';
type TestCaseLevel = 'p0' | 'p1' | 'p2' | 'p3';

interface SyncMeta {
  lastSyncAt: string;
  baseCommit: string;
  baseCommitMessage: string;
  branch: string;
  sourceFiles: string[];
}

interface SpecDetail {
  description: string;
  parameters: string[];      // string[] not object[]
}

interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

interface TestCase {
  level: TestCaseLevel;
  given: string;
  when: string;
  then: string;
}

interface TestCases {
  'unit-test': TestCase[];
  'end-to-end': TestCase[];
  'script-test': TestCase[];
}

interface SpecNode {
  id: string;                // kebab-case
  name: string;
  level: number;
  parent: string | null;
  children: string[];
  isLeaf: boolean;
  summary: string;
  goals?: string[];
  design?: string | null;
  acceptanceCriteria?: AcceptanceCriterion[];
  testCases?: TestCases;
  specDetail?: SpecDetail | null;
  constraints?: string[];
  status: Status;
  syncMeta: SyncMeta;
}

interface RootSpecNode extends SpecNode {
  id: 'project';
  level: 1;
  parent: null;
  treeDepth: number;
  treeScenario: TreeScenario;
}
```

**Key decisions:**
- `specDetail.parameters` is `string[]` — fixes the current `object[]` deviation
- `TestCases` three keys always present, enforced by TypeScript type
- Optional fields use `?`, but `create-node` fills defaults at runtime
- Root node uses `RootSpecNode extends SpecNode` for extra fields

## Skill Flow Changes

### Principle: LLM thinks, scripts do

| Responsibility | Executor | Why |
|---------------|----------|-----|
| Analyze source code, identify business nodes | LLM | Requires understanding |
| Generate text content (summary, goals, constraints) | LLM | Requires language |
| Assemble and write node JSON | Script | Format correctness |
| Read/query JSON files | Script | Consistency |
| Validate (Step 3) | Script | Automated, repeatable |
| Promote draft | Script | File operations |

### Step-by-step changes

**Step 1 (Scan & Change Analysis):**
- LLM analyzes code, then calls `read-tree` to get existing specs tree
- LLM writes change analysis to `draft/README.md`

**Step 2 (Generate Draft):**
- LLM analyzes source code to produce node content (summary, goals, specDetail, etc.)
- For each node, LLM passes data via stdin to `create-node`
- Design docs still written directly by LLM (Markdown, no JSON format risk)

**Step 3 (Validation):**
- LLM calls `validate`, script executes all 6 checks
- If errors returned, LLM fixes and calls `update-node`
- Leaf review (check 6) deep source analysis still needs LLM — script marks `needsReview: true`

**Step 4 (User Review):**
- LLM calls `read-tree` to display full data to user
- No fundamental change

**Step 5 (Promote):**
- LLM calls `promote-draft` for file movement and cleanup

### SKILL.md modification approach

Insert script call instructions at key steps. Example for Step 2a:

```
#### 2a — Generate Node JSON

For each node in the change list:

1. Analyze `syncMeta.sourceFiles` to extract facts
2. Generate descriptive fields (summary, goals, specDetail, constraints, acceptanceCriteria)
3. Construct a data object conforming to the node schema
4. Run `npx tsx .claude/skills/sync-specs/scripts/specs-cli.ts create-node`
   Pass node data JSON via stdin
5. Script validates format, creates directory structure, writes file
   If validation fails, script outputs error details — fix and retry
```

## Validation Logic (validator.ts)

### Output format

```typescript
interface ValidationResult {
  nodeId: string;
  checks: {
    format: { pass: boolean; errors: string[] };
    version: { pass: boolean; errors: string[] };
    content: { pass: boolean; errors: string[] };
    uniqueness: { pass: boolean; errors: string[] };
    designDoc: { pass: boolean; errors: string[] };
    coverage: { pass: boolean; errors: string[]; warnings: string[] };
  };
}

interface ValidateReport {
  totalNodes: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
}
```

### 6 validation checks

| # | Check | Implementation |
|---|-------|---------------|
| 1 | Format | TypeScript type check + custom assertions (id kebab-case, status enum, required fields) |
| 2 | Version | `git rev-parse --short HEAD` vs `syncMeta.baseCommit` |
| 3 | Content | Leaf nodes: specDetail/constraints non-empty, summary/goals present |
| 4 | Uniqueness | Same parent: no duplicate name or semantically duplicate summary |
| 5 | Design doc | Check design path file exists and non-empty |
| 6 | Coverage & leaf review | Check acceptanceCriteria covers goals; mark `needsReview: true` for LLM deep source analysis |

### `--fix` mode

`validate --fix` attempts auto-repair:
- Fill missing defaults (empty arrays, default status)
- Fix children/filesystem inconsistency
- Mark missing specDetail/constraints

Non-auto-fixable issues (content quality, source coverage) reported as errors only.

## Dependencies

- `tsx` (already available in project) — run TypeScript directly
- No external npm dependencies — uses Node.js built-in `fs`, `path`, `child_process`
- Git operations via `child_process.execSync`

## Out of Scope

- JSON Schema validation library (ajv/zod) — TypeScript types provide equivalent guarantees
- Automated testing for the scripts themselves — can be added later
- Migration of existing draft/ data — scripts handle whatever format they find, best-effort repair
