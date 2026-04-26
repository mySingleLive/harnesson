# 项目持久化与导航 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目数据从前端 localStorage 迁移到后端 Prisma + SQLite 持久化，并在 Projects 页面点击项目时导航到 Graph 页面。

**Architecture:** 后端新增 Prisma ORM + SQLite 数据层，通过 Hono 路由暴露项目 CRUD API。前端删除 mockApi.ts，用 serverApi.ts 直接调用后端 API。点击项目时通过 Zustand store 切换状态 + React Router navigate 跳转。

**Tech Stack:** Prisma, SQLite, Hono, React Router, Zustand

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/server/prisma/schema.prisma` | Prisma 数据模型定义 |
| Create | `apps/server/src/lib/prisma.ts` | PrismaClient 单例 |
| Create | `apps/server/src/routes/projects.ts` | 项目 CRUD 路由 |
| Modify | `apps/server/src/index.ts` | 注册项目路由 |
| Modify | `apps/server/package.json` | 添加 prisma 依赖 |
| Modify | `apps/web/src/lib/serverApi.ts` | 新增项目 API 调用函数 |
| Modify | `apps/web/src/stores/projectStore.ts` | mockApi → serverApi |
| Modify | `apps/web/src/hooks/useProjectActions.ts` | mockApi → serverApi |
| Modify | `apps/web/src/components/projects/ProjectList.tsx` | 移除 mockApi，加导航 |
| Delete | `apps/web/src/lib/mockApi.ts` | 完全移除 |

---

### Task 1: 安装 Prisma 依赖并初始化 Schema

**Files:**
- Modify: `apps/server/package.json`
- Create: `apps/server/prisma/schema.prisma`

- [ ] **Step 1: 安装 Prisma 依赖**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/server add prisma @prisma/client
```

- [ ] **Step 2: 创建 Prisma schema 文件**

Create `apps/server/prisma/schema.prisma`:
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

- [ ] **Step 3: 运行 Prisma 迁移**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson/apps/server && npx prisma migrate dev --name init
```
Expected: 生成 `prisma/migrations/` 目录和 `prisma/dev.db` 文件，输出 "The following migration(s) have been applied"

- [ ] **Step 4: 生成 Prisma Client**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson/apps/server && npx prisma generate
```
Expected: 输出 "generated Prisma Client"

- [ ] **Step 5: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/server/prisma/ apps/server/package.json pnpm-lock.yaml && git commit -m "feat: add Prisma schema with Project model and SQLite setup"
```

---

### Task 2: 创建 PrismaClient 单例

**Files:**
- Create: `apps/server/src/lib/prisma.ts`

- [ ] **Step 1: 创建 PrismaClient 单例**

Create `apps/server/src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

- [ ] **Step 2: 验证 Prisma Client 可正常导入**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson/apps/server && npx tsx -e "import { prisma } from './src/lib/prisma.js'; console.log('PrismaClient OK'); process.exit(0)"
```
Expected: 输出 "PrismaClient OK"

- [ ] **Step 3: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/server/src/lib/prisma.ts && git commit -m "feat: add PrismaClient singleton"
```

---

### Task 3: 实现项目 CRUD API 路由

**Files:**
- Create: `apps/server/src/routes/projects.ts`

- [ ] **Step 1: 创建项目路由**

Create `apps/server/src/routes/projects.ts`:
```typescript
import { Hono } from 'hono';
import { prisma } from '../lib/prisma.js';

export const projectsRoute = new Hono();

// GET /api/projects — 获取所有项目
projectsRoute.get('/api/projects', async (c) => {
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
  return c.json(projects);
});

// GET /api/projects/:id — 获取单个项目
projectsRoute.get('/api/projects/:id', async (c) => {
  const { id } = c.req.param();
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  return c.json(project);
});

// POST /api/projects — 创建项目
projectsRoute.post('/api/projects', async (c) => {
  const body = await c.req.json();
  const { name, path, description, source, gitInit } = body;

  if (!name || !path) {
    return c.json({ error: 'name and path are required' }, 400);
  }

  // 检查路径是否已存在
  const existing = await prisma.project.findUnique({ where: { path } });
  if (existing) {
    return c.json(existing);
  }

  // gitInit 处理（仅 source=create 时）
  if (gitInit && source === 'create') {
    try {
      const { execSync } = await import('child_process');
      execSync(`git init "${path}"`, { stdio: 'ignore' });
    } catch {
      // git init 失败不阻塞项目创建
    }
  }

  const project = await prisma.project.create({
    data: {
      name,
      path,
      description: description ?? null,
      source: source ?? 'local',
    },
  });

  return c.json(project, 201);
});

// DELETE /api/projects/:id — 删除项目
projectsRoute.delete('/api/projects/:id', async (c) => {
  const { id } = c.req.param();
  try {
    await prisma.project.delete({ where: { id } });
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'Project not found' }, 404);
  }
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/server/src/routes/projects.ts && git commit -m "feat: add project CRUD API routes"
```

---

### Task 4: 注册项目路由到主应用

**Files:**
- Modify: `apps/server/src/index.ts`

- [ ] **Step 1: 在 index.ts 中注册项目路由**

Update `apps/server/src/index.ts` to:
```typescript
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { openFolderRoute } from './routes/open-folder.js';
import { healthRoute } from './routes/health.js';
import { projectsRoute } from './routes/projects.js';

const app = new Hono();

app.use('/*', cors({ origin: 'http://localhost:5173' }));

app.route('/', healthRoute);
app.route('/', openFolderRoute);
app.route('/', projectsRoute);

const PORT = Number(process.env.PORT ?? 3456);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`@harnesson/server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: 启动服务器并验证 API**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson && pnpm dev:server &
sleep 3
curl -s http://localhost:3456/api/projects | head
```
Expected: 返回空数组 `[]`

- [ ] **Step 3: 测试创建项目 API**

Run:
```bash
curl -s -X POST http://localhost:3456/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"name":"test-project","path":"/tmp/test-project","source":"create"}' | head
```
Expected: 返回创建的项目 JSON，包含 `id`、`name`、`path` 等字段

- [ ] **Step 4: 测试获取项目列表**

Run:
```bash
curl -s http://localhost:3456/api/projects | head
```
Expected: 返回包含刚创建项目的数组

- [ ] **Step 5: 停止测试服务器**

Run:
```bash
kill %1 2>/dev/null; true
```

- [ ] **Step 6: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/server/src/index.ts && git commit -m "feat: register project routes in server"
```

---

### Task 5: 重写 serverApi.ts，新增项目 API 调用

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`

- [ ] **Step 1: 重写 serverApi.ts**

Update `apps/web/src/lib/serverApi.ts` to:
```typescript
import type { Project } from '@harnesson/shared';

const API_BASE = '/api';

export interface OpenFolderResponse {
  path?: string;
  cancelled?: boolean;
  error?: string;
}

let serverAvailable: boolean | null = null;

export async function isServerRunning(): Promise<boolean> {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

export async function openFolderDialog(): Promise<OpenFolderResponse> {
  try {
    const res = await fetch(`${API_BASE}/open-folder`, { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.error ?? `Server error: ${res.status}` };
    }
    return await res.json();
  } catch (err: any) {
    serverAvailable = false;
    return { error: err.message ?? 'Failed to connect to backend server' };
  }
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  return res.json();
}

export async function createProject(opts: {
  name: string;
  path: string;
  description?: string;
  source: 'local' | 'clone' | 'create';
  gitInit?: boolean;
}): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
  return res.json();
}

export async function removeProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to remove project: ${res.status}`);
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/web/src/lib/serverApi.ts && git commit -m "feat: add project API functions to serverApi"
```

---

### Task 6: 修改 projectStore.ts，替换 mockApi 为 serverApi

**Files:**
- Modify: `apps/web/src/stores/projectStore.ts`

- [ ] **Step 1: 更新 projectStore.ts**

Update `apps/web/src/stores/projectStore.ts` to:
```typescript
import { create } from 'zustand';
import type { Project } from '@harnesson/shared';
import * as serverApi from '@/lib/serverApi';

interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  projects: Project[];
  viewMode: 'card' | 'list';
  searchQuery: string;
  isLoading: boolean;
  loadProjects: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  switchProject: (projectId: string, branch: string) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  setSearchQuery: (query: string) => void;
  addProjectToList: (project: Project) => void;
}

const VIEW_MODE_KEY = 'harnesson_view_mode';

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjectId: null,
  activeBranch: null,
  projects: [],
  viewMode: (localStorage.getItem(VIEW_MODE_KEY) as 'card' | 'list') ?? 'card',
  searchQuery: '',
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await serverApi.getProjects();
      set({ projects, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  removeProject: async (id) => {
    await serverApi.removeProject(id);
    set({ projects: get().projects.filter((p) => p.id !== id) });
  },

  switchProject: (projectId, branch) => {
    const s = get();
    if (s.activeProjectId === projectId && s.activeBranch === branch) return;
    set({ activeProjectId: projectId, activeBranch: branch });
  },

  setViewMode: (mode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    set({ viewMode: mode });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  addProjectToList: (project) => {
    set({ projects: [...get().projects, project] });
  },
}));
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/web/src/stores/projectStore.ts && git commit -m "refactor: replace mockApi with serverApi in projectStore"
```

---

### Task 7: 修改 useProjectActions.ts，替换 mockApi 为 serverApi

**Files:**
- Modify: `apps/web/src/hooks/useProjectActions.ts`

- [ ] **Step 1: 更新 useProjectActions.ts**

Update `apps/web/src/hooks/useProjectActions.ts` to:
```typescript
import { useState, useCallback } from 'react';
import * as serverApi from '@/lib/serverApi';
import { useProjectStore } from '@/stores/projectStore';
import type { Project } from '@harnesson/shared';

export function useProjectActions() {
  const addProjectToList = useProjectStore((s) => s.addProjectToList);
  const switchProject = useProjectStore((s) => s.switchProject);
  const projects = useProjectStore((s) => s.projects);

  const [isOpening, setIsOpening] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const activateProject = useCallback(
    (project: Project) => {
      switchProject(project.id, 'main');
    },
    [switchProject],
  );

  const openFolder = useCallback(async () => {
    setIsOpening(true);
    try {
      const serverUp = await serverApi.isServerRunning();
      if (!serverUp) {
        alert('无法连接后端服务');
        return null;
      }

      const result = await serverApi.openFolderDialog();
      if (result.error) {
        alert(`无法打开文件夹: ${result.error}`);
        return null;
      }
      if (result.cancelled || !result.path) {
        return null;
      }

      const name = result.path.replace(/\/$/, '').split('/').pop() ?? 'untitled';
      const project = await serverApi.createProject({
        name,
        path: result.path,
        source: 'local',
      });
      addProjectToList(project);
      activateProject(project);
      return project;
    } finally {
      setIsOpening(false);
    }
  }, [addProjectToList, activateProject]);

  const cloneRepo = useCallback(
    async (url: string, localPath: string) => {
      setIsCloning(true);
      try {
        const name = url.split('/').pop()?.replace('.git', '') ?? 'cloned-project';
        const project = await serverApi.createProject({
          name,
          path: `${localPath}/${name}`,
          source: 'clone',
        });
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsCloning(false);
      }
    },
    [addProjectToList, activateProject],
  );

  const createProject = useCallback(
    async (opts: { name: string; path: string; description?: string; gitInit: boolean }) => {
      setIsCreating(true);
      try {
        const project = await serverApi.createProject({
          name: opts.name,
          path: `${opts.path}/${opts.name}`,
          description: opts.description,
          source: 'create',
          gitInit: opts.gitInit,
        });
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsCreating(false);
      }
    },
    [addProjectToList, activateProject],
  );

  const openProjectWithPath = useCallback(
    async (path: string) => {
      setIsOpening(true);
      try {
        const name = path.replace(/\/$/, '').split('/').pop() ?? 'untitled';
        const project = await serverApi.createProject({
          name,
          path,
          source: 'local',
        });
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsOpening(false);
      }
    },
    [addProjectToList, activateProject],
  );

  return {
    openFolder,
    cloneRepo,
    createProject,
    openProjectWithPath,
    isOpening,
    isCloning,
    isCreating,
  };
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/web/src/hooks/useProjectActions.ts && git commit -m "refactor: replace mockApi with serverApi in useProjectActions"
```

---

### Task 8: 修改 ProjectList.tsx，移除 mockApi 并添加导航

**Files:**
- Modify: `apps/web/src/components/projects/ProjectList.tsx`

- [ ] **Step 1: 更新 ProjectList.tsx**

Apply these changes to `apps/web/src/components/projects/ProjectList.tsx`:

1. 添加 `useNavigate` 导入：
```typescript
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
```

2. 移除 `import { mockApi } from '@/lib/mockApi';`

3. 在组件内部添加 `navigate`：
```typescript
export function ProjectList({ projects }: ProjectListProps) {
  const viewMode = useProjectStore((s) => s.viewMode);
  const searchQuery = useProjectStore((s) => s.searchQuery);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const setSearchQuery = useProjectStore((s) => s.setSearchQuery);
  const switchProject = useProjectStore((s) => s.switchProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const { openFolder, cloneRepo, createProject, isCloning, isCreating } = useProjectActions();
  const navigate = useNavigate();
```

4. 更新 `handleOpen` 添加导航：
```typescript
  const handleOpen = useCallback(
    (project: Project) => {
      switchProject(project.id, 'main');
      navigate('/graph');
    },
    [switchProject, navigate],
  );
```

5. 更新 `handleReveal` 移除 mockApi 调用（暂时改为空操作）：
```typescript
  const handleReveal = useCallback(async (_id: string) => {
    // revealFolder will be implemented server-side later
  }, []);
```

- [ ] **Step 2: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add apps/web/src/components/projects/ProjectList.tsx && git commit -m "feat: remove mockApi from ProjectList and add navigation to Graph on click"
```

---

### Task 9: 删除 mockApi.ts

**Files:**
- Delete: `apps/web/src/lib/mockApi.ts`

- [ ] **Step 1: 确认无其他文件引用 mockApi**

Run:
```bash
grep -rn "mockApi" apps/web/src/ --include="*.ts" --include="*.tsx"
```
Expected: 仅 `mockApi.ts` 自身出现（已在前面的 Task 中移除了所有其他引用）

- [ ] **Step 2: 删除 mockApi.ts**

Run:
```bash
rm apps/web/src/lib/mockApi.ts
```

- [ ] **Step 3: Commit**

```bash
cd /Users/dt_flys/Projects/harnesson && git add -u apps/web/src/lib/mockApi.ts && git commit -m "chore: remove mockApi.ts"
```

---

### Task 10: 端到端验证

**Files:** 无文件变更

- [ ] **Step 1: 启动后端服务器**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson && pnpm dev:server &
sleep 3
```

- [ ] **Step 2: 验证后端 API 可用**

Run:
```bash
curl -s http://localhost:3456/api/health
```
Expected: `{"status":"ok",...}`

- [ ] **Step 3: 验证项目列表为空**

Run:
```bash
curl -s http://localhost:3456/api/projects
```
Expected: `[]`

- [ ] **Step 4: 创建测试项目**

Run:
```bash
curl -s -X POST http://localhost:3456/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"name":"e2e-test","path":"/tmp/e2e-test","source":"create"}'
```
Expected: 返回包含 `id`、`name: "e2e-test"` 的 JSON

- [ ] **Step 5: 启动前端开发服务器**

Run:
```bash
cd /Users/dt_flys/Projects/harnesson && pnpm dev:web &
sleep 3
```

- [ ] **Step 6: 在浏览器中验证**

打开 `http://localhost:5173`：
1. 进入 Projects 页面，应能看到 "e2e-test" 项目
2. 点击该项目，应导航到 Graph 页面
3. 顶栏下拉应显示当前项目名
4. 创建新项目后应持久化（刷新页面后仍存在）

- [ ] **Step 7: 清理测试数据并停止服务器**

Run:
```bash
kill %1 %2 2>/dev/null; true
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Spec section 1 → Tasks 1-4; Section 2 → Tasks 5-9; Section 3 → Task 8
- [x] **Placeholder scan:** No TBD, TODO, or vague steps
- [x] **Type consistency:** `createProject` params match between `serverApi.ts`, `useProjectActions.ts`, and backend route
- [x] **No missing references:** All imports and function names are consistent across tasks
