# Agent Panel 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ChatPanel 重构为 AgentPanel，集成 Agent Session 上下文信息、执行状态和聊天功能，支持 per-agent 面板状态和全局项目切换。

**Architecture:** 扩展 Agent 类型加入 panelState 和 sessionContext，新建 projectStore 管理全局项目/分支状态，重构 useChatPanel 为 action-only hook 从 agentStore 读取面板状态。AgentPanel 替代 ChatPanel，顶部固定 AgentContextHeader 展示上下文，下方是消息区和输入区。

**Tech Stack:** React 19, TypeScript, Zustand 5, Tailwind CSS 4, Lucide React, React Router 7

**验证方式:** 项目暂无测试框架，每步通过 `pnpm --filter @harnesson/web typecheck` 验证类型正确性，通过 `pnpm --filter @harnesson/web build` 验证构建通过。

---

## Task 1: 扩展 Agent 类型

**Files:**
- Modify: `packages/shared/src/types/agent.ts`

- [ ] **Step 1: 扩展 Agent 接口，添加 panelState 和 sessionContext**

在 `packages/shared/src/types/agent.ts` 中，添加新的接口并扩展 Agent：

```typescript
export type AgentType = 'claude-code' | 'gpt' | 'cursor' | string;

export type AgentStatus = 'running' | 'waiting' | 'completed' | 'error' | 'idle';

export interface AgentPanelState {
  isOpen: boolean;
  isMaximized: boolean;
}

export interface AgentSessionContext {
  taskTitle?: string;
  tokenUsage?: number;
}

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
  panelState: AgentPanelState;
  sessionContext?: AgentSessionContext;
}
```

- [ ] **Step 2: 验证类型导出**

Run: `pnpm --filter @harnesson/shared build`
Expected: 构建通过

- [ ] **Step 3: 提交**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat(shared): extend Agent type with panelState and sessionContext"
```

---

## Task 2: 创建 projectStore

**Files:**
- Create: `apps/web/src/stores/projectStore.ts`

- [ ] **Step 1: 创建 projectStore**

创建 `apps/web/src/stores/projectStore.ts`：

```typescript
import { create } from 'zustand';

interface ProjectState {
  activeProjectId: string | null;
  activeBranch: string | null;
  switchProject: (projectId: string, branch: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProjectId: null,
  activeBranch: null,
  switchProject: (projectId, branch) => {
    const s = get();
    if (s.activeProjectId === projectId && s.activeBranch === branch) return;
    set({ activeProjectId, activeBranch: branch });
  },
}));
```

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/stores/projectStore.ts
git commit -m "feat(web): add projectStore for global project/branch state"
```

---

## Task 3: 更新 agentStore

**Files:**
- Modify: `apps/web/src/stores/agentStore.ts`

- [ ] **Step 1: 更新 agentStore，支持 panelState 管理和新 mock 数据**

更新 `apps/web/src/stores/agentStore.ts`：

```typescript
import { create } from 'zustand';
import type { Agent, AgentPanelState } from '@harnesson/shared';

interface AgentState {
  agents: Agent[];
  activeAgentId: string | null;
  setActiveAgent: (id: string | null) => void;
  updatePanelState: (id: string, state: Partial<AgentPanelState>) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
}

const mockAgents: Agent[] = [
  {
    id: 'agent-a',
    name: 'Agent A',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'main',
    worktreePath: '/tmp/worktree-a',
    model: 'Sonnet 4.7',
    createdAt: new Date(Date.now() - 754_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
    sessionContext: { taskTitle: '实现 JWT 认证', tokenUsage: 2400 },
  },
  {
    id: 'agent-b',
    name: 'Agent B',
    type: 'claude-code',
    status: 'running',
    projectId: 'My Project A',
    branch: 'tree-1',
    worktreePath: '/tmp/worktree-b',
    model: 'Sonnet 4.7',
    createdAt: new Date(Date.now() - 320_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
    sessionContext: { taskTitle: '添加用户注册接口', tokenUsage: 1200 },
  },
  {
    id: 'agent-c',
    name: 'Agent C',
    type: 'gpt',
    status: 'idle',
    projectId: 'My Project B',
    branch: 'dev',
    worktreePath: '/tmp/worktree-c',
    createdAt: new Date(Date.now() - 180_000).toISOString(),
    panelState: { isOpen: false, isMaximized: false },
  },
];

export const useAgentStore = create<AgentState>((set) => ({
  agents: mockAgents,
  activeAgentId: null,
  setActiveAgent: (id) => set({ activeAgentId: id }),
  updatePanelState: (id, state) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, panelState: { ...a.panelState, ...state } } : a,
      ),
    })),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
}));
```

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过（agentStore 引用了新 Agent 类型的 panelState 和 sessionContext）

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/stores/agentStore.ts
git commit -m "feat(web): update agentStore with panelState management and enriched mock data"
```

---

## Task 4: 重构 useChatPanel hook

**Files:**
- Modify: `apps/web/src/hooks/useChatPanel.ts`

- [ ] **Step 1: 重构 useChatPanel，面板状态从 agentStore 读取**

更新 `apps/web/src/hooks/useChatPanel.ts`：

```typescript
import { useAgentStore } from '@/stores/agentStore';

export function useChatPanel() {
  const { agents, activeAgentId, updatePanelState, setActiveAgent } = useAgentStore();
  const activeAgent = agents.find((a) => a.id === activeAgentId) ?? null;

  const isOpen = activeAgent?.panelState.isOpen ?? false;
  const isMaximized = activeAgent?.panelState.isMaximized ?? false;

  const open = () => {
    if (activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: true });
    }
  };

  const close = () => {
    if (activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: false });
    }
    setActiveAgent(null);
  };

  const toggleMaximize = () => {
    if (activeAgentId) {
      updatePanelState(activeAgentId, { isMaximized: !activeAgent?.panelState.isMaximized });
    }
  };

  return { isOpen, isMaximized, open, close, toggleMaximize };
}
```

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/hooks/useChatPanel.ts
git commit -m "refactor(web): delegate useChatPanel state to agentStore panelState"
```

---

## Task 5: 创建 useElapsedTime hook

**Files:**
- Create: `apps/web/src/hooks/useElapsedTime.ts`

- [ ] **Step 1: 创建 useElapsedTime hook**

创建 `apps/web/src/hooks/useElapsedTime.ts`：

```typescript
import { useState, useEffect } from 'react';

export function useElapsedTime(startedAt: string): string {
  const [elapsed, setElapsed] = useState(() => computeElapsed(startedAt));

  useEffect(() => {
    setElapsed(computeElapsed(startedAt));
    const timer = setInterval(() => setElapsed(computeElapsed(startedAt)), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return elapsed;
}

function computeElapsed(startedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
```

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/hooks/useElapsedTime.ts
git commit -m "feat(web): add useElapsedTime hook for live elapsed time display"
```

---

## Task 6: 创建 AgentContextHeader 组件

**Files:**
- Create: `apps/web/src/components/layout/AgentContextHeader.tsx`

- [ ] **Step 1: 创建 AgentContextHeader**

创建 `apps/web/src/components/layout/AgentContextHeader.tsx`：

```typescript
import { Maximize2, Minimize2, X } from 'lucide-react';
import type { Agent } from '@harnesson/shared';
import { useElapsedTime } from '@/hooks/useElapsedTime';

interface AgentContextHeaderProps {
  agent: Agent;
  onToggleMaximize: () => void;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  running: { label: 'Running', className: 'bg-orange-500/15 text-orange-500' },
  waiting: { label: 'Waiting', className: 'bg-amber-500/15 text-amber-500' },
  completed: { label: 'Completed', className: 'bg-green-500/15 text-green-500' },
  error: { label: 'Error', className: 'bg-red-500/15 text-red-500' },
  idle: { label: 'Idle', className: 'bg-gray-500/15 text-gray-400' },
};

export function AgentContextHeader({ agent, onToggleMaximize, onClose }: AgentContextHeaderProps) {
  const elapsed = useElapsedTime(agent.createdAt);
  const status = statusConfig[agent.status] ?? statusConfig.idle;
  const ctx = agent.sessionContext;
  const isMaximized = agent.panelState.isMaximized;

  return (
    <div className="flex-shrink-0 border-b border-harness-border">
      {/* 第一行：名称 + 状态 + 运行时间 + 按钮 */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="text-[14px] font-semibold text-gray-200">{agent.name}</span>
        <span className={`rounded-full px-2 py-[1px] text-[11px] ${status.className}`}>
          {status.label}
        </span>
        <span className="ml-auto mr-2 text-[11px] text-gray-600">{elapsed}</span>
        <button
          onClick={onToggleMaximize}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 第二行：上下文信息 */}
      <div className="px-4 pb-2.5">
        {ctx?.taskTitle && (
          <div className="text-[12px] text-gray-300">{ctx.taskTitle}</div>
        )}
        <div className="text-[11px] text-gray-500 font-mono">{agent.worktreePath}</div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          {agent.model ?? 'Unknown'}
          {ctx?.tokenUsage != null && (
            <span> · {(ctx.tokenUsage / 1000).toFixed(1)}k tokens</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/layout/AgentContextHeader.tsx
git commit -m "feat(web): add AgentContextHeader with status, context info, and maximize toggle"
```

---

## Task 7: 创建 AgentPanel 组件

**Files:**
- Create: `apps/web/src/components/layout/AgentPanel.tsx`

本任务将现有 ChatPanel 的消息渲染和输入区代码迁移到 AgentPanel 中，集成 AgentContextHeader。

- [ ] **Step 1: 创建 AgentPanel 组件**

创建 `apps/web/src/components/layout/AgentPanel.tsx`：

```typescript
import { useState } from 'react';
import { Plus, Layers, GitBranch, ImageIcon, FileText, Terminal, Wrench, Network, ChevronDown, ArrowUp } from 'lucide-react';
import type { Agent } from '@harnesson/shared';
import { cn } from '@/lib/utils';
import { AgentContextHeader } from './AgentContextHeader';

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

interface AgentPanelProps {
  agent: Agent;
  messages: ChatMessage[];
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function AgentPanel({ agent, messages, isMaximized, onToggleMaximize, onClose }: AgentPanelProps) {
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const width = isMaximized ? 'flex-1' : 'w-[440px] flex-shrink-0';

  return (
    <div className={`relative flex h-full flex-col border-r border-harness-border bg-harness-chat ${width}`}>
      <AgentContextHeader
        agent={agent}
        onToggleMaximize={onToggleMaximize}
        onClose={onClose}
      />

      {/* 消息区 */}
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

      {/* 输入区 */}
      <div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
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
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">{agent.type === 'claude-code' ? 'Claude Code' : agent.type}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{agent.branch}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                {agent.model ?? 'Sonnet 4.7'}
                <ChevronDown className="h-3 w-3" />
              </button>
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
              line.type === 'added' && 'bg-green-500/10 text-green-400',
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

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx
git commit -m "feat(web): add AgentPanel with integrated context header and chat"
```

---

## Task 8: 更新 Topbar — 从 projectStore 读取

**Files:**
- Modify: `apps/web/src/components/layout/Topbar.tsx`

- [ ] **Step 1: 更新 Topbar 组件**

更新 `apps/web/src/components/layout/Topbar.tsx`：

```typescript
import { Settings } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface TopbarProps {
  runningAgentCount: number;
}

export function Topbar({ runningAgentCount }: TopbarProps) {
  const { activeProjectId, activeBranch } = useProjectStore();
  const projectName = activeProjectId ?? 'No Project';
  const branch = activeBranch ?? '—';

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

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/layout/Topbar.tsx
git commit -m "refactor(web): Topbar reads project/branch from projectStore"
```

---

## Task 9: 更新 Sidebar — 集成项目切换

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: 更新 Sidebar 组件**

更新 `apps/web/src/components/layout/Sidebar.tsx`：

```typescript
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
  onAgentClick: (agent: Agent) => void;
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
            onClick={() => onAgentClick(agent)}
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

关键变更：`onAgentClick` 回调参数从 `agentId: string` 改为 `agent: Agent`，以便 MainLayout 能读取 `agent.projectId` 和 `agent.branch` 进行项目切换。

- [ ] **Step 2: 验证类型**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过（MainLayout 还未更新，会有类型错误，在 Task 10 修复）

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/layout/Sidebar.tsx
git commit -m "refactor(web): Sidebar onAgentClick passes full Agent object for project switching"
```

---

## Task 10: 更新 MainLayout — 集成所有变更

**Files:**
- Modify: `apps/web/src/components/layout/MainLayout.tsx`

- [ ] **Step 1: 更新 MainLayout 组件**

更新 `apps/web/src/components/layout/MainLayout.tsx`：

```typescript
import { Outlet } from 'react-router';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { AgentPanel } from './AgentPanel';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

export function MainLayout() {
  const { agents, activeAgentId, setActiveAgent, updatePanelState } = useAgentStore();
  const switchProject = useProjectStore((s) => s.switchProject);
  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const runningCount = agents.filter((a) => a.status === 'running').length;

  const handleAgentClick = (agent: typeof agents[number]) => {
    const prevId = activeAgentId;
    setActiveAgent(agent.id);
    updatePanelState(agent.id, { isOpen: true });
    switchProject(agent.projectId, agent.branch);
    if (prevId && prevId !== agent.id) {
      // 保留上一个 agent 的当前 panelState（已保存在 store 中）
    }
  };

  const handleClose = () => {
    if (activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: false });
    }
    setActiveAgent(null);
  };

  const handleToggleMaximize = () => {
    if (activeAgent) {
      updatePanelState(activeAgent.id, { isMaximized: !activeAgent.panelState.isMaximized });
    }
  };

  const showPanel = activeAgent && activeAgent.panelState.isOpen;

  return (
    <div className="flex h-screen flex-col">
      <Topbar runningAgentCount={runningCount} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          agents={agents}
          activeAgentId={activeAgentId ?? undefined}
          onAgentClick={handleAgentClick}
          onNewAgent={() => {}}
        />
        {showPanel && (
          <AgentPanel
            agent={activeAgent}
            messages={mockMessages}
            isMaximized={activeAgent.panelState.isMaximized}
            onToggleMaximize={handleToggleMaximize}
            onClose={handleClose}
          />
        )}
        {!activeAgent?.panelState.isMaximized && (
          <main className="flex-1 overflow-auto bg-harness-content">
            <Outlet />
          </main>
        )}
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
          { type: 'context' as const, lineNum: ' 5', content: "import express from 'express';" },
          { type: 'removed' as const, lineNum: ' 6', content: "import crypto from 'crypto';" },
          { type: 'removed' as const, lineNum: ' 7', content: "const SECRET = 'hardcoded-secret';" },
          { type: 'added' as const, lineNum: ' 6', content: "import jwt from 'jsonwebtoken';" },
          { type: 'added' as const, lineNum: ' 7', content: "import bcrypt from 'bcryptjs';" },
          { type: 'added' as const, lineNum: ' 8', content: 'const SECRET = config().JWT_SECRET;' },
          { type: 'added' as const, lineNum: ' 9', content: "const EXPIRES = '24h';" },
          { type: 'added' as const, lineNum: '10', content: "const REFRESH_EXPIRES = '7d';" },
        ],
      },
    ],
  },
];
```

关键变更：
- `ChatPanel` 导入替换为 `AgentPanel`
- `handleAgentClick` 调用 `switchProject` 并更新 panelState
- `handleClose` 更新 panelState.isOpen 而非全局 chatOpen
- 最大化模式下隐藏主内容区（Outlet）

- [ ] **Step 2: 验证类型和构建**

Run: `pnpm --filter @harnesson/web typecheck`
Expected: 通过

Run: `pnpm --filter @harnesson/web build`
Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/layout/MainLayout.tsx
git commit -m "feat(web): integrate AgentPanel with project switching in MainLayout"
```

---

## Task 11: 删除旧 ChatPanel

**Files:**
- Delete: `apps/web/src/components/layout/ChatPanel.tsx`

- [ ] **Step 1: 确认无引用后删除**

Run: `grep -r "ChatPanel" apps/web/src/`
Expected: 无匹配（所有引用已迁移到 AgentPanel）

```bash
rm apps/web/src/components/layout/ChatPanel.tsx
```

- [ ] **Step 2: 验证构建**

Run: `pnpm --filter @harnesson/web build`
Expected: 构建成功

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "chore(web): remove ChatPanel replaced by AgentPanel"
```
