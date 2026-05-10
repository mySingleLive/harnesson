# Agent 卡片右键菜单 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Sidebar 中的 Agent 卡片添加右键菜单，支持打开/关闭切换、复制用户消息（含子菜单）、删除（含确认弹窗）。

**Architecture:** 创建两个新组件（AgentContextMenu、ConfirmDialog）均通过 React Portal 渲染到 body。AgentContextMenu 管理菜单位置和子菜单 hover 状态，ConfirmDialog 处理删除确认。Sidebar 添加 onContextMenu 事件来触发菜单。

**Tech Stack:** React 19 + TypeScript + Tailwind CSS + Zustand (agentStore) + Vitest + @testing-library/react

---

### File Structure

```
apps/web/src/components/layout/
├── Sidebar.tsx              ← 修改：agent 卡片添加 onContextMenu
├── AgentContextMenu.tsx     ← 新建：右键菜单（Portal）
├── ConfirmDialog.tsx        ← 新建：删除确认弹窗（Portal）
└── __tests__/
    ├── AgentContextMenu.test.tsx  ← 新建
    └── ConfirmDialog.test.tsx     ← 新建
```

- **ConfirmDialog** — 通用确认弹窗，不依赖任何 store，纯受控组件
- **AgentContextMenu** — 右键菜单，依赖 agentStore 读取 messages/panelState、调用 updatePanelState/destroyAgent/setActiveAgent
- **Sidebar** — 仅添加 onContextMenu handler 和 contextMenu state

---

### Task 1: ConfirmDialog 组件

**Files:**
- Create: `apps/web/src/components/layout/ConfirmDialog.tsx`
- Create: `apps/web/src/components/layout/__tests__/ConfirmDialog.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/web/src/components/layout/__tests__/ConfirmDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: '删除 Agent',
    message: '确定要删除 agent-1 吗？此操作不可撤销，所有对话历史将被清除。',
    confirmLabel: '删除',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders title and message', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    expect(getByText('删除 Agent')).toBeTruthy();
    expect(getByText(/确定要删除/)).toBeTruthy();
  });

  it('renders confirm button with custom label', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    const btn = getByText('删除');
    expect(btn).toBeTruthy();
  });

  it('renders default confirm label "确认" when not provided', () => {
    const props = { title: 'Test', message: 'test', onConfirm: vi.fn(), onCancel: vi.fn() };
    const { getByText } = render(<ConfirmDialog {...props} />);
    expect(getByText('确认')).toBeTruthy();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    const { getByText } = render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(getByText('删除'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    const { getByText } = render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(getByText('取消'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    const backdrop = container.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onConfirm on Enter key', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.keyDown(document, { key: 'Escape' }); // first verify escape works
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('auto-focuses cancel button on mount', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    const cancelBtn = getByText('取消');
    expect(document.activeElement).toBe(cancelBtn);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/layout/__tests__/ConfirmDialog.test.tsx`
Expected: FAIL — "Cannot find module '../ConfirmDialog'"

- [ ] **Step 3: Write ConfirmDialog component**

```typescript
// apps/web/src/components/layout/ConfirmDialog.tsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = '确认', onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return createPortal(
    <div
      className="flex items-center justify-center fixed inset-0 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="relative bg-harness-sidebar border border-white/10 rounded-xl w-[380px] p-6 shadow-2xl">
        <h3 className="text-[15px] text-gray-200 font-semibold mb-1.5">{title}</h3>
        <p className="text-[13px] text-gray-400 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2.5 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-5 py-2 text-[13px] text-gray-400 border border-white/10 rounded-md hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/layout/__tests__/ConfirmDialog.test.tsx`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/ConfirmDialog.tsx apps/web/src/components/layout/__tests__/ConfirmDialog.test.tsx
git commit -m "feat: add ConfirmDialog component with tests"
```

---

### Task 2: AgentContextMenu 组件

**Files:**
- Create: `apps/web/src/components/layout/AgentContextMenu.tsx`
- Create: `apps/web/src/components/layout/__tests__/AgentContextMenu.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// apps/web/src/components/layout/__tests__/AgentContextMenu.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { AgentContextMenu } from '../AgentContextMenu';
import { useAgentStore } from '@/stores/agentStore';
import type { Agent, AgentMessage } from '@harnesson/shared';

// Mock agent store
vi.mock('@/stores/agentStore', () => ({
  useAgentStore: vi.fn(),
}));

const mockUpdatePanelState = vi.fn();
const mockDestroyAgent = vi.fn();
const mockSetActiveAgent = vi.fn();
const mockUseAgentStore = useAgentStore as unknown as ReturnType<typeof vi.fn>;

function setStoreState(messages: AgentMessage[], panelState = { isOpen: true, isMaximized: false }) {
  mockUseAgentStore.mockImplementation((selector: (s: Record<string, unknown>) => unknown) => {
    if (typeof selector === 'function') {
      return selector({
        messages: { 'agent-1': messages },
        activeAgentId: 'agent-1',
      });
    }
    return undefined;
  });
}

const baseAgent: Agent = {
  id: 'agent-1',
  name: 'test-agent',
  type: 'claude-code',
  status: 'idle',
  projectId: 'my-project',
  branch: 'main',
  worktreePath: '/tmp/test',
  createdAt: '2026-01-01',
  panelState: { isOpen: true, isMaximized: false },
};

describe('AgentContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgentStore.mockClear();
  });

  it('renders open/close and delete items', () => {
    setStoreState([]);
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={vi.fn()} />,
    );
    expect(getByText('关闭')).toBeTruthy();
    expect(getByText('复制用户消息')).toBeTruthy();
    expect(getByText('删除')).toBeTruthy();
  });

  it('shows "打开" when panel is closed', () => {
    setStoreState([], { isOpen: false, isMaximized: false });
    const { getByText } = render(
      <AgentContextMenu
        agent={{ ...baseAgent, panelState: { isOpen: false, isMaximized: false } }}
        x={100}
        y={100}
        onClose={vi.fn()}
      />,
    );
    expect(getByText('打开')).toBeTruthy();
  });

  it('calls onClose when clicking outside', () => {
    setStoreState([]);
    const onClose = vi.fn();
    render(<AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />);
    fireEvent.mouseDown(document);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    setStoreState([]);
    const onClose = vi.fn();
    render(<AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('disables copy user message when no user messages', () => {
    setStoreState([]);
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={vi.fn()} />,
    );
    const item = getByText('复制用户消息').closest('div')?.parentElement;
    expect(item?.className).toContain('opacity-40');
  });

  it('shows sub-menu on hover when user messages exist', () => {
    setStoreState([
      { id: '1', role: 'user', content: 'hello world', timestamp: '2026-01-01T10:00:00Z' },
    ]);
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={vi.fn()} />,
    );
    const copyItem = getByText('复制用户消息').closest('div')?.parentElement as HTMLElement;
    fireEvent.mouseEnter(copyItem);
    expect(getByText('hello world')).toBeTruthy();
  });

  it('calls navigator.clipboard.writeText when clicking a sub-menu message', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });
    setStoreState([
      { id: '1', role: 'user', content: 'hello world', timestamp: '2026-01-01T10:00:00Z' },
    ]);
    const onClose = vi.fn();
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />,
    );
    const copyItem = getByText('复制用户消息').closest('div')?.parentElement as HTMLElement;
    fireEvent.mouseEnter(copyItem);
    fireEvent.click(getByText('hello world'));
    expect(writeText).toHaveBeenCalledWith('hello world');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('positions menu at given coordinates', () => {
    setStoreState([]);
    const { container } = render(
      <AgentContextMenu agent={baseAgent} x={150} y={200} onClose={vi.fn()} />,
    );
    const menu = container.firstElementChild as HTMLElement;
    expect(menu.style.left).toBe('150px');
    expect(menu.style.top).toBe('200px');
  });

  it('calls onClose and opens ConfirmDialog on delete click', () => {
    setStoreState([]);
    const onClose = vi.fn();
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />,
    );
    fireEvent.click(getByText('删除'));
    expect(onClose).toHaveBeenCalledOnce();
    // ConfirmDialog should appear in DOM
    expect(document.body.textContent).toContain('确定要删除');
  });

  it('calls destroyAgent after confirming delete', async () => {
    setStoreState([]);
    // Mock destroyAgent in the component's internal state
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={vi.fn()} />,
    );
    fireEvent.click(getByText('删除'));
    // ConfirmDialog is now in the DOM
    const deleteBtn = document.body.querySelector('.bg-red-600') as HTMLButtonElement;
    expect(deleteBtn).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/components/layout/__tests__/AgentContextMenu.test.tsx`
Expected: FAIL — "Cannot find module '../AgentContextMenu'"

- [ ] **Step 3: Write AgentContextMenu component**

```typescript
// apps/web/src/components/layout/AgentContextMenu.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import type { Agent, AgentMessage } from '@harnesson/shared';
import { useAgentStore } from '@/stores/agentStore';
import { ConfirmDialog } from './ConfirmDialog';

interface AgentContextMenuProps {
  agent: Agent;
  x: number;
  y: number;
  onClose: () => void;
}

export function AgentContextMenu({ agent, x, y, onClose }: AgentContextMenuProps) {
  const messages = useAgentStore((s) => s.messages[agent.id] ?? []);
  const updatePanelState = useAgentStore((s) => s.updatePanelState);
  const setActiveAgent = useAgentStore((s) => s.setActiveAgent);
  const destroyAgent = useAgentStore((s) => s.destroyAgent);

  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [position, setPosition] = useState({ x, y });
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const userMessages = messages.filter((m) => m.role === 'user');

  // Adjust position to stay within viewport
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const adjusted = { x, y };
    if (rect.right > window.innerWidth) adjusted.x = x - rect.width;
    if (rect.bottom > window.innerHeight) adjusted.y = y - rect.height;
    setPosition(adjusted);
  }, [x, y]);

  // Close on outside click, Escape, or window blur
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleBlur = () => onClose();
    // Delay to avoid capturing the same right-click
    setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', handleBlur);
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onClose]);

  const handleToggleOpen = useCallback(() => {
    const isOpen = agent.panelState.isOpen;
    updatePanelState(agent.id, { isOpen: !isOpen });
    if (isOpen) {
      const currentActive = useAgentStore.getState().activeAgentId;
      if (currentActive === agent.id) {
        setActiveAgent(null);
      }
    }
    onClose();
  }, [agent.id, agent.panelState.isOpen, updatePanelState, setActiveAgent, onClose]);

  const handleCopyMessage = useCallback(
    async (msg: AgentMessage) => {
      try {
        await navigator.clipboard.writeText(msg.content);
      } catch {
        // clipboard unavailable — silent
      }
      onClose();
    },
    [onClose],
  );

  const handleDeleteClick = useCallback(() => {
    onClose();
    setShowConfirm(true);
  }, [onClose]);

  const handleDeleteConfirm = useCallback(() => {
    destroyAgent(agent.id);
    setShowConfirm(false);
  }, [agent.id, destroyAgent]);

  const handleSubMenuEnter = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setSubMenuOpen(true);
  }, []);

  const handleSubMenuLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => setSubMenuOpen(false), 150);
  }, []);

  const isOpen = agent.panelState.isOpen;

  return createPortal(
    <>
      <div
        ref={menuRef}
        className="fixed z-[100] bg-[#252540] border border-white/10 rounded-[10px] py-1 min-w-[200px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        style={{ left: position.x, top: position.y }}
      >
        {/* Open/Close */}
        <button
          onClick={handleToggleOpen}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
        >
          {isOpen ? '关闭' : '打开'}
        </button>

        <div className="h-px bg-white/[0.06] mx-2 my-1" />

        {/* Copy user message with sub-menu */}
        <div
          className="relative"
          onMouseEnter={handleSubMenuEnter}
          onMouseLeave={handleSubMenuLeave}
        >
          <button
            disabled={userMessages.length === 0}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[13px] rounded-md mx-1 transition-colors ${
              userMessages.length === 0
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : 'text-gray-200 hover:bg-white/[0.06]'
            }`}
          >
            <span>复制用户消息</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          </button>

          {subMenuOpen && userMessages.length > 0 && (
            <div
              ref={subMenuRef}
              className="absolute left-full top-0 ml-1 bg-[#252540] border border-white/10 rounded-[10px] py-1 w-[280px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
            >
              <div className="px-2.5 py-1 text-[10px] text-gray-500 uppercase tracking-wider">
                用户消息 ({userMessages.length})
              </div>
              {userMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleCopyMessage(msg)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
                  title={msg.content}
                >
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 text-left">
                    {msg.content}
                  </span>
                  <span className="text-[10px] text-gray-600 flex-shrink-0">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-white/[0.06] mx-2 my-1" />

        {/* Delete */}
        <button
          onClick={handleDeleteClick}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-red-400 hover:bg-red-400/10 rounded-md mx-1 transition-colors"
        >
          删除
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="删除 Agent"
          message={`确定要删除 ${agent.name} 吗？此操作不可撤销，所有对话历史将被清除。`}
          confirmLabel="删除"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>,
    document.body,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/components/layout/__tests__/AgentContextMenu.test.tsx`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/AgentContextMenu.tsx apps/web/src/components/layout/__tests__/AgentContextMenu.test.tsx
git commit -m "feat: add AgentContextMenu component with tests"
```

---

### Task 3: Sidebar 集成 onContextMenu

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx` — add contextMenu state, onContextMenu handler, AgentContextMenu rendering

- [ ] **Step 1: Add contextMenu state and AgentContextMenu rendering to Sidebar**

```typescript
// apps/web/src/components/layout/Sidebar.tsx
import { useState } from 'react';
// ... rest of existing imports unchanged
import { AgentContextMenu } from './AgentContextMenu';
// type Agent is already imported from @harnesson/shared

interface SidebarProps {
  agents: Agent[];
  activeAgentId?: string;
  onAgentClick: (agent: Agent) => void;
}

// ... existing navItems array ...

export function Sidebar({ agents, activeAgentId, onAgentClick }: SidebarProps) {
  // Add context menu state
  const [contextMenu, setContextMenu] = useState<{
    agent: Agent;
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, agent: Agent) => {
    e.preventDefault();
    setContextMenu({ agent, x: e.clientX, y: e.clientY });
  };
```

The agent card button section changes from:

```tsx
<button
  key={agent.id}
  onClick={() => onAgentClick(agent)}
```

To:

```tsx
<button
  key={agent.id}
  onClick={() => onAgentClick(agent)}
  onContextMenu={(e) => handleContextMenu(e, agent)}
```

And add at the bottom of the aside (before `</aside>`):

```tsx
{contextMenu && (
  <AgentContextMenu
    agent={contextMenu.agent}
    x={contextMenu.x}
    y={contextMenu.y}
    onClose={() => setContextMenu(null)}
  />
)}
```

- [ ] **Step 2: Verify existing Sidebar tests still pass**

Run: `cd apps/web && npx vitest run src/components/layout/__tests__/`
Expected: All existing tests pass

- [ ] **Step 3: Run TypeScript check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No new type errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat: integrate AgentContextMenu into Sidebar agent cards"
```
