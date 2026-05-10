# Agent Chat File Edit/Write Card Redesign

## Summary

Redesign the Edit and Write tool cards in the Agent chat panel to always stay expanded with CLI-style diff/code display, including Prism syntax highlighting and aligned line numbers.

## Motivation

- Current Edit/Write cards are collapsed by default — users must click to see file changes
- Current diff display is a simple "Remove"/"Add" two-section list, not a unified diff
- No syntax highlighting on code
- The collapsible pattern does not match the CLI experience where diffs are always visible

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auto-expand | Always expanded, no collapse toggle | File changes are the primary content users want to see |
| Scope | Edit + Write only | Read/Bash/Grep/Glob/LSP remain collapsible |
| Syntax highlighting | `prism-react-renderer` | ~50KB, synchronous, good enough token coverage |
| Diff layout | Unified diff (context + deleted + added) | Standard CLI diff format, most familiar to developers |
| Side indicator | `box-shadow: inset` instead of `border-left` | Visual same effect but doesn't shift layout — keeps columns aligned |

## Component Changes

### New dependency

Add `prism-react-renderer` to `apps/web/package.json`.

### EditCard (`apps/web/src/components/chat/tool-cards/EditCard.tsx`)

Remove `CollapsibleCard` wrapper. Replace with always-expanded layout:

```
┌────────────────────────────────────────────┐
│ 📝 Edit · src/components/foo.tsx    +3 −2  │  ← header bar
├────────────────────────────────────────────┤
│  1  import { useState } from 'react';      │  ← context (no bg)
│  2                                          │
│  3  export function MyComponent() {         │
│  4 −const oldValue = data.value;           │  ← deleted (red bg + box-shadow)
│  5 −return <div>{oldValue}</div>;          │
│  6 +const newValue = data.value ?? '';     │  ← added (green bg + box-shadow)
│  7 +const result = newValue.toUpperCase(); │
│  8 +return <div>{result}</div>;            │
│  9  }                                       │  ← context (no bg)
└────────────────────────────────────────────┘
```

**Line types:**

| Type | Background | Left indicator | Prefix | Code color |
|------|-----------|----------------|--------|------------|
| Context | none | none | (space) | normal Prism tokens |
| Deleted | `rgba(239,68,68,0.15)` | `box-shadow: inset 3px 0 0 #ef4444` | `−` (#ef4444) | red-tinted Prism tokens |
| Added | `rgba(74,222,128,0.12)` | `box-shadow: inset 3px 0 0 #22c55e` | `+` (#4ade80) | normal Prism tokens |

**Column layout (per line):**

```tsx
<div className="flex px-2.5">
  <span className="w-8 text-right shrink-0 mr-3 text-gray-600 select-none">{lineNumber}</span>
  <span className="w-[10px] shrink-0">{prefix}</span>
  <span className="flex-1">{highlightedCode}</span>
</div>
```

All line numbers share the same grey (`text-gray-600` / `#555`) regardless of line type — no color variation. Deleted lines use the edit's old content line numbers; added and context lines use sequential numbering within the diff block.

**Running state:** When `event.output` is absent, show header with pulsing purple dot + "running..." — same as current `CollapsibleCard` running state but without the collapse wrapper.

**Overflow:** `max-h-[300px] overflow-y-auto` on the code body container.

### WriteCard (`apps/web/src/components/chat/tool-cards/WriteCard.tsx`)

Remove `CollapsibleCard` wrapper. Replace with always-expanded code view:

```
┌────────────────────────────────────────────┐
│ ✏️ Write · src/utils/helpers.ts    1.2KB   │  ← header bar
├────────────────────────────────────────────┤
│  1  export function formatDate(d: Date) {  │  ← plain code, no diff markers
│  2    return d.toISOString();              │
│  3  }                                       │
│  ... 15 more lines                          │
└────────────────────────────────────────────┘
```

Plain code view — no `+`/`−` prefixes, no diff background colors. Just line numbers + Prism-highlighted code. Max 30 lines shown, remainder count displayed as "... N more lines". Same column layout and overflow as EditCard.

### Syntax highlighting

Both cards use `prism-react-renderer`'s `Highlight` component with `Prism.Languages.tsx` (or `ts`/`json` fallback based on file extension). The highlighted tokens are rendered via inline `<span>` elements with Prism's token colors.

## What Does NOT Change

- Other tool cards (Read, Bash, Grep, Glob, LSP, Generic) continue using `CollapsibleCard` 
- `CollapsibleCard` component itself — unchanged
- `ToolEventCard.tsx` card registry — only Edit/Write card implementations change
- Data flow (SSE → store → buildEventTree → renderTreeSegment → SingleToolEventCard) — unchanged
- `AgentPanel.tsx`, `MessageRenderer.tsx` — unchanged

## Testing

Manual visual verification:
- Send a message that triggers an Edit tool call: verify unified diff renders with correct colors, line numbers aligned
- Send a message that triggers a Write tool call: verify code displays with line numbers and Prism highlighting
- Verify running state shows pulsing dot before completion
- Verify overflow scroll on files with many lines
- Verify other cards (Read, Bash) still collapse/expand normally
