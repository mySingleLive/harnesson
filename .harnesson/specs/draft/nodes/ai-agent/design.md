# AI Agent

## 架构概览

AI Agent 功能采用前后端分离架构，前端通过 Zustand store 管理 Agent 状态，后端通过 Express 路由和 Agent Service 处理会话生命周期。实时通信使用 Server-Sent Events (SSE)。

## 前端设计

### 状态管理
- `agentStore` (Zustand): 管理 Agent 列表、消息、流式状态、面板状态
- Agent 状态: idle, running, waiting, waiting_for_input, completed, error

### 关键 API 调用
| 方法 | 路径 | 用途 |
|------|------|------|
| POST | /api/agents | 创建 Agent 会话 |
| POST | /api/agents/:id/message | 发送消息 |
| GET | /api/agents/:id/stream | SSE 实时流 |
| POST | /api/agents/:id/abort | 中止执行 |
| DELETE | /api/agents/:id | 删除会话 |

## 后端设计

### API 端点
| 方法 | 路径 | 请求体 | 响应 |
|------|------|--------|------|
| POST | /api/agents | {name, projectId, model, branch} | AgentSession |
| GET | /api/agents | - | AgentSession[] |
| GET | /api/agents/:id | - | AgentSession |
| GET | /api/agents/:id/messages | - | Message[] |
| GET | /api/agents/:id/stream | - | SSE stream |
| POST | /api/agents/:id/message | {content, images} | Message |
| POST | /api/agents/:id/abort | - | {ok} |
| DELETE | /api/agents/:id | - | {ok} |

### 数据库模型
- **AgentSession**: id, name, type, status, projectId, branch, model, sessionData(JSON)
- **Message**: id, agentId, role, content, images(JSON), contentBlocks(JSON), events(JSON)
- **TodoItem**: id, agentId, subject, description, status, activeForm

### 业务流程
1. Agent 创建 → AgentService 初始化 → Claude Code Adapter 建立会话
2. 消息发送 → SSE 流式处理 → 事件推送前端 → 渲染
3. Agent 销毁 → 状态设为 destroyed → 级联删除关联数据
