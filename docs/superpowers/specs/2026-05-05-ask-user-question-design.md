# AskUserQuestion Design

## Overview

When an agent calls the AskUserQuestion tool during a chat session, display a popup panel that presents the question and its options to the user. The agent pauses execution on the server until the user answers, then resumes. The popup is positioned fixed above the input box (below TodoBar if active), replacing the input area while visible.

## Requirements

- **One question at a time** — matching Claude Code CLI behavior. When multiple questions exist, each arrives as a separate tool call.
- **4 option rendering modes** based on data structure:
  - Simple (label only) → compact single-line
  - Detailed (label + description) → two-line card
  - With preview (label + description + preview) → left options + right preview area
  - Multi-select → checkbox style + confirm button
- **"Other" custom input** — always visible at bottom, user can type a free-text answer
- **Input box hidden** when popup is active
- **ThinkingBar hidden** when popup is active
- **Single-select**: click to submit immediately. **Multi-select**: select multiple, then confirm with button.

## Data Flow

```
Agent calls AskUserQuestion tool
  → Server intercepts tool_use, sends SSE: agent.question event
  → Server pauses Agent execution (await Promise)
  → Client receives agent.question, sets pendingQuestion state
  → AskUserQuestionPanel renders in sticky area
  → User selects option or types custom answer
  → Client POST /api/agents/:id/tool-result { tool_use_id, answer }
  → Server resolves Promise, Agent resumes
  → Client clears pendingQuestion, restores input box
  → Subsequent events stream normally
```

## Types

```typescript
interface PendingQuestion {
  toolUseId: string;
  question: QuestionData;
}

interface QuestionData {
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect: boolean;
}

interface QuestionOption {
  label: string;
  description?: string;
  preview?: string;
}
```

## Server Changes

### Agent Execution Loop

In the existing agent executor, intercept `AskUserQuestion` tool calls:

```typescript
// agent-executor.ts
for await (const event of agent.runStream()) {
  if (event.type === 'tool_use' && event.tool === 'AskUserQuestion') {
    const question = event.input.questions[0];

    // Send custom SSE event to client
    sseSend({
      type: 'agent.question',
      tool_use_id: event.id,
      question
    });

    // Pause — wait for user answer
    const answer = await new Promise((resolve) => {
      pendingToolResults.set(agentId, event.id, resolve);
    });

    // Return tool_result to Agent SDK, continue execution
    continueWithToolResult(event.id, answer);
    continue;
  }

  sseSend(event);
}
```

### API Endpoint

```
POST /api/agents/:id/tool-result
```

Request body:

```json
{
  "tool_use_id": "toolu_xxx",
  "answer": "selected option label"
}
```

Multi-select answer:

```json
{
  "tool_use_id": "toolu_xxx",
  "answer": ["Option A", "Option B"]
}
```

Response: `{ "ok": true }`

Error: `404` if no pending question for the given tool_use_id.

### Pending Tool Results Manager

```typescript
class PendingToolResults {
  private map = new Map<string, Map<string, (answer: string | string[]) => void>>();

  set(agentId: string, toolUseId: string, resolve: Function) {
    if (!this.map.has(agentId)) this.map.set(agentId, new Map());
    this.map.get(agentId)!.set(toolUseId, resolve);
  }

  get(agentId: string, toolUseId: string) {
    return this.map.get(agentId)?.get(toolUseId);
  }

  delete(agentId: string, toolUseId: string) {
    this.map.get(agentId)?.delete(toolUseId);
  }

  clearAgent(agentId: string) {
    this.map.delete(agentId);
  }
}
```

Clean up on Agent disconnect (SSE close) by calling `clearAgent(agentId)`.

## Client Changes

### agentStore Extensions

**New state:**

```typescript
pendingQuestion: Record<string, PendingQuestion | null>;
```

**New SSE event handling** (in `appendStreamEvent`):

```typescript
if (event.type === 'agent.question') {
  set((s) => ({
    pendingQuestion: {
      ...s.pendingQuestion,
      [agentId]: {
        toolUseId: event.tool_use_id,
        question: event.question
      }
    }
  }));
}
```

**New action — submitQuestionAnswer:**

```typescript
async submitQuestionAnswer(agentId: string, answer: string | string[]) {
  const pending = get().pendingQuestion[agentId];
  if (!pending) return;

  await fetch(`/api/agents/${agentId}/tool-result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool_use_id: pending.toolUseId,
      answer
    })
  });

  set((s) => ({
    pendingQuestion: {
      ...s.pendingQuestion,
      [agentId]: null
    }
  }));
}
```

### AskUserQuestionPanel Component

**File:** `src/apps/web/src/components/chat/AskUserQuestionPanel.tsx`

**Props:**

```typescript
interface AskUserQuestionPanelProps {
  question: QuestionData;
  onSubmit: (answer: string | string[]) => void;
}
```

**Layout:**

```
┌─────────────────────────────────────────────────┐
│  ?  HEADER_LABEL                                 │
│                                                  │
│  Question text goes here?                        │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ ○ Option label 1                            │ │
│  │   description text (if present)             │ │
│  ├─────────────────────────────────────────────┤ │
│  │ ○ Option label 2                            │ │
│  ├─────────────────────────────────────────────┤ │
│  │ ○ Option label 3                            │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  自定义回答                                       │
│  [_________________________] [提交]              │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Container: `ml-[68px] mr-3 mb-2` (aligned with TodoBar)
- Background: `bg-[#16162e]` with `border border-[#2a2a4e] rounded-[10px]`
- Box shadow: `shadow-[0_-4px_16px_rgba(0,0,0,0.3)]`
- Padding: `p-4`
- Header: purple circle `?` icon + header text in `text-xs uppercase tracking-wide text-[#8b8bff]`
- Question: `text-sm text-[#e0e0f0]`

**Rendering rules:**

| Option data | Render mode |
|---|---|
| label only | Single line: `○ label` |
| label + description | Two lines: `○ label` + gray description below |
| label + description + preview | Split view: options left, monospace preview right |
| multiSelect=true | Checkboxes `☑/☐`, confirm button at bottom |

**Interaction:**
- Single select: click option → immediately calls `onSubmit(label)`
- Multi select: toggle checkboxes → click "确认" button → calls `onSubmit(selectedLabels)`
- Custom input: type in text field → click "提交" → calls `onSubmit(text)`

### AgentPanel Integration

In the sticky container area:

```tsx
const pendingQuestion = useAgentStore(s => s.pendingQuestion[agent.id]);
const hasPendingQuestion = pendingQuestion !== null;

<div className="sticky bottom-0 bg-harness-chat pt-1 pb-2">
  {/* ThinkingBar — hidden when question pending */}
  {isStreaming && !hasPendingQuestion && <ThinkingBar />}

  {/* TodoBar — always visible if todos exist */}
  {todos && todos.length > 0 && <TodoBar todos={todos} />}

  {/* AskUserQuestionPanel — below TodoBar */}
  {hasPendingQuestion && (
    <AskUserQuestionPanel
      question={pendingQuestion.question}
      onSubmit={(answer) =>
        useAgentStore.getState().submitQuestionAnswer(agent.id, answer)
      }
    />
  )}
</div>

{/* Input area — hidden when question pending */}
{!hasPendingQuestion && <ChatInput ... />}
```

### toolCardMap Registration

Register `AskUserQuestionCard` in `toolCardMap` for message history rendering:

```typescript
const toolCardMap = {
  ...existingTools,
  AskUserQuestion: AskUserQuestionCard,
};
```

`AskUserQuestionCard` displays in the message stream as a compact record: `?` icon + "提问: {header}" + the user's answer. It does not handle interaction — only shows the historical tool call.

## State Machine

```
┌─────────────┐     agent.question event    ┌──────────────────┐
│   Normal     │ ──────────────────────────> │  Waiting for     │
│ ThinkingBar  │                             │  User Answer     │
│ Input active │                             │  Panel visible   │
└─────────────┘                             │  Input hidden    │
      ▲                                     └──────────────────┘
      │         POST tool-result                    │
      └────────────────────────────────────────────┘
```

Agent may call AskUserQuestion again immediately after resuming — the client transitions directly to the next waiting state without passing through normal.
