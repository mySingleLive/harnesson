# Todo List Design

## Overview

When an agent triggers TaskCreate/TaskUpdate tools in the chat panel, display a real-time todo list that tracks task progress. The list floats above the input area while tasks are incomplete, then inserts into the message flow as a final record when all tasks are completed. Visual style follows the existing chat panel design language — same fonts and coordinated color scheme.

## Data Flow

Agent calls TaskCreate/TaskUpdate tools, which flow through the existing SSE event stream:

```
Agent tool call (TaskCreate/TaskUpdate)
  → SSE: agent.tool_use event (existing event type)
  → agentStore parses input, extracts todo data
  → TodoBar subscribes to store.todos, re-renders in real time
  → All completed → fade out float, insert TodoCard into message stream
```

No new SSE event types required. The store identifies TaskCreate/TaskUpdate by inspecting the `tool` field on existing `agent.tool_use` events.

## Types

```typescript
interface TodoItem {
  id: string;
  subject: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm?: string; // displayed as spinner label when status is in_progress
}
```

## Store Changes

Add to `agentStore`:

- **State**: `todos: TodoItem[]` — active todo items for current agent turn
- **Methods**: `addTodo(item)`, `updateTodo(id, updates)`, `clearTodos()`
- **Derived**: computed check for all-completed status

Event handling in existing SSE listener:
- When `tool` is `TaskCreate`: parse `input`, call `addTodo()`
- When `tool` is `TaskUpdate`: parse `input`, call `updateTodo()`
- After each update: check if all items are `completed` → trigger transition sequence

## Components

### TodoBar

File: `components/chat/TodoBar.tsx`

Floating component positioned in AgentPanel between ThinkingBar and input area.

**Layout** (bottom-fixed area of AgentPanel):
```
AgentPanel
  └─ Message list (scrollable)
  └─ Fixed bottom area
       ├─ ThinkingBar  (streaming)
       ├─ TodoBar      (active todos exist)
       └─ Input area
```

**Visual design**:
- Font: same as chat panel (not monospace)
- Background: semi-transparent with backdrop blur, matching existing panel aesthetic
- Rounded corners, `px-4 py-2` padding
- Max height: 40vh, internal scroll if overflow
- Enter animation: fade + slide-up
- Exit animation: fade-out after 1.5s completion hold

**Status icons** — using existing color palette:
- `pending`: muted/secondary tone, empty checkbox icon
- `in_progress`: primary/accent (purple) tone, spinning circle icon
- `completed`: success/green tone, checkmark icon

### TodoCard

File: `components/chat/tool-cards/TodoCard.tsx`

Final-state card appended as a special message segment (not a tool card). When all todos complete, the store appends a synthetic message to the conversation containing the TodoCard.

- All items show as completed (green checkmarks)
- Uses CollapsibleCard pattern (expandable/collapsible)
- Contains a snapshot of the final todo list state
- Acts as a historical record in the conversation

## Transition Sequence

When the last todo becomes completed:

1. TodoBar briefly shows all-complete state (1.5s)
2. TodoBar fades out from bottom-fixed area
3. A TodoCard is appended to the message stream with the final snapshot
4. `store.clearTodos()` resets the active state

## Lifecycle

- One active todo list per agent reply cycle
- If a new agent reply starts while todos are still pending, the current todo state is snapshot-inserted into the message flow, then cleared for the new cycle
- This prevents multiple floating todo lists

## Files

**New**:
- `components/chat/TodoBar.tsx`
- `components/chat/tool-cards/TodoCard.tsx`

**Modified**:
- `stores/agentStore.ts` — add todos state and methods, append synthetic message on completion
- `components/layout/AgentPanel.tsx` — integrate TodoBar
- `types/` — add TodoItem type definition

## Dependencies

None beyond existing stack (React, Zustand, Tailwind, existing CSS variables).
