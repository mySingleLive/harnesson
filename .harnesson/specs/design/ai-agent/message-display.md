# 消息展示 -- 前端设计

## 布局

消息展示系统负责渲染 Agent 会话中的所有交互内容。核心入口为 `MessageRenderer` 组件，位于聊天面板的滚动区域中，按时间顺序从上到下排列消息。每条消息占据全宽，用户消息右对齐，Agent 消息左对齐（带左侧 padding）。

消息渲染分为三个主路径：
1. **TodoSnapshot** — 待办事项完成时生成的快照卡片
2. **UserMessage** — 用户发送的消息，支持纯文本 / 图片附件 / 富文本 contentBlocks
3. **AgentMessageBubble** — Agent 回复，通过 `buildEventTree()` 将扁平事件流转换为树形结构后渲染

## 组件树

```
MessageRenderer
├── TodoCard (当 message.todoSnapshot 存在)
├── UserMessage (当 role === 'user')
│   ├── 文本 / contentBlocks 内联渲染
│   ├── <img> 缩略图 (点击弹出 ImagePreview 大图查看)
│   └── ImagePreview (全屏遮罩)
└── AgentMessageBubble (当 role === 'agent')
    ├── buildEventTree(events) → TreeSegment[]
    ├── renderTreeSegment()
    │   ├── text → Markdown (react-markdown + remarkGfm)
    │   ├── qa-result → QAResultCard
    │   ├── tool (Agent) → StreamingAgentCard (嵌套子 Agent)
    │   └── tool (其他) → SingleToolEventCard
    └── ThinkingIndicator (streaming 且无内容时)
```

## 事件树构建

`buildEventTree()` 是消息展示的核心算法，位于 `tool-cards/buildEventTree.ts`，分为三步：

1. **expandLegacyNested** — 兼容旧格式：当 `Agent` 的 `tool_result.output` 是 JSON 时，展开其中的 `subEvents` 和 `subTexts` 为扁平事件。
2. **partitionByParent** — 按 `parentToolUseId` 将事件分组，`null` 组为根级事件。
3. **segmentGroup** — 对每组事件执行配对（tool_use ↔ tool_result），生成 `TreeSegment[]`：
   - 连续的 `agent.text` 合并为 `{ type: 'text', content }`
   - 配对的 tool_use/tool_result 生成 `{ type: 'tool', event, toolUseId }`
   - `AskUserQuestion` 配对生成 `{ type: 'qa-result', question, answer }`
   - `TodoWrite` 事件被跳过（由 store 层面的 todo 管理处理）
4. 对 `Agent` 类型的 tool segment，递归查找其子事件组并填充 `children`。

## 交互方式

**文本渲染** — Agent 的文本输出使用 `react-markdown` 渲染，支持 GFM 扩展（表格、任务列表、删除线）。通过 Tailwind `prose-invert` 类型系统统一样式，代码块使用 Harnesson 主题的 accent 色，背景为 sidebar 色。

**思考指示器** — `ThinkingIndicator` 组件在 streaming 中且尚无内容时显示，提供视觉反馈表明 Agent 正在处理。

**待办事项** — `TodoWrite` 工具事件在 `agentStore.appendStreamEvent()` 中拦截处理：直接替换当前 Agent 的 `todos` 列表。当所有 todo 状态变为 `completed` 时，1.5 秒延迟后生成 `todoSnapshot` 消息（避免最后一项完成时立即消失）。`TodoCard` 组件渲染待办列表，显示每项的 content、status（pending / in_progress / completed）和 `activeForm`。

**工具执行卡片** — 工具卡片目录 (`tool-cards/`) 包含 16 个组件：

| 组件 | 对应工具 | 展示内容 |
|------|----------|----------|
| `ReadCard` | Read | 文件路径、行数、语法高亮代码 |
| `WriteCard` | Write | 文件路径、内容预览 |
| `EditCard` | Edit | 文件路径、差异对比 |
| `BashCard` | Bash | 命令、输出、退出码 |
| `GlobCard` | Glob | 模式、匹配文件列表 |
| `GrepCard` | Grep | 搜索模式、匹配结果 |
| `LSPCard` | LSP | 诊断信息 |
| `QAResultCard` | AskUserQuestion | 问题、用户回答 |
| `StreamingAgentCard` | Agent (子 Agent) | 嵌套的工具树 |
| `TodoCard` | TodoWrite | 待办事项列表 |
| `GenericCard` | 其他工具 | 通用 input/output 展示 |

所有工具卡片基于 `CollapsibleCard` 实现折叠/展开，使用 `ToolEventCard` 作为路由分发器，根据 `event.tool` 选择对应卡片组件。

**用户问答交互** — 当 `agent.question` 事件到达时，`pendingQuestion` 状态被设置，前端弹出 `AskUserQuestionPanel`。用户选择/输入答案后通过 `POST /api/agents/:id/tool-result` 提交，Agent 继续执行。
