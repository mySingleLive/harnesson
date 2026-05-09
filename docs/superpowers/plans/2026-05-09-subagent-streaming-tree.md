# Subagent 实时树形展示 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Subagent 调用从完成后一次性展示改为实时流式树形展示，用户可看到子代理执行过程中的工具调用和文本输出。

**Architecture:** 服务端 adapter 移除事件缓冲，改为流式发出带 `parentToolUseId`/`depth` 的扁平事件。客户端新增 `buildEventTree` 纯函数将扁平事件构建为树结构，新 `StreamingAgentCard` 组件递归渲染树形 UI，支持运行/完成/错误/等待四种状态样式。

**Tech Stack:** TypeScript, React, Vitest, SSE, @anthropic-ai/claude-agent-sdk

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/server/src/lib/claude-code-adapter.ts` | Modify | 移除缓冲逻辑，流式发出子事件 |
| `apps/web/src/components/chat/tool-cards/buildEventTree.ts` | Create | `buildEventTree` 纯函数 + `TreeSegment` 类型 |
| `apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx` | Create | 实时树形 Agent 卡片组件 |
| `apps/web/src/components/chat/MessageRenderer.tsx` | Modify | 切换到 `buildEventTree`，递归渲染 |
| `apps/web/src/components/chat/tool-cards/AgentCard.tsx` | Delete | 被 `StreamingAgentCard` 替代 |
| `apps/web/src/components/chat/tool-cards/AgentEventTree.tsx` | Delete | 逻辑合并入 `StreamingAgentCard` |
| `apps/web/src/components/chat/tool-cards/index.ts` | Modify | 更新导出 |
| `apps/web/src/components/chat/tool-cards/segmentEvents.ts` | Keep | 保留不变，`buildEventTree` 独立实现 |

---

### Task 1: 新增 `buildEventTree` 纯函数

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/buildEventTree.ts`
- Create: `apps/web/src/components/chat/tool-cards/buildEventTree.test.ts`

- [ ] **Step 1: 创建 `TreeSegment` 类型和 `buildEventTree` 函数**

```typescript
// apps/web/src/components/chat/tool-cards/buildEventTree.ts

import type { AgentStreamEvent } from '@harnesson/shared';
import type { PairedToolEvent } from './pairEvents';

export interface TreeSegment {
  type: 'text' | 'tool' | 'qa-result';
  content?: string;
  event?: PairedToolEvent;
  question?: string;
  answer?: string;
  children?: TreeSegment[];
}

interface SubEventShape {
  tool: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
  duration?: number;
  subEvents?: SubEventShape[];
  subTexts?: string[];
}

/** 检测并展开旧格式嵌套 JSON（历史数据兼容） */
function expandLegacyNested(events: AgentStreamEvent[]): AgentStreamEvent[] {
  const result: AgentStreamEvent[] = [];

  for (const event of events) {
    result.push(event);

    if (
      event.type === 'agent.tool_result' &&
      event.tool === 'Agent' &&
      event.output
    ) {
      let parsed: SubEventShape | undefined;
      try {
        parsed = JSON.parse(event.output);
      } catch {
        continue;
      }

      if (!parsed.subEvents && !parsed.subTexts) continue;

      // 获取对应 tool_use 的 id 作为 parentToolUseId
      const agentToolUseId = event.tool_use_id;

      // 替换 output 为实际文本
      result[result.length - 1] = {
        ...event,
        output: parsed.textOutput ?? event.output,
      };

      // 展开子文本
      for (const text of parsed.subTexts ?? []) {
        result.push({
          type: 'agent.text',
          text,
          parentToolUseId: agentToolUseId,
          depth: (event.depth ?? 0) + 1,
        });
      }

      // 展开子工具事件
      for (const sub of parsed.subEvents ?? []) {
        result.push({
          type: 'agent.tool_use',
          tool: sub.tool,
          input: sub.input ?? {},
          parentToolUseId: agentToolUseId,
          depth: (event.depth ?? 0) + 1,
        });
        result.push({
          type: 'agent.tool_result',
          tool: sub.tool,
          output: sub.output,
          isError: sub.isError,
          duration: sub.duration,
          parentToolUseId: agentToolUseId,
          depth: (event.depth ?? 0) + 1,
        });
      }
    }
  }

  return result;
}

/** 按 parentToolUseId 分组事件 */
function partitionByParent(events: AgentStreamEvent[]): Map<string | null, AgentStreamEvent[]> {
  const groups = new Map<string | null, AgentStreamEvent[]>();
  groups.set(null, []);

  for (const event of events) {
    const key = event.parentToolUseId ?? null;
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(event);
  }

  return groups;
}

/** 对一组扁平事件执行配对和分段 */
function segmentGroup(events: AgentStreamEvent[]): TreeSegment[] {
  const segments: TreeSegment[] = [];
  let textBuffer = '';
  const pendingTools: Array<{ tool: string; input: Record<string, unknown>; tool_use_id?: string }> = [];

  function flushText() {
    if (textBuffer) {
      segments.push({ type: 'text', content: textBuffer });
      textBuffer = '';
    }
  }

  for (const event of events) {
    if (event.type === 'agent.text') {
      if (event.text) textBuffer += event.text;
    } else if (event.type === 'agent.tool_use') {
      if (event.tool === 'TodoWrite') continue;
      flushText();
      pendingTools.push({ tool: event.tool ?? 'unknown', input: event.input ?? {}, tool_use_id: event.tool_use_id });
    } else if (event.type === 'agent.tool_result') {
      flushText();

      if (event.tool === 'AskUserQuestion') {
        const paired = pendingTools.find(p => p.tool === 'AskUserQuestion');
        const questions = paired?.input?.questions as Array<Record<string, unknown>> | undefined;
        const question = String(questions?.[0]?.question ?? '');
        const idx = pendingTools.findIndex(p => p.tool === 'AskUserQuestion');
        if (idx >= 0) pendingTools.splice(idx, 1);
        segments.push({ type: 'qa-result', question, answer: String(event.output ?? '') });
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
  }

  flushText();
  for (const { tool, input } of pendingTools) {
    segments.push({ type: 'tool', event: { tool, input } });
  }

  return segments;
}

/** 将扁平事件列表构建为树形结构 */
export function buildEventTree(events: AgentStreamEvent[]): TreeSegment[] {
  const expanded = expandLegacyNested(events);
  const groups = partitionByParent(expanded);

  // 构建根层 segments
  const rootEvents = groups.get(null) ?? [];
  const rootSegments = segmentGroup(rootEvents);

  // 为每个 Agent ToolSegment 填充 children
  function fillChildren(segments: TreeSegment[]): TreeSegment[] {
    return segments.map(seg => {
      if (seg.type === 'tool' && seg.event?.tool === 'Agent' && seg.event.input) {
        // 从配对的 tool_use 事件中获取 tool_use_id
        // 需要找到对应的原始 tool_use 事件来获取 tool_use_id
        const childGroup = findChildGroup(seg, rootEvents, groups);
        if (childGroup && childGroup.length > 0) {
          return { ...seg, children: fillChildren(segmentGroup(childGroup)) };
        }
      }
      return seg;
    });
  }

  return fillChildren(rootSegments);
}

function findChildGroup(
  _seg: TreeSegment,
  _rootEvents: AgentStreamEvent[],
  groups: Map<string | null, AgentStreamEvent[]>
): AgentStreamEvent[] | undefined {
  // 在 rootEvents 中找到对应的 Agent tool_use 事件的 tool_use_id
  // 然后用该 id 查找子事件组
  for (const [key, group] of groups) {
    if (key === null) continue;
    // 检查这个 group 的事件的 parentToolUseId 是否对应某个 Agent tool_use
    if (group.length > 0) {
      const parentId = group[0].parentToolUseId;
      if (parentId) {
        // 在 rootEvents 中查找对应的 Agent tool_use
        const hasAgentToolUse = _rootEvents.some(
          e => e.type === 'agent.tool_use' && e.tool === 'Agent' && e.tool_use_id === parentId
        );
        if (hasAgentToolUse) {
          return group;
        }
      }
    }
  }
  return undefined;
}
```

- [ ] **Step 2: 创建测试文件**

```typescript
// apps/web/src/components/chat/tool-cards/buildEventTree.test.ts

import { describe, it, expect } from 'vitest';
import type { AgentStreamEvent } from '@harnesson/shared';
import { buildEventTree } from './buildEventTree';

describe('buildEventTree', () => {
  it('returns empty array for empty events', () => {
    expect(buildEventTree([])).toEqual([]);
  });

  it('segments root-level text events', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.text', text: 'Hello ' },
      { type: 'agent.text', text: 'world' },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0]).toEqual({ type: 'text', content: 'Hello world' });
  });

  it('pairs root-level tool_use and tool_result', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.tool_use', tool: 'Read', input: { file: 'a.ts' }, tool_use_id: 'r1' },
      { type: 'agent.tool_result', tool: 'Read', output: 'file content', duration: 100 },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('tool');
    expect(tree[0].event?.tool).toBe('Read');
    expect(tree[0].event?.output).toBe('file content');
  });

  it('builds children for Agent tool with parentToolUseId events', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.text', text: 'I will use an agent' },
      { type: 'agent.tool_use', tool: 'Agent', input: { description: 'explore' }, tool_use_id: 'agent-1' },
      { type: 'agent.text', text: 'sub text', parentToolUseId: 'agent-1', depth: 1 },
      { type: 'agent.tool_use', tool: 'Read', input: { file: 'b.ts' }, tool_use_id: 'r1', parentToolUseId: 'agent-1', depth: 1 },
      { type: 'agent.tool_result', tool: 'Read', output: 'content', parentToolUseId: 'agent-1', depth: 1 },
      { type: 'agent.tool_result', tool: 'Agent', output: 'done' },
    ];
    const tree = buildEventTree(events);
    // Root: text + Agent tool
    expect(tree).toHaveLength(2);
    expect(tree[0].type).toBe('text');
    expect(tree[0].content).toBe('I will use an agent');
    expect(tree[1].type).toBe('tool');
    expect(tree[1].event?.tool).toBe('Agent');
    // Agent has children
    expect(tree[1].children).toBeDefined();
    expect(tree[1].children).toHaveLength(2);
    expect(tree[1].children![0].type).toBe('text');
    expect(tree[1].children![0].content).toBe('sub text');
    expect(tree[1].children![1].type).toBe('tool');
    expect(tree[1].children![1].event?.tool).toBe('Read');
  });

  it('expands legacy nested JSON format for backward compat', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.tool_use', tool: 'Agent', input: { description: 'test' }, tool_use_id: 'agent-old' },
      {
        type: 'agent.tool_result',
        tool: 'Agent',
        output: JSON.stringify({
          textOutput: 'final result',
          subTexts: ['thinking...'],
          subEvents: [
            { tool: 'Glob', input: { pattern: '**/*.ts' }, output: 'a.ts\nb.ts', duration: 50 },
          ],
        }),
        tool_use_id: 'agent-old',
      },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].event?.tool).toBe('Agent');
    // output 应该是 textOutput，不是嵌套 JSON
    expect(tree[0].event?.output).toBe('final result');
    // 应该有展开的 children
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children![0].type).toBe('text');
    expect(tree[0].children![0].content).toBe('thinking...');
    expect(tree[0].children![1].type).toBe('tool');
    expect(tree[0].children![1].event?.tool).toBe('Glob');
  });

  it('skips TodoWrite events', () => {
    const events: AgentStreamEvent[] = [
      { type: 'agent.tool_use', tool: 'TodoWrite', input: { todos: [] }, tool_use_id: 'tw1' },
      { type: 'agent.text', text: 'hello' },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('text');
  });

  it('handles qa-result from AskUserQuestion', () => {
    const events: AgentStreamEvent[] = [
      {
        type: 'agent.tool_use',
        tool: 'AskUserQuestion',
        input: { questions: [{ question: 'Pick one?' }] },
        tool_use_id: 'q1',
      },
      { type: 'agent.tool_result', tool: 'AskUserQuestion', output: 'Option A' },
    ];
    const tree = buildEventTree(events);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('qa-result');
    expect(tree[0].question).toBe('Pick one?');
    expect(tree[0].answer).toBe('Option A');
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `cd apps/web && npx vitest run src/components/chat/tool-cards/buildEventTree.test.ts`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/buildEventTree.ts apps/web/src/components/chat/tool-cards/buildEventTree.test.ts
git commit -m "feat: add buildEventTree function with legacy compat and tests"
```

---

### Task 2: 服务端 Adapter 移除缓冲，流式发出子事件

**Files:**
- Modify: `apps/server/src/lib/claude-code-adapter.ts`

- [ ] **Step 1: 重构 `sendMessage` 方法**

替换 `claude-code-adapter.ts` 中 `sendMessage` 方法的核心循环逻辑。关键改动：

1. 移除 `pairSubEvents` 函数（第 6-16 行）
2. 移除 `subEventBuffers` 变量和所有缓冲逻辑（第 144 行及后续使用处）
3. 修改事件处理：子代理内部事件直接 yield，附带 `parentToolUseId` 和 `depth`

将 `sendMessage` 方法中 `for await (const sdkMessage of messageStream)` 循环的内容替换为：

```typescript
      const toolNameById = new Map<string, string>();
      const agentStack: string[] = [];

      function currentParent(): string | undefined {
        return agentStack.length > 0 ? agentStack[agentStack.length - 1] : undefined;
      }

      function currentDepth(): number {
        return agentStack.length;
      }

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
                const parent = currentParent();
                if (parent) {
                  yield { type: 'agent.text', text: block.text, parentToolUseId: parent, depth: currentDepth() };
                } else {
                  yield { type: 'agent.text', text: block.text };
                }
              } else if (block.type === 'tool_use') {
                const toolName = block.name as string;
                const toolInput = block.input as Record<string, unknown>;
                const toolUseId = typeof block.id === 'string' ? block.id : '';

                if (toolUseId) {
                  toolNameById.set(toolUseId, toolName);
                }

                const parent = currentParent();

                if (toolName === 'Agent') {
                  agentStack.push(toolUseId);
                }

                // TodoWrite: yield immediately at root level for real-time UI updates
                if (toolName === 'TodoWrite') {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput, tool_use_id: toolUseId };
                } else if (parent) {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput, tool_use_id: toolUseId, parentToolUseId: parent, depth: currentDepth() };
                } else {
                  yield { type: 'agent.tool_use', tool: toolName, input: toolInput, tool_use_id: toolUseId };
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

                const parent = currentParent();

                if (toolName === 'Agent') {
                  // Pop the finished agent from stack
                  if (agentStack.length > 0 && agentStack[agentStack.length - 1] === toolId) {
                    agentStack.pop();
                  }

                  const newParent = currentParent();
                  if (newParent) {
                    yield {
                      type: 'agent.tool_result',
                      tool: 'Agent',
                      output,
                      isError,
                      parentToolUseId: newParent,
                      depth: currentDepth(),
                    };
                  } else {
                    yield {
                      type: 'agent.tool_result',
                      tool: 'Agent',
                      output,
                      isError,
                    };
                  }
                } else if (parent) {
                  // Subagent internal tool result
                  if (toolName === 'TodoWrite') {
                    yield { type: 'agent.tool_result', tool: toolName, output, isError };
                  } else {
                    yield {
                      type: 'agent.tool_result',
                      tool: toolName,
                      output,
                      isError,
                      parentToolUseId: parent,
                      depth: currentDepth(),
                    };
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
        } else if (msg.type === 'result') {
          if (msg.session_id && typeof msg.session_id === 'string') {
            sessionId = msg.session_id as string;
          }
        }
      }
```

- [ ] **Step 2: 删除 `pairSubEvents` 函数**

删除 `claude-code-adapter.ts` 第 6-16 行的 `pairSubEvents` 函数。

- [ ] **Step 3: 构建验证**

Run: `cd apps/server && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/lib/claude-code-adapter.ts
git commit -m "refactor: remove subagent event buffering, stream events with parentToolUseId"
```

---

### Task 3: 创建 `StreamingAgentCard` 组件

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx`

- [ ] **Step 1: 实现 StreamingAgentCard 组件**

```tsx
// apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx

import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { PairedToolEvent } from './pairEvents';
import type { TreeSegment } from './buildEventTree';
import { SingleToolEventCard } from './ToolEventCard';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type CardStatus = 'running' | 'completed' | 'error' | 'pending';

function getStatus(event?: PairedToolEvent): CardStatus {
  if (!event?.output) return 'running';
  if (event.isError) return 'error';
  return 'completed';
}

const STATUS_STYLES: Record<CardStatus, { bg: string; border: string }> = {
  running: {
    bg: 'rgba(168, 85, 247, 0.08)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
  },
  completed: {
    bg: 'rgba(74, 222, 128, 0.06)',
    border: '1px solid rgba(74, 222, 128, 0.15)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  pending: {
    bg: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
};

function StatusBadge({ status, duration }: { status: CardStatus; duration?: number }) {
  if (status === 'running') {
    return (
      <span className="flex items-center gap-1.5 text-purple-400">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
        running...
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="text-green-500">
        ✓ {duration != null ? formatDuration(duration) : ''}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="text-red-400">
        ✗ {duration != null ? formatDuration(duration) : ''}
      </span>
    );
  }
  return <span className="text-gray-600">pending</span>;
}

/** 递归渲染 TreeSegment 子节点 */
function TreeChildren({ children }: { children: TreeSegment[] }) {
  return (
    <div className="ml-5 border-l-[1.5px] border-gray-700 pl-3.5 pt-1.5 pb-0.5 space-y-1">
      {children.map((child, i) => {
        if (child.type === 'text') {
          return (
            <div key={`text-${i}`} className="flex items-start gap-1.5 py-0.5 text-[11px]">
              <span className="shrink-0 text-gray-600">💬</span>
              <span className="text-gray-400 italic line-clamp-2">{child.content?.slice(0, 200)}</span>
            </div>
          );
        }
        if (child.type === 'qa-result') {
          return (
            <div key={`qa-${i}`} className="rounded bg-blue-500/10 px-2 py-1 text-[11px] text-blue-400">
              Q: {child.question?.slice(0, 100)} → {child.answer?.slice(0, 100)}
            </div>
          );
        }
        if (child.event?.tool === 'Agent') {
          return (
            <div key={`agent-${i}`} className="py-0.5">
              <StreamingAgentCard event={child.event} children={child.children} />
            </div>
          );
        }
        return (
          <div key={`tool-${i}`} className="py-0.5">
            <SingleToolEventCard event={child.event!} />
          </div>
        );
      })}
    </div>
  );
}

interface StreamingAgentCardProps {
  event: PairedToolEvent;
  children?: TreeSegment[];
}

export function StreamingAgentCard({ event, children: treeChildren }: StreamingAgentCardProps) {
  const status = getStatus(event);
  const hasChildren = (treeChildren?.length ?? 0) > 0;
  const [open, setOpen] = useState(status === 'running');
  const [manuallyOpened, setManuallyOpened] = useState(false);
  const prevStatusRef = useRef(status);

  // 运行中自动展开，完成后自动折叠（除非用户手动展开过）
  useEffect(() => {
    if (status === 'running') {
      setOpen(true);
    } else if (prevStatusRef.current === 'running' && status !== 'running' && !manuallyOpened) {
      setOpen(false);
    }
    prevStatusRef.current = status;
  }, [status, manuallyOpened]);

  const description = (event.input?.description as string) ?? 'Agent';
  const model = event.input?.model as string | undefined;
  const style = STATUS_STYLES[status];

  const handleToggle = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      setManuallyOpened(true);
    }
  };

  return (
    <div className="overflow-hidden rounded-md" style={{ background: style.bg, border: style.border }}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] text-left hover:brightness-110 transition-all"
      >
        <span className={`transition-transform duration-200 text-gray-500 ${open ? 'rotate-90' : ''}`}>▸</span>
        <span>🤖</span>
        <span className="font-medium text-gray-400">Agent</span>
        <span className="text-gray-600">·</span>
        <span className="truncate text-gray-500">{description}</span>
        {model && (
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">{model}</span>
        )}
        <span className="ml-auto">
          <StatusBadge status={status} duration={event.duration} />
        </span>
      </button>
      {open && hasChildren && (
        <div className="border-t border-white/5 px-1 pb-1" onClick={(e) => e.stopPropagation()}>
          <TreeChildren children={treeChildren!} />
        </div>
      )}
      {open && !hasChildren && status === 'running' && (
        <div className="border-t border-white/5 px-2.5 py-2 text-[11px] text-gray-600" onClick={(e) => e.stopPropagation()}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            waiting for events...
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 构建验证**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx
git commit -m "feat: add StreamingAgentCard component with tree rendering and status styles"
```

---

### Task 4: 更新 MessageRenderer 使用 `buildEventTree`

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx`

- [ ] **Step 1: 替换 imports 和 `AgentMessageBubble` 的逻辑**

替换 `MessageRenderer.tsx` 的 imports：

```tsx
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentMessage, ImageAttachment, ContentBlock } from '@harnesson/shared';
import { buildEventTree, type TreeSegment } from './tool-cards/buildEventTree';
import { SingleToolEventCard } from './tool-cards/ToolEventCard';
import { StreamingAgentCard } from './tool-cards/StreamingAgentCard';
import { QAResultCard } from './tool-cards/QAResultCard';
import { TodoCard } from './tool-cards/TodoCard';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ImagePreview } from './ImagePreview';
```

然后更新 `AgentMessageBubble`：

```tsx
function AgentMessageBubble({ events, agentName, isStreaming }: {
  events: AgentMessage['events'];
  agentName: string;
  isStreaming: boolean;
}) {
  const tree = buildEventTree(events ?? []);

  if (tree.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div className="py-3.5 pl-10 pr-5">
      {tree.map((seg, i) => renderTreeSegment(seg, i))}
      {isStreaming && tree.length === 0 && <ThinkingIndicator />}
      {events?.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={`error-${i}`} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}

function renderTreeSegment(seg: TreeSegment, key: number): React.ReactNode {
  if (seg.type === 'text') {
    return (
      <div key={key} className="mb-5 text-[13px] leading-relaxed text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-strong:text-gray-200 prose-code:text-harness-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-300">
        <Markdown remarkPlugins={[remarkGfm]}>{seg.content ?? ''}</Markdown>
      </div>
    );
  }
  if (seg.type === 'qa-result') {
    return (
      <div key={key} className="mb-3">
        <QAResultCard question={seg.question ?? ''} answer={seg.answer ?? ''} />
      </div>
    );
  }
  if (seg.event?.tool === 'Agent') {
    return (
      <div key={key} className="mb-3">
        <StreamingAgentCard event={seg.event} children={seg.children} />
      </div>
    );
  }
  return (
    <div key={key} className="mb-3">
      <SingleToolEventCard event={seg.event!} />
    </div>
  );
}
```

旧 imports（删除这些行）：

```diff
- import { segmentEvents, SingleToolEventCard } from './tool-cards';
- import { QAResultCard } from './tool-cards/QAResultCard';
```

新 imports 已在上面的完整 import 块中包含。`UserMessage` 和 `TodoCard` 相关代码保持不变。

- [ ] **Step 2: 构建验证**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "feat: switch MessageRenderer to buildEventTree with recursive tree rendering"
```

---

### Task 5: 更新导出，清理旧文件

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/index.ts`
- Delete: `apps/web/src/components/chat/tool-cards/AgentCard.tsx`
- Delete: `apps/web/src/components/chat/tool-cards/AgentEventTree.tsx`

- [ ] **Step 1: 更新 `index.ts` 导出**

```typescript
// apps/web/src/components/chat/tool-cards/index.ts

export { ToolEventCardList, SingleToolEventCard } from './ToolEventCard';
export { segmentEvents, type Segment, type TextSegment, type ToolSegment, type QAResultSegment } from './segmentEvents';
export { buildEventTree, type TreeSegment } from './buildEventTree';
export { StreamingAgentCard } from './StreamingAgentCard';
```

- [ ] **Step 2: 删除旧文件**

```bash
rm apps/web/src/components/chat/tool-cards/AgentCard.tsx
rm apps/web/src/components/chat/tool-cards/AgentEventTree.tsx
```

- [ ] **Step 3: 检查是否有其他地方引用旧组件**

Run: `cd apps/web && grep -r "AgentCard\|AgentEventTree" src/ --include="*.ts" --include="*.tsx"`
Expected: 无引用（仅有 index.ts 和刚删的文件）

如果有残留引用，更新它们指向 `StreamingAgentCard`。

- [ ] **Step 4: 构建验证**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add -A apps/web/src/components/chat/tool-cards/
git commit -m "refactor: replace AgentCard/AgentEventTree with StreamingAgentCard, update exports"
```

---

### Task 6: 端到端验证

**Files:** 无代码改动

- [ ] **Step 1: 启动开发服务器**

```bash
cd apps/server && npm run dev
cd apps/web && npm run dev
```

- [ ] **Step 2: 验证旧消息兼容**

打开已有的 Agent 聊天记录，确认旧格式（嵌套 JSON）的 Agent 卡片仍然正确渲染为树形。

- [ ] **Step 3: 验证新消息实时展示**

发送新消息触发 Agent 执行，确认：
1. Agent tool_use 卡片立即出现（紫色 running 状态）
2. 子代理内部的工具调用实时显示
3. 子代理完成后卡片自动折叠（绿色完成状态）
4. 点击可展开查看子事件树
5. 连接线正确连接父子节点

- [ ] **Step 4: 运行全部测试**

Run: `cd apps/web && npx vitest run`
Expected: All tests pass

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "chore: subagent streaming tree display complete"
```
