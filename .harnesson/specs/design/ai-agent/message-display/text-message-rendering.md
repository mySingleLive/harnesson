# 文本消息渲染 — 前端设计

## 布局

Agent 消息和用户消息以垂直时间线排列。用户消息右对齐（`justify-end`），Agent 消息左对齐。消息气泡最大宽度受限，超出自动换行。

## 组件树

```
MessageRenderer
├── UserMessage (role === 'user')
│   ├── ContentBlocks (inline text + images)
│   └── ImagePreview (点击放大灯箱)
└── AgentMessageBubble (role === 'assistant')
    ├── ThinkingIndicator (流式等待期间)
    ├── react-markdown + remarkGfm (Markdown 渲染)
    ├── ToolEventCardList (工具调用卡片树)
    ├── QAResultCard (问答结果)
    └── TodoCard (待办快照)
```

`MessageRenderer` 是顶层分发组件，根据 `message.role` 和 `message.todoSnapshot` 选择渲染分支。Markdown 渲染使用 `react-markdown` 配合 `remark-gfm` 插件支持 GFM 扩展语法（表格、任务列表、删除线）。

## 样式与主题

用户消息背景为强调色（紫色系），文字白色；Agent 消息背景为面板色（`bg-harness-sidebar`），文字主题色。代码块使用 `prism-react-renderer` 语法高亮，超长代码块启用 `overflow-x-auto` 横向滚动。

## 交互方式

- 流式输出：新文本片段到达时追加到消息缓冲区，自动滚动到 `scrollHeight`
- 自动滚动阈值：距底部 100px 以内时跟随滚动
- 用户手动上滚超过 200px 时停止自动滚动，显示浮动"回到底部"按钮
- 离线时已渲染消息仍可查看，页面刷新后从 `/api/agents/:id/messages` 重新加载

## 状态管理

消息存储在 `agentStore.messages[agentId]` 数组中（Zustand），通过 `appendStreamEvent` 处理 SSE 事件追加。`isStreaming` 标志控制流式渲染行为。

## Specification Details

### Parameters

- Markdown 渲染支持：标题、列表、代码块（语法高亮）、表格、链接、图片、引用块
- 用户消息右对齐，Agent 消息左对齐
- 自动滚动阈值为距底部 100px 以内
- "回到底部"按钮在用户上滚超过 200px 时显示

## Constraints

- 仅渲染文本内容，不执行嵌入的 JavaScript 或 HTML
- 超长代码块自动启用横向滚动
- 用户离线时已渲染的消息仍可查看
- 消息历史仅在当前会话期间保留（刷新后重新加载）
