# 聊天消息气泡布局重构 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除聊天面板中 "You" 和 "AGENT A" 标签，改用背景色气泡和布局差异区分用户与 Agent 消息。

**Architecture:** 仅修改 `MessageRenderer.tsx` 中的 `UserMessage` 和 `AgentMessageBubble` 组件的 JSX 和 Tailwind 类名。纯 UI 样式改动，不涉及逻辑变更。

**Tech Stack:** React, Tailwind CSS

---

### Task 1: 重构 UserMessage 组件为气泡样式

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx:21-28`

- [ ] **Step 1: 替换 UserMessage 组件**

将 `UserMessage` 函数体替换为：

```tsx
function UserMessage({ content }: { content: string }) {
  return (
    <div className="border-b border-white/[0.04] px-5 py-4 flex justify-start">
      <div
        className="max-w-[85%] rounded-xl rounded-bl px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-300"
        style={{ background: '#454560', border: '1px solid rgba(255,255,255,0.1)', borderBottomLeftRadius: '4px' }}
      >
        {content}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 启动 dev server 验证**

Run: `cd /Users/dt_flys/Projects/harnesson && pnpm --filter web dev`

打开浏览器，发送一条用户消息，确认：
- "You" 标签已消失
- 消息显示为带灰紫色背景的圆角气泡
- 左下角为 4px 小圆角，其余三角为 12px 圆角
- 气泡最大宽度 85%，左对齐

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "style: replace user message label with chat bubble"
```

---

### Task 2: 移除 AgentMessageBubble 的标签行

**Files:**
- Modify: `apps/web/src/components/chat/MessageRenderer.tsx:30-66`

- [ ] **Step 1: 修改 AgentMessageBubble 组件**

将 `AgentMessageBubble` 函数体替换为：

```tsx
function AgentMessageBubble({ events, agentName, isStreaming }: {
  events: AgentMessage['events'];
  agentName: string;
  isStreaming: boolean;
}) {
  const segments = segmentEvents(events ?? []);

  if (segments.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div className="border-b border-white/[0.04] px-5 py-3.5">
      {isStreaming && (
        <div className="mb-1.5">
          <ThinkingIndicator size="sm" />
        </div>
      )}

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

      {events?.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={`error-${i}`} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 浏览器验证**

打开浏览器，确认：
- Agent 名称标签（如 "AGENT A"）已消失
- ThinkingIndicator 在 streaming 时显示在内容区域上方
- 工具卡片、Markdown 渲染、错误提示样式不受影响
- 用户气泡与 Agent 平铺消息之间有明显的视觉差异

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/MessageRenderer.tsx
git commit -m "style: remove agent name label, keep flat layout for agent messages"
```

---

### Task 3: 最终验证

- [ ] **Step 1: 全流程验证**

在浏览器中完成完整对话流程：
1. 发送用户消息 → 确认气泡样式
2. 等待 Agent 回复 → 确认无标签、平铺展示
3. 触发工具调用 → 确认工具卡片正常
4. 多轮对话 → 确认消息间分隔线正常
5. 触发错误 → 确认错误提示正常显示
