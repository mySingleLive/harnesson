# Message Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix message ordering so markdown text appears after the tool calls that precede it chronologically, not above all tool cards.

**Architecture:** Replace the two-block rendering (all text → all tool cards) with a segmented approach. A new `segmentEvents()` function processes the events array into ordered segments (text or tool), and `AgentMessageBubble` renders them sequentially.

**Tech Stack:** React, TypeScript, Vitest, @testing-library/react

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/src/components/chat/tool-cards/segmentEvents.ts` | Create | Segment function + types |
| `apps/web/src/components/chat/tool-cards/__tests__/segmentEvents.test.ts` | Create | Tests for segmentEvents |
| `apps/web/src/components/chat/tool-cards/ToolEventCard.tsx` | Modify | Export single-card renderer |
| `apps/web/src/components/chat/tool-cards/index.ts` | Modify | Export new items |
| `apps/web/src/components/chat/MessageRenderer.tsx` | Modify | Use segmented rendering |

---

### Task 1: Create `segmentEvents` function and types

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/segmentEvents.ts`
- Test: `apps/web/src/components/chat/tool-cards/__tests__/segmentEvents.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/src/components/chat/tool-cards/__tests__/segmentEvents.test.ts
import { describe, it, expect } from 'vitest';
import { segmentEvents, type Segment } from '../segmentEvents';
import type { AgentStreamEvent } from '@harnesson/shared';

function textEvent(text: string): AgentStreamEvent {
  return { type: 'agent.text', text };
}

function toolUseEvent(tool: string, input: Record<string, unknown> = {}): AgentStreamEvent {
  return { type: 'agent.tool_use', tool, input };
}

function toolResultEvent(tool: string, output?: string): AgentStreamEvent {
  return { type: 'agent.tool_result', tool, output };
}

function thinkingEvent(): AgentStreamEvent {
  return { type: 'agent.thinking' };
}

describe('segmentEvents', () => {
  it('returns empty array for empty events', () => {
    expect(segmentEvents([])).toEqual([]);
  });

  it('returns a single text segment for text-only events', () => {
    const events = [textEvent('Hello world')];
    const result = segmentEvents(events);
    expect(result).toEqual([
      { type: 'text', content: 'Hello world' },
    ]);
  });

  it('concatenates consecutive text events into one segment', () => {
    const events = [textEvent('Hello '), textEvent('world')];
    const result = segmentEvents(events);
    expect(result).toEqual([
      { type: 'text', content: 'Hello world' },
    ]);
  });

  it('produces a tool segment from paired tool_use + tool_result', () => {
    const events = [
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'file contents'),
    ];
    const result = segmentEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('tool');
    if (result[0].type === 'tool') {
      expect(result[0].event.tool).toBe('Read');
      expect(result[0].event.input).toEqual({ file_path: '/a.ts' });
      expect(result[0].event.output).toBe('file contents');
    }
  });

  it('interleaves text and tool segments in chronological order', () => {
    const events = [
      textEvent('Let me read the file.'),
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents'),
      textEvent('Here is what I found.'),
    ];
    const result = segmentEvents(events);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: 'text', content: 'Let me read the file.' });
    expect(result[1].type).toBe('tool');
    expect(result[2]).toEqual({ type: 'text', content: 'Here is what I found.' });
  });

  it('renders multiple tool calls with text between them', () => {
    const events = [
      toolUseEvent('Glob', { pattern: '*.ts' }),
      toolResultEvent('Glob', 'a.ts\nb.ts'),
      textEvent('Now let me read a.ts'),
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents of a'),
    ];
    const result = segmentEvents(events);

    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('tool');
    expect(result[1]).toEqual({ type: 'text', content: 'Now let me read a.ts' });
    expect(result[2].type).toBe('tool');
  });

  it('ignores thinking events', () => {
    const events = [thinkingEvent(), textEvent('Hello'), thinkingEvent()];
    const result = segmentEvents(events);
    expect(result).toEqual([{ type: 'text', content: 'Hello' }]);
  });

  it('handles tool_use without tool_result as incomplete tool segment', () => {
    const events = [toolUseEvent('Read', { file_path: '/a.ts' })];
    const result = segmentEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('tool');
    if (result[0].type === 'tool') {
      expect(result[0].event.tool).toBe('Read');
      expect(result[0].event.output).toBeUndefined();
    }
  });

  it('skips empty text segments', () => {
    const events = [
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents'),
      textEvent(''),
      toolUseEvent('Write', { file_path: '/b.ts' }),
      toolResultEvent('Write', 'ok'),
    ];
    const result = segmentEvents(events);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('tool');
    expect(result[1].type).toBe('tool');
  });

  it('handles a full conversation with multiple interleaved segments', () => {
    const events = [
      textEvent('I will search for files.'),
      toolUseEvent('Glob', { pattern: '*.ts' }),
      toolResultEvent('Glob', 'a.ts\nb.ts'),
      textEvent('Let me read them.'),
      toolUseEvent('Read', { file_path: '/a.ts' }),
      toolResultEvent('Read', 'contents a'),
      textEvent('Now I will edit.'),
      toolUseEvent('Edit', { file_path: '/a.ts' }),
      toolResultEvent('Edit', 'ok'),
      textEvent('Done!'),
    ];
    const result = segmentEvents(events);

    const types = result.map((s) => s.type);
    expect(types).toEqual(['text', 'tool', 'text', 'tool', 'text', 'tool', 'text']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run src/components/chat/tool-cards/__tests__/segmentEvents.test.ts`
Expected: FAIL — module `../segmentEvents` does not exist

- [ ] **Step 3: Write `segmentEvents` implementation**

```typescript
// apps/web/src/components/chat/tool-cards/segmentEvents.ts
import type { AgentStreamEvent } from '@harnesson/shared';
import type { PairedToolEvent } from './pairEvents';

export interface TextSegment {
  type: 'text';
  content: string;
}

export interface ToolSegment {
  type: 'tool';
  event: PairedToolEvent;
}

export type Segment = TextSegment | ToolSegment;

export function segmentEvents(events: AgentStreamEvent[]): Segment[] {
  const segments: Segment[] = [];
  let textBuffer = '';
  const pendingTools: Array<{ tool: string; input: Record<string, unknown> }> = [];

  function flushText() {
    if (textBuffer) {
      segments.push({ type: 'text', content: textBuffer });
      textBuffer = '';
    }
  }

  function flushPendingTools() {
    for (const { tool, input } of pendingTools) {
      segments.push({ type: 'tool', event: { tool, input } });
    }
    pendingTools.length = 0;
  }

  for (const event of events) {
    if (event.type === 'agent.text') {
      if (event.text) {
        textBuffer += event.text;
      }
    } else if (event.type === 'agent.tool_use') {
      flushText();
      pendingTools.push({ tool: event.tool ?? 'unknown', input: event.input ?? {} });
    } else if (event.type === 'agent.tool_result') {
      flushText();
      const toolName = event.tool;
      if (pendingTools.length > 0) {
        const { tool, input } = pendingTools.shift()!;
        segments.push({
          type: 'tool',
          event: {
            tool: toolName && toolName !== 'unknown' ? toolName : tool,
            input,
            output: event.output,
            isError: event.isError,
            duration: event.duration,
          },
        });
      } else {
        segments.push({
          type: 'tool',
          event: {
            tool: toolName ?? 'unknown',
            input: {},
            output: event.output,
            isError: event.isError,
            duration: event.duration,
          },
        });
      }
    }
    // agent.thinking, agent.error, agent.done — ignored for segmentation
  }

  flushText();
  flushPendingTools();

  return segments;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm vitest run src/components/chat/tool-cards/__tests__/segmentEvents.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/segmentEvents.ts apps/web/src/components/chat/tool-cards/__tests__/segmentEvents.test.ts
git commit -m "feat: add segmentEvents function for interleaved message rendering"
```

---

### Task 2: Export single-tool-card renderer from ToolEventCard

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/ToolEventCard.tsx`

Currently `ToolEventCardList` takes `AgentStreamEvent[]`, calls `pairEvents()` internally, then renders cards. The segmented renderer needs to render a single card from a `PairedToolEvent` directly.

- [ ] **Step 1: Add `SingleToolEventCard` export**

Add this component at the end of `ToolEventCard.tsx` (before the closing of the file), after the existing `ToolEventCardList`:

```tsx
export function SingleToolEventCard({ event }: { event: PairedToolEvent }) {
  const Card = toolCardMap[event.tool] ?? GenericCard;
  return <Card event={event} />;
}
```

The full import at top of `ToolEventCard.tsx` already has `PairedToolEvent` from `./pairEvents` — but verify the import exists. If not, add:

```typescript
import type { PairedToolEvent } from './pairEvents';
```

Check the current import line `import { pairEvents, type PairedToolEvent } from './pairEvents';` — if `PairedToolEvent` is not imported, add it.

- [ ] **Step 2: Update barrel export**

Modify `apps/web/src/components/chat/tool-cards/index.ts`:

```typescript
export { ToolEventCardList, SingleToolEventCard } from './ToolEventCard';
export { segmentEvents, type Segment, type TextSegment, type ToolSegment } from './segmentEvents';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd apps/web && pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/ToolEventCard.tsx apps/web/src/components/chat/tool-cards/index.ts
git commit -m "feat: export SingleToolEventCard and segment types from tool-cards"
```

---

### Task 3: Refactor `AgentMessageBubble` to use segmented rendering

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx`

This is the core change — replace the two-block layout (content above, tools below) with interleaved segments.

- [ ] **Step 1: Update `AgentMessageBubble`**

Replace the current `AgentMessageBubble` function body. The current code at lines 29-62 renders `{content && ...Markdown}` then `{events && <ToolEventCardList>}`. Replace with segmented rendering.

New `AgentMessageBubble`:

```tsx
function AgentMessageBubble({ events, content, agentName, isStreaming }: {
  events: AgentMessage['events'];
  content: string;
  agentName: string;
  isStreaming: boolean;
}) {
  const segments = segmentEvents(events ?? []);

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

      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <div key={i} className="border-l-2 border-green-500/40 pl-3 text-[13px] leading-relaxed text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-strong:text-gray-200 prose-code:text-harness-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-300">
            <Markdown remarkPlugins={[remarkGfm]}>{seg.content}</Markdown>
          </div>
        ) : (
          <div key={i} className="mt-2">
            <SingleToolEventCard event={seg.event} />
          </div>
        )
      )}

      {events?.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={`error-${i}`} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}
```

Update the imports at the top of `MessageRenderer.tsx`. Replace:

```typescript
import { ToolEventCardList } from './tool-cards';
```

With:

```typescript
import { segmentEvents, SingleToolEventCard } from './tool-cards';
```

- [ ] **Step 2: Run TypeScript check**

Run: `cd apps/web && pnpm typecheck`
Expected: No errors

- [ ] **Step 3: Run all existing tests**

Run: `cd apps/web && pnpm vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "feat: use segmented rendering for interleaved text and tool cards"
```

---

### Task 4: Manual verification in browser

**Files:** None (visual check)

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Open agent chat and send a message**

Open the app in a browser, open an agent chat panel, and send a message that triggers tool usage (e.g., "Read the file package.json").

- [ ] **Step 3: Verify message ordering**

Confirm that:
1. Text before a tool call appears above the tool card
2. The tool card appears in its correct chronological position
3. Text after a tool result appears **below** the tool card (not above all cards)
4. Multiple tool calls with text between them are correctly interleaved
5. Streaming display works as before (text appears incrementally)
6. The agent name header and streaming indicator still work
