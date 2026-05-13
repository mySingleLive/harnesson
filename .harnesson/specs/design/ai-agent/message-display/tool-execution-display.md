# 工具执行展示 — 前端设计

## 布局

工具卡片嵌入 Agent 消息气泡内，以 `mt-2 space-y-2` 垂直堆叠。每个卡片为圆角边框容器，包含标题栏（工具图标 + 名称 + 状态指示）和可折叠内容区域。

## 组件树

```
AgentStreamEvent[] 
  → segmentEvents() → pairEvents() → buildEventTree()
    → ToolEventCardList
      ├── toolCardMap 分发:
      │   ├── ReadCard    (文件路径、行号、内容预览 ≤50 行)
      │   ├── WriteCard   (文件路径、语法高亮代码)
      │   ├── EditCard    (统一 diff 视图、+/- 行统计)
      │   ├── BashCard    (命令文本、输出截断 ≤200 行、耗时)
      │   ├── GrepCard    (搜索模式、路径、匹配数)
      │   ├── GlobCard    (Glob 模式、匹配文件列表)
      │   ├── LSPCard     (操作类型、文件路径、行号)
      │   └── GenericCard (fallback: 原始 JSON)
      ├── StreamingAgentCard (嵌套子 Agent 事件树)
      ├── AskUserQuestionCard (问答卡片)
      └── TodoCard (待办快照)
```

## 事件处理流程

```mermaid
flowchart LR
    A[混合事件流] --> B[segmentEvents]
    B --> C[文本段 / 工具段 / 问答段]
    C --> D[pairEvents]
    D --> E[tool_use + tool_result 配对]
    E --> F[buildEventTree]
    F --> G[嵌套 Agent 树 + 平级工具卡片]
    G --> H[渲染对应 Card 组件]
```

`segmentEvents` 将 SSE 事件流切分为文本段、工具调用段和问答段。`pairEvents` 将 `tool_use` 和 `tool_result` 配对。`buildEventTree` 处理嵌套 Agent 调用，构建父子关系树。

## 样式与主题

- 卡片状态动画：运行中脉冲 + 旋转图标、完成绿色边框、错误红色边框
- 代码块使用 `prism-react-renderer` 语法高亮
- 嵌套子 Agent 以缩进 + 树形连线展示父子层级

## 交互方式

点击卡片标题栏（CollapsibleCard）切换折叠/展开。ReadCard 内容预览截断 50 行，BashCard 输出截断 200 行。EditCard 使用 `diff` 库生成统一 diff 视图。

## 状态管理

事件流由 SSE 直接推送，`agentStore.appendStreamEvent` 追加到消息缓冲区。卡片组件从 `AgentMessage.events` 数组读取事件进行渲染。

## Specification Details

### Parameters

- ReadCard 内容预览截断阈值：50 行
- BashCard 输出内容截断阈值：200 行
- 卡片状态动画：运行中脉冲、完成绿色、错误红色边框
- EditCard 使用 diff 库生成统一 diff 视图
- WriteCard/EditCard 使用 prism-react-renderer 进行代码语法高亮
- 嵌套 Agent 卡片以缩进 + 树形连线展示父子关系

## Constraints

- 工具事件的展示依赖 SSE 事件流的完整性（丢失事件可能导致卡片不完整）
- 超长输出内容自动截断，用户无法展开查看完整内容（当前设计限制）
- 未知工具类型回退到 GenericCard（原始 JSON）
- 嵌套 Agent 的深度理论上无限但实际受 SDK 限制
