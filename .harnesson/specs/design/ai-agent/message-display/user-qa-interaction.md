# 用户问答交互 — 全栈设计

## 架构概览

Agent 调用 `AskUserQuestion` 工具时，前端聊天输入框替换为交互式问答面板。用户选择或输入答案后，通过 `POST /api/agents/:id/tool-result` 发回后端，Agent 继续执行。

```
Agent → SSE (question event) → AskUserQuestionPanel → 用户选择 
→ POST /api/agents/:id/tool-result → Agent 继续
```

## 前端设计

**组件**：`AskUserQuestionPanel`
- 问题标题：显示 `question.question` 字段
- 选项列表：单选（Radio）或多选（Checkbox），由 `question.multiSelect` 决定
- 预览区域：选项包含 `preview` 内容时，选中后右侧展示 Markdown 预览
- 自定义答案：底部文本输入框，支持自由文本回答

**交互方式**：
- 键盘导航：上下箭头移动焦点，Enter 选中确认（单选），Escape 取消
- 未选择选项时提交按钮禁用（除非输入自定义答案）
- 提交后面板消失，恢复聊天输入框

**状态管理**：`agentStore.pendingQuestion[agentId]` 存储当前问题，`submitQuestionAnswer` 方法发送答案。

## 后端设计

**事件流**：Agent SDK 发出 `question` 事件，后端通过 SSE 推送给前端。后端 `agentService` 内部维护 `pendingAnswers` Map，`submitAnswer()` 方法 resolve 对应的 Promise，将答案传回 SDK 的 `tool_result`。

**API 端点**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/agents/:id/tool-result` | 提交问答答案 |

请求体：`{ answer: string | string[] }`

## Specification Details

### Parameters

- 问题是否多选由 `multiSelect` 字段决定
- 选项选中状态：单选用 Radio 按钮，多选用 Checkbox
- 预览内容 Markdown 渲染，在选项聚焦时显示
- 问答面板占满聊天输入区域，原输入框完全隐藏

## Constraints

- 问答面板同时只处理一个问题（Agent 串行提问）
- 用户必须回答问题后才能继续与 Agent 交互（阻塞式）
- 未选择选项时提交按钮禁用（除非输入自定义答案）
- 预览内容过长时面板内滚动显示
