# Dynamic Session Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic "Agent A/B/C" session names with meaningful titles generated from the user's first prompt.

**Architecture:** Pass the user's first message as a `prompt` field through the create-agent API chain. On the server, a `generateTitle()` function checks the prompt length — short prompts are used directly, longer ones are summarized by a lightweight LLM call using the existing `query()` SDK function.

**Tech Stack:** TypeScript, `@anthropic-ai/claude-agent-sdk`, Hono (server), Zustand (client store)

---

### Task 1: Add `prompt` field to shared `CreateAgentRequest` type

**Files:**
- Modify: `packages/shared/src/types/agent.ts:57-64`

- [ ] **Step 1: Add `prompt` field to `CreateAgentRequest` interface**

In `packages/shared/src/types/agent.ts`, add `prompt` as an optional field:

```typescript
export interface CreateAgentRequest {
  cwd: string;
  type: AgentType;
  model?: string;
  systemPrompt?: string;
  permissionMode: 'auto' | 'manual';
  maxTurns?: number;
  prompt?: string;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | head -20`
Expected: No errors related to `CreateAgentRequest`.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat: add prompt field to CreateAgentRequest type"
```

---

### Task 2: Implement `generateTitle()` in agent-service

**Files:**
- Modify: `apps/server/src/lib/agent-service.ts:1-34`

- [ ] **Step 1: Add `generateTitle` function and remove old naming code**

Add the import for `query` and replace `agentCounter` + `nextAgentName()` with `generateTitle()`. Insert at the top of `agent-service.ts`:

```typescript
import type { AgentStreamEvent, AgentInfo, CreateAgentRequest, CreateAgentResponse, AgentStatus } from '@harnesson/shared';
import type { AgentAdapter, ModelInfo } from './agent-adapter.js';
import { ClaudeCodeAdapter } from './claude-code-adapter.js';
import { query } from '@anthropic-ai/claude-agent-sdk';

// ... SSEClient and AgentState interfaces stay the same (lines 5-27) ...

async function generateTitle(prompt: string): Promise<string> {
  if (!prompt.trim()) return '新会话';
  if (prompt.length <= 10) return prompt;

  try {
    const stream = query({
      prompt,
      options: {
        maxTurns: 1,
        systemPrompt: '请用不超过10个中文字符总结以下任务的标题。只返回标题文字本身，不要加引号、编号或其他格式。',
        abortController: new AbortController(),
      },
    });

    let title = '';
    for await (const msg of stream) {
      const m = msg as Record<string, unknown>;
      if (m.type === 'assistant') {
        const betaMessage = m.message as Record<string, unknown> | undefined;
        const content = betaMessage?.content as Array<Record<string, unknown>> | undefined;
        if (content) {
          for (const block of content) {
            if (block.type === 'text' && typeof block.text === 'string') {
              title += block.text;
            }
          }
        }
      }
    }
    (stream as unknown as { abort?: () => void }).abort?.();
    return title.trim() || prompt.slice(0, 10);
  } catch {
    return prompt.slice(0, 10);
  }
}
```

Remove the old `agentCounter` and `nextAgentName()` function (original lines 29-34).

- [ ] **Step 2: Update `create()` method to use `generateTitle`**

In `AgentService.create()`, replace:

```typescript
const name = nextAgentName();
```

with:

```typescript
const name = await generateTitle(req.prompt ?? '');
```

The full `create()` method signature stays `async create(req: CreateAgentRequest)`.

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/server/tsconfig.json 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/lib/agent-service.ts
git commit -m "feat: replace static agent names with dynamic title generation"
```

---

### Task 3: Thread `prompt` through the client API layer

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts:187-212`
- Modify: `apps/web/src/stores/agentStore.ts:54-61`

- [ ] **Step 1: Add `prompt` to `createAgent` in `serverApi.ts`**

In the `createAgent` function signature and body, add `prompt`:

```typescript
export async function createAgent(opts: {
  cwd: string;
  type: string;
  model?: string;
  permissionMode?: 'auto' | 'manual';
  systemPrompt?: string;
  maxTurns?: number;
  prompt?: string;
}): Promise<CreateAgentResponse> {
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cwd: opts.cwd,
      type: opts.type,
      model: opts.model,
      permissionMode: opts.permissionMode ?? 'auto',
      systemPrompt: opts.systemPrompt,
      maxTurns: opts.maxTurns,
      prompt: opts.prompt,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to create agent: ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 2: Forward `taskTitle` as `prompt` in `agentStore.ts`**

In the `createAgent` method of the store, pass `taskTitle` as `prompt` to `api.createAgent`:

```typescript
const response = await api.createAgent({
  cwd: opts.cwd,
  type: opts.type,
  model: opts.model,
  permissionMode: opts.permissionMode ?? 'auto',
  prompt: opts.taskTitle,
});
```

- [ ] **Step 3: Verify typecheck passes**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/serverApi.ts apps/web/src/stores/agentStore.ts
git commit -m "feat: pass user prompt through to agent creation API"
```

---

### Task 4: End-to-end verification

**Files:** None — manual testing only.

- [ ] **Step 1: Start the dev server**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm dev`

- [ ] **Step 2: Test short prompt (≤ 10 chars)**

Open the app, type a short prompt like "你好" and send it. Verify the sidebar shows "你好" instead of "Agent A".

- [ ] **Step 3: Test long prompt (> 10 chars)**

Type a longer prompt like "帮我分析这个项目的代码架构并给出优化建议" and send it. Verify the sidebar shows a concise Chinese summary title (~10 chars) instead of "Agent B".

- [ ] **Step 4: Test edge case — empty prompt**

Verify that the UI prevents sending an empty message (the button should be disabled). If somehow an empty prompt reaches the server, verify the title defaults to "新会话".

- [ ] **Step 5: Verify existing agent list loads correctly**

Reload the page. Verify that previously created agents still display their names correctly in the sidebar. The `list()` and `get()` methods in `AgentService` should still work since they read `agent.name` from stored state.

- [ ] **Step 6: Commit any fixes if needed**

If any issues were found and fixed during testing, commit them.
