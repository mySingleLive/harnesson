# Agent 聊天面板自动滚动 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Agent 聊天面板添加智能自动滚动，流式响应时自动跟随新内容，用户向上滚动时暂停并显示"滚动到底部"按钮。

**Architecture:** 创建 `useAutoScroll` hook 封装滚动逻辑，在 `AgentPanel` 中引入 hook 并添加浮动按钮。hook 通过 scroll 事件检测用户是否在底部，通过 useEffect 监听依赖变化触发自动滚动。

**Tech Stack:** React hooks, TypeScript, Tailwind CSS, Lucide icons

---

### Task 1: 创建 useAutoScroll Hook

**Files:**
- Create: `apps/web/src/hooks/useAutoScroll.ts`

- [ ] **Step 1: 创建 useAutoScroll hook**

```typescript
import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';

const BOTTOM_THRESHOLD = 80;

export function useAutoScroll(
  scrollRef: RefObject<HTMLDivElement | null>,
  deps: unknown[]
) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  const checkBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkBottom, { passive: true });
    return () => el.removeEventListener('scroll', checkBottom);
  }, [scrollRef, checkBottom]);

  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }, [scrollRef]);

  return { isAtBottom, scrollToBottom };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/hooks/useAutoScroll.ts
git commit -m "feat: add useAutoScroll hook with smart scroll detection"
```

---

### Task 2: 在 AgentPanel 中集成 hook 并添加滚动到底部按钮

**Files:**
- Modify: `apps/web/src/components/layout/AgentPanel.tsx`

- [ ] **Step 1: 添加 import 和 ref，修改滚动容器，添加按钮**

在文件顶部 import 中添加：

```typescript
import { useState, useRef } from 'react';
import { ..., ArrowDown } from 'lucide-react';  // 添加 ArrowDown
import { useAutoScroll } from '@/hooks/useAutoScroll';
```

在组件函数内，`const [showPlusMenu, setShowPlusMenu] = useState(false);` 后添加：

```typescript
const scrollRef = useRef<HTMLDivElement>(null);
const { isAtBottom, scrollToBottom } = useAutoScroll(scrollRef, [messages, isStreaming]);
```

将滚动容器（第 51 行）从：

```tsx
<div className="flex-1 overflow-y-auto">
```

改为：

```tsx
<div ref={scrollRef} className="flex-1 overflow-y-auto relative">
```

在滚动容器的 `</div>` 前面（第 65 行之前），添加滚动到底部按钮：

```tsx
{!isAtBottom && (
  <div className="sticky bottom-2 flex justify-end pr-3">
    <button
      onClick={scrollToBottom}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#252540] text-gray-400 shadow-lg transition-colors hover:text-gray-200"
    >
      <ArrowDown className="h-4 w-4" />
    </button>
  </div>
)}
```

完整的消息区域应该是：

```tsx
<div ref={scrollRef} className="flex-1 overflow-y-auto relative">
  {messages.map((msg) => (
    <MessageRenderer
      key={msg.id}
      message={msg}
      agentName={agent.name}
      isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'agent'}
    />
  ))}
  {messages.length === 0 && (
    <div className="flex h-full items-center justify-center text-[13px] text-gray-600">
      Waiting for response...
    </div>
  )}
  {!isAtBottom && (
    <div className="sticky bottom-2 flex justify-end pr-3">
      <button
        onClick={scrollToBottom}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#252540] text-gray-400 shadow-lg transition-colors hover:text-gray-200"
      >
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  )}
</div>
```

- [ ] **Step 2: 验证构建**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web build`
Expected: 构建成功，无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx
git commit -m "feat: integrate useAutoScroll into AgentPanel with scroll-to-bottom button"
```

---

### Task 3: 手动验证

- [ ] **Step 1: 启动 dev server 并验证**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web dev`

验证以下行为：
1. 打开 Agent 面板，发送一条消息
2. Agent 开始流式响应时，聊天应自动滚动到底部
3. 响应过程中向上滚动，自动滚动应暂停
4. 向上滚动后应出现圆形"滚动到底部"按钮
5. 点击按钮后平滑滚动到底部，之后自动滚动恢复
6. 用户消息发送后（即使不在底部），应自动滚动到底部
