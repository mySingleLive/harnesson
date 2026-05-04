# Message Ordering: Event-Stream Segmented Rendering

## Problem

In the Agent chat panel, when an agent completes a tool call and then outputs markdown text, the text appears **above** all tool cards instead of **after** the relevant tool call. This breaks the chronological narrative of the conversation.

Root cause: `AgentMessageBubble` renders all markdown content first (from the accumulated `content` string), then all tool cards below. Text and tool events are interleaved in time but rendered as two separate blocks.

## Solution

Process the `events` array into ordered segments, where each segment is either a text block or a tool card, then render them sequentially.

## Data Model

```typescript
// Reuse existing PairedToolEvent from pairEvents.ts
type Segment = TextSegment | ToolSegment;

interface TextSegment {
  type: 'text';
  content: string;
}

interface ToolSegment {
  type: 'tool';
  event: PairedToolEvent;  // reuse existing type
}
```

## Core Function: `segmentEvents`

Located at `src/components/chat/tool-cards/segmentEvents.ts`.

Algorithm:
1. Iterate through events in arrival order
2. `agent.text` events: accumulate text into a buffer
3. `agent.tool_use`: flush text buffer as a TextSegment, then track pending tool call
4. `agent.tool_result`: pair with pending tool_use, emit ToolSegment
5. `agent.thinking`: ignored (no visual segment)
6. After loop: flush any remaining text buffer

Uses FIFO pairing for tool_use/tool_result (same as existing `pairEvents`).

## Rendering Changes

`AgentMessageBubble` in `MessageRenderer.tsx`:

- Remove separate `content` block and `ToolEventCardList` block
- Call `segmentEvents(events)` to get ordered segments
- Map segments: TextSegment → Markdown component, ToolSegment → tool card component

```tsx
const segments = segmentEvents(events);
return (
  <div>
    <AgentNameHeader />
    {segments.map((seg, i) =>
      seg.type === 'text'
        ? <MarkdownBlock key={i} content={seg.content} />
        : <ToolCard key={i} event={seg} />
    )}
  </div>
);
```

## Files Changed

| File | Change |
|------|--------|
| `tool-cards/segmentEvents.ts` | New: segment function + types |
| `MessageRenderer.tsx` | Refactor `AgentMessageBubble` to use segmented rendering |
| `tool-cards/ToolEventCard.tsx` | Export a single-event card renderer for ToolSegment |

## Files Unchanged

- `agentStore.ts` — no store changes
- `AgentMessage` / `AgentStreamEvent` types — no type changes
- `pairEvents.ts` — retained, logic reused inside `segmentEvents`
- Streaming display behavior — unchanged

## Edge Cases

- Empty text segments (consecutive tool calls with no text between) are skipped
- Incomplete tool_use without tool_result: rendered as a running/incomplete card
- Streaming: last text segment may be incomplete; rendered the same as current behavior
