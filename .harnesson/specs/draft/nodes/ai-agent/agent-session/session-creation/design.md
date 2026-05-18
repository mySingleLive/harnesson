# Session Creation

## 前端设计

### 界面布局
- 快捷操作按钮: Create Feature, Fix Bug, Code Review, Write Tests
- 模型选择下拉框
- 分支选择下拉框
- 富文本输入框

### 交互流程
1. 用户输入描述或点击快捷按钮
2. 调用 agentStore.createAgent() → POST /api/agents
3. 创建成功后打开 AgentPanel 聊天界面
4. 自动发送初始消息（如有）

## 后端设计

### POST /api/agents
- 请求: {name, projectId, model, branch, type}
- 处理: AgentService.createAgent() → Claude Code Adapter 初始化
- 响应: AgentSession 记录
- 持久化: AgentSession 表 + sessionData JSON
