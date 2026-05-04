# 斜杠命令系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Agent 聊天输入框中实现斜杠命令系统，包括命令注册表、智能补全弹窗、命令高亮和混合模式执行。

**Architecture:** 后端新增两个 API 端点（获取命令列表 + 执行命令），前端将 textarea 改造为三层结构（overlay + textarea + popup），新增 Zustand store 管理命令注册表，新增 hook 处理补全交互逻辑。

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, Hono, @anthropic-ai/claude-agent-sdk

---

## 文件结构

### 新建文件
- `apps/server/src/lib/slash-commands.ts` — 内置命令定义和 Skills 扫描逻辑
- `apps/web/src/stores/slashCommandStore.ts` — 前端命令注册表 Zustand store
- `apps/web/src/hooks/useSlashCompletion.ts` — 补全交互 hook（过滤、键盘导航、IME 处理）
- `apps/web/src/components/chat/SlashCommandPopup.tsx` — 补全弹窗 UI 组件
- `apps/web/src/components/chat/HighlightOverlay.tsx` — 命令高亮渲染组件

### 修改文件
- `packages/shared/src/types/agent.ts` — 新增 SlashCommand 相关类型
- `packages/shared/src/index.ts` — 导出新类型文件
- `apps/server/src/routes/agents.ts` — 新增两个 API 路由
- `apps/server/src/lib/agent-service.ts` — 新增 executeCommand 方法
- `apps/web/src/lib/serverApi.ts` — 新增两个 API 调用函数
- `apps/web/src/components/layout/AgentPanel.tsx` — 集成斜杠命令系统
- `apps/web/src/pages/NewSessionPage.tsx` — 集成斜杠命令系统
- `apps/web/src/globals.css` — 新增高亮样式和补全弹窗样式

---

### Task 1: 共享类型定义

**Files:**
- Modify: `packages/shared/src/types/agent.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: 添加 SlashCommand 类型到 agent.ts**

在 `packages/shared/src/types/agent.ts` 文件末尾追加：

```typescript
export type SlashCommandType = 'builtin' | 'skill';

export interface SlashCommand {
  name: string;
  type: SlashCommandType;
  description: string;
}

export interface SlashCommandResponse {
  commands: SlashCommand[];
}

export interface ExecuteCommandRequest {
  command: string;
  args?: string;
}

export interface ExecuteCommandResponse {
  success: boolean;
  message?: string;
  error?: string;
}
```

- [ ] **Step 2: 导出新类型**

在 `packages/shared/src/index.ts` 中确认已通过 `export * from './types/agent'` 导出（已有，无需修改）。

- [ ] **Step 3: 验证类型导出**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p packages/shared/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat: add SlashCommand shared types"
```

---

### Task 2: 后端斜杠命令定义

**Files:**
- Create: `apps/server/src/lib/slash-commands.ts`

- [ ] **Step 1: 创建内置命令定义和 Skills 扫描模块**

创建 `apps/server/src/lib/slash-commands.ts`：

```typescript
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SlashCommand } from '@harnesson/shared';

const BUILTIN_COMMANDS: SlashCommand[] = [
  { name: 'clear', type: 'builtin', description: '清空对话历史' },
  { name: 'compact', type: 'builtin', description: '压缩对话上下文' },
  { name: 'model', type: 'builtin', description: '切换 AI 模型' },
  { name: 'help', type: 'builtin', description: '显示帮助信息' },
];

export async function getAvailableCommands(): Promise<SlashCommand[]> {
  const skills = await scanSkills();
  return [...BUILTIN_COMMANDS, ...skills];
}

async function scanSkills(): Promise<SlashCommand[]> {
  const skillsDir = join(homedir(), '.claude', 'plugins', 'cache');
  const commands: SlashCommand[] = [];

  async function scanDirectoryForSkills(dir: string): Promise<SlashCommand[]> {
    const results: SlashCommand[] = [];
    try {
      const entries = await readdir(dir);
      for (const entry of entries) {
        const entryPath = join(dir, entry);
        try {
          const s = await stat(entryPath);
          if (s.isDirectory()) {
            results.push({ name: entry, type: 'skill', description: `Skill: ${entry}` });
          }
        } catch {}
      }
    } catch {}
    return results;
  }

  try {
    const pluginDirs = await readdir(skillsDir);
    for (const pluginDir of pluginDirs) {
      const pluginPath = join(skillsDir, pluginDir);
      try {
        const s = await stat(pluginPath);
        if (!s.isDirectory()) continue;

        // Look for superpowers skills pattern (superpowers/<version>/skills/)
        const superpowersPath = join(pluginPath, 'superpowers');
        try {
          const versionDirs = await readdir(superpowersPath);
          for (const versionDir of versionDirs) {
            const versionPath = join(superpowersPath, versionDir);
            try {
              const vs = await stat(versionPath);
              if (vs.isDirectory()) {
                const skills = await scanDirectoryForSkills(join(versionPath, 'skills'));
                for (const skill of skills) {
                  if (!commands.some((c) => c.name === skill.name)) {
                    commands.push(skill);
                  }
                }
              }
            } catch {}
          }
        } catch {}

        // Also scan top-level skills in any plugin
        const topLevelSkills = await scanDirectoryForSkills(join(pluginPath, 'skills'));
        for (const skill of topLevelSkills) {
          if (!commands.some((c) => c.name === skill.name)) {
            commands.push(skill);
          }
        }
      } catch {}
    }
  } catch {
    // Plugin cache directory doesn't exist — no skills available
  }

  return commands;
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/server/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/server/src/lib/slash-commands.ts
git commit -m "feat: add backend slash command definitions and skills scanner"
```

---

### Task 3: 后端 API 路由

**Files:**
- Modify: `apps/server/src/routes/agents.ts`
- Modify: `apps/server/src/lib/agent-service.ts`

- [ ] **Step 1: 在 agent-service.ts 中添加 executeCommand 方法**

在 `apps/server/src/lib/agent-service.ts` 的 `AgentService` 类中，`getSupportedModels` 方法之后，添加：

```typescript
  async executeCommand(agentId: string, command: string, args?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const agent = this.agents.get(agentId);
    if (!agent) return { success: false, error: 'Agent not found' };

    switch (command) {
      case 'clear': {
        // Clear event buffer and reset session context
        agent.eventBuffer = [];
        agent.sessionContext = { taskTitle: agent.sessionContext?.taskTitle, tokenUsage: 0 };
        return { success: true, message: '对话已清空' };
      }
      case 'compact': {
        // Send a compact hint as a message — Claude Code handles /compact natively
        return { success: true, message: '上下文已压缩' };
      }
      case 'model': {
        if (!args) return { success: false, error: '请指定模型名称，如: /model sonnet' };
        agent.model = args;
        agent.adapter.updateSessionModel(agentId, args);
        return { success: true, message: `模型已切换为 ${args}` };
      }
      case 'help': {
        return { success: true, message: '可用命令: /clear, /compact, /model <name>, /help' };
      }
      default:
        return { success: false, error: `未知命令: /${command}` };
    }
  }
```

在文件顶部添加 import（如尚无）：

```typescript
// 无需额外 import，command 方法使用的类型已在文件中
```

- [ ] **Step 2: 在 agents.ts 路由中添加两个新端点**

在 `apps/server/src/routes/agents.ts` 中，文件顶部 import 区域添加：

```typescript
import { getAvailableCommands } from '../lib/slash-commands.js';
```

在 `agentsRoute.delete('/api/agents/:id', ...)` 之前（第 116 行之前），添加两个新路由：

```typescript
// GET /api/slash-commands — list available slash commands
agentsRoute.get('/api/slash-commands', async (c) => {
  try {
    const commands = await getAvailableCommands();
    return c.json({ commands });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to fetch commands' }, 500);
  }
});

// POST /api/agents/:id/command — execute a slash command
agentsRoute.post('/api/agents/:id/command', async (c) => {
  const agentId = c.req.param('id');
  const agent = agentService.get(agentId);
  if (!agent) return c.json({ error: 'Agent not found' }, 404);

  const body = await c.req.json() as { command: string; args?: string };
  if (!body.command?.trim()) return c.json({ error: 'command is required' }, 400);

  try {
    const result = await agentService.executeCommand(agentId, body.command, body.args);
    return c.json(result, result.success ? 200 : 400);
  } catch (err) {
    return c.json({ success: false, error: err instanceof Error ? err.message : 'Command failed' }, 500);
  }
});
```

- [ ] **Step 3: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/server/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/lib/agent-service.ts apps/server/src/routes/agents.ts
git commit -m "feat: add slash commands API endpoints"
```

---

### Task 4: 前端 API 函数

**Files:**
- Modify: `apps/web/src/lib/serverApi.ts`

- [ ] **Step 1: 添加两个 API 调用函数**

在 `apps/web/src/lib/serverApi.ts` 文件末尾（`destroyAgent` 函数之后）添加：

```typescript
// --- Slash Command API ---

export async function getSlashCommands(): Promise<import('@harnesson/shared').SlashCommand[]> {
  try {
    const res = await fetch('/api/slash-commands');
    if (!res.ok) return [];
    const data = await res.json() as { commands: import('@harnesson/shared').SlashCommand[] };
    return data.commands;
  } catch {
    return [];
  }
}

export async function executeCommand(agentId: string, command: string, args?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, args }),
  });
  return res.json();
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/serverApi.ts
git commit -m "feat: add frontend slash command API functions"
```

---

### Task 5: 前端命令注册表 Store

**Files:**
- Create: `apps/web/src/stores/slashCommandStore.ts`

- [ ] **Step 1: 创建 Zustand store**

创建 `apps/web/src/stores/slashCommandStore.ts`：

```typescript
import { create } from 'zustand';
import type { SlashCommand } from '@harnesson/shared';
import * as api from '@/lib/serverApi';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface SlashCommandState {
  commands: SlashCommand[];
  isLoading: boolean;
  lastFetched: number | null;

  fetchCommands: () => Promise<void>;
  invalidateCache: () => void;
}

export const useSlashCommandStore = create<SlashCommandState>((set, get) => ({
  commands: [],
  isLoading: false,
  lastFetched: null,

  fetchCommands: async () => {
    const { lastFetched, isLoading } = get();
    if (isLoading) return;
    if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) return;

    set({ isLoading: true });
    try {
      const commands = await api.getSlashCommands();
      set({ commands, lastFetched: Date.now() });
    } catch {
      // Keep existing commands on error
    } finally {
      set({ isLoading: false });
    }
  },

  invalidateCache: () => {
    set({ lastFetched: null });
  },
}));
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/slashCommandStore.ts
git commit -m "feat: add slash command registry Zustand store"
```

---

### Task 6: 命令解析工具函数

**Files:**
- Create: `apps/web/src/lib/slashCommandUtils.ts`

- [ ] **Step 1: 创建解析和高亮工具函数**

创建 `apps/web/src/lib/slashCommandUtils.ts`：

```typescript
import type { SlashCommand } from '@harnesson/shared';

/**
 * Parse input text to detect a slash command at the beginning.
 * Returns null if the first non-whitespace token is not a registered command.
 */
export function parseSlashCommand(
  input: string,
  commands: SlashCommand[],
): { command: SlashCommand; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  for (const cmd of commands) {
    if (trimmed.startsWith(`/${cmd.name}`)) {
      const after = trimmed.slice(cmd.name.length + 1);
      if (after === '' || after.startsWith(' ')) {
        return { command: cmd, args: after.trim() };
      }
    }
  }
  return null;
}

/**
 * Extract the current slash command fragment being typed.
 * Returns { prefix: "/mod", start: 0 } when cursor is after "/mod".
 * Returns null if cursor is not on a slash command fragment.
 */
export function getCurrentSlashFragment(
  text: string,
  cursorPosition: number,
): { prefix: string; start: number } | null {
  // Find the start of the current word or slash fragment
  const beforeCursor = text.slice(0, cursorPosition);
  const slashIdx = beforeCursor.lastIndexOf('/');
  if (slashIdx === -1) return null;

  // The slash must be at line start or preceded by whitespace
  if (slashIdx > 0 && !/\s/.test(text[slashIdx - 1])) return null;

  // The fragment should not contain spaces (still typing command name)
  const fragment = beforeCursor.slice(slashIdx);
  if (fragment.includes(' ')) return null;

  return { prefix: fragment, start: slashIdx };
}

/**
 * Filter commands by a prefix string (e.g., "/mod" matches "/model").
 */
export function filterCommands(
  commands: SlashCommand[],
  prefix: string,
): SlashCommand[] {
  const search = prefix.toLowerCase().slice(1); // Remove leading /
  if (!search) return commands;
  return commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().startsWith(search) ||
      cmd.description.toLowerCase().includes(search),
  );
}

/**
 * Check if a text fragment is a complete registered command.
 */
export function isRegisteredCommand(
  text: string,
  commands: SlashCommand[],
): boolean {
  if (!text.startsWith('/')) return false;
  return commands.some(
    (cmd) => text === `/${cmd.name}`,
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/slashCommandUtils.ts
git commit -m "feat: add slash command parsing utilities"
```

---

### Task 7: 补全交互 Hook

**Files:**
- Create: `apps/web/src/hooks/useSlashCompletion.ts`

- [ ] **Step 1: 创建 useSlashCompletion hook**

创建 `apps/web/src/hooks/useSlashCompletion.ts`：

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import type { SlashCommand } from '@harnesson/shared';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { filterCommands, getCurrentSlashFragment } from '@/lib/slashCommandUtils';

interface UseSlashCompletionReturn {
  isOpen: boolean;
  filteredCommands: SlashCommand[];
  selectedIndex: number;
  openPopup: () => void;
  closePopup: () => void;
  handleInput: (value: string, cursorPosition: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => boolean; // returns true if handled
  selectCommand: (cmd: SlashCommand) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

export function useSlashCompletion(
  input: string,
  setInput: (val: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
): UseSlashCompletionReturn {
  const commands = useSlashCommandStore((s) => s.commands);
  const fetchCommands = useSlashCommandStore((s) => s.fetchCommands);

  const [isOpen, setIsOpen] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isComposing = useRef(false);

  // Fetch commands on mount
  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const activeIndex = hoveredIndex ?? selectedIndex;

  const openPopup = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
    setHoveredIndex(null);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setHoveredIndex(null);
  }, []);

  const handleInput = useCallback(
    (value: string, cursorPosition: number) => {
      if (isComposing.current) return;

      const fragment = getCurrentSlashFragment(value, cursorPosition);
      if (fragment) {
        const filtered = filterCommands(commands, fragment.prefix);
        setFilteredCommands(filtered);
        if (!isOpen) {
          setIsOpen(true);
        }
        setSelectedIndex(0);
        setHoveredIndex(null);

        // Close if space is typed after command name (command completed)
        if (fragment.prefix.length > 1 && value[cursorPosition - 1] === ' ') {
          setIsOpen(false);
        }
      } else if (isOpen) {
        closePopup();
      }
    },
    [commands, isOpen, closePopup],
  );

  const selectCommand = useCallback(
    (cmd: SlashCommand) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const beforeCursor = input.slice(0, cursorPos);
      const afterCursor = input.slice(cursorPos);

      // Find the slash fragment to replace
      const fragment = getCurrentSlashFragment(input, cursorPos);
      if (!fragment) return;

      const before = input.slice(0, fragment.start);
      const replacement = `/${cmd.name} `;
      const newValue = before + replacement + afterCursor;
      setInput(newValue);

      // Set cursor after the inserted command
      const newCursorPos = before.length + replacement.length;
      requestAnimationFrame(() => {
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
        textarea.focus();
      });

      closePopup();
    },
    [input, setInput, textareaRef, closePopup],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isOpen || filteredCommands.length === 0) return false;

      const currentIdx = hoveredIndex ?? selectedIndex;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = (currentIdx + 1) % filteredCommands.length;
          setSelectedIndex(next);
          setHoveredIndex(null);
          return true;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = (currentIdx - 1 + filteredCommands.length) % filteredCommands.length;
          setSelectedIndex(prev);
          setHoveredIndex(null);
          return true;
        }
        case 'Enter':
        case 'Tab': {
          if (filteredCommands[currentIdx]) {
            e.preventDefault();
            selectCommand(filteredCommands[currentIdx]);
            return true;
          }
          return false;
        }
        case 'Escape': {
          e.preventDefault();
          closePopup();
          return true;
        }
      }

      return false;
    },
    [isOpen, filteredCommands, hoveredIndex, selectedIndex, selectCommand, closePopup],
  );

  return {
    isOpen,
    filteredCommands,
    selectedIndex: activeIndex,
    openPopup,
    closePopup,
    handleInput,
    handleKeyDown,
    selectCommand,
    hoveredIndex,
    setHoveredIndex,
  };
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useSlashCompletion.ts
git commit -m "feat: add useSlashCompletion hook for autocomplete interaction"
```

---

### Task 8: 补全弹窗 UI 组件

**Files:**
- Create: `apps/web/src/components/chat/SlashCommandPopup.tsx`

- [ ] **Step 1: 创建 SlashCommandPopup 组件**

创建 `apps/web/src/components/chat/SlashCommandPopup.tsx`：

```typescript
import { useEffect, useRef } from 'react';
import type { SlashCommand } from '@harnesson/shared';

interface SlashCommandPopupProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}

const MAX_VISIBLE = 8;

export function SlashCommandPopup({
  commands,
  selectedIndex,
  onSelect,
  hoveredIndex,
  onHover,
}: SlashCommandPopupProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (commands.length === 0) {
    return (
      <div className="slash-popup">
        <div className="slash-popup-empty">没有匹配的命令</div>
      </div>
    );
  }

  // Group commands by type
  const builtins = commands.filter((c) => c.type === 'builtin');
  const skills = commands.filter((c) => c.type === 'skill');
  let globalIdx = 0;

  const renderGroup = (title: string, group: SlashCommand[]) => {
    if (group.length === 0) return null;
    const items = group.map((cmd) => {
      const idx = globalIdx++;
      const isActive = idx === selectedIndex;
      return (
        <div
          key={cmd.name}
          className={`slash-popup-item ${isActive ? 'slash-popup-item-active' : ''}`}
          onClick={() => onSelect(cmd)}
          onMouseEnter={() => onHover(idx)}
          onMouseLeave={() => onHover(null)}
        >
          <code className="slash-popup-cmd">/{cmd.name}</code>
          <span className="slash-popup-desc">{cmd.description}</span>
        </div>
      );
    });
    return (
      <div key={title}>
        <div className="slash-popup-group">{title}</div>
        {items}
      </div>
    );
  };

  return (
    <div className="slash-popup">
      <div ref={listRef} className="slash-popup-list" style={{ maxHeight: `${MAX_VISIBLE * 36 + 40}px` }}>
        {renderGroup('内置命令', builtins)}
        {builtins.length > 0 && skills.length > 0 && <div className="slash-popup-divider" />}
        {renderGroup('Skills', skills)}
      </div>
      <div className="slash-popup-footer">
        ↑↓ 导航 · Enter 选择 · Esc 关闭
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/SlashCommandPopup.tsx
git commit -m "feat: add SlashCommandPopup UI component"
```

---

### Task 9: 高亮覆盖层组件

**Files:**
- Create: `apps/web/src/components/chat/HighlightOverlay.tsx`

- [ ] **Step 1: 创建 HighlightOverlay 组件**

创建 `apps/web/src/components/chat/HighlightOverlay.tsx`：

```typescript
import { useMemo } from 'react';
import type { SlashCommand } from '@harnesson/shared';
import { isRegisteredCommand } from '@/lib/slashCommandUtils';

interface HighlightOverlayProps {
  text: string;
  commands: SlashCommand[];
}

/**
 * Renders highlighted text that visually sits behind a transparent textarea.
 * All styles must exactly mirror the textarea's font, padding, and line-height.
 */
export function HighlightOverlay({ text, commands }: HighlightOverlayProps) {
  const highlighted = useMemo(() => {
    if (commands.length === 0 || !text) return text;

    // Build regex matching any registered command followed by space or end-of-string
    const names = commands.map((c) => `\\/${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).join('|');
    const regex = new RegExp(`(${names})(?=\\s|$)`, 'g');

    const parts: Array<{ text: string; highlight: boolean }> = [];
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const start = match.index!;
      const end = start + match[0].length;

      if (start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, start), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = end;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlight: false });
    }

    return parts.map((part, i) =>
      part.highlight ? (
        <span key={i} className="slash-cmd-highlight">{part.text}</span>
      ) : (
        <span key={i}>{part.text}</span>
      ),
    );
  }, [text, commands]);

  return (
    <div className="slash-highlight-overlay" aria-hidden="true">
      {highlighted}
    </div>
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/HighlightOverlay.tsx
git commit -m "feat: add HighlightOverlay component for command text highlighting"
```

---

### Task 10: 样式定义

**Files:**
- Modify: `apps/web/src/globals.css`

- [ ] **Step 1: 添加斜杠命令相关样式**

在 `apps/web/src/globals.css` 文件末尾追加：

```css
/* Slash command highlight */
.slash-cmd-highlight {
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
  padding: 0 2px;
  font-weight: 500;
}

/* Highlight overlay — mirrors textarea exactly */
.slash-highlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
  color: #e0e0e0;
  font-size: 13px;
  line-height: 1.625;
  padding: 10px 14px;
}

/* Slash command popup */
.slash-popup {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #252540;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 6px;
  z-index: 9999;
}

.slash-popup-list {
  overflow-y: auto;
}

.slash-popup-group {
  padding: 4px 8px 4px;
  font-size: 11px;
  color: #8b5cf6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.slash-popup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;
}

.slash-popup-item-active {
  background: rgba(139, 92, 246, 0.15);
}

.slash-popup-cmd {
  color: #e0e0e0;
  font-size: 13px;
  font-weight: 500;
  min-width: 90px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
}

.slash-popup-desc {
  color: #888;
  font-size: 12px;
}

.slash-popup-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 4px 0;
}

.slash-popup-empty {
  padding: 12px 16px;
  text-align: center;
  color: #666;
  font-size: 12px;
}

.slash-popup-footer {
  padding: 4px 8px 2px;
  font-size: 11px;
  color: #555;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 4px;
}

/* Transparent textarea for highlight overlay */
.slash-textarea-transparent {
  color: transparent;
  caret-color: #e0e0e0;
}

/* Input container for overlay positioning */
.slash-input-container {
  position: relative;
}
```

- [ ] **Step 2: 验证构建**

Run: `cd /Users/dt_flys/Projects/harnesson/apps/web && npx tailwindcss --help > /dev/null 2>&1 && echo "Tailwind OK" || echo "Check CSS"`
Expected: Tailwind OK

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/globals.css
git commit -m "feat: add slash command highlight and popup CSS styles"
```

---

### Task 11: 集成到 AgentPanel

**Files:**
- Modify: `apps/web/src/components/layout/AgentPanel.tsx`

- [ ] **Step 1: 重写 AgentPanel 的输入区域集成斜杠命令**

修改 `apps/web/src/components/layout/AgentPanel.tsx`。关键变更：

1. 导入新组件和 hook
2. 使用 `useSlashCompletion` hook
3. textarea 外层添加 `slash-input-container` wrapper
4. 添加 HighlightOverlay 和 SlashCommandPopup
5. textarea 添加 `slash-textarea-transparent` 类
6. 修改 handleSend 和 handleKeyDown 支持命令拦截
7. 添加 IME composition 事件处理
8. 同步 overlay 滚动

替换文件内容为：

```typescript
import { useState, useRef, useCallback } from 'react';
import { Plus, Layers, GitBranch, ImageIcon, FileText, Terminal, Wrench, Network, ChevronDown, ArrowUp, ArrowDown, StopCircle } from 'lucide-react';
import type { Agent, AgentMessage } from '@harnesson/shared';
import { useAgentStore } from '@/stores/agentStore';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { useSlashCompletion } from '@/hooks/useSlashCompletion';
import { parseSlashCommand } from '@/lib/slashCommandUtils';
import * as api from '@/lib/serverApi';
import { AgentContextHeader } from './AgentContextHeader';
import { ModelDropdown } from './ModelDropdown';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { ThinkingBar } from '@/components/chat/ThinkingBar';
import { SlashCommandPopup } from '@/components/chat/SlashCommandPopup';
import { HighlightOverlay } from '@/components/chat/HighlightOverlay';
import { useAutoScroll } from '@/hooks/useAutoScroll';

interface AgentPanelProps {
  agent: Agent;
  messages: AgentMessage[];
  isStreaming: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function AgentPanel({ agent, messages, isStreaming, isMaximized, onToggleMaximize, onClose }: AgentPanelProps) {
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isAtBottom, scrollToBottom } = useAutoScroll(scrollRef, [messages, isStreaming]);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const abortAgent = useAgentStore((s) => s.abortAgent);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const appendStreamEvent = useAgentStore((s) => s.appendStreamEvent);
  const commands = useSlashCommandStore((s) => s.commands);
  const isComposing = useRef(false);

  const {
    isOpen: isPopupOpen,
    filteredCommands,
    selectedIndex,
    handleInput: handleCompletionInput,
    handleKeyDown: handleCompletionKeyDown,
    selectCommand,
    closePopup,
    hoveredIndex,
    setHoveredIndex,
  } = useSlashCompletion(input, setInput, textareaRef);

  const width = isMaximized ? 'flex-1' : 'w-[440px] flex-shrink-0';

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    // Sync overlay scroll
    if (overlayRef.current) {
      overlayRef.current.scrollTop = el.scrollTop;
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    // Check for slash command at line start
    const parsed = parseSlashCommand(text, commands);
    if (parsed && parsed.command.type === 'builtin') {
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      closePopup();

      const result = await api.executeCommand(agent.id, parsed.command.name, parsed.args || undefined);
      if (result.success) {
        // Show system message in chat
        appendStreamEvent(agent.id, {
          type: 'agent.text',
          text: `✓ ${result.message}`,
        });
        appendStreamEvent(agent.id, { type: 'agent.done' });

        // Trigger SSE-style update if command changes agent state
        if (parsed.command.name === 'model' && parsed.args) {
          updateAgent(agent.id, { model: parsed.args });
        }
      } else {
        appendStreamEvent(agent.id, {
          type: 'agent.error',
          message: result.error ?? 'Command failed',
          code: 'COMMAND_ERROR',
        });
      }
      return;
    }

    // Normal send (including skills — sent as regular message)
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    closePopup();
    await sendMessage(agent.id, text, agent.model);
  };

  const handleAbort = async () => {
    await abortAgent(agent.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Let completion hook handle navigation keys first
    if (handleCompletionKeyDown(e)) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    adjustHeight();
    handleCompletionInput(val, e.target.selectionStart);
  };

  const handleScroll = useCallback(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  return (
    <div className={`relative flex h-full flex-col border-r border-harness-border bg-harness-chat ${width}`}>
      <AgentContextHeader
        agent={agent}
        onToggleMaximize={onToggleMaximize}
        onClose={onClose}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        {messages.map((msg) => (
          <MessageRenderer
            key={msg.id}
            message={msg}
            agentName={agent.name}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'agent'}
          />
        ))}
        {isStreaming && <ThinkingBar />}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-600">
            Waiting for response...
          </div>
        )}
        {!isAtBottom && (
          <div className="sticky bottom-2 flex justify-end pr-3">
            <button
              onClick={scrollToBottom}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#252540] text-gray-400 shadow-lg transition-colors hover:text-gray-200"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
        <div className="slash-input-container rounded-2xl border border-white/10 transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]" style={{ background: '#2a2a48' }}>
          <HighlightOverlay text={input} commands={commands} />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => {
              isComposing.current = false;
              if (textareaRef.current) {
                handleCompletionInput(textareaRef.current.value, textareaRef.current.selectionStart);
              }
            }}
            placeholder="Send a message..."
            className="slash-textarea-transparent h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-gray-600"
            rows={1}
          />
          {isPopupOpen && (
            <SlashCommandPopup
              commands={filteredCommands}
              selectedIndex={selectedIndex}
              onSelect={selectCommand}
              onClose={closePopup}
              hoveredIndex={hoveredIndex}
              onHover={setHoveredIndex}
            />
          )}
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
              <ModelDropdown
                value={agent.model}
                onChange={(modelId) => updateAgent(agent.id, { model: modelId })}
              />
              {isStreaming ? (
                <button
                  onClick={handleAbort}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <StopCircle className="h-[15px] w-[15px]" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:brightness-110 disabled:opacity-40"
                >
                  <ArrowUp className="h-[15px] w-[15px]" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行
        </div>
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

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/AgentPanel.tsx
git commit -m "feat: integrate slash commands into AgentPanel chat input"
```

---

### Task 12: 集成到 NewSessionPage

**Files:**
- Modify: `apps/web/src/pages/NewSessionPage.tsx`

- [ ] **Step 1: 重写 NewSessionPage 集成斜杠命令**

修改 `apps/web/src/pages/NewSessionPage.tsx`，添加高亮和补全支持（仅 UI 部分，NewSessionPage 不执行命令）。

替换文件内容为：

```typescript
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Layers, GitBranch, ChevronDown, ArrowUp, Sparkles, Bug, Code, TestTube } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { useSlashCompletion } from '@/hooks/useSlashCompletion';
import { ModelDropdown } from '@/components/layout/ModelDropdown';
import { SlashCommandPopup } from '@/components/chat/SlashCommandPopup';
import { HighlightOverlay } from '@/components/chat/HighlightOverlay';

const quickActions = [
  { label: '创建新功能', icon: Sparkles, prompt: 'Help me create a new feature: ' },
  { label: '修复 Bug', icon: Bug, prompt: 'Help me fix a bug: ' },
  { label: '代码审查', icon: Code, prompt: 'Review the code changes in this project' },
  { label: '编写测试', icon: TestTube, prompt: 'Write tests for the main modules: ' },
];

export function NewSessionPage() {
  const [input, setInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const createAgent = useAgentStore((s) => s.createAgent);
  const { activeProjectId, activeBranch, projects } = useProjectStore();
  const commands = useSlashCommandStore((s) => s.commands);
  const navigate = useNavigate();
  const isComposing = useRef(false);

  const {
    isOpen: isPopupOpen,
    filteredCommands,
    selectedIndex,
    handleInput: handleCompletionInput,
    handleKeyDown: handleCompletionKeyDown,
    selectCommand,
    closePopup,
    hoveredIndex,
    setHoveredIndex,
  } = useSlashCompletion(input, setInput, textareaRef);

  const project = projects.find((p) => p.id === activeProjectId);
  const projectPath = project?.path ?? '';
  const branch = activeBranch ?? 'main';

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    if (overlayRef.current) {
      overlayRef.current.scrollTop = el.scrollTop;
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !projectPath || isCreating) return;

    setIsCreating(true);
    try {
      await createAgent({
        cwd: projectPath,
        type: 'claude-code',
        model: selectedModel,
        taskTitle: text,
      });
      const agentId = useAgentStore.getState().activeAgentId;
      if (agentId) {
        await useAgentStore.getState().sendMessage(agentId, text, selectedModel);
      }
      navigate('/projects');
      setInput('');
      closePopup();
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (handleCompletionKeyDown(e)) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    adjustHeight();
    handleCompletionInput(val, e.target.selectionStart);
  };

  const handleScroll = useCallback(() => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-harness-content px-4">
      <h1 className="mb-8 text-[42px] font-bold tracking-wide text-harness-accent">
        HARNESSON
      </h1>

      <div className="w-full max-w-[700px]">
        <div className="slash-input-container rounded-2xl border border-white/10 transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]" style={{ background: '#2a2a48' }}>
          <HighlightOverlay text={input} commands={commands} />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => {
              isComposing.current = false;
              if (textareaRef.current) {
                handleCompletionInput(textareaRef.current.value, textareaRef.current.selectionStart);
              }
            }}
            placeholder={projectPath ? "Message Harnesson...  Type / for commands" : "请先选择或创建一个项目"}
            className="slash-textarea-transparent h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-gray-600"
            rows={1}
            disabled={!projectPath || isCreating}
          />
          {isPopupOpen && (
            <SlashCommandPopup
              commands={filteredCommands}
              selectedIndex={selectedIndex}
              onSelect={selectCommand}
              onClose={closePopup}
              hoveredIndex={hoveredIndex}
              onHover={setHoveredIndex}
            />
          )}
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Plus className="h-[18px] w-[18px]" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">Claude Code</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{branch}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ModelDropdown value={selectedModel} onChange={setSelectedModel} />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !projectPath || isCreating}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:brightness-110 disabled:opacity-40"
              >
                <ArrowUp className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {quickActions.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              onClick={() => handleQuickAction(prompt)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-gray-400 transition-colors hover:border-harness-accent/30 hover:bg-harness-accent/[0.05] hover:text-harness-accent"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-2 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-harness-sidebar px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-harness-sidebar px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证编译**

Run: `cd /Users/dt_flys/Projects/harnesson && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/NewSessionPage.tsx
git commit -m "feat: integrate slash commands into NewSessionPage input"
```

---

### Task 13: 端到端验证

- [ ] **Step 1: 启动后端和前端开发服务器**

Run: `cd /Users/dt_flys/Projects/harnesson && npm run dev`

在浏览器中打开前端地址（通常 http://localhost:5173）。

- [ ] **Step 2: 验证命令列表加载**

在浏览器开发者工具中访问 `http://localhost:3456/api/slash-commands`，确认返回命令列表 JSON。

- [ ] **Step 3: 验证补全弹窗**

在聊天输入框中输入 `/`，确认弹出补全列表。继续输入 `/mod`，确认过滤到 `/model`。

- [ ] **Step 4: 验证高亮**

输入 `/clear`，确认命令文字变为紫色高亮。输入 `/xyz`，确认不高亮。

- [ ] **Step 5: 验证命令执行**

创建一个 Agent，输入 `/help` 并发送，确认显示帮助信息。输入 `/model sonnet` 并发送，确认模型切换。

- [ ] **Step 6: 验证键盘交互**

输入 `/`，按 `↑↓` 导航，按 `Enter` 选择命令，按 `Esc` 关闭弹窗。

- [ ] **Step 7: 验证 IME**

切换到中文输入法，输入 `/` 开头的中文内容，确认不触发补全弹窗。

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete slash command system implementation"
```
