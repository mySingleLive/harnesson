# Tool Card Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw JSON tool call display in agent chat with parsed, tool-specific collapsible cards.

**Architecture:** Fix the backend adapter to pass tool names in tool_result events. On the frontend, pair tool_use and tool_result events into a single data structure, then route each paired event to a tool-specific card component. All cards share a CollapsibleCard wrapper for expand/collapse behavior.

**Tech Stack:** React, TypeScript, Tailwind CSS, Zustand, Vitest + Testing Library

---

### Task 1: Fix adapter to pass tool name in tool_result events

The adapter currently sets `tool` to `parent_tool_use_id` (a UUID) on tool_result events, making it impossible to pair with tool_use events by tool name. Fix by tracking a local id-to-name map.

**Files:**
- Modify: `apps/server/src/lib/claude-code-adapter.ts`

- [ ] **Step 1: Update adapter to track tool names**

Replace the `sendMessage` method body. Add a `toolNameById` map after the `sessionId` declaration (line 81), store `block.id -> block.name` on tool_use, and look up the name on tool_result:

```typescript
// After line 81: let sessionId: string | undefined;
// Add:
const toolNameById = new Map<string, string>();
```

Update the tool_use yield block (lines 98-103) to also store the mapping:

```typescript
} else if (block.type === 'tool_use') {
  if (block.id && typeof block.id === 'string') {
    toolNameById.set(block.id, block.name as string);
  }
  yield {
    type: 'agent.tool_use',
    tool: block.name as string,
    input: block.input as Record<string, unknown>,
  };
}
```

Update the tool_result yield block (lines 108-114) to resolve the tool name:

```typescript
} else if (msg.type === 'user' && msg.tool_use_result) {
  const result = msg.tool_use_result as Record<string, unknown>;
  const toolId = msg.parent_tool_use_id as string | undefined;
  const toolName = toolId ? (toolNameById.get(toolId) ?? 'unknown') : 'unknown';
  yield {
    type: 'agent.tool_result',
    tool: toolName,
    output: typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
    isError: result.is_error === true,
  };
}
```

- [ ] **Step 2: Verify the change compiles**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/server/tsconfig.json 2>&1 | head -20`
Expected: No errors related to claude-code-adapter.ts

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/claude-code-adapter.ts
git commit -m "fix: pass tool name instead of UUID in tool_result events"
```

---

### Task 2: Create PairedToolEvent type and pairEvents utility

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/pairEvents.ts`

- [ ] **Step 1: Create the pairEvents module**

```typescript
import type { AgentStreamEvent } from '@harnesson/shared';

export interface PairedToolEvent {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  duration?: number;
}

export function pairEvents(events: AgentStreamEvent[]): PairedToolEvent[] {
  const toolEvents = events.filter(
    (e) => e.type === 'agent.tool_use' || e.type === 'agent.tool_result'
  );

  const paired: PairedToolEvent[] = [];
  const pending: Array<{ tool: string; input: Record<string, unknown> }> = [];

  for (const event of toolEvents) {
    if (event.type === 'agent.tool_use') {
      pending.push({ tool: event.tool ?? 'unknown', input: event.input ?? {} });
    } else if (event.type === 'agent.tool_result') {
      const toolName = event.tool ?? 'unknown';
      const idx = pending.findIndex((p) => p.tool === toolName);
      if (idx !== -1) {
        const { tool, input } = pending.splice(idx, 1)[0];
        paired.push({
          tool,
          input,
          output: event.output,
          isError: event.isError,
          duration: event.duration,
        });
      } else {
        paired.push({
          tool: toolName,
          input: {},
          output: event.output,
          isError: event.isError,
          duration: event.duration,
        });
      }
    }
  }

  for (const { tool, input } of pending) {
    paired.push({ tool, input });
  }

  return paired;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors related to pairEvents.ts

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/pairEvents.ts
git commit -m "feat: add pairEvents utility to merge tool_use and tool_result"
```

---

### Task 3: Create CollapsibleCard component

Shared wrapper providing collapse/expand behavior for all tool cards.

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx`

- [ ] **Step 1: Write the CollapsibleCard component**

```tsx
import { useState, type ReactNode } from 'react';

interface CollapsibleCardProps {
  icon: ReactNode;
  summary: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  isRunning?: boolean;
}

export function CollapsibleCard({ icon, summary, badge, children, isRunning }: CollapsibleCardProps) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(children);

  if (isRunning) {
    return (
      <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
        <div className="flex items-center gap-2 px-2.5 py-1 text-[11px]">
          {icon}
          {summary}
          <span className="ml-auto flex items-center gap-1 text-purple-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            running...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
      <button
        type="button"
        onClick={() => hasDetail && setOpen(!open)}
        className="flex w-full items-center gap-2 bg-[#1a1a2e] px-2.5 py-1 text-[11px] text-left hover:bg-[#1f1f38] transition-colors"
      >
        <span className={`transition-transform duration-200 text-gray-500 ${open ? 'rotate-90' : ''}`}>▸</span>
        {icon}
        {summary}
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {open && hasDetail && (
        <div className="max-h-[300px] overflow-y-auto border-t border-harness-border px-2.5 py-2">
          {children}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors related to CollapsibleCard.tsx

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx
git commit -m "feat: add CollapsibleCard wrapper with collapse/expand behavior"
```

---

### Task 4: Create GenericCard (fallback for unknown tools)

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/GenericCard.tsx`

- [ ] **Step 1: Write the GenericCard component**

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function GenericCard({ event }: { event: PairedToolEvent }) {
  const inputStr = JSON.stringify(event.input, null, 2);

  return (
    <CollapsibleCard
      icon={<span>🔧</span>}
      summary={<span className="font-medium text-gray-400">{event.tool}</span>}
      badge={event.isError ? <span className="text-red-400">✗</span> : undefined}
      isRunning={!event.output}
    >
      {event.input && Object.keys(event.input).length > 0 && (
        <div className="mb-1">
          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Input</div>
          <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{inputStr}</pre>
        </div>
      )}
      {event.output && (
        <div>
          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Output</div>
          <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 2000)}</pre>
        </div>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/GenericCard.tsx
git commit -m "feat: add GenericCard fallback for unknown tool events"
```

---

### Task 5: Create GlobCard component

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/GlobCard.tsx`

- [ ] **Step 1: Write the GlobCard component**

Glob input has `{ pattern: string }`. Output is newline-separated file paths.

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

function parseFileList(output?: string): string[] {
  if (!output) return [];
  return output.split('\n').filter((line) => line.trim().length > 0);
}

export function GlobCard({ event }: { event: PairedToolEvent }) {
  const pattern = (event.input.pattern as string) ?? '';
  const files = parseFileList(event.output);
  const fileCount = files.length;
  const displayFiles = files.slice(0, 20);
  const remaining = fileCount - displayFiles.length;

  return (
    <CollapsibleCard
      icon={<span>🔍</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Glob</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{pattern}</span>
        </>
      }
      badge={
        event.output ? (
          <span className="text-green-500">✓ {fileCount} files</span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {displayFiles.length > 0 && (
        <div className="space-y-0.5">
          {displayFiles.map((f, i) => (
            <div key={i} className="font-mono text-[11px] text-gray-500">{f}</div>
          ))}
          {remaining > 0 && (
            <div className="text-[11px] text-gray-600">... {remaining} more</div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/GlobCard.tsx
git commit -m "feat: add GlobCard with file list display"
```

---

### Task 6: Create GrepCard component

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/GrepCard.tsx`

- [ ] **Step 1: Write the GrepCard component**

Grep input has `{ pattern: string, path?: string }`. Output is lines with matches.

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function GrepCard({ event }: { event: PairedToolEvent }) {
  const pattern = (event.input.pattern as string) ?? '';
  const path = (event.input.path as string) ?? '';
  const lines = (event.output ?? '').split('\n').filter((l) => l.trim().length > 0);
  const matchCount = lines.length;
  const displayLines = lines.slice(0, 20);
  const remaining = matchCount - displayLines.length;

  return (
    <CollapsibleCard
      icon={<span>🔍</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Grep</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">&quot;{pattern}&quot;</span>
          {path && (
            <>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500">{path}</span>
            </>
          )}
        </>
      }
      badge={
        event.output ? (
          <span className="text-green-500">✓ {matchCount} matches</span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {displayLines.length > 0 && (
        <div className="space-y-0.5">
          {displayLines.map((l, i) => (
            <div key={i} className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{l}</div>
          ))}
          {remaining > 0 && (
            <div className="text-[11px] text-gray-600">... {remaining} more</div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/GrepCard.tsx
git commit -m "feat: add GrepCard with match list display"
```

---

### Task 7: Create ReadCard component

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/ReadCard.tsx`

- [ ] **Step 1: Write the ReadCard component**

Read input has `{ file_path: string, offset?: number, limit?: number }`. Output is file content.

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function ReadCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const outputLines = (event.output ?? '').split('\n');
  const displayLines = outputLines.slice(0, 50);
  const remaining = outputLines.length - displayLines.length;

  return (
    <CollapsibleCard
      icon={<span>📄</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Read</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{filePath}</span>
        </>
      }
      badge={event.output ? <span className="text-green-500">✓</span> : undefined}
      isRunning={!event.output}
    >
      {displayLines.length > 0 && (
        <div className="space-y-0.5">
          {displayLines.map((line, i) => (
            <div key={i} className="flex gap-2 font-mono text-[11px]">
              <span className="w-8 shrink-0 text-right text-gray-600 select-none">{i + 1}</span>
              <span className="text-gray-500 whitespace-pre">{line}</span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-[11px] text-gray-600">... {remaining} more lines</div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/ReadCard.tsx
git commit -m "feat: add ReadCard with line-numbered file content"
```

---

### Task 8: Create WriteCard component

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/WriteCard.tsx`

- [ ] **Step 1: Write the WriteCard component**

Write input has `{ file_path: string, content: string }`. Output is typically a confirmation message.

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function WriteCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const content = (event.input.content as string) ?? '';
  const contentLines = content.split('\n');
  const displayLines = contentLines.slice(0, 30);
  const remaining = contentLines.length - displayLines.length;
  const size = formatBytes(new Blob([content]).size);

  return (
    <CollapsibleCard
      icon={<span>✏️</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Write</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{filePath}</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">{size}</span>
        </>
      }
      badge={event.output ? <span className="text-green-500">✓</span> : undefined}
      isRunning={!event.output}
    >
      {displayLines.length > 0 && (
        <div className="space-y-0.5">
          {displayLines.map((line, i) => (
            <div key={i} className="flex gap-2 font-mono text-[11px]">
              <span className="w-8 shrink-0 text-right text-gray-600 select-none">{i + 1}</span>
              <span className="text-gray-500 whitespace-pre">{line}</span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-[11px] text-gray-600">... {remaining} more lines</div>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/WriteCard.tsx
git commit -m "feat: add WriteCard with content preview and size"
```

---

### Task 9: Create EditCard component

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/EditCard.tsx`

- [ ] **Step 1: Write the EditCard component**

Edit input has `{ file_path: string, old_string: string, new_string: string, replace_all?: boolean }`. Output is confirmation. The detail view shows a diff with red/green highlighting.

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function EditCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const oldStr = (event.input.old_string as string) ?? '';
  const newStr = (event.input.new_string as string) ?? '';
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');

  return (
    <CollapsibleCard
      icon={<span>✏️</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Edit</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{filePath}</span>
        </>
      }
      badge={event.output ? <span className="text-green-500">✓</span> : event.isError ? <span className="text-red-400">✗</span> : undefined}
      isRunning={!event.output}
    >
      <div className="space-y-1">
        {oldLines.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Remove</div>
            {oldLines.map((line, i) => (
              <div key={i} className="font-mono text-[11px] bg-red-500/10 text-red-400 px-1 whitespace-pre">
                - {line}
              </div>
            ))}
          </div>
        )}
        {newLines.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">Add</div>
            {newLines.map((line, i) => (
              <div key={i} className="font-mono text-[11px] bg-green-500/10 text-green-400 px-1 whitespace-pre">
                + {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/EditCard.tsx
git commit -m "feat: add EditCard with diff-style old/new display"
```

---

### Task 10: Create BashCard and LSPCard components

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/BashCard.tsx`
- Create: `apps/web/src/components/chat/tool-cards/LSPCard.tsx`

- [ ] **Step 1: Write BashCard**

Bash input has `{ command: string, timeout?: number }`. Output is stdout/stderr.

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function BashCard({ event }: { event: PairedToolEvent }) {
  const command = (event.input.command as string) ?? '';
  const truncatedCmd = command.length > 60 ? command.slice(0, 60) + '...' : command;

  return (
    <CollapsibleCard
      icon={<span>⚡</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Bash</span>
          <span className="text-gray-600">·</span>
          <span className="truncate font-mono text-gray-500">{truncatedCmd}</span>
        </>
      }
      badge={
        event.output ? (
          <span className={event.isError ? 'text-red-400' : 'text-green-500'}>
            {event.isError ? '✗' : '✓'}
            {event.duration != null ? ` ${formatDuration(event.duration)}` : ''}
          </span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {event.output && (
        <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 3000)}</pre>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Write LSPCard**

LSP input has `{ operation: string, filePath: string, line?: number, character?: number }`. Output is LSP result.

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function LSPCard({ event }: { event: PairedToolEvent }) {
  const operation = (event.input.operation as string) ?? '';
  const filePath = (event.input.filePath as string) ?? '';
  const line = event.input.line as number | undefined;

  return (
    <CollapsibleCard
      icon={<span>🔗</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">LSP</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">{operation}</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">
            {filePath}{line != null ? `:${line}` : ''}
          </span>
        </>
      }
      badge={event.output ? <span className="text-green-500">✓</span> : undefined}
      isRunning={!event.output}
    >
      {event.output && (
        <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 2000)}</pre>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/BashCard.tsx apps/web/src/components/chat/tool-cards/LSPCard.tsx
git commit -m "feat: add BashCard and LSPCard components"
```

---

### Task 11: Create ToolEventCard router and index.ts

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/ToolEventCard.tsx`
- Create: `apps/web/src/components/chat/tool-cards/index.ts`

- [ ] **Step 1: Write ToolEventCard with toolCardMap**

```tsx
import type { ComponentType } from 'react';
import type { AgentStreamEvent } from '@harnesson/shared';
import { pairEvents, type PairedToolEvent } from './pairEvents';
import { GlobCard } from './GlobCard';
import { GrepCard } from './GrepCard';
import { ReadCard } from './ReadCard';
import { WriteCard } from './WriteCard';
import { EditCard } from './EditCard';
import { BashCard } from './BashCard';
import { LSPCard } from './LSPCard';
import { GenericCard } from './GenericCard';

const toolCardMap: Record<string, ComponentType<{ event: PairedToolEvent }>> = {
  Glob: GlobCard,
  Grep: GrepCard,
  Read: ReadCard,
  Write: WriteCard,
  Edit: EditCard,
  Bash: BashCard,
  LSP: LSPCard,
};

export function ToolEventCardList({ events }: { events: AgentStreamEvent[] }) {
  const paired = pairEvents(events);

  return (
    <div className="mt-2 space-y-2">
      {paired.map((event, i) => {
        const Card = toolCardMap[event.tool] ?? GenericCard;
        return <Card key={i} event={event} />;
      })}
    </div>
  );
}
```

- [ ] **Step 2: Write index.ts barrel export**

```typescript
export { ToolEventCardList } from './ToolEventCard';
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/ToolEventCard.tsx apps/web/src/components/chat/tool-cards/index.ts
git commit -m "feat: add ToolEventCard router with toolCardMap"
```

---

### Task 12: Update MessageRenderer to use new tool cards

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx`

- [ ] **Step 1: Replace inline ToolEventCard with imported component**

The current `MessageRenderer.tsx` has an inline `ToolEventCard` and the rendering in `AgentMessageBubble`. Replace lines 52-65 with the new `ToolEventCardList`. Also remove the now-unused `ToolEventCard` function (lines 69-113).

Full updated file:

```tsx
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentMessage } from '@harnesson/shared';
import { ToolEventCardList } from './tool-cards';

interface MessageRendererProps {
  message: AgentMessage;
  agentName: string;
  isStreaming: boolean;
}

export function MessageRenderer({ message, agentName, isStreaming }: MessageRendererProps) {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />;
  }

  return <AgentMessageBubble events={message.events ?? []} content={message.content} agentName={agentName} isStreaming={isStreaming} />;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="border-b border-white/[0.04] bg-harness-accent/[0.04] px-4 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-harness-accent">You</div>
      <div className="text-[13px] leading-relaxed text-gray-300">{content}</div>
    </div>
  );
}

function AgentMessageBubble({ events, content, agentName, isStreaming }: {
  events: AgentMessage['events'];
  content: string;
  agentName: string;
  isStreaming: boolean;
}) {
  return (
    <div className="border-b border-white/[0.04] px-4 py-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-green-500">{agentName}</span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-[11px] text-purple-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            thinking...
          </span>
        )}
      </div>

      {content && (
        <div className="border-l-2 border-green-500/40 pl-3 text-[13px] leading-relaxed text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-strong:text-gray-200 prose-code:text-harness-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-300">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      )}

      {events && events.length > 0 && <ToolEventCardList events={events} />}

      {events?.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={i} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "feat: wire MessageRenderer to new tool card components"
```

---

### Task 13: Manual visual verification

- [ ] **Step 1: Start dev server and test**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web dev`

Open the app in browser, navigate to an agent chat session, trigger tool calls (Glob, Grep, Bash, Read, Write, Edit), and verify:
- Tool cards show parsed summaries instead of raw JSON
- Click to expand/collapse works
- Running tools show pulse animation
- Error results show red indicator
- File paths, commands, patterns are readable in collapsed state
