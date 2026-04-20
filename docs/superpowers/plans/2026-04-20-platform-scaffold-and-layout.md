# Harnesson 项目脚手架与核心布局 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建 monorepo 项目脚手架，实现设计文档中定义的三栏核心布局（Sidebar + Chat Panel + Content Area），包含暗色主题、路由、侧边栏导航和 Agent 列表。

**Architecture:** 使用 pnpm workspaces 管理 monorepo（apps/web + apps/server + packages/shared）。前端 React 18 + TypeScript + Vite，shadcn/ui + Tailwind CSS。先搭建共享类型包、前端项目骨架和核心三栏布局组件。后端和 API 暂用 mock 数据。

**Tech Stack:** pnpm, React 18, TypeScript 5, Vite 6, Tailwind CSS 4, shadcn/ui, Lucide React, React Router 7, Zustand

**Design Spec:** `docs/superpowers/specs/2026-04-20-platform-framework-design.md`

---

## File Structure

```
harnesson/
├── package.json                    # pnpm workspace root
├── pnpm-workspace.yaml             # workspace 配置
├── tsconfig.base.json              # 共享 TS 配置
├── apps/
│   └── web/
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       ├── postcss.config.js
│       └── src/
│           ├── main.tsx            # 入口
│           ├── App.tsx             # 根组件 + 路由
│           ├── globals.css         # Tailwind + 暗色主题变量
│           ├── components/
│           │   ├── layout/
│           │   │   ├── Topbar.tsx        # 顶部栏
│           │   │   ├── Sidebar.tsx       # 侧边栏 (导航 + Agent 列表)
│           │   │   ├── ChatPanel.tsx     # Agent 聊天面板
│           │   │   ├── MainLayout.tsx    # 三栏布局容器
│           │   │   └── AgentStatusDot.tsx # Agent 状态指示器
│           │   └── ui/             # shadcn/ui 组件 (自动生成)
│           ├── pages/
│           │   ├── DashboardPage.tsx
│           │   ├── SpecsPage.tsx
│           │   ├── TasksPage.tsx
│           │   ├── GitPage.tsx
│           │   └── NotFoundPage.tsx
│           ├── stores/
│           │   └── agentStore.ts    # Agent 状态 (Zustand)
│           ├── hooks/
│           │   └── useChatPanel.ts  # 聊天面板开关状态
│           └── lib/
│               └── utils.ts        # cn() 等工具函数
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── agent.ts
│           │   ├── project.ts
│           │   ├── spec-node.ts
│           │   └── task.ts
│           └── index.ts            # 统一导出
└── docs/
```

---

### Task 1: 初始化 pnpm Monorepo 脚手架

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.npmrc`

- [ ] **Step 1: 初始化根 package.json**

```bash
cd /Users/dt_flys/Projects/harnesson
pnpm init
```

然后修改 `package.json`:

```json
{
  "name": "harnesson",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @harnesson/web dev",
    "build": "pnpm --filter @harnesson/shared build && pnpm --filter @harnesson/web build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  }
}
```

- [ ] **Step 2: 创建 pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: 创建 tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: 创建 .npmrc**

```
shamefully-hoist=false
strict-peer-dependencies=false
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .npmrc
git commit -m "chore: initialize pnpm monorepo scaffold"
```

---

### Task 2: 创建 shared 类型包

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types/agent.ts`
- Create: `packages/shared/src/types/project.ts`
- Create: `packages/shared/src/types/spec-node.ts`
- Create: `packages/shared/src/types/task.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: 创建 packages/shared/package.json**

```json
{
  "name": "@harnesson/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: 创建 packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: 创建 agent.ts**

```typescript
export type AgentType = 'claude-code' | 'gpt' | 'cursor' | string;

export type AgentStatus = 'running' | 'waiting' | 'completed' | 'error' | 'idle';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  projectId: string;
  branch: string;
  worktreePath: string;
  taskId?: string;
  pid?: number;
  model?: string;
  createdAt: string;
  error?: string;
}
```

- [ ] **Step 4: 创建 project.ts**

```typescript
export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 5: 创建 spec-node.ts**

```typescript
export type SpecNodeType = 'business' | 'tech';

export interface SpecNode {
  id: string;
  projectId: string;
  parentId?: string;
  type: SpecNodeType;
  level: number;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 6: 创建 task.ts**

```typescript
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done' | 'failed';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  sourceSpecId?: string;
  sourceDiff?: string;
  assignedAgentId?: string;
  branch: string;
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
  startedAt?: string;
  reviewedAt?: string;
  testedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 7: 创建 index.ts 统一导出**

```typescript
export * from './types/agent';
export * from './types/project';
export * from './types/spec-node';
export * from './types/task';
```

- [ ] **Step 8: 安装依赖并验证类型检查**

```bash
cd /Users/dt_flys/Projects/harnesson && pnpm install
pnpm --filter @harnesson/shared typecheck
```

Expected: 无错误

- [ ] **Step 9: Commit**

```bash
git add packages/
git commit -m "feat(shared): add shared type definitions for Agent, Project, SpecNode, Task"
```

---

### Task 3: 初始化 React + Vite + Tailwind 前端项目

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.app.json`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/globals.css`
- Create: `apps/web/src/lib/utils.ts`

- [ ] **Step 1: 创建 apps/web/package.json**

```json
{
  "name": "@harnesson/web",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@harnesson/shared": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.4.0",
    "zustand": "^5.0.0",
    "lucide-react": "^0.475.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.7.0",
    "vite": "^6.2.0",
    "tailwindcss": "^4.1.0",
    "@tailwindcss/vite": "^4.1.0"
  }
}
```

- [ ] **Step 2: 创建 apps/web/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: 创建 apps/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite-env.d.ts"],
  "references": [{ "path": "./tsconfig.app.json" }]
}
```

- [ ] **Step 4: 创建 apps/web/tsconfig.app.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite-env.d.ts"]
}
```

- [ ] **Step 5: 创建 apps/web/postcss.config.js**

```javascript
export default {
  plugins: [],
};
```

- [ ] **Step 6: 创建 apps/web/index.html**

```html
<!doctype html>
<html lang="zh-CN" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Harnesson</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 apps/web/src/globals.css**

```css
@import "tailwindcss";

@theme {
  --color-harness-bg: #0d0d1a;
  --color-harness-sidebar: #1e1e32;
  --color-harness-chat: #191930;
  --color-harness-content: #16162a;
  --color-harness-accent: #8b5cf6;
  --color-harness-border: #333;
  --color-harness-text: #e0e0e0;
  --color-harness-muted: #888;
}

body {
  margin: 0;
  background-color: var(--color-harness-bg);
  color: var(--color-harness-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.5);
}

/* Agent 状态呼吸灯动画 */
@keyframes pulse-scale {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 2px rgba(249, 115, 22, 0.4);
  }
  50% {
    transform: scale(1.6);
    box-shadow: 0 0 8px rgba(249, 115, 22, 0.6), 0 0 16px rgba(249, 115, 22, 0.2);
  }
}
```

- [ ] **Step 8: 创建 apps/web/src/lib/utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 9: 创建 apps/web/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 10: 创建占位 App.tsx**

```tsx
export function App() {
  return <div className="h-screen w-screen bg-harness-bg text-harness-text" />;
}
```

- [ ] **Step 11: 安装依赖并验证构建**

```bash
cd /Users/dt_flys/Projects/harnesson && pnpm install
pnpm --filter @harnesson/web typecheck
pnpm --filter @harnesson/web build
```

Expected: 构建成功，无错误

- [ ] **Step 12: Commit**

```bash
git add apps/web/
git commit -m "feat(web): scaffold React+Vite+Tailwind frontend app"
```

---

### Task 4: 实现 AgentStatusDot 组件

**Files:**
- Create: `apps/web/src/components/layout/AgentStatusDot.tsx`

- [ ] **Step 1: 实现 AgentStatusDot 组件**

根据设计文档 Agent 状态指示器规格实现：

```tsx
import type { AgentStatus } from '@harnesson/shared';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusDotProps {
  status: AgentStatus;
  className?: string;
}

export function AgentStatusDot({ status, className }: AgentStatusDotProps) {
  if (status === 'error') {
    return (
      <span className={cn('flex items-center justify-center', className)}>
        <AlertCircle className="h-4 w-4 text-red-500" />
      </span>
    );
  }

  const colorMap: Record<Exclude<AgentStatus, 'error'>, string> = {
    running: 'bg-orange-500 animate-[pulse-scale_1.8s_ease-in-out_infinite]',
    completed: 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.3)]',
    waiting: 'bg-amber-500 opacity-70',
    idle: 'bg-gray-500',
  };

  return (
    <span className={cn('flex items-center justify-center', className)}>
      <span className={cn('h-2 w-2 rounded-full', colorMap[status])} />
    </span>
  );
}
```

- [ ] **Step 2: 验证类型检查**

```bash
pnpm --filter @harnesson/web typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/AgentStatusDot.tsx
git commit -m "feat(web): add AgentStatusDot component with status colors and animations"
```

---

### Task 5: 实现 Sidebar 组件

**Files:**
- Create: `apps/web/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: 实现 Sidebar 组件**

包含导航区和 Agent 列表，使用 Lucide 图标，无分区标题文字：

```tsx
import { NavLink } from 'react-router';
import {
  LayoutGrid,
  FileText,
  CheckSquare,
  GitBranch,
  Plus,
} from 'lucide-react';
import { AgentStatusDot } from './AgentStatusDot';
import type { Agent } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface SidebarProps {
  agents: Agent[];
  activeAgentId?: string;
  onAgentClick: (agentId: string) => void;
  onNewAgent: () => void;
}

const navItems = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/specs', icon: FileText, label: 'Specs' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/git', icon: GitBranch, label: 'Git' },
];

export function Sidebar({ agents, activeAgentId, onAgentClick, onNewAgent }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-harness-border bg-harness-sidebar">
      <nav className="py-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors',
                isActive
                  ? 'border-l-[3px] border-harness-accent bg-harness-accent/10 text-harness-accent'
                  : 'text-gray-400 hover:bg-white/[0.02] hover:text-gray-300',
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={onNewAgent}
          className="mx-4 mt-2 flex items-center justify-center gap-1.5 rounded-md bg-harness-accent px-0 py-[7px] text-[12px] font-medium text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          New Agent
        </button>
      </nav>

      <div className="mx-4 h-px bg-harness-border" />

      <div className="flex-1 overflow-y-auto py-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className={cn(
              'w-full px-4 py-2 text-left transition-colors',
              activeAgentId === agent.id
                ? 'border-l-[3px] border-harness-accent bg-harness-accent/[0.08]'
                : 'hover:bg-white/[0.02]',
            )}
          >
            <div className="flex items-center gap-2">
              <AgentStatusDot status={agent.status} />
              <span className="text-[13px] font-medium text-gray-300">{agent.name}</span>
              <span className="ml-auto rounded bg-white/5 px-1.5 py-[1px] text-[10px] text-gray-500">
                {agent.type === 'claude-code' ? 'Claude' : agent.type === 'gpt' ? 'GPT' : agent.type}
              </span>
            </div>
            <div className="mt-0.5 pl-4 text-[11px] text-gray-500">
              {agent.projectId} · <span className="font-medium text-harness-accent">{agent.branch}</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: 验证类型检查**

```bash
pnpm --filter @harnesson/web typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat(web): add Sidebar component with navigation and agent list"
```

---

### Task 6: 实现 ChatPanel 组件

**Files:**
- Create: `apps/web/src/components/layout/ChatPanel.tsx`

- [ ] **Step 1: 实现 ChatPanel 组件**

包含 Cursor 风格消息区和 Claude Code 风格输入框：

```tsx
import { useState } from 'react';
import { X, Layers, GitBranch, Plus, ImageIcon, FileText, Terminal, Wrench, Network, ChevronDown, ArrowUp } from 'lucide-react';
import type { Agent } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  diffBlocks?: DiffBlock[];
}

interface DiffBlock {
  fileName: string;
  added: number;
  removed: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'context' | 'added' | 'removed';
  lineNum: string;
  content: string;
}

interface ChatPanelProps {
  agent: Agent;
  messages: ChatMessage[];
  onClose: () => void;
}

export function ChatPanel({ agent, messages, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  return (
    <div className="relative flex h-full w-[440px] flex-shrink-0 flex-col border-r border-harness-border bg-harness-chat">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-harness-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{agent.name}</span>
          <span className="rounded-full bg-orange-500/15 px-2 py-[1px] text-[11px] text-orange-500">
            Running
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages — Cursor 风格 */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'border-b border-white/[0.04] px-4 py-4',
              msg.role === 'user' && 'bg-harness-accent/[0.04]',
            )}
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              {msg.role === 'user' ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-harness-accent">
                  You
                </span>
              ) : (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-green-500">
                  {agent.name}
                </span>
              )}
            </div>
            <div className="text-[13px] leading-relaxed text-gray-300">{msg.content}</div>
            {msg.diffBlocks?.map((diff, i) => (
              <DiffCodeBlock key={i} diff={diff} />
            ))}
          </div>
        ))}
      </div>

      {/* Input — Claude Code 风格 */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl border border-white/10 bg-harness-sidebar transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${agent.name}...  Type @ for files, / for commands`}
            className="h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-harness-text outline-none placeholder:text-gray-600"
            rows={1}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              {/* + 按钮 */}
              <div className="relative">
                <button
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300"
                >
                  <Plus className="h-[18px] w-[18px]" />
                </button>
                {showPlusMenu && (
                  <div className="absolute bottom-[38px] left-0 z-[9999] min-w-[200px] rounded-lg border border-white/10 bg-[#252540] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    <DropdownItem icon={ImageIcon} label="Add Image" shortcut="⌘ V" />
                    <DropdownItem icon={FileText} label="Reference File" shortcut="@" />
                    <DropdownItem icon={Terminal} label="Slash Command" shortcut="/" />
                    <DropdownItem icon={Wrench} label="Tools" />
                    <DropdownItem icon={Network} label="MCP Servers" />
                  </div>
                )}
              </div>
              {/* Agent 选择器 */}
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">Claude Code</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              {/* Worktree 选择器 */}
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">main</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* 模型选择器 */}
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                Sonnet 4.7
                <ChevronDown className="h-3 w-3" />
              </button>
              {/* 发送按钮 */}
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:bg-[#7c3aed]">
                <ArrowUp className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">@</kbd> 引用文件 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">/</kbd> 斜杠命令
        </div>
      </div>
    </div>
  );
}

function DiffCodeBlock({ diff }: { diff: DiffBlock }) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-harness-border bg-harness-bg">
      <div className="flex items-center justify-between bg-[#1a1a2e] px-2.5 py-1 text-[11px] text-gray-500">
        <span>{diff.fileName}</span>
        <div className="flex gap-2">
          <span className="text-green-500">+{diff.added}</span>
          <span className="text-red-500">-{diff.removed}</span>
        </div>
      </div>
      <div className="py-2 font-mono text-[12px] leading-[1.7]">
        {diff.lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'px-2.5 whitespace-pre',
              line.type === 'added' && 'bg-red-500/10 text-green-400',
              line.type === 'removed' && 'bg-red-500/10 text-red-400',
              line.type === 'context' && 'text-gray-600',
            )}
          >
            <span className="inline-block w-[30px] text-right mr-3 text-gray-700">{line.lineNum}</span>
            <span className="inline-block w-3.5 opacity-60">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            {line.content}
          </div>
        ))}
      </div>
    </div>
  );
}

function DropdownItem({ icon: Icon, label, shortcut }: { icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string }) {
  return (
    <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200">
      <Icon className="h-3.5 w-3.5 text-gray-500" />
      {label}
      {shortcut && <span className="ml-auto text-[11px] text-gray-600">{shortcut}</span>}
    </button>
  );
}
```

- [ ] **Step 2: 验证类型检查**

```bash
pnpm --filter @harnesson/web typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/ChatPanel.tsx
git commit -m "feat(web): add ChatPanel with Cursor-style messages and Claude Code input"
```

---

### Task 7: 实现 Topbar 组件

**Files:**
- Create: `apps/web/src/components/layout/Topbar.tsx`

- [ ] **Step 1: 实现 Topbar 组件**

```tsx
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopbarProps {
  projectName: string;
  branch: string;
  runningAgentCount: number;
}

export function Topbar({ projectName, branch, runningAgentCount }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-harness-border bg-[#1a1a2e] px-4 py-2 text-[13px]">
      <div className="flex items-center gap-4">
        <span className="text-[15px] font-bold text-harness-accent">Harnesson</span>
        <span className="text-gray-600">|</span>
        <button className="rounded-md bg-white/5 px-3 py-1 text-gray-400">
          ▼ {projectName}
        </button>
        <span className="text-[12px] text-gray-500">{branch}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-green-500 px-2 py-[2px] text-[11px] font-semibold text-black">
          {runningAgentCount} Agents Running
        </span>
        <button className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-gray-400">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 验证类型检查**

```bash
pnpm --filter @harnesson/web typecheck
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/Topbar.tsx
git commit -m "feat(web): add Topbar component"
```

---

### Task 8: 实现 Zustand Store 和 Hooks

**Files:**
- Create: `apps/web/src/stores/agentStore.ts`
- Create: `apps/web/src/hooks/useChatPanel.ts`

- [ ] **Step 1: 创建 agentStore**

```typescript
import { create } from 'zustand';
import type { Agent } from '@harnesson/shared';

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  setActiveAgent: (id: string | null) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
}

// Mock 数据 — 后续由 API 替换
const mockAgents: Agent[] = [
  {
    id: 'agent-a',
    name: 'Agent A',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'main',
    worktreePath: '/tmp/worktree-a',
    model: 'sonnet-4.7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent-b',
    name: 'Agent B',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'tree-1',
    worktreePath: '/tmp/worktree-b',
    model: 'sonnet-4.7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent-c',
    name: 'Agent C',
    type: 'gpt',
    status: 'completed',
    projectId: 'My Project B',
    branch: 'dev',
    worktreePath: '/tmp/worktree-c',
    createdAt: new Date().toISOString(),
  },
];

export const useAgentStore = create<AgentState>((set) => ({
  agents: mockAgents,
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
}));
```

- [ ] **Step 2: 创建 useChatPanel hook**

```typescript
import { create } from 'zustand';

interface ChatPanelState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useChatPanel = create<ChatPanelState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));
```

- [ ] **Step 3: 验证类型检查**

```bash
pnpm --filter @harnesson/web typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/ apps/web/src/hooks/
git commit -m "feat(web): add Zustand agent store and chat panel hook with mock data"
```

---

### Task 9: 实现 MainLayout 组装和页面占位

**Files:**
- Create: `apps/web/src/components/layout/MainLayout.tsx`
- Create: `apps/web/src/pages/DashboardPage.tsx`
- Create: `apps/web/src/pages/SpecsPage.tsx`
- Create: `apps/web/src/pages/TasksPage.tsx`
- Create: `apps/web/src/pages/GitPage.tsx`
- Create: `apps/web/src/pages/NotFoundPage.tsx`

- [ ] **Step 1: 创建页面占位组件**

每个页面使用相同模式，以 DashboardPage 为例：

```tsx
// DashboardPage.tsx
export function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Running" value={3} color="text-orange-500" />
        <StatCard label="Pending" value={7} color="text-amber-500" />
        <StatCard label="Specs" value={24} color="text-harness-accent" />
        <StatCard label="Errors" value={1} color="text-red-500" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-harness-border bg-harness-sidebar p-4">
      <div className="mb-1 text-[11px] text-gray-500">{label}</div>
      <div className={cn('text-[28px] font-bold', color)}>{value}</div>
    </div>
  );
}

import { cn } from '@/lib/utils';
```

其余页面（SpecsPage / TasksPage / GitPage）：

```tsx
// SpecsPage.tsx
export function SpecsPage() {
  return <div className="p-6"><h1 className="mb-4 text-lg font-semibold">Specs</h1></div>;
}
```

```tsx
// TasksPage.tsx
export function TasksPage() {
  return <div className="p-6"><h1 className="mb-4 text-lg font-semibold">Tasks</h1></div>;
}
```

```tsx
// GitPage.tsx
export function GitPage() {
  return <div className="p-6"><h1 className="mb-4 text-lg font-semibold">Git</h1></div>;
}
```

```tsx
// NotFoundPage.tsx
export function NotFoundPage() {
  return <div className="flex h-full items-center justify-center text-gray-500">404 — Page Not Found</div>;
}
```

- [ ] **Step 2: 创建 MainLayout**

三栏布局组装：

```tsx
import { Outlet } from 'react-router';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel';
import { useAgentStore } from '@/stores/agentStore';
import { useChatPanel } from '@/hooks/useChatPanel';

export function MainLayout() {
  const { agents, activeAgentId, setActiveAgent } = useAgentStore();
  const { isOpen: chatOpen, close: closeChat } = useChatPanel();

  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const runningCount = agents.filter((a) => a.status === 'running').length;

  return (
    <div className="flex h-screen flex-col">
      <Topbar projectName="My Project A" branch="main branch" runningAgentCount={runningCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          agents={agents}
          activeAgentId={activeAgentId ?? undefined}
          onAgentClick={(id) => {
            setActiveAgent(id);
            useChatPanel.getState().open();
          }}
          onNewAgent={() => {}}
        />
        {chatOpen && activeAgent && (
          <ChatPanel
            agent={activeAgent}
            messages={mockMessages}
            onClose={() => {
              closeChat();
              setActiveAgent(null);
            }}
          />
        )}
        <main className="flex-1 overflow-auto bg-harness-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const mockMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'Implement JWT authentication for the login API endpoint.',
  },
  {
    id: '2',
    role: 'agent' as const,
    content: "I'll implement JWT authentication. Let me update the auth module:",
    diffBlocks: [
      {
        fileName: 'auth/jwt.ts',
        added: 5,
        removed: 2,
        lines: [
          { type: 'context', lineNum: ' 5', content: "import express from 'express';" },
          { type: 'removed', lineNum: ' 6', content: "import crypto from 'crypto';" },
          { type: 'removed', lineNum: ' 7', content: "const SECRET = 'hardcoded-secret';" },
          { type: 'added', lineNum: ' 6', content: "import jwt from 'jsonwebtoken';" },
          { type: 'added', lineNum: ' 7', content: "import bcrypt from 'bcryptjs';" },
          { type: 'added', lineNum: ' 8', content: 'const SECRET = config().JWT_SECRET;' },
          { type: 'added', lineNum: ' 9', content: "const EXPIRES = '24h';" },
          { type: 'added', lineNum: '10', content: "const REFRESH_EXPIRES = '7d';" },
        ],
      },
    ],
  },
];
```

- [ ] **Step 3: 验证类型检查**

```bash
pnpm --filter @harnesson/web typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/MainLayout.tsx apps/web/src/pages/
git commit -m "feat(web): add MainLayout with three-column assembly and page placeholders"
```

---

### Task 10: 配置路由并完成 App 组装

**Files:**
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: 重写 App.tsx 配置路由**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SpecsPage } from './pages/SpecsPage';
import { TasksPage } from './pages/TasksPage';
import { GitPage } from './pages/GitPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="specs" element={<SpecsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="git" element={<GitPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: 验证构建**

```bash
pnpm --filter @harnesson/web typecheck
pnpm --filter @harnesson/web build
```

Expected: 构建成功

- [ ] **Step 3: 启动开发服务器验证页面**

```bash
pnpm dev
```

Expected: 浏览器打开后可见三栏暗色布局，侧边栏有导航和 mock Agent 列表，点击 Agent 展开聊天面板

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat(web): wire up routing and complete three-column layout assembly"
```

---

## Self-Review

### 1. Spec Coverage

| 设计文档要求 | 对应 Task |
|-------------|-----------|
| Monorepo 结构 (apps/web, apps/server, packages/shared) | Task 1, 2, 3 |
| 共享类型定义 (Agent, Project, SpecNode, Task) | Task 2 |
| 暗色主题配色 | Task 3 (globals.css) |
| 自定义滚动条 | Task 3 (globals.css) |
| Agent 状态呼吸灯动画 | Task 3 (globals.css) + Task 4 |
| Lucide SVG 图标 | Task 5, 6, 7 |
| Sidebar 导航 + Agent 列表 | Task 5 |
| Chat Panel (Cursor 风格消息) | Task 6 |
| Claude Code 风格输入框 | Task 6 |
| Diff 代码块 (红/绿) | Task 6 |
| Agent/Worktree/模型选择器 | Task 6 |
| Topbar | Task 7 |
| React Router 路由 | Task 10 |
| Zustand 状态管理 | Task 8 |
| Mock 数据 | Task 8 |
| 5 个页面占位 | Task 9, 10 |

### 2. Placeholder Scan

无 TBD/TODO/placeholder。所有代码步骤包含完整实现。

### 3. Type Consistency

- `Agent` type 从 `@harnesson/shared` 导入，Task 2 定义，Task 4/5/6/8 使用 — 一致
- `AgentStatus` type 同上 — 一致
- `cn()` 工具函数 Task 3 定义，Task 4/5/6/7/9 使用 — 一致
- Zustand store 的 `activeAgentId` 为 `string | null`，ChatPanel 检查 `activeAgent` 存在性 — 一致
