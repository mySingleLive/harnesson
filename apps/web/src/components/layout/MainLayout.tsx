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
