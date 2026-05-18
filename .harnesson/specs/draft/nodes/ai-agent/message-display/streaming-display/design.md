# Streaming Display

## 前端设计
- SSE 连接到 GET /api/agents/:id/stream
- 增量渲染文本、工具调用和状态事件
- ThinkingBar 思考状态动画
- TodoBar 任务进度展示

## 后端设计
- GET /api/agents/:id/stream SSE 端点
- 事件类型: text_delta, tool_use, tool_result, question, status
- Agent Service 广播机制推送事件
