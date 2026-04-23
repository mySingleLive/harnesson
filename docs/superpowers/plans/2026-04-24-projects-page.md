# Projects Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured Projects page with empty state (drag & drop support), project list (card/list toggle), and three project creation flows.

**Architecture:** Single-page dual-state component. `ProjectsPage` switches between `EmptyState` and `ProjectList` based on project count. Mock API layer for data persistence. Zustand store manages projects and UI state.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Zustand, lucide-react, Vite

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `packages/shared/src/types/project.ts` | Add `source`, `agentCount` fields |
| Create | `apps/web/src/lib/mockApi.ts` | Mock API client with localStorage persistence |
| Modify | `apps/web/src/stores/projectStore.ts` | Expand with projects list, viewMode, search |
| Create | `apps/web/src/hooks/useProjectActions.ts` | Add-project logic hook |
| Create | `apps/web/src/components/projects/EmptyState.tsx` | Empty state with drag & drop |
| Create | `apps/web/src/components/projects/ActionCard.tsx` | Action card for empty state |
| Create | `apps/web/src/components/projects/ProjectList.tsx` | Project list with header, search, toggle |
| Create | `apps/web/src/components/projects/ProjectCard.tsx` | Card layout item |
| Create | `apps/web/src/components/projects/ProjectRow.tsx` | List layout item |
| Create | `apps/web/src/components/projects/ProjectDetailModal.tsx` | Detail popup |
| Create | `apps/web/src/components/projects/CloneRepoModal.tsx` | Clone repo form |
| Create | `apps/web/src/components/projects/CreateProjectModal.tsx` | Create project form |
| Modify | `apps/web/src/pages/ProjectsPage.tsx` | Wire up empty state vs list |
| Modify | `apps/web/src/globals.css` | Add animation keyframes |

---

### Task 1: Update Project Type

**Files:**
- Modify: `packages/shared/src/types/project.ts`

- [ ] **Step 1: Add `source` and `agentCount` to Project interface**

```typescript
export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  source: 'local' | 'clone' | 'create';
  agentCount: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/types/project.ts
git commit -m "feat: extend Project type with source and agentCount"
```

---

### Task 2: Create Mock API Client

**Files:**
- Create: `apps/web/src/lib/mockApi.ts`

The mock API stores projects in localStorage under key `harnesson_projects` and simulates async behavior with `Promise.resolve()` + short delays.

- [ ] **Step 1: Create mock API module**

```typescript
import type { Project } from '@harnesson/shared';

const STORAGE_KEY = 'harnesson_projects';

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

function readStore(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeStore(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export const mockApi = {
  async getProjects(): Promise<Project[]> {
    await delay(200);
    return readStore();
  },

  async getProject(id: string): Promise<Project | null> {
    await delay(100);
    return readStore().find((p) => p.id === id) ?? null;
  },

  async removeProject(id: string): Promise<void> {
    await delay(200);
    writeStore(readStore().filter((p) => p.id !== id));
  },

  async openFolder(): Promise<Project> {
    await delay(500);
    const project: Project = {
      id: crypto.randomUUID(),
      name: 'my-project',
      path: '/Users/developer/projects/my-project',
      source: 'local',
      agentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStore([...readStore(), project]);
    return project;
  },

  async cloneRepo(url: string, localPath: string): Promise<Project> {
    await delay(1500);
    const name = url.split('/').pop()?.replace('.git', '') ?? 'cloned-project';
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      path: `${localPath}/${name}`,
      source: 'clone',
      agentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStore([...readStore(), project]);
    return project;
  },

  async createProject(opts: {
    name: string;
    path: string;
    description?: string;
    gitInit: boolean;
  }): Promise<Project> {
    await delay(800);
    const project: Project = {
      id: crypto.randomUUID(),
      name: opts.name,
      path: `${opts.path}/${opts.name}`,
      description: opts.description,
      source: 'create',
      agentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStore([...readStore(), project]);
    return project;
  },

  async revealFolder(_id: string): Promise<void> {
    await delay(100);
    // In real app, this opens system file manager
  },
};
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/mockApi.ts
git commit -m "feat: add mock API client for projects"
```

---

### Task 3: Expand Project Store

**Files:**
- Modify: `apps/web/src/stores/projectStore.ts`

- [ ] **Step 1: Replace the entire store file**

```typescript
import { create } from 'zustand';
import type { Project } from '@harnesson/shared';
import { mockApi } from '@/lib/mockApi';

interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  projects: Project[];
  viewMode: 'card' | 'list';
  searchQuery: string;
  isLoading: boolean;
  // actions
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
    const projects = await mockApi.getProjects();
    set({ projects, isLoading: false });
  },

  removeProject: async (id) => {
    await mockApi.removeProject(id);
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

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/projectStore.ts
git commit -m "feat: expand project store with list, view mode, and CRUD actions"
```

---

### Task 4: Create useProjectActions Hook

**Files:**
- Create: `apps/web/src/hooks/useProjectActions.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useState, useCallback } from 'react';
import { mockApi } from '@/lib/mockApi';
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
      const project = await mockApi.openFolder();
      if (projects.some((p) => p.path === project.path)) {
        return null;
      }
      addProjectToList(project);
      activateProject(project);
      return project;
    } finally {
      setIsOpening(false);
    }
  }, [addProjectToList, activateProject, projects]);

  const cloneRepo = useCallback(
    async (url: string, localPath: string) => {
      setIsCloning(true);
      try {
        const project = await mockApi.cloneRepo(url, localPath);
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
        const project = await mockApi.createProject(opts);
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
        if (projects.some((p) => p.path === path)) {
          const existing = projects.find((p) => p.path === path)!;
          activateProject(existing);
          return null;
        }
        const name = path.split('/').pop() ?? 'untitled';
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          path,
          source: 'local' as const,
          agentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsOpening(false);
      }
    },
    [addProjectToList, activateProject, projects],
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

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useProjectActions.ts
git commit -m "feat: add useProjectActions hook for project creation flows"
```

---

### Task 5: Build ActionCard Component

**Files:**
- Create: `apps/web/src/components/projects/ActionCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

export function ActionCard({ icon: Icon, title, description, onClick, className }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col items-center gap-3 rounded-xl border border-transparent p-6',
        'bg-harness-sidebar transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-harness-accent hover:shadow-lg hover:shadow-harness-accent/10',
        'focus:outline-none focus:ring-2 focus:ring-harness-accent/50',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-harness-accent/10 text-harness-accent transition-colors group-hover:bg-harness-accent/20">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-200">{title}</div>
        <div className="mt-1 text-xs text-gray-500">{description}</div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/ActionCard.tsx
git commit -m "feat: add ActionCard component for empty state"
```

---

### Task 6: Build EmptyState Component with Drag & Drop

**Files:**
- Create: `apps/web/src/components/projects/EmptyState.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState, useCallback, type DragEvent } from 'react';
import { FolderOpen, GitBranch, Plus } from 'lucide-react';
import { ActionCard } from './ActionCard';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  onOpenFolder: () => void;
  onCloneRepo: () => void;
  onCreateProject: () => void;
  onDropFolder: (path: string) => void;
  isLoading: boolean;
}

export function EmptyState({ onOpenFolder, onCloneRepo, onCreateProject, onDropFolder, isLoading }: EmptyStateProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      if (!items) return;

      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          onDropFolder(entry.fullPath || (entry as FileSystemDirectoryEntry).name);
          return;
        }
      }

      // Fallback: try file path
      const file = e.dataTransfer.files[0];
      if (file) {
        const path = (file as File & { path?: string }).path;
        if (path) {
          onDropFolder(path);
        }
      }
    },
    [onDropFolder],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex h-full flex-col items-center justify-center p-8 transition-all duration-200',
        isDragOver && 'relative',
      )}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-harness-accent bg-harness-accent/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <FolderOpen className="h-10 w-10 text-harness-accent" />
            <span className="text-sm font-medium text-harness-accent">释放以打开项目文件夹</span>
          </div>
        </div>
      )}

      <div className={cn('flex flex-col items-center gap-8 transition-opacity duration-200', isDragOver && 'opacity-30')}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-gray-100">Harnesson</h1>
          <p className="text-sm text-gray-500">开始你的第一个项目</p>
        </div>

        <div className="grid w-full max-w-xl grid-cols-3 gap-4">
          <ActionCard icon={FolderOpen} title="打开文件夹" description="选择本地项目文件夹" onClick={onOpenFolder} />
          <ActionCard icon={GitBranch} title="克隆仓库" description="从远程 Git 仓库克隆" onClick={onCloneRepo} />
          <ActionCard icon={Plus} title="创建项目" description="创建一个新的空项目" onClick={onCreateProject} />
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-harness-accent border-t-transparent" />
            处理中...
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/EmptyState.tsx
git commit -m "feat: add EmptyState component with drag & drop support"
```

---

### Task 7: Build ProjectCard Component

**Files:**
- Create: `apps/web/src/components/projects/ProjectCard.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { FolderKanban, MoreHorizontal, Eye, FolderOpen, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onReveal: (id: string) => void;
  onRemove: (id: string) => void;
  onViewDetail: (project: Project) => void;
}

export function ProjectCard({ project, onOpen, onReveal, onRemove, onViewDetail }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleRemoveClick = useCallback(() => {
    if (confirmRemove) {
      onRemove(project.id);
      setConfirmRemove(false);
    } else {
      setConfirmRemove(true);
      confirmTimer.current = setTimeout(() => setConfirmRemove(false), 3000);
    }
  }, [confirmRemove, onRemove, project.id]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const timeAgo = formatTimeAgo(project.updatedAt);

  return (
    <div
      onClick={() => onOpen(project)}
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-transparent bg-harness-sidebar p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-harness-accent/50 hover:shadow-lg hover:shadow-harness-accent/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-harness-accent/10">
            <FolderKanban className="h-4 w-4 text-harness-accent" />
          </div>
          <span className="text-sm font-medium text-gray-200">{project.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:bg-white/5 hover:text-gray-300 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <span className="truncate text-xs text-gray-500" title={project.path}>
        {project.path}
      </span>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-600">{timeAgo}</span>
        <div className="relative" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-6 right-0 z-20 w-36 rounded-lg border border-harness-border bg-harness-sidebar py-1 shadow-xl">
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetail(project); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
              >
                <Eye className="h-3.5 w-3.5" />查看详情
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReveal(project.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
              >
                <FolderOpen className="h-3.5 w-3.5" />打开文件夹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5',
                  confirmRemove ? 'text-red-400' : 'text-gray-300',
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmRemove ? '确认移除？' : '移除'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/ProjectCard.tsx
git commit -m "feat: add ProjectCard component with menu and inline remove confirm"
```

---

### Task 8: Build ProjectRow Component

**Files:**
- Create: `apps/web/src/components/projects/ProjectRow.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { FolderKanban, Eye, FolderOpen, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface ProjectRowProps {
  project: Project;
  onOpen: (project: Project) => void;
  onReveal: (id: string) => void;
  onRemove: (id: string) => void;
  onViewDetail: (project: Project) => void;
}

export function ProjectRow({ project, onOpen, onReveal, onRemove, onViewDetail }: ProjectRowProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handleRemoveClick = useCallback(() => {
    if (confirmRemove) {
      onRemove(project.id);
      setConfirmRemove(false);
    } else {
      setConfirmRemove(true);
      confirmTimer.current = setTimeout(() => setConfirmRemove(false), 3000);
    }
  }, [confirmRemove, onRemove, project.id]);

  const timeAgo = formatTimeAgo(project.updatedAt);

  return (
    <div
      onClick={() => onOpen(project)}
      className="group flex cursor-pointer items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/[0.03]"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-harness-accent/10">
        <FolderKanban className="h-4 w-4 text-harness-accent" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-200">{project.name}</div>
      </div>

      <div className="hidden min-w-0 flex-1 truncate text-xs text-gray-500 md:block">{project.path}</div>

      <span className="flex-shrink-0 text-[11px] text-gray-600">{timeAgo}</span>

      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetail(project); }}
          className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300"
          title="查看详情"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReveal(project.id); }}
          className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300"
          title="打开文件夹"
        >
          <FolderOpen className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
          className={cn(
            'rounded p-1 hover:bg-white/5',
            confirmRemove ? 'text-red-400' : 'text-gray-500 hover:text-gray-300',
          )}
          title={confirmRemove ? '确认移除？' : '移除'}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/ProjectRow.tsx
git commit -m "feat: add ProjectRow component with inline remove confirm"
```

---

### Task 9: Extract Shared formatTimeAgo Utility

Both `ProjectCard` and `ProjectRow` duplicate `formatTimeAgo`. Extract it.

**Files:**
- Create: `apps/web/src/lib/time.ts`
- Modify: `apps/web/src/components/projects/ProjectCard.tsx`
- Modify: `apps/web/src/components/projects/ProjectRow.tsx`

- [ ] **Step 1: Create time utility**

```typescript
export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}
```

- [ ] **Step 2: Update ProjectCard — replace local `formatTimeAgo` function with import**

In `ProjectCard.tsx`, remove the local `formatTimeAgo` function at the bottom of the file and add:
```typescript
import { formatTimeAgo } from '@/lib/time';
```

- [ ] **Step 3: Update ProjectRow — replace local `formatTimeAgo` function with import**

In `ProjectRow.tsx`, remove the local `formatTimeAgo` function at the bottom of the file and add:
```typescript
import { formatTimeAgo } from '@/lib/time';
```

- [ ] **Step 4: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/time.ts apps/web/src/components/projects/ProjectCard.tsx apps/web/src/components/projects/ProjectRow.tsx
git commit -m "refactor: extract shared formatTimeAgo utility"
```

---

### Task 10: Build ProjectDetailModal Component

**Files:**
- Create: `apps/web/src/components/projects/ProjectDetailModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { X } from 'lucide-react';
import type { Project } from '@harnesson/shared';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
}

const sourceLabels: Record<Project['source'], string> = {
  local: '本地文件夹',
  clone: 'Git 克隆',
  create: '手动创建',
};

export function ProjectDetailModal({ project, onClose, onOpen, onDelete }: ProjectDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-harness-border bg-harness-sidebar p-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-harness-border px-5 py-3">
          <span className="text-sm font-medium text-gray-200">项目详情</span>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 py-4">
          <DetailRow label="名称" value={project.name} />
          <DetailRow label="路径" value={project.path} />
          <DetailRow label="来源" value={sourceLabels[project.source]} />
          {project.description && <DetailRow label="描述" value={project.description} />}
          <DetailRow
            label="Agent"
            value={project.agentCount > 0 ? `${project.agentCount} 个活跃` : ''}
            fallback="无活跃 Agent"
            fallbackClassName="text-gray-600"
          />
          <DetailRow label="创建" value={new Date(project.createdAt).toLocaleDateString('zh-CN')} />
          <DetailRow label="更新" value={new Date(project.updatedAt).toLocaleDateString('zh-CN')} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-harness-border px-5 py-3">
          <button
            onClick={() => onDelete(project.id)}
            className="rounded-md px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10"
          >
            删除
          </button>
          <button
            onClick={() => { onOpen(project); onClose(); }}
            className="rounded-md bg-harness-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90"
          >
            打开项目
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  fallback,
  fallbackClassName,
}: {
  label: string;
  value: string;
  fallback?: string;
  fallbackClassName?: string;
}) {
  const displayValue = value || fallback;
  const isFallback = !value && fallback;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={isFallback ? fallbackClassName : 'text-gray-200'}>{displayValue}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/ProjectDetailModal.tsx
git commit -m "feat: add ProjectDetailModal component"
```

---

### Task 11: Build CloneRepoModal Component

**Files:**
- Create: `apps/web/src/components/projects/CloneRepoModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CloneRepoModalProps {
  onClose: () => void;
  onClone: (url: string, localPath: string) => Promise<unknown>;
  isCloning: boolean;
}

export function CloneRepoModal({ onClose, onClone, isCloning }: CloneRepoModalProps) {
  const [url, setUrl] = useState('');
  const [localPath, setLocalPath] = useState('~/projects');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setError('');
    try {
      await onClone(url.trim(), localPath.trim() || '~/projects');
      onClose();
    } catch {
      setError('克隆失败，请检查仓库地址');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-harness-border bg-harness-sidebar shadow-2xl">
        <div className="flex items-center justify-between border-b border-harness-border px-5 py-3">
          <span className="text-sm font-medium text-gray-200">克隆 Git 仓库</span>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">仓库 URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">本地存放路径</label>
            <input
              type="text"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="~/projects"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          {isCloning && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              克隆中...
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-harness-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url.trim() || isCloning}
            className="rounded-md bg-harness-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            克隆
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/CloneRepoModal.tsx
git commit -m "feat: add CloneRepoModal component"
```

---

### Task 12: Build CreateProjectModal Component

**Files:**
- Create: `apps/web/src/components/projects/CreateProjectModal.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (opts: { name: string; path: string; description?: string; gitInit: boolean }) => Promise<unknown>;
  isCreating: boolean;
}

export function CreateProjectModal({ onClose, onCreate, isCreating }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('~/projects');
  const [description, setDescription] = useState('');
  const [gitInit, setGitInit] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await onCreate({ name: name.trim(), path: path.trim() || '~/projects', description: description.trim() || undefined, gitInit });
      onClose();
    } catch {
      setError('创建失败，请检查路径');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-harness-border bg-harness-sidebar shadow-2xl">
        <div className="flex items-center justify-between border-b border-harness-border px-5 py-3">
          <span className="text-sm font-medium text-gray-200">创建新项目</span>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">项目名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-project"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">项目路径</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="~/projects"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">描述（选填）</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="项目描述..."
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={gitInit}
              onChange={(e) => setGitInit(e.target.checked)}
              className="accent-harness-accent"
            />
            初始化 Git 仓库
          </label>

          {error && <div className="text-xs text-red-400">{error}</div>}

          {isCreating && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              创建中...
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-harness-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isCreating}
            className="rounded-md bg-harness-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/CreateProjectModal.tsx
git commit -m "feat: add CreateProjectModal component"
```

---

### Task 13: Build ProjectList Component

**Files:**
- Create: `apps/web/src/components/projects/ProjectList.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { useState, useMemo, useCallback } from 'react';
import { Search, LayoutGrid, List, Plus, FolderOpen, GitBranch } from 'lucide-react';
import type { Project } from '@harnesson/shared';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectActions } from '@/hooks/useProjectActions';
import { mockApi } from '@/lib/mockApi';
import { ProjectCard } from './ProjectCard';
import { ProjectRow } from './ProjectRow';
import { ProjectDetailModal } from './ProjectDetailModal';
import { CloneRepoModal } from './CloneRepoModal';
import { CreateProjectModal } from './CreateProjectModal';
import { cn } from '@/lib/utils';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const viewMode = useProjectStore((s) => s.viewMode);
  const searchQuery = useProjectStore((s) => s.searchQuery);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const setSearchQuery = useProjectStore((s) => s.setSearchQuery);
  const switchProject = useProjectStore((s) => s.switchProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const { openFolder, cloneRepo, createProject, isCloning, isCreating } = useProjectActions();

  const [menuOpen, setMenuOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const handleOpen = useCallback(
    (project: Project) => switchProject(project.id, 'main'),
    [switchProject],
  );

  const handleReveal = useCallback(async (id: string) => {
    await mockApi.revealFolder(id);
  }, []);

  const handleOpenFolder = useCallback(async () => {
    await openFolder();
  }, [openFolder]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-harness-border px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-200">项目</h1>
          <span className="rounded-full bg-harness-accent/20 px-2 py-0.5 text-[11px] text-harness-accent">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="w-48 rounded-lg border border-harness-border bg-harness-content py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-harness-border">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                'rounded-l-lg p-1.5 transition-colors',
                viewMode === 'card' ? 'bg-harness-accent/20 text-harness-accent' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-r-lg p-1.5 transition-colors',
                viewMode === 'list' ? 'bg-harness-accent/20 text-harness-accent' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add project */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 rounded-lg bg-harness-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90"
            >
              <Plus className="h-3.5 w-3.5" />
              添加项目
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-harness-border bg-harness-sidebar py-1 shadow-xl">
                  <button
                    onClick={() => { handleOpenFolder(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    打开文件夹
                  </button>
                  <button
                    onClick={() => { setShowCloneModal(true); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    克隆仓库
                  </button>
                  <button
                    onClick={() => { setShowCreateModal(true); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    创建项目
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 && searchQuery ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            未找到匹配的项目
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onReveal={handleReveal}
                onRemove={removeProject}
                onViewDetail={setDetailProject}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onReveal={handleReveal}
                onRemove={removeProject}
                onViewDetail={setDetailProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onOpen={handleOpen}
          onDelete={(id) => { removeProject(id); setDetailProject(null); }}
        />
      )}
      {showCloneModal && (
        <CloneRepoModal
          onClose={() => setShowCloneModal(false)}
          onClone={cloneRepo}
          isCloning={isCloning}
        />
      )}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createProject}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/projects/ProjectList.tsx
git commit -m "feat: add ProjectList component with search, toggle, and modals"
```

---

### Task 14: Wire Up ProjectsPage

**Files:**
- Modify: `apps/web/src/pages/ProjectsPage.tsx`

- [ ] **Step 1: Replace the entire page component**

```typescript
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectActions } from '@/hooks/useProjectActions';
import { EmptyState } from '@/components/projects/EmptyState';
import { ProjectList } from '@/components/projects/ProjectList';

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const { openFolder, openProjectWithPath, isOpening } = useProjectActions();

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-harness-accent border-t-transparent" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        onOpenFolder={openFolder}
        onCloneRepo={() => setShowCloneModal(true)}
        onCreateProject={() => setShowCreateModal(true)}
        onDropFolder={openProjectWithPath}
        isLoading={isOpening}
      />
    );
  }

  return <ProjectList projects={projects} />;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ProjectsPage.tsx
git commit -m "feat: wire up ProjectsPage with empty state and project list"
```

---

### Task 15: Add CSS Animations

**Files:**
- Modify: `apps/web/src/globals.css`

- [ ] **Step 1: Add modal and stagger animations after the existing keyframes**

Append to `globals.css` after the existing `pulse-scale` keyframe:

```css
/* Modal animations */
@keyframes modal-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-content-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.fixed.inset-0 {
  animation: modal-backdrop-in 150ms ease-out;
}

.fixed.inset-0 > .relative {
  animation: modal-content-in 200ms ease-out;
}

/* Stagger animation for project items */
@keyframes fade-slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Note: The modal backdrop and content animations use direct CSS selectors on the existing class patterns from our modal components. The stagger animation is available for future use on list items.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/globals.css
git commit -m "feat: add modal and stagger animation keyframes"
```

---

### Task 16: Fix EmptyState Modal Wiring

The ProjectsPage currently has `showCloneModal` and `showCreateModal` state but doesn't render the modals. The modals are managed inside `ProjectList` when there are projects, but need to be shown from `ProjectsPage` when in empty state.

**Files:**
- Modify: `apps/web/src/pages/ProjectsPage.tsx`

- [ ] **Step 1: Add modal imports and rendering**

Update `ProjectsPage.tsx` to import and render the modals:

```typescript
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectActions } from '@/hooks/useProjectActions';
import { EmptyState } from '@/components/projects/EmptyState';
import { ProjectList } from '@/components/projects/ProjectList';
import { CloneRepoModal } from '@/components/projects/CloneRepoModal';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const { openFolder, openProjectWithPath, cloneRepo, createProject, isOpening, isCloning, isCreating } = useProjectActions();

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-harness-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {projects.length === 0 ? (
        <EmptyState
          onOpenFolder={openFolder}
          onCloneRepo={() => setShowCloneModal(true)}
          onCreateProject={() => setShowCreateModal(true)}
          onDropFolder={openProjectWithPath}
          isLoading={isOpening}
        />
      ) : (
        <ProjectList projects={projects} />
      )}

      {showCloneModal && (
        <CloneRepoModal
          onClose={() => setShowCloneModal(false)}
          onClone={cloneRepo}
          isCloning={isCloning}
        />
      )}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createProject}
          isCreating={isCreating}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ProjectsPage.tsx
git commit -m "fix: wire up clone and create modals in ProjectsPage empty state"
```

---

### Task 17: Build & Visual Verification

- [ ] **Step 1: Start dev server and verify**

```bash
cd apps/web && pnpm dev
```

Navigate to `http://localhost:5173/projects` and verify:
1. Empty state shows three action cards
2. Drag & drop overlay appears when dragging files
3. Click "创建项目" → modal appears → fill in → project added → switches to list view
4. Card/list toggle works
5. Search filters projects
6. Project detail modal shows correct info
7. Layout is clean with no visual glitches

- [ ] **Step 2: Fix any visual issues found during testing**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: polish Projects page visual issues"
```
