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