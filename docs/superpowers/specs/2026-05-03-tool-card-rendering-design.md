# Tool Card Rendering Design

## Problem

Agent chat messages display tool calls (Glob, Grep, Bash, etc.) as raw JSON text. Users see `{"pattern":"src/**/*.tsx","cwd":"/project"}` instead of a parsed, readable summary. Tool results show unformatted plain text. The UX is noisy and hard to scan.

## Solution

Parse each tool's `input` and `output` fields, then render them with tool-specific card components. Merge `tool_use` and `tool_result` events into a single collapsible card per invocation.

## Data Pairing Layer

`tool_use` and `tool_result` events arrive as separate items in the events array. A pairing function merges them:

```ts
interface PairedToolEvent {
  tool: string;
  input: Record<string, unknown>;
  output?: string;       // undefined = still executing
  isError?: boolean;
  duration?: number;
}
```

- Iterate events, index `tool_use` by tool name + occurrence order
- Match corresponding `tool_result` by same order
- Unpaired events (streaming, no result yet) render as "running" state with pulse animation

## Component Architecture

```
components/chat/tool-cards/
├── index.ts              # Export toolCardMap and ToolEventCard
├── ToolEventCard.tsx     # Pairing logic + route to specific card
├── CollapsibleCard.tsx   # Shared collapse/expand wrapper
├── GlobCard.tsx
├── GrepCard.tsx
├── ReadCard.tsx
├── WriteCard.tsx
├── EditCard.tsx
├── BashCard.tsx
└── GenericCard.tsx       # Fallback for unknown tools
```

`ToolEventCard` pairs events, then looks up the tool name in `toolCardMap` to render the matching component. Each card implements `renderSummary()` and `renderDetail()`, wrapped by `CollapsibleCard`.

## CollapsibleCard

Shared wrapper providing collapse/expand behavior:

```ts
interface CollapsibleCardProps {
  summary: ReactNode;     // Collapsed content
  children: ReactNode;    // Expanded detail content
  defaultOpen?: boolean;  // Default false
  badge?: ReactNode;      // Right-side status (e.g. "✓ 45ms")
  icon: ReactNode;        // Tool icon
}
```

- Default collapsed, click summary area to toggle
- `▸` / `▾` indicator with rotation transition
- Detail area: `max-height` ~300px with `overflow-y: auto` and scrollbar
- Outer styling reuses existing `border border-harness-border bg-harness-bg rounded-md`
- Cards without a result (still running) are not collapsible — show pulse animation + "running..."

## Tool-Specific Rendering

| Tool | Summary (collapsed) | Detail (expanded) |
|------|---------------------|-------------------|
| **Glob** | `🔍 Glob · src/**/*.tsx · 23 files` | File path list, `... N more` beyond 20 |
| **Grep** | `🔍 Grep · "pattern" · path/ · 12 matches` | Match lines as `file:line: content` |
| **Read** | `📄 Read · path/to/file.tsx` | File content with line numbers, truncated if long |
| **Write** | `✏️ Write · path/to/file.tsx · 1.2KB` | Content preview with line numbers |
| **Edit** | `✏️ Edit · path/to/file.tsx` | Diff view: red/green highlighting for removed/added lines |
| **Bash** | `⚡ Bash · npm run build · 1.2s` | Command in monospace + stdout/stderr output |
| **LSP** | `🔗 LSP · goToDefinition · file.tsx:42` | LSP result |
| **Generic** | `🔧 ToolName · truncated input` | Full JSON input + output |

### Details

- **Bash** command in summary uses monospace font, truncated if long
- **Edit** detail shows `old_string` → `new_string` with red (removed) / green (added) highlighting
- **Glob/Grep** file counts parsed from output file list
- Running tools (no output) show pulse animation + "running..." text

## File Changes

- **New**: `apps/web/src/components/chat/tool-cards/` directory with all card components
- **Modify**: `MessageRenderer.tsx` — replace inline `ToolEventCard` with imported version from tool-cards
