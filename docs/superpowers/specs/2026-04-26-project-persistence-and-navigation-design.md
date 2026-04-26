# 项目持久化与导航

## 背景

当前项目数据存储在前端 localStorage（通过 `mockApi.ts`），应用重启后数据依赖浏览器存储，不可靠。同时，Projects 页面点击项目后仅切换全局状态，未导航到 Graph 页面。

## 目标

1. 项目数据通过后端 API 持久化到 SQLite 数据库
2. Projects 页面点击项目后切换全局当前项目并导航到 Graph 页面

## 设计决策

- **数据库**：Prisma ORM + SQLite（单文件，零配置）
- **用户模型**：单用户，无需认证
- **数据层策略**：完全移除 mockApi，前端直接对接后端 API
- **导航方式**：切换 Zustand 全局状态 + React Router 导航，不通过 URL 参数

## 1. 后端 — Prisma + SQLite 数据层

### Schema（`apps/server/prisma/schema.prisma`）

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Project {
  id          String   @id @default(uuid())
  name        String
  path        String   @unique
  description String?
  source      String   @default("local")
  agentCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### PrismaClient 单例（`apps/server/src/lib/prisma.ts`）

导出一个 PrismaClient 实例，供所有路由使用。

### 项目 CRUD 路由（`apps/server/src/routes/projects.ts`）

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/projects` | 获取所有项目列表 |
| GET | `/api/projects/:id` | 获取单个项目 |
| POST | `/api/projects` | 创建项目 |
| DELETE | `/api/projects/:id` | 删除项目 |

创建项目请求体：

```json
{
  "name": "my-project",
  "path": "/Users/dev/projects/my-project",
  "description": "可选描述",
  "source": "create",
  "gitInit": true
}
```

- `path` 字段唯一，后端需做重复检查
- `gitInit` 字段仅 `source: "create"` 时有效，后端负责初始化 git 仓库
- `id`、`createdAt`、`updatedAt` 由后端生成，前端不传

### 文件结构变更

- 新增 `apps/server/prisma/schema.prisma`
- 新增 `apps/server/src/lib/prisma.ts`
- 新增 `apps/server/src/routes/projects.ts`
- 修改 `apps/server/src/index.ts` — 注册 `/api/projects` 路由
- 新增 Prisma 和 `@prisma/client` 依赖

## 2. 前端 — 替换 mockApi，对接后端 API

### 重写 `serverApi.ts`

新增项目相关的 API 调用函数：

```typescript
getProjects(): Promise<Project[]>        // GET /api/projects
getProject(id): Promise<Project | null>  // GET /api/projects/:id
createProject(opts): Promise<Project>    // POST /api/projects
removeProject(id): Promise<void>         // DELETE /api/projects/:id
```

### 删除 `mockApi.ts`

完全移除 `apps/web/src/lib/mockApi.ts`，所有引用改为使用 `serverApi`。

### 修改 `projectStore.ts`

- `loadProjects` → 调用 `serverApi.getProjects()`
- `removeProject` → 调用 `serverApi.removeProject(id)`
- 移除 `mockApi` 导入

### 修改 `useProjectActions.ts`

- `openFolder` → 后端选择文件夹 → 调用 `serverApi.createProject()`
- `cloneRepo` → 调用 `serverApi.createProject()`（source: 'clone'）
- `createProject` → 调用 `serverApi.createProject()`
- 移除前端 `crypto.randomUUID()` 生成 ID 的逻辑，ID 由后端生成
- 移除 `mockApi` 导入

### 修改 `ProjectList.tsx`

- 移除 `import { mockApi }` 和 `mockApi.revealFolder` 调用

## 3. 点击项目 → 切换并导航到 Graph

### 修改 `ProjectList.tsx` 的 `handleOpen`

```typescript
const navigate = useNavigate();

const handleOpen = useCallback(
  (project: Project) => {
    switchProject(project.id, 'main');
    navigate('/graph');
  },
  [switchProject, navigate],
);
```

### 影响范围

- `ProjectCard` 和 `ProjectRow` 的 `onOpen` 回调已指向 `handleOpen`，无需修改
- `ProjectDetailModal` 的"打开项目"按钮使用同一个 `onOpen`，自动生效
- **ProjectDropdown（顶栏下拉）不导航**，只切换当前项目 — 下拉菜单保持原有行为

### 用户体验流程

1. 用户在 Projects 页面点击任意项目（卡片/列表行/详情弹窗）
2. Zustand store 更新 `activeProjectId`
3. 立即导航到 `/graph`
4. Graph 页面从 store 读取当前项目并加载内容

## 不在范围内

- 用户认证/多用户
- 项目设置/配置管理
- 项目-agent 关联管理
- revealFolder 后端实现（可后续添加）
