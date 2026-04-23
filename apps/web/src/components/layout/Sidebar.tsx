import { NavLink } from 'react-router';
import {
  MessageSquarePlus,
  FolderKanban,
  Network,
  CheckSquare,
  FolderOpen,
  GitBranch,
} from 'lucide-react';
import { AgentStatusDot } from './AgentStatusDot';
import type { Agent } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface SidebarProps {
  agents: Agent[];
  activeAgentId?: string;
  onAgentClick: (agent: Agent) => void;
}

const navItems = [
  { to: '/', icon: MessageSquarePlus, label: 'New Session' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/graph', icon: Network, label: 'Graph' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/git', icon: GitBranch, label: 'Git' },
];

export function Sidebar({ agents, activeAgentId, onAgentClick }: SidebarProps) {
  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-harness-border bg-harness-sidebar">
      <nav className="py-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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