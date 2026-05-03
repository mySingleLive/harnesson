# Agent 聊天面板自动滚动

## 问题

Agent 聊天面板没有自动滚动功能。当 Agent 响应内容较长（尤其是包含工具事件卡片时），用户必须手动向下滚动才能看到最新内容。这在流式响应期间体验很差。

## 方案

采用"智能滚动"模式：只有当用户已经在底部附近时才自动滚动；用户向上滚动查看历史消息时暂停自动滚动，并显示"滚动到底部"按钮。

### 涉及文件

| 文件 | 操作 |
|------|------|
| `apps/web/src/hooks/useAutoScroll.ts` | 新建 |
| `apps/web/src/components/layout/AgentPanel.tsx` | 修改 |

### useAutoScroll Hook

```typescript
function useAutoScroll(
  scrollRef: RefObject<HTMLDivElement>,
  deps: unknown[]
): { isAtBottom: boolean; scrollToBottom: () => void }
```

- **底部检测**：监听 scroll 事件，当 `scrollHeight - scrollTop - clientHeight < 80` 时认为在底部
- **自动滚动触发**：当 deps 变化且 `isAtBottom === true` 时，调用 `scrollTo({ top: scrollHeight, behavior: 'smooth' })`
- **流式支持**：deps 包含消息数组引用，每次 SSE 更新触发 re-render 时 hook 都会检查是否需要滚动

### "滚动到底部" 按钮

当 `isAtBottom === false` 时，在聊天区域右下角显示一个浮动按钮。点击后平滑滚动到底部并更新状态。按钮样式与现有 UI 一致（小圆形按钮，带向下箭头图标）。

### 数据流

```
SSE streaming event
  → agentStore 更新消息
    → AgentPanel re-render
      → useAutoScroll 检测到 deps 变化
        → 若用户在底部 → 自动 scrollTo
        → 若用户不在底部 → 不操作，显示按钮
```
