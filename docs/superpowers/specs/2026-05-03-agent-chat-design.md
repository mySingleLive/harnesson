# Agent Chat 系统设计

日期: 2026-05-03

## 概述

实现 Agent 聊天的完整闭环：用户在前端输入提示词，后端通过 Claude Code SDK 调用第三方 Agent 进行实际处理，实时流式反馈到前端聊天面板。支持多 Agent 并发运行，每个 Agent 绑定独立的项目目录。

## 决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| Agent 接入方式 | CLI/SDK 模式 | 完整文档、类型安全、session 管理，MCP 模式适合 AI 客户端调用场景 |
| 第一版范围 | 仅 Claude Code | 聚焦核心闭环，通过 AgentAdapter 接口预留扩展性 |
| 后端架构 | A+B 混合：SDK 实现 + CLI 抽象 | Claude Code 用 SDK，未来 Agent 用 CLI 适配，统一 AgentAdapter 接口 |
| 会话模型 | 多轮对话 | 通过 SDK `sessionId` 参数 resume 已有会话 |
| 权限模式 | 默认自动批准，可切换为用户审批 | `allowedTools` 预设全部工具，用户可在设置中切换 |
| 工作区 | 项目目录直接工作 | Claude Code 需要访问项目目录才能发挥作用 |
| 流式展示 | 全量展示 | 文本 + 工具调用详情 + 代码 diff，完整透明 |
| 并发 | 多 Agent 同时运行 | 各自独立 SSE 连接和项目目录 |

## 架构

### 三层架构

```
Frontend (React)          Backend (Hono.js)            Third-Party Agent
┌─────────────────┐      ┌──────────────────────┐     ┌───────────────┐
│ NewSessionPage  │      │ API Routes           │     │               │
│ AgentPanel      │◄────►│ POST /agents         │     │ Claude Code   │
│ agentStore      │ SSE  │ POST /agents/:id/msg │────►│ CLI (SDK)     │
│ MessageRenderer │      │ GET  /agents/:id/str │     │               │
└─────────────────┘      │ AgentService         │     │ cwd: 项目目录  │
                         │ ├─ AgentAdapter (抽象)│     └───────────────┘
                         │ └─ ClaudeCodeAdapter  │
                         └──────────────────────┘
```

### 数据流

1. 用户输入 → `POST /agents/:id/message` (202 Accepted)
2. AgentService → `ClaudeCodeAdapter.sendMessage()`
3. Adapter → `query({ prompt, sessionId, cwd })`
4. Claude Code 执行 → stream-json 输出
5. Adapter 解析流 → 统一 `AgentStreamEvent` 格式
6. SSE 推送 → `GET /agents/:id/stream`
7. 前端 EventSource → AgentPanel 实时渲染

## 后端设计

### AgentAdapter 抽象接口

```typescript
interface AgentAdapter {
  sendMessage(sessionId: string, message: string): AsyncIterable<AgentStreamEvent>
  createSession(config: SessionConfig): Promise<string>
  destroySession(sessionId: string): Promise<void>
  abort(sessionId: string): void
}

interface SessionConfig {
  cwd: string
  systemPrompt?: string
  allowedTools?: string[]
  maxTurns?: number
}
```

### ClaudeCodeAdapter 实现

- **依赖**: `@anthropic-ai/claude-code` SDK
- **内部状态**:
  - `sessions`: Map<id, { sdkSessionId, abortController }>
  - `activeStreams`: Map<id, AbortController>
- **SDK 映射**:
  - `sendMessage` → `query({ prompt, sessionId, cwd, allowedTools, maxTurns })`
  - `resume` → 复用 SDK 返回的 sessionId
  - `abort` → AbortController.abort()
- **流解析**: SDK 返回的 AsyncIterable 中每条消息转换为 `AgentStreamEvent`

### AgentService 会话管理器

- **职责**: 管理所有 Agent 会话的生命周期
- **状态**: `agents: Map<id, AgentState>`，含 adapter、sessionConfig、sseClients、status
- **SSE 广播**: Adapter yield event → 广播给该 Agent 的所有 SSE 客户端

### API 端点

| Method | Route | Description | Request/Response |
|--------|-------|-------------|------------------|
| POST | `/api/agents` | 创建新 Agent | `{cwd, type, model, permissions}` → `{agent}` |
| POST | `/api/agents/:id/message` | 发送消息 | `{message}` → 202 Accepted |
| GET | `/api/agents/:id/stream` | SSE 流 | `text/event-stream` → `AgentStreamEvent` |
| POST | `/api/agents/:id/abort` | 中止当前处理 | → 200 OK |
| GET | `/api/agents` | 列出所有 Agent | → `{agents[]}` |
| DELETE | `/api/agents/:id` | 销毁 Agent | → 200 OK |

**发送与接收分离**: `POST /message` 只负责触发，所有内容通过同一个 SSE 连接返回。

## 前端设计

### 页面交互流程

```
NewSessionPage (输入提示词)
  → POST /agents (创建 Agent)
  → 跳转主页, AgentPanel 打开
  → GET /agents/:id/stream (建立 SSE)
  → 实时渲染流式消息

后续消息循环:
  AgentPanel 输入 → POST /agents/:id/message (202)
  → SSE 推送流式响应 → 前端实时追加消息
```

### AgentStreamEvent 消息类型

| Event Type | Payload | UI 渲染 |
|------------|---------|---------|
| `agent.thinking` | `{ text }` | 思考中动画 + 流式文本 |
| `agent.text` | `{ text }` | Markdown 渲染的文本块 |
| `agent.tool_use` | `{ tool, input }` | 工具调用卡片 (可展开) |
| `agent.tool_result` | `{ tool, output, isError }` | 工具结果 (代码/diff/文本) |
| `agent.error` | `{ message, code }` | 错误提示 (红色横幅) |
| `agent.done` | `{ sessionId, tokenUsage }` | 状态更新为 idle, 显示 token 用量 |

SSE 事件格式:
```
event: agent.text
data: {"text":"我来帮你实现这个功能..."}

event: agent.tool_use
data: {"tool":"Read","input":{"file_path":"/src/app.tsx"}}

event: agent.tool_result
data: {"tool":"Read","output":"file content...","duration":120}
```

### agentStore 改造

新增 State:
- `messages: Map<agentId, AgentMessage[]>` — 每个会话的消息历史
- `eventSources: Map<agentId, EventSource>` — SSE 连接管理
- `isStreaming: Map<agentId, boolean>` — 当前是否在接收流

新增 Actions:
- `createAgent(config)` → POST /agents, 建立 SSE, 返回 agentId
- `sendMessage(agentId, text)` → POST /agents/:id/message, 追加用户消息
- `appendStreamEvent(agentId, event)` → SSE 回调, 追加到消息列表
- `connectSSE(agentId)` → 建立 EventSource, 绑定事件处理器
- `disconnectSSE(agentId)` → 关闭 EventSource 连接
- `abortAgent(agentId)` → POST /agents/:id/abort
- `destroyAgent(agentId)` → DELETE, 关闭 SSE, 清理状态

### MessageRenderer 组件

渲染 Agent 响应的不同内容类型:
- **用户消息**: 蓝色气泡, 右对齐
- **Agent 思考**: 紫色脉冲动画 + 流式文本
- **Agent 文本**: 左侧绿色竖线 + Markdown 渲染
- **工具调用**: 折叠卡片, 显示工具名 + 目标文件/命令 + 耗时
- **工具结果**: 代码块或 diff 视图 (红色删除/绿色新增)

## 错误处理

| 场景 | 后端处理 | 前端表现 |
|------|---------|---------|
| Agent 进程崩溃 | 捕获 SDK 错误 → SSE error → 标记 error | 红色错误横幅 + "重新启动" 按钮 |
| SSE 连接断开 | 继续处理 + 缓存事件 → 重连后补发 | EventSource 自动重连 + 同步丢失消息 |
| 用户中止 | AbortController → SDK 中止 → SSE done | "已中止" 提示, 状态 idle |
| 项目目录无效 | 创建时验证 cwd, 无效返回 400 | 表单验证提示 |
| 超过 maxTurns | SDK 自动停止 → done (含原因) | "最大轮次" 提示 + "继续" 按钮 |
| 切换项目/分支 | 不中断 Agent, 各自绑定 cwd | 列表显示各 Agent 的项目和分支 |

## 权限系统

### 模式 A: 自动批准 (默认)

SDK 配置:
```typescript
query({
  allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'LSP', 'Glob', 'Grep', 'Agent'],
  ...
})
```

流程: 用户发送消息 → Agent 自由执行所有工具 → 结果流式展示

### 模式 B: 用户审批

SDK 配置:
```typescript
query({
  permissionPromptTool: 'harnesson-permission',
  ...
})
```

流程: Agent 请求工具 → SDK 调用 permission tool → SSE 推送审批请求 → 前端弹窗 → 用户批准/拒绝 → 返回结果给 Agent

### 配置入口

NewSessionPage 工具栏和 AgentPanel 设置菜单中提供权限模式切换。切换仅对新消息生效，不中断当前执行。

## 资源清理与生命周期

### Agent 状态流转

```
创建 → running
消息处理中 → running (streaming)
等待用户输入 → idle
出错 → error (可恢复)
用户关闭 → destroyed (释放资源)
```

### 清理策略

- SSE 连接空闲 30 分钟 → 后端自动关闭
- Agent 空闲 24 小时 → 自动归档到历史
- 页面关闭 → beforeunload 断开 SSE
- 后端重启 → 恢复活跃 Agent 列表 (持久化到 SQLite)

### 多 Agent 并发

- 每个 Agent 独立 SSE 连接
- 各自绑定独立的项目目录
- 侧边栏显示所有活跃 Agent
- 点击切换当前查看的 Agent
- 后台 Agent 继续运行不受影响
