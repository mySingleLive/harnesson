# 待办事项展示 — 全栈设计

## 架构概览

Agent 通过 `TodoWrite` 工具调用更新待办列表，后端将 todo 事件通过 SSE 广播到前端。前端 `TodoBar` 组件实时渲染进行中的待办列表，全部完成后自动生成 `TodoCard` 快照插入消息流。

```
Agent SDK → SSE (todo event) → agentStore → TodoBar → TodoCard (snapshot)
```

## 前端设计

**组件树**：
- `TodoBar`：浮动在消息面板上方的实时待办列表，垂直排列各项
- `StatusIcon`：每项左侧的状态图标（pending 为空心圆 / in_progress 为旋转圆环 / completed 为绿色勾选）
- `TodoCard`：全部完成后生成的快照卡片，插入消息流

**交互方式**：进行中项目显示旋转动画（`animate-spin`）和紫色文字，已完成项目显示删除线和灰色。列表容器最大高度 `40vh`，超出滚动。

**状态管理**：`agentStore.todos[agentId]` 存储当前 TodoItem 数组，`addTodo`、`updateTodo`、`clearTodos` 方法更新。完成后 1.5s 延迟触发快照生成。

## 后端设计

**事件流**：Agent SDK 发出 `todo_update` 事件，后端通过 SSE 广播给所有连接的客户端。todo 事件包含 `{ id, content, status, activeForm }` 字段。

**API 端点**：`GET /api/agents/:id/todos` 获取历史待办（持久化查询）。

## Specification Details

### Parameters

- 待办项状态：pending（灰色）、in_progress（强调色 + 旋转动画）、completed（删除线 + 绿色勾选）
- 全部完成后到生成快照的延迟：1.5s
- TodoCard 快照显示各项目的最终状态和完成时间
- 待办项列表最大显示条目数无硬性限制

## Constraints

- Agent 不使用 TodoWrite 工具时不显示待办列表
- 待办数据来自 Agent SSE 流，页面刷新后需重新加载
- 多个 Agent 同时运行时的待办列表各自独立
- 待办项的快照仅在全部完成时生成一次
