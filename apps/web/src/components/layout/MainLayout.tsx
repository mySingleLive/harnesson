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
