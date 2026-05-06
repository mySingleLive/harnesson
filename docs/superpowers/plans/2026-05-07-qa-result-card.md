# Q&A Result Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a simple inline `question → answer` card in the chat flow after the user submits an answer through the Q&A popup.

**Architecture:** Add a new `qa-result` segment type to `segmentEvents.ts`, create a `QAResultCard` component, and wire it into `MessageRenderer.tsx`. No changes to tool card system or state management.

**Tech Stack:** React, TypeScript, Tailwind (inline styles)

---

### Task 1: Add `qa-result` segment type to `segmentEvents.ts`

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/segmentEvents.ts`
- Modify: `apps/web/src/components/chat/tool-cards/index.ts`

- [ ] **Step 1: Add `QAResultSegment` interface and update `Segment` union**

In `segmentEvents.ts`, add after `ToolSegment` interface (line 12):

```ts
export interface QAResultSegment {
  type: 'qa-result';
  question: string;
  answer: string;
}
```

Change the `Segment` type (line 14) from:

```ts
export type Segment = TextSegment | ToolSegment;
```

to:

```ts
export type Segment = TextSegment | ToolSegment | QAResultSegment;
```

- [ ] **Step 2: Stop filtering `AskUserQuestion` from `tool_use` events**

In `segmentEvents.ts`, change line 42 from:

```ts
if (event.tool !== 'TodoWrite' && event.tool !== 'AskUserQuestion') {
```

to:

```ts
if (event.tool !== 'TodoWrite') {
```

- [ ] **Step 3: Handle `AskUserQuestion` tool_result as `qa-result` segment**

In `segmentEvents.ts`, change the `agent.tool_result` branch (lines 45-73). Replace the early `continue` for `AskUserQuestion` with dedicated handling. The full replacement for lines 45-73:

```ts
} else if (event.type === 'agent.tool_result') {
  flushText();

  // Handle AskUserQuestion: generate qa-result segment
  if (event.tool === 'AskUserQuestion') {
    const question = (() => {
      const paired = pendingTools.find(p => p.tool === 'AskUserQuestion');
      if (paired) {
        const questions = paired.input?.questions as Array<Record<string, unknown>> | undefined;
        return String(questions?.[0]?.question ?? '');
      }
      return '';
    })();
    // Remove from pendingTools
    const idx = pendingTools.findIndex(p => p.tool === 'AskUserQuestion');
    if (idx >= 0) pendingTools.splice(idx, 1);

    segments.push({
      type: 'qa-result',
      question,
      answer: String(event.output ?? ''),
    });
    continue;
  }

  if (event.tool === 'TodoWrite') continue;
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
```

- [ ] **Step 4: Export `QAResultSegment` from barrel file**

In `index.ts`, change the segmentEvents export line (line 2) from:

```ts
export { segmentEvents, type Segment, type TextSegment, type ToolSegment } from './segmentEvents';
```

to:

```ts
export { segmentEvents, type Segment, type TextSegment, type ToolSegment, type QAResultSegment } from './segmentEvents';
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors in `segmentEvents.ts` or `index.ts`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/segmentEvents.ts apps/web/src/components/chat/tool-cards/index.ts
git commit -m "feat: add qa-result segment type for AskUserQuestion results"
```

---

### Task 2: Create `QAResultCard` component

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/QAResultCard.tsx`

- [ ] **Step 1: Create the component**

Create `apps/web/src/components/chat/tool-cards/QAResultCard.tsx`:

```tsx
interface QAResultCardProps {
  question: string;
  answer: string;
}

export function QAResultCard({ question, answer }: QAResultCardProps) {
  const truncated = answer.length > 100 ? answer.slice(0, 100) + '...' : answer;

  return (
    <div
      style={{
        background: '#252540',
        borderRadius: '8px',
        padding: '12px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        <span style={{ color: '#9ca3af' }}>{question}</span>
        <span style={{ color: '#6b7280' }}>→</span>
        <span style={{ color: '#00bfff' }}>{truncated}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/QAResultCard.tsx
git commit -m "feat: add QAResultCard component for inline question-answer display"
```

---

### Task 3: Wire `qa-result` segment into `MessageRenderer`

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx`

- [ ] **Step 1: Import `QAResultCard` and update segment rendering**

In `MessageRenderer.tsx`, add import at line 4:

Change:
```tsx
import { segmentEvents, SingleToolEventCard } from './tool-cards';
```

to:
```tsx
import { segmentEvents, SingleToolEventCard } from './tool-cards';
import { QAResultCard } from './tool-cards/QAResultCard';
```

Then in `AgentMessageBubble`, update the segments.map block (lines 56-65) from:

```tsx
{segments.map((seg, i) =>
  seg.type === 'text' ? (
    <div key={i} className="mb-5 text-[13px] leading-relaxed text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-strong:text-gray-200 prose-code:text-harness-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-300">
      <Markdown remarkPlugins={[remarkGfm]}>{seg.content}</Markdown>
    </div>
  ) : (
    <div key={i} className="mb-3">
      <SingleToolEventCard event={seg.event} />
    </div>
  )
)}
```

to:

```tsx
{segments.map((seg, i) => {
  if (seg.type === 'text') {
    return (
      <div key={i} className="mb-5 text-[13px] leading-relaxed text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-strong:text-gray-200 prose-code:text-harness-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-300">
        <Markdown remarkPlugins={[remarkGfm]}>{seg.content}</Markdown>
      </div>
    );
  }
  if (seg.type === 'qa-result') {
    return (
      <div key={i} className="mb-3">
        <QAResultCard question={seg.question} answer={seg.answer} />
      </div>
    );
  }
  return (
    <div key={i} className="mb-3">
      <SingleToolEventCard event={seg.event} />
    </div>
  );
})}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "feat: render qa-result segments as inline Q&A cards in chat"
```

---

### Task 4: Manual E2E verification

- [ ] **Step 1: Start dev server**

Run: `cd apps/web && npm run dev`

- [ ] **Step 2: Trigger a question-answer flow**

In the browser, send a message that triggers the agent to ask a question. Answer the question via the popup.

- [ ] **Step 3: Verify result card appears in chat**

Expected: After submitting the answer, a card appears in the chat message flow showing `question → answer` in gray and brand-blue colors. No sender label on the card.

- [ ] **Step 4: Verify no regressions**

Check that: tool cards still render correctly, text segments still show, no console errors.
