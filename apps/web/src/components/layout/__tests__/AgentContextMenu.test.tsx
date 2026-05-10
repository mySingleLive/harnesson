import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AgentContextMenu } from '../AgentContextMenu';
import type { Agent, AgentMessage } from '@harnesson/shared';

// Mock store functions
const mockUpdatePanelState = vi.fn();
const mockDestroyAgent = vi.fn();
const mockSetActiveAgent = vi.fn();

vi.mock('@/stores/agentStore', () => {
  const mockFn = vi.fn();
  return { useAgentStore: mockFn };
});

import { useAgentStore } from '@/stores/agentStore';
const mockUseAgentStore = useAgentStore as unknown as ReturnType<typeof vi.fn>;

function setStoreState(
  messages: AgentMessage[],
  panelState = { isOpen: true, isMaximized: false },
) {
  const store = {
    messages: { 'agent-1': messages },
    activeAgentId: 'agent-1',
    updatePanelState: mockUpdatePanelState,
    setActiveAgent: mockSetActiveAgent,
    destroyAgent: mockDestroyAgent,
  };
  mockUseAgentStore.mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) => {
      if (typeof selector === 'function') {
        return selector(store as unknown as Parameters<typeof selector>[0]);
      }
      return undefined;
    },
  );
  (mockUseAgentStore as Record<string, unknown>).getState = () => store;
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
    mockUseAgentStore.mockReset();
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
    vi.useFakeTimers();
    setStoreState([]);
    const onClose = vi.fn();
    render(<AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />);
    // Advance past the setTimeout that adds listeners
    vi.advanceTimersToNextTimer();
    fireEvent.mouseDown(document);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('calls onClose on Escape key', () => {
    vi.useFakeTimers();
    setStoreState([]);
    const onClose = vi.fn();
    render(<AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />);
    vi.advanceTimersToNextTimer();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('disables copy user message when no user messages', () => {
    setStoreState([]);
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={vi.fn()} />,
    );
    const button = getByText('复制用户消息').closest('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('shows sub-menu on hover when user messages exist', () => {
    setStoreState([
      {
        id: '1',
        role: 'user',
        content: 'hello world',
        timestamp: '2026-01-01T10:00:00Z',
      },
    ]);
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={vi.fn()} />,
    );
    const copyItem = getByText('复制用户消息').closest('button')
      ?.parentElement as HTMLElement;
    fireEvent.mouseEnter(copyItem);
    expect(getByText('hello world')).toBeTruthy();
  });

  it('calls navigator.clipboard.writeText when clicking a sub-menu message', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    setStoreState([
      {
        id: '1',
        role: 'user',
        content: 'hello world',
        timestamp: '2026-01-01T10:00:00Z',
      },
    ]);
    const onClose = vi.fn();
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />,
    );
    const copyItem = getByText('复制用户消息').closest('button')
      ?.parentElement as HTMLElement;
    fireEvent.mouseEnter(copyItem);
    fireEvent.click(getByText('hello world'));
    // writeText is called synchronously, but onClose happens after await
    expect(writeText).toHaveBeenCalledWith('hello world');
    await vi.waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('positions menu at given coordinates', () => {
    setStoreState([]);
    render(
      <AgentContextMenu agent={baseAgent} x={150} y={200} onClose={vi.fn()} />,
    );
    // Rendered via createPortal to document.body, query from body
    const menu = document.body.querySelector('[style*="left: 150px"]') as HTMLElement;
    expect(menu).toBeTruthy();
    expect(menu.style.left).toBe('150px');
    expect(menu.style.top).toBe('200px');
  });

  it('shows confirm dialog on delete click without closing menu yet', () => {
    setStoreState([]);
    const onClose = vi.fn();
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />,
    );
    fireEvent.click(getByText('删除'));
    // onClose should NOT be called yet — ConfirmDialog replaces the menu
    expect(onClose).not.toHaveBeenCalled();
    // ConfirmDialog should appear in the DOM
    expect(document.body.textContent).toContain('确定要删除');
    // Context menu should still be in the DOM
    expect(getByText('复制用户消息')).toBeTruthy();
  });

  it('calls destroyAgent and onClose after confirming delete', () => {
    setStoreState([]);
    const onClose = vi.fn();
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />,
    );
    fireEvent.click(getByText('删除'));
    // ConfirmDialog is now in the DOM - find confirm button and click it
    const confirmBtn = document.querySelector('.bg-red-600') as HTMLButtonElement;
    fireEvent.click(confirmBtn);
    expect(mockDestroyAgent).toHaveBeenCalledWith('agent-1');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when canceling delete', () => {
    setStoreState([]);
    const onClose = vi.fn();
    render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />,
    );
    // Click delete, then cancel the confirm dialog
    const deleteBtn = document.querySelector('.text-red-400') as HTMLButtonElement;
    fireEvent.click(deleteBtn);
    const cancelBtns = document.querySelectorAll('button');
    const cancelBtn = Array.from(cancelBtns).find((b) => b.textContent === '取消') as HTMLButtonElement;
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls updatePanelState when clicking toggle button', () => {
    setStoreState([]);
    const onClose = vi.fn();
    const { getByText } = render(
      <AgentContextMenu agent={baseAgent} x={100} y={100} onClose={onClose} />,
    );
    fireEvent.click(getByText('关闭'));
    expect(mockUpdatePanelState).toHaveBeenCalledWith('agent-1', { isOpen: false });
    expect(onClose).toHaveBeenCalled();
  });
});
