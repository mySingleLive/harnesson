# Tool Card Preview & Agent Sub-Agent Tree Rendering

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add collapsed preview lines to tool cards and create a recursive Agent card with backend-supported sub-agent event nesting.

**Architecture:** Backend adapter tracks Agent tool nesting via a stack, buffers sub-agent events, and emits them as nested data. Frontend adds preview lines to each tool card and a new AgentCard that recursively renders sub-agent events in a tree structure.

**Tech Stack:** React, TypeScript, Vitest, Claude Agent SDK, SSE streaming

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/shared/src/types/agent.ts` | Add `parentToolUseId`, `depth` to `AgentStreamEvent` |
| Modify | `apps/server/src/lib/claude-code-adapter.ts` | Add stack-based nesting tracker for Agent sub-events |
| Modify | `apps/web/src/components/chat/tool-cards/pairEvents.ts` | Add `subEvents`/`subTexts` to `PairedToolEvent`, nest sub-agent events |
| Create | `apps/web/src/components/chat/tool-cards/AgentCard.tsx` | Agent card with collapsed summary + expandable tree |
| Create | `apps/web/src/components/chat/tool-cards/AgentEventTree.tsx` | Recursive tree renderer for sub-agent events |
| Modify | `apps/web/src/components/chat/tool-cards/ToolEventCard.tsx` | Register `AgentCard` in `toolCardMap` |
| Modify | `apps/web/src/components/chat/tool-cards/index.ts` | Export new components |
| Modify | `apps/web/src/components/chat/tool-cards/GlobCard.tsx` | Add collapsed preview |
| Modify | `apps/web/src/components/chat/tool-cards/ReadCard.tsx` | Add collapsed preview |
| Modify | `apps/web/src/components/chat/tool-cards/BashCard.tsx` | Add collapsed preview |
| Modify | `apps/web/src/components/chat/tool-cards/GrepCard.tsx` | Add collapsed preview |
| Modify | `apps/web/src/components/chat/tool-cards/WriteCard.tsx` | Add collapsed preview |
| Modify | `apps/web/src/components/chat/tool-cards/EditCard.tsx` | Add collapsed preview |

---

### Task 1: Update Shared Types

**Files:**
- Modify: `packages/shared/src/types/agent.ts`

- [ ] **Step 1: Add `parentToolUseId` and `depth` to `AgentStreamEvent`**

In `packages/shared/src/types/agent.ts`, add two optional fields to the `AgentStreamEvent` interface:

```typescript
export interface AgentStreamEvent {
  type: 'agent.thinking' | 'agent.text' | 'agent.tool_use' | 'agent.tool_result' | 'agent.error' | 'agent.done';
  text?: string;
  tool?: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  duration?: number;
  message?: string;
  code?: string;
  sessionId?: string;
  tokenUsage?: number;
  reason?: string;
  parentToolUseId?: string;
  depth?: number;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/shared run typecheck`
Expected: PASS (additive change only)

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat: add parentToolUseId and depth to AgentStreamEvent"
```

---

### Task 2: Update PairedToolEvent Type

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/pairEvents.ts`

- [ ] **Step 1: Add `subEvents` and `subTexts` to `PairedToolEvent`**

In `pairEvents.ts`, extend the interface:

```typescript
export interface PairedToolEvent {
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  duration?: number;
  subEvents?: PairedToolEvent[];
  subTexts?: string[];
}
```

Do NOT modify the `pairEvents()` function logic yet — that comes in Task 5 after the backend streams nested events.

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/web run typecheck`
Expected: PASS (additive optional fields)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/pairEvents.ts
git commit -m "feat: add subEvents and subTexts to PairedToolEvent"
```

---

### Task 3: Backend Nesting Stack in Claude Code Adapter

**Files:**
- Modify: `apps/server/src/lib/claude-code-adapter.ts`

- [ ] **Step 1: Add nesting state to the `sendMessage` generator**

Inside the `sendMessage` method, after the `toolNameById` declaration (line 81), add:

```typescript
      const agentStack: string[] = [];
      const subEventBuffers = new Map<string, { texts: string[]; toolEvents: Array<{ tool: string; input: Record<string, unknown>; output?: string; isError?: boolean; duration?: number }> }>();
```

- [ ] **Step 2: Replace the event processing loop with nesting-aware logic**

Replace the entire `for await (const sdkMessage of messageStream)` block (lines 83–134) with:

```typescript
      for await (const sdkMessage of messageStream) {
        if (abortController.signal.aborted) break;

        const msg = sdkMessage as Record<string, unknown>;

        if (msg.session_id && typeof msg.session_id === 'string') {
          sessionId = msg.session_id;
        }

        if (msg.type === 'assistant') {
          const betaMessage = msg.message as Record<string, unknown> | undefined;
          const content = betaMessage?.content as Array<Record<string, unknown>> | undefined;
          if (content) {
            for (const block of content) {
              if (block.type === 'text' && typeof block.text === 'string') {
                const textEvent: AgentStreamEvent = { type: 'agent.text', text: block.text };
                if (agentStack.length > 0) {
                  const buffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                  if (buffer) buffer.texts.push(block.text);
                } else {
                  yield textEvent;
                }
              } else if (block.type === 'tool_use') {
                const toolName = block.name as string;
                const toolInput = block.input as Record<string, unknown>;
                const toolUseId = typeof block.id === 'string' ? block.id : '';

                if (toolNameById && toolUseId) {
                  toolNameById.set(toolUseId, toolName);
                }

                if (toolName === 'Agent') {
                  agentStack.push(toolUseId);
                  subEventBuffers.set(toolUseId, { texts: [], toolEvents: [] });
                }

                if (agentStack.length > 0) {
                  const buffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                  if (buffer) buffer.toolEvents.push({ tool: toolName, input: toolInput });
                } else {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput };
                }
              }
            }
          }
        } else if (msg.type === 'user') {
          const betaMessage = msg.message as Record<string, unknown> | undefined;
          const content = betaMessage?.content as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === 'tool_result') {
                const toolId = block.tool_use_id as string;
                const toolName = toolNameById.get(toolId) ?? 'unknown';
                const blockContent = block.content;
                const output = typeof blockContent === 'string' ? blockContent : JSON.stringify(blockContent);
                const isError = block.is_error === true;

                if (toolName === 'Agent' && agentStack.length > 0) {
                  const finishedId = agentStack.pop()!;
                  const buffer = subEventBuffers.get(finishedId);
                  subEventBuffers.delete(finishedId);

                  if (agentStack.length > 0) {
                    const parentBuffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                    if (parentBuffer) {
                      parentBuffer.toolEvents.push({
                        tool: 'Agent',
                        input: buffer ? { description: '', prompt: '' } : {},
                        output,
                        isError,
                        subEvents: buffer ? pairSubEvents(buffer) : undefined,
                        subTexts: buffer?.texts,
                      });
                    }
                  } else {
                    yield {
                      type: 'agent.tool_use',
                      tool: 'Agent',
                      input: {},
                    };
                    yield {
                      type: 'agent.tool_result',
                      tool: 'Agent',
                      output: JSON.stringify({
                        textOutput: output,
                        subTexts: buffer?.texts ?? [],
                        subEvents: buffer ? pairSubEvents(buffer) : [],
                      }),
                      isError,
                    };
                  }
                } else {
                  if (agentStack.length > 0) {
                    const buffer = subEventBuffers.get(agentStack[agentStack.length - 1]);
                    const pending = buffer?.toolEvents.findLastIndex((e) => e.tool === toolName && e.output === undefined);
                    if (pending !== undefined && pending >= 0 && buffer) {
                      buffer.toolEvents[pending].output = output;
                      buffer.toolEvents[pending].isError = isError;
                    }
                  } else {
                    yield {
                      type: 'agent.tool_result',
                      tool: toolName,
                      output,
                      isError,
                    };
                  }
                }
              }
            }
          }
        } else if (msg.type === 'result') {
          if (msg.session_id && typeof msg.session_id === 'string') {
            sessionId = msg.session_id as string;
          }
        }
      }
```

- [ ] **Step 3: Add the `pairSubEvents` helper function**

Add this function before the class definition (at the top of the file, after the imports):

```typescript
function pairSubEvents(buffer: { texts: string[]; toolEvents: Array<{ tool: string; input: Record<string, unknown>; output?: string; isError?: boolean; duration?: number }> }): Array<{ tool: string; input: Record<string, unknown>; output?: string; isError?: boolean; duration?: number; subEvents?: unknown[]; subTexts?: string[] }> {
  return buffer.toolEvents.map((e) => ({
    tool: e.tool,
    input: e.input,
    output: e.output,
    isError: e.isError,
    duration: e.duration,
    subEvents: (e as { subEvents?: unknown[] }).subEvents,
    subTexts: (e as { subTexts?: string[] }).subTexts,
  }));
}
```

- [ ] **Step 4: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/server run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/lib/claude-code-adapter.ts
git commit -m "feat: add Agent sub-event nesting stack to claude-code-adapter"
```

---

### Task 4: Update pairEvents to Parse Nested Agent Output

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/pairEvents.ts`

- [ ] **Step 1: Add parsing logic for nested Agent tool_result**

When a `tool_result` comes for the `Agent` tool and its output is JSON containing `subEvents`/`subTexts`, parse those into the `PairedToolEvent`. Update the `pairEvents` function — in the `agent.tool_result` branch, after constructing the paired event, add parsing:

Replace the existing `pairEvents` function body with:

```typescript
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
      const toolName = event.tool;
      if (pending.length > 0) {
        const { tool, input } = pending.shift()!;
        const pairedEvent: PairedToolEvent = {
          tool: toolName && toolName !== 'unknown' ? toolName : tool,
          input,
          output: event.output,
          isError: event.isError,
          duration: event.duration,
        };

        if (pairedEvent.tool === 'Agent' && event.output) {
          try {
            const parsed = JSON.parse(event.output);
            if (parsed.subEvents || parsed.subTexts) {
              pairedEvent.subEvents = parsed.subEvents;
              pairedEvent.subTexts = parsed.subTexts;
              pairedEvent.output = parsed.textOutput;
            }
          } catch {
            // output is plain text, not nested JSON
          }
        }

        paired.push(pairedEvent);
      } else {
        paired.push({
          tool: toolName ?? 'unknown',
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

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/web run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/pairEvents.ts
git commit -m "feat: parse nested subEvents/subTexts from Agent tool_result"
```

---

### Task 5: Create AgentEventTree Recursive Renderer

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/AgentEventTree.tsx`

- [ ] **Step 1: Write AgentEventTree.tsx**

```tsx
import { SingleToolEventCard } from './ToolEventCard';
import type { PairedToolEvent } from './pairEvents';

interface AgentEventTreeProps {
  subEvents: PairedToolEvent[];
  subTexts: string[];
  depth?: number;
}

export function AgentEventTree({ subEvents, subTexts, depth = 0 }: AgentEventTreeProps) {
  const items: Array<{ type: 'text'; content: string } | { type: 'tool'; event: PairedToolEvent }> = [];

  const texts = [...subTexts];
  for (const evt of subEvents) {
    if (texts.length > 0) {
      items.push({ type: 'text', content: texts.shift()! });
    }
    items.push({ type: 'tool', event: evt });
  }
  while (texts.length > 0) {
    items.push({ type: 'text', content: texts.shift()! });
  }

  return (
    <div className={depth > 0 ? 'ml-3 border-l border-gray-700 pl-2' : ''}>
      {items.map((item, i) =>
        item.type === 'text' ? (
          <div key={`text-${i}`} className="flex items-start gap-1.5 py-0.5 text-[11px]">
            <span className="shrink-0 text-gray-600">💬</span>
            <span className="text-gray-400 italic line-clamp-2">{item.content.slice(0, 200)}</span>
          </div>
        ) : (
          <div key={`tool-${i}`} className="py-0.5">
            <SingleToolEventCard event={item.event} />
          </div>
        )
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/web run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/AgentEventTree.tsx
git commit -m "feat: add AgentEventTree recursive renderer for sub-agent events"
```

---

### Task 6: Create AgentCard (depends on Task 5)

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/AgentCard.tsx`

- [ ] **Step 1: Write AgentCard.tsx**

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import { AgentEventTree } from './AgentEventTree';
import type { PairedToolEvent } from './pairEvents';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AgentCard({ event }: { event: PairedToolEvent }) {
  const description = (event.input.description as string) ?? 'Agent';
  const model = event.input.model as string | undefined;
  const hasSubEvents = (event.subEvents?.length ?? 0) > 0 || (event.subTexts?.length ?? 0) > 0;

  return (
    <CollapsibleCard
      icon={<span>🤖</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Agent</span>
          <span className="text-gray-600">·</span>
          <span className="truncate text-gray-500">{description}</span>
        </>
      }
      badge={
        event.output ? (
          <span className="flex items-center gap-1.5">
            {model && (
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">{model}</span>
            )}
            <span className={event.isError ? 'text-red-400' : 'text-green-500'}>
              {event.isError ? '✗' : '✓'}
              {event.duration != null ? ` ${formatDuration(event.duration)}` : ''}
            </span>
          </span>
        ) : undefined
      }
      isRunning={!event.output}
    >
      {hasSubEvents && (
        <AgentEventTree subEvents={event.subEvents ?? []} subTexts={event.subTexts ?? []} />
      )}
      {!hasSubEvents && event.output && (
        <div className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{event.output.slice(0, 2000)}</div>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/web run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/AgentCard.tsx
git commit -m "feat: add AgentCard component for sub-agent tool calls"
```

---

### Task 7: Register AgentCard and Update Exports

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/ToolEventCard.tsx`
- Modify: `apps/web/src/components/chat/tool-cards/index.ts`

- [ ] **Step 1: Add AgentCard to toolCardMap**

In `ToolEventCard.tsx`, add the import and map entry:

```typescript
import { AgentCard } from './AgentCard';

// Add to toolCardMap:
Agent: AgentCard,
```

The full updated file:

```typescript
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
import { AgentCard } from './AgentCard';

const toolCardMap: Record<string, ComponentType<{ event: PairedToolEvent }>> = {
  Glob: GlobCard,
  Grep: GrepCard,
  Read: ReadCard,
  Write: WriteCard,
  Edit: EditCard,
  Bash: BashCard,
  LSP: LSPCard,
  Agent: AgentCard,
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

export function SingleToolEventCard({ event }: { event: PairedToolEvent }) {
  const Card = toolCardMap[event.tool] ?? GenericCard;
  return <Card event={event} />;
}
```

- [ ] **Step 2: Update index.ts exports**

In `index.ts`, add:

```typescript
export { ToolEventCardList, SingleToolEventCard } from './ToolEventCard';
export { segmentEvents, type Segment, type TextSegment, type ToolSegment } from './segmentEvents';
export { AgentCard } from './AgentCard';
export { AgentEventTree } from './AgentEventTree';
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/web run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/ToolEventCard.tsx apps/web/src/components/chat/tool-cards/index.ts
git commit -m "feat: register AgentCard in toolCardMap and update exports"
```

---

### Task 8: Add Collapsed Preview — CollapsibleCard + GlobCard

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/GlobCard.tsx`

- [ ] **Step 1: Add preview line showing first 2 matched files**

The preview shows inside the card but outside the collapsible detail. Restructure to add a preview `<div>` after the `CollapsibleCard`. Since `CollapsibleCard` controls its own layout, we wrap everything in an outer div and add the preview between the card header and the expandable content.

Actually, since `CollapsibleCard` encapsulates both header and expandable content, the cleanest approach is to modify `CollapsibleCard` to accept a `preview` slot that's always visible. But per the spec, we avoid changing `CollapsibleCard`. Instead, we restructure each card to use `CollapsibleCard` for the expandable detail and add the preview outside it.

Wait — that would change the visual structure significantly. A simpler approach: pass the preview content as part of `summary` in `CollapsibleCard`, rendered below the main summary line. This requires a small change to `CollapsibleCard` to support a `preview` prop.

**Decision: Add a `preview` prop to `CollapsibleCard`.**

Modify `CollapsibleCard.tsx` to accept an optional `preview` prop:

```typescript
interface CollapsibleCardProps {
  icon: ReactNode;
  summary: ReactNode;
  preview?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  isRunning?: boolean;
}
```

In the running state template (line 17–27), after the summary line, add:

```tsx
{preview && <div className="px-2.5 pb-1 text-[11px] text-gray-600">{preview}</div>}
```

In the complete state template (line 31–48), after the button and before the expandable content, add:

```tsx
{preview && <div className="px-2.5 pb-1 text-[11px] text-gray-600">{preview}</div>}
```

The full updated `CollapsibleCard.tsx`:

```tsx
import { useState, type ReactNode } from 'react';

interface CollapsibleCardProps {
  icon: ReactNode;
  summary: ReactNode;
  preview?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  isRunning?: boolean;
}

export function CollapsibleCard({ icon, summary, preview, badge, children, isRunning }: CollapsibleCardProps) {
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
        {preview && <div className="px-2.5 pb-1 text-[11px] text-gray-600">{preview}</div>}
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
      {preview && <div className="px-2.5 pb-1 text-[11px] text-gray-600">{preview}</div>}
      {open && hasDetail && (
        <div className="max-h-[300px] overflow-y-auto border-t border-harness-border px-2.5 py-2">
          {children}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit the CollapsibleCard change**

```bash
git add apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx
git commit -m "feat: add preview prop to CollapsibleCard"
```

- [ ] **Step 3: Update GlobCard with preview**

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
  const previewFiles = files.slice(0, 2);

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
      preview={
        previewFiles.length > 0 ? (
          <div className="space-y-0.5">
            {previewFiles.map((f, i) => (
              <div key={i} className="font-mono text-[11px] text-gray-600 truncate">{f}</div>
            ))}
          </div>
        ) : undefined
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

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/GlobCard.tsx
git commit -m "feat: add collapsed preview to GlobCard"
```

---

### Task 9: Add Collapsed Preview to ReadCard

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/ReadCard.tsx`

- [ ] **Step 1: Update ReadCard with preview showing first 2 lines**

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function ReadCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const outputLines = (event.output ?? '').split('\n');
  const displayLines = outputLines.slice(0, 50);
  const remaining = outputLines.length - displayLines.length;
  const previewLines = outputLines.slice(0, 2);

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
      preview={
        previewLines.length > 0 && previewLines[0].trim().length > 0 ? (
          <div className="space-y-0.5">
            {previewLines.map((line, i) => (
              <div key={i} className="flex gap-2 font-mono text-[11px]">
                <span className="w-8 shrink-0 text-right text-gray-700 select-none">{i + 1}</span>
                <span className="text-gray-600 truncate">{line}</span>
              </div>
            ))}
          </div>
        ) : undefined
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
git commit -m "feat: add collapsed preview to ReadCard"
```

---

### Task 10: Add Collapsed Preview to BashCard

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/BashCard.tsx`

- [ ] **Step 1: Update BashCard with preview showing first 2 lines of output**

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
  const outputLines = (event.output ?? '').split('\n').filter((l) => l.trim().length > 0);
  const previewLines = outputLines.slice(0, 2);

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
      preview={
        previewLines.length > 0 ? (
          <div className="space-y-0.5">
            {previewLines.map((line, i) => (
              <div key={i} className="font-mono text-[11px] text-gray-600 truncate">{line}</div>
            ))}
          </div>
        ) : undefined
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

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/BashCard.tsx
git commit -m "feat: add collapsed preview to BashCard"
```

---

### Task 11: Add Collapsed Preview to GrepCard

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/GrepCard.tsx`

- [ ] **Step 1: Update GrepCard with preview showing first 2 match lines**

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
  const previewLines = lines.slice(0, 2);

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
      preview={
        previewLines.length > 0 ? (
          <div className="space-y-0.5">
            {previewLines.map((l, i) => (
              <div key={i} className="font-mono text-[11px] text-gray-600 truncate">{l}</div>
            ))}
          </div>
        ) : undefined
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
git commit -m "feat: add collapsed preview to GrepCard"
```

---

### Task 12: Add Collapsed Preview to WriteCard

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/WriteCard.tsx`

- [ ] **Step 1: Update WriteCard with preview showing first 2 lines of content**

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
  const previewLines = contentLines.slice(0, 2);

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
      preview={
        previewLines.length > 0 && previewLines[0].trim().length > 0 ? (
          <div className="space-y-0.5">
            {previewLines.map((line, i) => (
              <div key={i} className="flex gap-2 font-mono text-[11px]">
                <span className="w-8 shrink-0 text-right text-gray-700 select-none">{i + 1}</span>
                <span className="text-gray-600 truncate">{line}</span>
              </div>
            ))}
          </div>
        ) : undefined
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
git commit -m "feat: add collapsed preview to WriteCard"
```

---

### Task 13: Add Collapsed Preview to EditCard

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/EditCard.tsx`

- [ ] **Step 1: Update EditCard with preview showing old→new first line**

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function EditCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const oldStr = (event.input.old_string as string) ?? '';
  const newStr = (event.input.new_string as string) ?? '';
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const oldPreview = oldLines[0] ?? '';
  const newPreview = newLines[0] ?? '';

  return (
    <CollapsibleCard
      icon={<span>📝</span>}
      summary={
        <>
          <span className="font-medium text-gray-400">Edit</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{filePath}</span>
        </>
      }
      preview={
        oldPreview || newPreview ? (
          <div className="space-y-0.5">
            {oldPreview && (
              <div className="font-mono text-[11px] text-red-400/60 truncate">- {oldPreview}</div>
            )}
            {newPreview && (
              <div className="font-mono text-[11px] text-green-400/60 truncate">+ {newPreview}</div>
            )}
          </div>
        ) : undefined
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
git commit -m "feat: add collapsed preview to EditCard"
```

---

### Task 14: Final Verification

- [ ] **Step 1: Run full typecheck**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm run typecheck`
Expected: PASS across all packages

- [ ] **Step 2: Run dev server and verify visually**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm -F @harnesson/web run dev`

Open the agent panel, send a message that triggers tool calls, verify:
- Tool cards show preview lines in collapsed state
- Agent sub-agent calls render with description + model badge
- Expanding Agent card shows tree of sub-events with indentation

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address typecheck or visual issues from final verification"
```
