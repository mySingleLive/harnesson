# 中止执行 — 全栈设计

## 架构概览

用户在 Agent 运行期间点击中止按钮，前端调用 `POST /api/agents/:id/abort`，后端调用 SDK 的 `abort()` 方法终止 Agent 执行，SSE 连接随之关闭，Agent 状态更新。

```
用户点击中止 → agentStore.abortAgent() → POST /api/agents/:id/abort
→ agentService.abort() → adapter.abort() → SDK 停止执行 → SSE close
```

## 前端设计

**UI 表现**：
- Agent 运行期间（`isStreaming=true`），输入框右侧按钮从发送箭头（`ArrowUp`）切换为红色中止按钮（`StopCircle`，图标 15x15px）
- 点击中止按钮后，按钮立即切换回发送箭头
- `agentStore.abortAgent(agentId)` 发送 POST 请求后，更新 Agent 状态为 idle 或 error

**状态管理**：`agentStore.isStreaming[agentId]` 控制按钮显示，`abortAgent` 方法封装 HTTP 请求。

## 后端设计

**API 端点**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/agents/:id/abort` | 中止正在运行的 Agent |

**处理流程**：
1. 路由层调用 `agentService.abort(agentId)`
2. `agentService` 获取对应 `RuntimeState`，调用 `adapter.abort()`
3. SDK 的 `abort()` 方法终止当前工具调用和消息处理循环
4. SSE 客户端收到 `done` 或 `error` 事件后自动断开连接
5. Agent 状态更新为 idle（正常终止）或 error（异常终止）

**注意事项**：SDK 中止可能有延迟，取决于当前工具调用的完成时间。中止后已收到的部分消息保留在消息历史中。

## Specification Details

### Parameters

- 中止按钮仅在 `isStreaming=true` 时显示（红色背景，StopCircle 图标 15x15px）
- 中止请求通过 `POST /api/agents/:id/abort` 发送
- 中止后 Agent 状态更新为 `idle`（正常终止）或 `error`（异常终止）
- 同一次 Agent 执行只能中止一次

## Constraints

- 中止操作不可撤销，中止后需重新发送消息才能继续对话
- 网络中段时中止请求可能无法到达后端
- SDK 中止可能有时延（取决于当前工具调用的完成时间）
- 中止后已收到的部分消息保留在消息历史中
