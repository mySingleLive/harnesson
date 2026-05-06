# 问答结果卡片设计

日期: 2026-05-07

## 概述

用户通过问答弹框提交答案后，在聊天消息流中显示独立的问答结果卡片。卡片以简洁内联方式展示 `问题 → 答案`，使用不同颜色区分问题和答案。

## 背景

当前系统中 `AskUserQuestion` 事件在 `segmentEvents()` 中被完全过滤，用户回答问题后聊天流中没有任何视觉记录。已有的 `AskUserQuestionCard` 组件是折叠卡片式设计，不符合简洁内联的需求。

## 设计决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 卡片样式 | 简洁内联式 | 问题答案一行展示，紧凑直观 |
| 消息归属 | 独立卡片，无发送者 | 问答结果是独立信息，不属于用户或助手 |
| 问题颜色 | `#9ca3af`（浅灰） | 低调，不抢视觉焦点 |
| 答案颜色 | `#00bfff`（品牌蓝） | 突出用户的选择 |
| 箭头符号 | `→` 文本，`#6b7280` 灰色 | 简洁分隔 |
| 技术方案 | 新增 `qa-result` 段类型 | 独立于 tool card 体系，语义更准确 |

## 数据层

### 新增段类型 (`segmentEvents.ts`)

```ts
export interface QAResultSegment {
  type: 'qa-result';
  question: string;
  answer: string;
}

export type Segment = TextSegment | ToolSegment | QAResultSegment;
```

### 处理逻辑

1. `agent.tool_use` 阶段：不再过滤 `AskUserQuestion`，将其加入 `pendingTools` 队列
2. `agent.tool_result` 阶段：当 `tool === 'AskUserQuestion'` 时，从配对的 `tool_use` input 中提取 `questions[0].question` 作为问题文本，从 `tool_result` output 提取答案文本，生成 `qa-result` 段

## 组件层

### 新建 `QAResultCard.tsx`

位置: `apps/web/src/components/chat/tool-cards/QAResultCard.tsx`

渲染结构:
- 外层: `div`，背景 `#252540`，圆角 8px，内边距 12px 16px
- 内容: flex 行布局，居中对齐
  - 问题文本: `color: #9ca3af`，`font-size: 14px`
  - 箭头: `color: #6b7280`，`→` 文本符号，左右间距 8px
  - 答案文本: `color: #00bfff`，`font-size: 14px`

答案截断规则: 超过 100 字符时截断并加 `...`。

## 渲染层

在消息渲染的 segment switch 中，增加 `qa-result` case:

```tsx
case 'qa-result':
  return <QAResultCard question={seg.question} answer={seg.answer} />;
```

卡片直接嵌入聊天消息流，不包裹在任何发送者气泡中。

## 涉及文件

1. `apps/web/src/components/chat/tool-cards/segmentEvents.ts` — 新增段类型和处理逻辑
2. `apps/web/src/components/chat/tool-cards/QAResultCard.tsx` — 新建组件
3. `apps/web/src/components/layout/AgentPanel.tsx` — 渲染层增加 qa-result 段处理

## 不涉及

- `AskUserQuestionCard.tsx` — 保留不动，不参与此功能
- `ToolEventCard.tsx` — 不注册新卡片，独立于 tool card 体系
- `AskUserQuestionPanel.tsx` — 交互弹框保持不变
- `agentStore.ts` — 状态管理无需修改
