# Agent Control

## 架构概览

Agent 运行控制功能，包含中止执行和模型切换两个子功能。

## 前端设计

### 组件
- AgentPanel 中的中止按钮和模型选择器
- 中止按钮仅在 Agent 运行时显示

## 后端设计

### POST /api/agents/:id/abort
- 通过 AbortController 信号中断处理
- Agent 状态从 running → idle

### GET /api/models
- 从 Claude Code Adapter 获取模型列表
- 结果缓存
