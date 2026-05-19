# Architecture: Harnesson

> Last synced: 2026-05-19T21:00:00Z | Commit: 73edcc0

## Module Map

| Module | Path | Key Files | Summary |
|--------|------|-----------|---------|
| server-generated | apps/server/src/generated/ | client.ts, models.ts | Prisma ORM 生成的数据库客户端和模型 |
| server-lib | apps/server/src/lib/ | agent-service.ts, graph-storage.ts, sync-engine.ts, prisma.ts | 服务端核心业务逻辑：Agent 管理、Graph 存储、同步引擎 |
| server-routes | apps/server/src/routes/ | agents.ts, projects.ts, graph.ts, branches.ts | REST API 路由层（Hono 框架） |
| shared-types | packages/shared/src/types/ | agent.ts, project.ts, graph.ts, spec-node.ts | 跨包共享 TypeScript 类型定义 |
| web-chat | apps/web/src/components/chat/ | RichTextInput.tsx, MessageRenderer.tsx, tool-cards/ | AI 对话 UI：消息渲染、工具卡片、富文本输入 |
| web-graph | apps/web/src/components/graph/ | SpecsGraph.tsx, SpecsList.tsx, SyncView.tsx | 项目规格图谱可视化和同步 |
| web-layout | apps/web/src/components/layout/ | MainLayout.tsx, Sidebar.tsx, AgentPanel.tsx | 应用布局框架：顶栏、侧栏、面板、分隔条 |
| web-projects | apps/web/src/components/projects/ | ProjectList.tsx, CreateProjectModal.tsx | 项目管理界面：列表、创建、详情 |
| web-hooks | apps/web/src/hooks/ | useSlashCompletion.ts, useImageInput.ts, useEmacsKeybindings.ts | React 自定义 Hooks 集合 |
| web-lib | apps/web/src/lib/ | serverApi.ts, slashCommandUtils.ts | 前端工具库：API 封装、命令工具 |
| web-pages | apps/web/src/pages/ | NewSessionPage.tsx, ProjectsPage.tsx, GraphPage.tsx | 应用路由页面 |
| web-stores | apps/web/src/stores/ | agentStore.ts, graphStore.ts, projectStore.ts | Zustand 全局状态管理 |

## Dependency Graph

```
shared-types ─────────────────────────────────────────────┐
     │                                                     │
     ├── server-generated (Prisma types)                   │
     │        │                                             │
     │        └── server-lib (prisma.ts)                   │
     │             │                                        │
     │             └── server-routes (Hono API)             │
     │                                                     │
     └── web-lib (serverApi.ts) ───────────────────────────┤
              │                                             │
              └── web-stores (Zustand)                     │
                   │                                        │
                   ├── web-hooks (React hooks)              │
                   │                                        │
                   └── web-layout (MainLayout, AgentPanel)  │
                        │                                   │
                        ├── web-chat (对话组件)              │
                        ├── web-graph (图谱组件)             │
                        ├── web-projects (项目管理)          │
                        └── web-pages (路由页面)             │
```

**数据流方向：**
1. `server-routes` → `server-lib` → `server-generated` (API → 业务逻辑 → 数据库)
2. `web-pages` → `web-stores` → `web-lib` → `server-routes` (页面 → 状态 → API → 后端)
3. `web-chat` ↔ `web-hooks` ↔ `web-stores` (UI ↔ 交互逻辑 ↔ 状态)

**关键依赖说明：**
- `shared-types` 是唯一的零依赖模块，被所有其他模块依赖
- `web-lib/serverApi.ts` 是前端与后端通信的唯一接口层
- `web-stores` 是前端状态的中枢，所有 UI 组件通过 stores 访问数据
- `server-lib` 是后端业务逻辑的中枢，所有 routes 通过 lib 执行操作
- `web-chat/tool-cards/` 是最复杂的子模块，包含 15+ 个独立工具卡片组件
