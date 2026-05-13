# 思考指示器 — 前端设计

## 布局

思考指示器作为消息列表中的一个独立条目插入，位于最新的 Agent 消息气泡内。包含三个横向排列的弹跳圆点和一段状态文字（"thinking..."、"reasoning..." 等），与文本消息保持一致的间距和对齐方式。

## 组件树

```
ThinkingIndicator (inline-flex span)
├── 弹跳圆点 × 3 (bounce-dot animation)
└── 状态文字 (animate-pulse)
```

`ThinkingIndicator` 是纯展示组件，接收 `size` 参数（`sm` | `md`）控制圆点和文字尺寸。状态文字从固定词组 `['thinking', 'reasoning', 'analyzing', 'processing']` 中每 3 秒轮换。

## 样式与主题

- 圆点尺寸：`sm` 模式下 `h-1.5 w-1.5`（6px），`md` 模式下 `h-2 w-2`（8px）
- 圆点颜色：`bg-purple-400`（#c084fc），强调色
- 文字颜色：`text-purple-400`，字号 `text-[11px]`（sm）或 `text-[12px]`（md）
- 弹跳动画：CSS `@keyframes bounce-dot`，周期 0.6s，每个圆点延迟 0s / 0.15s / 0.3s
- 文字附带 `animate-pulse` 脉冲效果

## 交互方式

纯视觉指示器，无交互。在 Agent 状态变为 thinking 且尚无文本输出时显示；收到第一个 `agent.text` 或 `agent.done` 事件时移除。SSE 连接中断时指示器可能持续显示（无超时自动隐藏机制）。

## 状态管理

由 `agentStore.isStreaming[agentId]` 和消息流事件共同决定。当 `isStreaming` 为 true 且消息列表最后一个消息无文本内容时显示。`ThinkingIndicator` 在 `AgentMessageBubble` 中作为流式等待的占位元素渲染，不参与消息持久化。

## Specification Details

### Parameters

- 三个圆点尺寸 6x6px，间距 4px
- 弹跳动画周期 0.6s，每个圆点延迟 0s/0.15s/0.3s
- 圆点颜色 #c084fc（purple-400）
- 指示器在收到第一个 agent.text 或 agent.done 事件时移除

## Constraints

- 仅在 Agent 处于 thinking 状态且无文本输出时显示
- 思考指示器不包含任何文本，仅视觉提示
- 网络断开导致 SSE 中断时指示器可能持续显示（无超时自动隐藏）
