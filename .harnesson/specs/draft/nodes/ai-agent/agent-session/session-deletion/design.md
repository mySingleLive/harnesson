# Session Deletion

## 前端设计

### 交互
- 侧边栏右键菜单或删除按钮触发
- 确认对话框防误操作
- 删除后自动切换到下一个可用会话

## 后端设计

### DELETE /api/agents/:id
- Agent 状态设为 destroyed
- 释放 SSE 连接和运行时资源
- Prisma 级联删除 Message 和 TodoItem 记录
