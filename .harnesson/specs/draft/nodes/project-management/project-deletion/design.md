# Project Deletion

## 前端设计
- ProjectDetailModal 中的删除按钮
- 需要用户确认

## 后端设计
- DELETE /api/projects/:id
- Prisma 级联删除 AgentSession, Message, TodoItem
