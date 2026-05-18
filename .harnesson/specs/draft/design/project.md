# Harnesson

## 技术栈
- 前端: React 19 + TypeScript + Vite + TailwindCSS
- 后端: Express 5 + TypeScript + Prisma + SQLite
- 共享类型: @harnesson/shared (TypeScript types)
- AI 集成: Claude SDK (@anthropic-ai/sdk)
- 实时通信: Server-Sent Events (SSE)
- 构建工具: pnpm workspace monorepo

## 项目结构
```
apps/web/       - React 前端应用
apps/server/    - Express 后端服务
packages/shared/ - 共享类型定义
```

## 关键模块
- AI Agent: Claude Code 驱动的编码助手
- Project Management: 项目 CRUD 和 Git 集成
- Graph Visualization: 代码结构可视化和规格展示

## 数据库
- SQLite (Prisma ORM)
- 模型: Project, AgentSession, Message, TodoItem
