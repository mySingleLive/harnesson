# 模型切换 — 全栈设计

## 架构概览

用户通过模型下拉菜单或 `/model` 斜杠命令切换 AI 模型。模型选择存储在 `agentStore.sessionModel`，每次 `sendMessage` 时作为参数发送给后端，后端调用 `adapter.updateSessionModel()` 更新 SDK 会话模型。

```
ModelDropdown / /model 命令 → agentStore.sessionModel 更新 
→ sendMessage(model) → POST /api/agents/:id/message (含 model 参数)
→ agentService → adapter.updateSessionModel() → SDK 使用新模型
```

## 前端设计

**组件**：`ModelDropdown` — 位于输入框底部右侧的下拉菜单，显示当前选中模型名称。展开后列出所有可用模型及其描述。

**切换方式**：
1. 新建会话时：`NewSessionPage` 上的模型下拉菜单
2. 聊天输入中：`RichTextInput` 底部的 `ModelDropdown` 组件
3. 斜杠命令：输入 `/model` 触发 model-switch 逻辑

模型选择通过 `onModelChange` 回调更新 `agentStore` 的 `sessionModel` 字段。模型列表为空时下拉菜单显示空状态。

**状态管理**：`agentStore.sessionModel` 持久化当前会话的模型选择。`sendMessage(agentId, text, model)` 传递 model 参数。

## 后端设计

**API 端点**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models` | 获取可用模型列表 |
| POST | `/api/agents/:id/message` | 发送消息（含 `model` 参数） |

`GET /api/models` 从 Claude Code SDK 的 `__list_models__` 查询或硬编码列表返回模型信息（`value`、`displayName`、`description`）。发送消息时，后端调用 `adapter.updateSessionModel(model)` 更新当前会话的模型配置。

## Specification Details

### Parameters

- ModelDropdown 组件位于输入框底部右侧
- 模型选择通过 `onModelChange` 回调通知父组件
- 模型值持久化在 `agentStore` 的 `sessionModel` 字段中
- 模型列表为空时下拉菜单显示空状态

## Constraints

- 模型切换后不影响已在处理中的消息（仅影响后续消息）
- 可用模型列表取决于后端 SDK 支持的模型
- 模型列表获取失败时不显示错误，列表为空
- 同一会话的不同消息可以使用不同模型
