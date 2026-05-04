# AskUserQuestion 弹窗 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 当 Agent 调用 AskUserQuestion 工具时，在聊天面板输入框上方弹出问答面板，用户选择或输入答案后 Agent 继续执行。

**Architecture:** 服务端在 agent-service 的 sendMessage 循环中拦截 AskUserQuestion tool_use 事件，通过 SSE 广播 `agent.question` 事件给客户端，然后暂停等待用户回答（pending Promise）。客户端 Zustand store 识别该事件并设置 pendingQuestion 状态，AskUserQuestionPanel 组件渲染在 sticky 区域（TodoBar 下方）。用户回答后通过 API 回传，服务端 resolve Promise 并将答案作为新消息发送给 Agent 继续执行。

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, SSE, Hono (server)

---

### Task 1: 共享类型定义

**Files:**
- Modify: `packages/shared/src/types/agent.ts`

- [ ] **Step 1: 在 agent.ts 中添加 AskUserQuestion 相关类型**

在文件末尾添加以下类型定义：

```typescript
export interface QuestionOption {
  label: string;
  description?: string;
  preview?: string;
}

export interface QuestionData {
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect: boolean;
}

export interface PendingQuestion {
  toolUseId: string;
  question: QuestionData;
}
```

同时，扩展 `AgentStreamEvent` 的 `type` 字段，添加 `'agent.question'`：

找到 `AgentStreamEvent` 接口定义，将 `type` 字段修改为：

```typescript
type: 'agent.thinking' | 'agent.text' | 'agent.tool_use' | 'agent.tool_result' | 'agent.error' | 'agent.done' | 'agent.question';
```

同时在 `AgentStreamEvent` 中添加可选字段（与 agent.question 事件一起使用）：

```typescript
tool_use_id?: string;
question?: QuestionData;
```

- [ ] **Step 2: 确认 shared 包导出新类型**

检查 `packages/shared/src/index.ts`（或主入口文件），确保 `QuestionOption`、`QuestionData`、`PendingQuestion` 被导出。

- [ ] **Step 3: 提交**

```bash
git add packages/shared/src/types/agent.ts packages/shared/src/index.ts
git commit -m "feat: add AskUserQuestion types to shared package"
```

---

### Task 2: 服务端 — 适配器改动

**Files:**
- Modify: `apps/server/src/lib/claude-code-adapter.ts`

- [ ] **Step 1: 在 DEFAULT_ALLOWED_TOOLS 中添加 AskUserQuestion**

在 `claude-code-adapter.ts` 第 17-20 行的 `DEFAULT_ALLOWED_TOOLS` 数组中添加 `'AskUserQuestion'`：

```typescript
const DEFAULT_ALLOWED_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent',
  'TodoWrite', 'AskUserQuestion',
];
```

- [ ] **Step 2: 在 tool_use 事件中传递 tool_use_id**

当前适配器在 yield `agent.tool_use` 事件时不包含 `block.id`（即 tool_use_id）。AskUserQuestion 需要这个 ID 来匹配问答。

找到 yield tool_use 事件的位置（约第 146 行，非嵌套 Agent 的情况）：

```typescript
yield { type: 'agent.tool_use', tool: toolName, input: toolInput };
```

替换为：

```typescript
yield { type: 'agent.tool_use', tool: toolName, input: toolInput, tool_use_id: toolUseId };
```

注意：这需要 `AgentStreamEvent` 类型中有 `tool_use_id` 字段，已在 Task 1 中添加。

- [ ] **Step 3: 提交**

```bash
git add apps/server/src/lib/claude-code-adapter.ts
git commit -m "feat: add AskUserQuestion to allowed tools and include tool_use_id in events"
```

---

### Task 3: 服务端 — agent-service 拦截与 pending answer 管理

**Files:**
- Modify: `apps/server/src/lib/agent-service.ts`

- [ ] **Step 1: 添加 pending answers 管理器**

在 `AgentService` 类中添加一个 `pendingAnswers` Map 和相关方法。在 `agents` 属性声明之后（约第 37 行）添加：

```typescript
private pendingAnswers = new Map<string, {
  resolve: (answer: string | string[]) => void;
  question: QuestionData;
}>();
```

同时在文件顶部导入新类型：

```typescript
import type { AgentStreamEvent, AgentInfo, CreateAgentRequest, CreateAgentResponse, AgentStatus, QuestionData } from '@harnesson/shared';
```

- [ ] **Step 2: 添加 submitAnswer 方法**

在 `AgentService` 类中，`abort` 方法之后添加新方法：

```typescript
submitAnswer(agentId: string, answer: string | string[]): boolean {
  const pending = this.pendingAnswers.get(agentId);
  if (!pending) return false;
  pending.resolve(answer);
  this.pendingAnswers.delete(agentId);
  return true;
}

getPendingQuestion(agentId: string): QuestionData | undefined {
  return this.pendingAnswers.get(agentId)?.question;
}
```

- [ ] **Step 3: 修改 sendMessage 方法，拦截 AskUserQuestion**

将 `sendMessage` 方法中第 109-136 行的 `for await` 循环替换为以下逻辑。核心改动是：检测到 AskUserQuestion tool_use 后，广播事件、暂停等待用户回答、然后以答案作为新消息继续。

找到 `agent.messageQueue = agent.messageQueue.then(async () => {` 内部的 `for await` 循环，将整个 try 块替换为：

```typescript
try {
  for await (const event of agent.adapter.sendMessage(agentId, message)) {
    // 检测 AskUserQuestion tool_use
    if (
      event.type === 'agent.tool_use' &&
      event.tool === 'AskUserQuestion' &&
      event.input
    ) {
      const questions = event.input.questions as Array<Record<string, unknown>> | undefined;
      const q = questions?.[0];
      if (!q) {
        this.broadcast(agentId, event);
        continue;
      }

      const questionData: QuestionData = {
        question: String(q.question ?? ''),
        header: String(q.header ?? ''),
        options: (q.options as Array<Record<string, unknown>> | undefined)?.map((o) => ({
          label: String(o.label ?? ''),
          description: o.description ? String(o.description) : undefined,
          preview: o.preview ? String(o.preview) : undefined,
        })) ?? [],
        multiSelect: q.multiSelect === true,
      };

      const toolUseId = event.tool_use_id ?? crypto.randomUUID();

      // 广播 tool_use 事件（消息历史）
      this.broadcast(agentId, event);

      // 广播 agent.question 事件（触发弹窗）
      this.broadcast(agentId, {
        type: 'agent.question',
        tool_use_id: toolUseId,
        question: questionData,
      } as unknown as AgentStreamEvent);

      // 中止当前流
      agent.adapter.abort(agentId);

      // 等待用户回答
      agent.status = 'waiting_for_input';
      const answer = await new Promise<string | string[]>((resolve) => {
        this.pendingAnswers.set(agentId, { resolve, question: questionData });
      });

      // 用户已回答，清除 pending 状态
      this.pendingAnswers.delete(agentId);

      // 广播 agent.done 表示当前轮结束
      this.broadcast(agentId, {
        type: 'agent.done',
      });

      // 将答案作为新消息发送给 Agent
      const answerStr = Array.isArray(answer) ? answer.join(', ') : answer;
      const contextMsg = `[User answered question: "${questionData.question}"]\nAnswer: ${answerStr}`;

      agent.status = 'running';
      agent.error = undefined;
      this.broadcast(agentId, { type: 'agent.thinking', text: '' });

      for await (const answerEvent of agent.adapter.sendMessage(agentId, contextMsg)) {
        this.broadcast(agentId, answerEvent);
        if (answerEvent.type === 'agent.done') {
          agent.tokenUsage = answerEvent.tokenUsage ?? agent.tokenUsage;
        }
        if (answerEvent.type === 'agent.error') {
          agent.error = answerEvent.message;
        }
      }

      agent.status = agent.error ? 'error' : 'idle';
      if (agent.status === 'idle') {
        agent.error = undefined;
      }
      return;
    }

    this.broadcast(agentId, event);

    if (event.type === 'agent.done') {
      agent.tokenUsage = event.tokenUsage ?? agent.tokenUsage;
    }
    if (event.type === 'agent.error') {
      agent.error = event.message;
    }
  }

  agent.status = agent.error ? 'error' : 'idle';
  if (agent.status === 'idle') {
    agent.error = undefined;
  }
}
```

- [ ] **Step 4: 在 destroy 方法中清理 pending answers**

在 `destroy` 方法（第 161-173 行）中，在 `agent.adapter.abort(agentId)` 之后添加：

```typescript
// 清理 pending answers
const pending = this.pendingAnswers.get(agentId);
if (pending) {
  pending.resolve(''); // resolve with empty to unblock
  this.pendingAnswers.delete(agentId);
}
```

- [ ] **Step 5: 提交**

```bash
git add apps/server/src/lib/agent-service.ts
git commit -m "feat: intercept AskUserQuestion in agent-service with pending answer flow"
```

---

### Task 4: 服务端 — API 端点

**Files:**
- Modify: `apps/server/src/routes/agents.ts`

- [ ] **Step 1: 添加 POST /api/agents/:id/tool-result 路由**

在 `agents.ts` 中，在 `POST /api/agents/:id/message` 路由（第 55-71 行）之后添加新路由：

```typescript
// POST /api/agents/:id/tool-result — submit answer to pending question
agentsRoute.post('/api/agents/:id/tool-result', async (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const body = await c.req.json() as { answer?: string | string[] };
  if (body.answer === undefined) return c.json({ error: 'answer is required' }, 400);

  const resolved = agentService.submitAnswer(agentId, body.answer);
  if (!resolved) return c.json({ error: 'No pending question' }, 404);

  return c.json({ ok: true });
});
```

- [ ] **Step 2: 提交**

```bash
git add apps/server/src/routes/agents.ts
git commit -m "feat: add POST /api/agents/:id/tool-result endpoint"
```

---

### Task 5: 客户端 — agentStore 扩展

**Files:**
- Modify: `apps/web/src/stores/agentStore.ts`

- [ ] **Step 1: 添加 pendingQuestion 状态**

在 `AgentState` 接口中，`todos` 属性之后添加：

```typescript
pendingQuestion: Record<string, import('@harnesson/shared').PendingQuestion | null>;
```

在 store 创建时（`create` 函数的初始状态中），添加初始值：

```typescript
pendingQuestion: {},
```

- [ ] **Step 2: 添加 submitQuestionAnswer action**

在 `AgentState` 接口的 methods 区域添加：

```typescript
submitQuestionAnswer: (agentId: string, answer: string | string[]) => Promise<void>;
```

在 store 实现中添加该 action：

```typescript
submitQuestionAnswer: async (agentId, answer) => {
  const pending = get().pendingQuestion[agentId];
  if (!pending) return;

  try {
    await fetch(`/api/agents/${encodeURIComponent(agentId)}/tool-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer,
      }),
    });
  } catch {
    // 网络错误时仍然清除 pending 状态
  }

  set((s) => ({
    pendingQuestion: {
      ...s.pendingQuestion,
      [agentId]: null,
    },
  }));
},
```

- [ ] **Step 3: 在 appendStreamEvent 中处理 agent.question 事件**

在 `appendStreamEvent` 方法中，在 TodoWrite 处理逻辑之前（约第 172 行），添加 agent.question 事件处理：

```typescript
// 处理 AskUserQuestion 事件
if (event.type === 'agent.question') {
  const questionData = event.question as unknown as import('@harnesson/shared').QuestionData;
  const toolUseId = (event as Record<string, unknown>).tool_use_id as string;
  if (questionData && toolUseId) {
    set((s) => ({
      pendingQuestion: {
        ...s.pendingQuestion,
        [agentId]: {
          toolUseId,
          question: questionData,
        },
      },
    }));
  }
  return;
}
```

- [ ] **Step 4: 在 connectSSE 中添加 agent.question 事件监听**

在 `connectSSE` 方法中，`eventTypes` 数组（约第 255-262 行）添加 `'agent.question'`：

```typescript
const eventTypes = [
  'agent.thinking',
  'agent.text',
  'agent.tool_use',
  'agent.tool_result',
  'agent.error',
  'agent.done',
  'agent.question',
];
```

- [ ] **Step 5: 提交**

```bash
git add apps/web/src/stores/agentStore.ts
git commit -m "feat: add pendingQuestion state and agent.question event handling to agentStore"
```

---

### Task 6: 客户端 — AskUserQuestionPanel 组件

**Files:**
- Create: `apps/web/src/components/chat/AskUserQuestionPanel.tsx`

- [ ] **Step 1: 创建 AskUserQuestionPanel 组件**

创建文件 `apps/web/src/components/chat/AskUserQuestionPanel.tsx`，内容如下：

```tsx
import { useState } from 'react';
import type { QuestionData, QuestionOption } from '@harnesson/shared';

interface AskUserQuestionPanelProps {
  question: QuestionData;
  onSubmit: (answer: string | string[]) => void;
}

export function AskUserQuestionPanel({ question, onSubmit }: AskUserQuestionPanelProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [customAnswer, setCustomAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return null;

  const hasPreview = question.options.some((o) => o.preview);
  const hasDescription = question.options.some((o) => o.description);

  function handleSingleSelect(label: string) {
    setSubmitted(true);
    onSubmit(label);
  }

  function handleToggleOption(label: string) {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleMultiConfirm() {
    if (selectedOptions.size === 0) return;
    setSubmitted(true);
    onSubmit(Array.from(selectedOptions));
  }

  function handleCustomSubmit() {
    const trimmed = customAnswer.trim();
    if (!trimmed) return;
    setSubmitted(true);
    onSubmit(trimmed);
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
  }

  return (
    <div className="ml-[68px] mr-3 mb-2 rounded-[10px] border border-[#2a2a4e] bg-[#16162e] p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-harness-accent">
          <span className="text-[11px] font-bold text-white">?</span>
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-harness-accent">
          {question.header}
        </span>
      </div>

      {/* Question */}
      <div className="mb-3.5 text-sm leading-relaxed text-[#e0e0f0]">{question.question}</div>

      {/* Options */}
      {hasPreview ? (
        <PreviewLayout
          options={question.options}
          multiSelect={question.multiSelect}
          selected={selectedOptions}
          onSelect={question.multiSelect ? handleToggleOption : (label) => handleSingleSelect(label)}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {question.options.map((opt) => (
            <OptionItem
              key={opt.label}
              option={opt}
              multiSelect={question.multiSelect}
              selected={question.multiSelect ? selectedOptions.has(opt.label) : false}
              onSelect={question.multiSelect ? () => handleToggleOption(opt.label) : () => handleSingleSelect(opt.label)}
              showDescription={hasDescription}
            />
          ))}
        </div>
      )}

      {/* Multi-select confirm button */}
      {question.multiSelect && (
        <button
          onClick={handleMultiConfirm}
          disabled={selectedOptions.size === 0}
          className="mt-3 rounded-lg bg-harness-accent px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-40"
        >
          确认
        </button>
      )}

      {/* Custom input */}
      <div className="mt-3 border-t border-[#2a2a4e] pt-2.5">
        <div className="mb-1.5 text-xs text-gray-500">自定义回答</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customAnswer}
            onChange={(e) => setCustomAnswer(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="输入你的答案..."
            className="flex-1 rounded-md border border-[#3a3a5c] bg-[#0d0d1a] px-3 py-2 text-[13px] text-[#e0e0f0] outline-none placeholder:text-gray-600 focus:border-harness-accent"
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customAnswer.trim()}
            className="rounded-md bg-harness-accent px-4 py-2 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-40"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionItem({
  option,
  multiSelect,
  selected,
  onSelect,
  showDescription,
}: {
  option: QuestionOption;
  multiSelect: boolean;
  selected: boolean;
  onSelect: () => void;
  showDescription: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? 'border-harness-accent bg-[#1e1e3a]'
          : 'border-[#2a2a4e] bg-[#1a1a2e] hover:border-[#3a3a5c]'
      }`}
    >
      <div className="flex items-center gap-2">
        {multiSelect ? (
          <span className={`text-sm ${selected ? 'text-harness-accent' : 'text-gray-500'}`}>
            {selected ? '☑' : '☐'}
          </span>
        ) : (
          <div
            className={`h-4 w-4 rounded-full border-2 ${
              selected ? 'border-harness-accent' : 'border-[#4a4a6e]'
            } flex items-center justify-center`}
          >
            {selected && <div className="h-2 w-2 rounded-full bg-harness-accent" />}
          </div>
        )}
        <span className={`text-sm font-medium ${selected ? 'text-[#e0e0f0]' : 'text-[#c0c0e0]'}`}>
          {option.label}
        </span>
      </div>
      {showDescription && option.description && (
        <div className="mt-1 ml-6 text-xs text-gray-500">{option.description}</div>
      )}
    </button>
  );
}

function PreviewLayout({
  options,
  multiSelect,
  selected,
  onSelect,
}: {
  options: QuestionOption[];
  multiSelect: boolean;
  selected: Set<string>;
  onSelect: (label: string) => void;
}) {
  const [previewContent, setPreviewContent] = useState<string>(options[0]?.preview ?? '');

  return (
    <div className="flex gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              onSelect(opt.label);
              if (opt.preview) setPreviewContent(opt.preview);
            }}
            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
              selected.has(opt.label)
                ? 'border-harness-accent bg-[#1e1e3a]'
                : 'border-[#2a2a4e] bg-[#1a1a2e] hover:border-[#3a3a5c]'
            }`}
          >
            <div className="flex items-center gap-2">
              {multiSelect ? (
                <span className={`text-sm ${selected.has(opt.label) ? 'text-harness-accent' : 'text-gray-500'}`}>
                  {selected.has(opt.label) ? '☑' : '☐'}
                </span>
              ) : (
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    selected.has(opt.label) ? 'border-harness-accent' : 'border-[#4a4a6e]'
                  } flex items-center justify-center`}
                >
                  {selected.has(opt.label) && <div className="h-2 w-2 rounded-full bg-harness-accent" />}
                </div>
              )}
              <span className={`text-sm font-medium ${selected.has(opt.label) ? 'text-[#e0e0f0]' : 'text-[#c0c0e0]'}`}>
                {opt.label}
              </span>
            </div>
            {opt.description && <div className="mt-1 ml-6 text-xs text-gray-500">{opt.description}</div>}
          </button>
        ))}
      </div>
      {previewContent && (
        <div className="flex-1 rounded-lg border border-[#3a3a5c] bg-[#16162a] p-3 font-mono text-xs text-[#a0a0c0]">
          <div className="mb-2 text-gray-600">Preview:</div>
          <pre className="whitespace-pre-wrap">{previewContent}</pre>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/web/src/components/chat/AskUserQuestionPanel.tsx
git commit -m "feat: create AskUserQuestionPanel component with all option types"
```

---

### Task 7: 客户端 — AgentPanel 集成

**Files:**
- Modify: `apps/web/src/components/layout/AgentPanel.tsx`

- [ ] **Step 1: 导入 AskUserQuestionPanel**

在 AgentPanel.tsx 文件顶部的导入区域添加：

```typescript
import { AskUserQuestionPanel } from '../chat/AskUserQuestionPanel';
```

- [ ] **Step 2: 从 store 读取 pendingQuestion 状态**

在 AgentPanel 组件中，找到其他 store 状态读取的位置（如 `todos` 和 `isStreaming`），添加：

```typescript
const pendingQuestion = useAgentStore((s) => s.pendingQuestion[agent.id]);
const hasPendingQuestion = pendingQuestion !== null && pendingQuestion !== undefined;
```

- [ ] **Step 3: 修改 sticky 区域渲染逻辑**

找到现有的 sticky 容器（约第 152-157 行）：

```tsx
{(isStreaming || (todos && todos.length > 0)) && (
  <div className="sticky bottom-0 bg-harness-chat pt-1 pb-2">
    {isStreaming && <ThinkingBar />}
    {todos && todos.length > 0 && <TodoBar todos={todos} />}
  </div>
)}
```

替换为：

```tsx
{(isStreaming || (todos && todos.length > 0) || hasPendingQuestion) && (
  <div className="sticky bottom-0 bg-harness-chat pt-1 pb-2">
    {isStreaming && !hasPendingQuestion && <ThinkingBar />}
    {todos && todos.length > 0 && <TodoBar todos={todos} />}
    {hasPendingQuestion && (
      <AskUserQuestionPanel
        question={pendingQuestion.question}
        onSubmit={(answer) =>
          useAgentStore.getState().submitQuestionAnswer(agent.id, answer)
        }
      />
    )}
  </div>
)}
```

- [ ] **Step 4: 隐藏输入框当有 pending question 时**

找到输入框区域（约第 175 行开始的 `<div className="px-3 pb-3 ...">`），在该 div 前添加条件：

```tsx
{!hasPendingQuestion && (
  <div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
    {/* 现有的输入框内容保持不变 */}
  </div>
)}
```

确保输入框区域的闭合 `</div>` 后有对应的 `)}`。

- [ ] **Step 5: 提交**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx
git commit -m "feat: integrate AskUserQuestionPanel into AgentPanel with conditional rendering"
```

---

### Task 8: 客户端 — toolCardMap 注册 AskUserQuestionCard

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx`
- Modify: `apps/web/src/components/chat/tool-cards/ToolEventCard.tsx`

- [ ] **Step 1: 创建 AskUserQuestionCard 组件**

创建文件 `apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx`：

```tsx
import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function AskUserQuestionCard({ event }: { event: PairedToolEvent }) {
  const questions = event.input?.questions as Array<Record<string, unknown>> | undefined;
  const question = questions?.[0];
  const header = question ? String(question.header ?? '') : '';
  const answer = event.output ?? '';

  return (
    <CollapsibleCard
      icon={<span className="text-harness-accent">?</span>}
      summary={<span className="font-medium text-gray-400">AskUserQuestion{header ? `: ${header}` : ''}</span>}
      isRunning={!event.output}
    >
      {question && (
        <div className="mb-1 text-[11px] text-gray-500">{String(question.question ?? '')}</div>
      )}
      {answer && (
        <div>
          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">回答</div>
          <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{answer.slice(0, 500)}</pre>
        </div>
      )}
    </CollapsibleCard>
  );
}
```

- [ ] **Step 2: 注册到 toolCardMap**

在 `ToolEventCard.tsx` 中：

添加导入：

```typescript
import { AskUserQuestionCard } from './AskUserQuestionCard';
```

修改 `toolCardMap`：

```typescript
const toolCardMap: Record<string, ComponentType<{ event: PairedToolEvent }>> = {
  Glob: GlobCard,
  Grep: GrepCard,
  Read: ReadCard,
  Write: WriteCard,
  Edit: EditCard,
  Bash: BashCard,
  LSP: LSPCard,
  Agent: AgentCard,
  AskUserQuestion: AskUserQuestionCard,
};
```

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx apps/web/src/components/chat/tool-cards/ToolEventCard.tsx
git commit -m "feat: add AskUserQuestionCard to toolCardMap for message history"
```

---

### Task 9: 手动集成测试

- [ ] **Step 1: 启动开发服务器**

```bash
cd /Users/dt_flys/Projects/harnesson && npm run dev
```

- [ ] **Step 2: 测试基本弹窗功能**

1. 创建一个新 Agent 会话
2. 发送消息触发 Agent 调用 AskUserQuestion（例如："请问我应该用哪种方式实现？"）
3. 验证：
   - 聊天输入框被隐藏
   - ThinkingBar 被隐藏
   - 弹窗显示在 TodoBar 下方（如有 todos）
   - 弹窗显示问题文本和选项
   - 弹窗底部有"自定义回答"输入框

- [ ] **Step 3: 测试单选交互**

1. 点击一个选项
2. 验证：
   - 弹窗立即消失
   - 输入框恢复显示
   - Agent 继续执行

- [ ] **Step 4: 测试自定义输入**

1. 再次触发 AskUserQuestion
2. 在"自定义回答"输入框输入文字
3. 点击"提交"按钮
4. 验证：答案被发送，Agent 继续

- [ ] **Step 5: 测试消息历史**

1. 检查消息流中是否显示 AskUserQuestion 工具卡片
2. 验证卡片显示问题标签和用户回答摘要

- [ ] **Step 6: 提交最终测试修复（如有）**

```bash
git add -A
git commit -m "fix: address integration test issues for AskUserQuestion"
```
