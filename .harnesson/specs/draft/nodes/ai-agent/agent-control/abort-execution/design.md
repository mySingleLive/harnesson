# Abort Execution

## 前端设计
- AgentPanel 中止按钮，仅在 Agent 处于 running/waiting 状态时显示
- 点击后调用 POST /api/agents/:id/abort

## 后端设计
- POST /api/agents/:id/abort
- AbortController 信号中断 Claude SDK 调用
- 断开 SSE 连接
- Agent 状态更新为 idle
- 非运行状态返回 409 Conflict
