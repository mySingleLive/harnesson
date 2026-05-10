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
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const listenerTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const userMessages = messages.filter((m) => m.role === 'user');

  // Clean up sub-menu hover timer on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

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
      const target = e.target as Element;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (target.closest?.('[role="dialog"]')) return;
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleBlur = () => onClose();
    // Delay to avoid capturing the same right-click
    listenerTimerRef.current = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', handleBlur);
    }, 0);
    return () => {
      if (listenerTimerRef.current) clearTimeout(listenerTimerRef.current);
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
    setShowConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    destroyAgent(agent.id);
    setShowConfirm(false);
    onClose();
  }, [agent.id, destroyAgent, onClose]);

  const handleDeleteCancel = useCallback(() => {
    setShowConfirm(false);
    onClose();
  }, [onClose]);

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
          onCancel={handleDeleteCancel}
        />
      )}
    </>,
    document.body,
  );
}
