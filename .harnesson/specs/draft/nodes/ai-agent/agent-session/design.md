# Agent Session

## 架构概览

Agent 会话管理涵盖创建、切换和删除三个核心操作。创建和删除涉及前后端交互，切换为纯前端操作。

## 前端设计

### 组件
- `NewSessionPage`: 新会话创建页面，含快捷操作按钮
- `Sidebar`: 侧边栏展示 Agent 列表，支持点击切换和删除

### 状态
- `agentStore.createAgent()`: 调用 POST /api/agents
- `agentStore.setActiveAgent()`: 纯前端切换
- `agentStore.destroyAgent()`: 调用 DELETE /api/agents/:id

## 后端设计

### API
- POST /api/agents: 创建会话，关联项目和分支
- DELETE /api/agents/:id: 销毁会话，级联删除消息和任务
- GET /api/agents: 列出所有活跃会话

### 会话持久化
- AgentSession 表存储会话元数据
- sessionData JSON 字段存储 SDK 会话状态
- 服务器重启时自动恢复未销毁的会话
