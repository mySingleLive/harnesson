import { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router';
import {
  MessageSquarePlus,
  FolderKanban,
  Network,
  CheckSquare,
  FolderOpen,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Folder,
} from 'lucide-react';
import { AgentStatusDot } from './AgentStatusDot';
import { AgentContextMenu } from './AgentContextMenu';
import type { Agent } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface SidebarProps {
  agents: Agent[];
  activeAgentId?: string;
  onAgentClick: (agent: Agent) => void;
  projects: { id: string; name: string }[];
}

const navItems = [
  { to: '/', icon: MessageSquarePlus, label: 'New Session' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/graph', icon: Network, label: 'Graph' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/git', icon: GitBranch, label: 'Git' },
];

export function Sidebar({ agents, activeAgentId, onAgentClick, projects }: SidebarProps) {
  const [contextMenu, setContextMenu] = useState<{
    agent: Agent;
    x: number;
    y: number;
  } | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const projectNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      map.set(p.id, p.name);
    }
    return map;
  }, [projects]);

  const { ungrouped, grouped } = useMemo(() => {
    const grouped = new Map<string, Agent[]>();
    const ungrouped: Agent[] = [];
    for (const agent of agents) {
      if (agent.projectId) {
        const list = grouped.get(agent.projectId) ?? [];
        list.push(agent);
        grouped.set(agent.projectId, list);
      } else {
        ungrouped.push(agent);
      }
    }
    return { ungrouped, grouped };
  }, [agents]);

  // Auto-expand a project group when its agent becomes active
  useEffect(() => {
    if (activeAgentId) {
      const agent = agents.find((a) => a.id === activeAgentId);
      if (agent?.projectId) {
        setCollapsedProjects((prev) => {
          if (prev.has(agent.projectId)) {
            const next = new Set(prev);
            next.delete(agent.projectId);
            return next;
          }
          return prev;
        });
      }
    }
  }, [activeAgentId, agents]);

  const handleContextMenu = (e: React.MouseEvent, agent: Agent) => {
    e.preventDefault();
    setContextMenu({ agent, x: e.clientX, y: e.clientY });
  };

  const toggleProject = (projectId: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const renderAgentItem = (agent: Agent) => (
    <button
      key={agent.id}
      onClick={() => onAgentClick(agent)}
      onContextMenu={(e) => handleContextMenu(e, agent)}
      className={cn(
        'w-full py-1.5 text-left transition-colors',
        activeAgentId === agent.id
          ? 'border-l-[3px] border-harness-accent bg-harness-accent/[0.08]'
          : 'border-l-[3px] border-transparent hover:bg-white/[0.02]',
      )}
    >
      <div className="flex items-center gap-2 pl-4 pr-3">
        <AgentStatusDot status={agent.status} />
        <span className="text-[13px] font-medium text-gray-300 truncate">{agent.name}</span>
        <span className="ml-auto flex-shrink-0 rounded bg-white/5 px-1.5 py-[1px] text-[10px] text-gray-500">
          {agent.type === 'claude-code' ? 'Claude' : agent.type === 'gpt' ? 'GPT' : agent.type}
        </span>
      </div>
      <div className="mt-0.5 pl-8 text-[11px] text-gray-500">
        <span className="font-medium text-harness-accent">{agent.branch}</span>
      </div>
    </button>
  );

  const hasGroups = grouped.size > 0 || ungrouped.length > 0;

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

      <div className="flex-1 overflow-y-auto py-2">
        {!hasGroups && (
          <p className="px-4 py-4 text-[12px] text-gray-500">No agent sessions</p>
        )}

        {/* Ungrouped agents (no project) */}
        {ungrouped.length > 0 && (
          <div className="mb-1">
            <div className="px-4 py-1 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Ungrouped
            </div>
            {ungrouped.map(renderAgentItem)}
          </div>
        )}

        {/* Grouped by project */}
        {[...grouped.entries()].map(([projectId, projectAgents]) => {
          const projectName = projectNames.get(projectId) ?? projectId;
          const isCollapsed = collapsedProjects.has(projectId);

          return (
            <div key={projectId} className="mb-0.5">
              <button
                onClick={() => toggleProject(projectId)}
                className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[12px] text-gray-400 transition-colors hover:bg-white/[0.02] hover:text-gray-300"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <Folder className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
                <span className="font-medium truncate">{projectName}</span>
                <span className="ml-auto flex-shrink-0 text-[10px] text-gray-500">
                  {projectAgents.length}
                </span>
              </button>
              {!isCollapsed && projectAgents.map(renderAgentItem)}
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <AgentContextMenu
          agent={contextMenu.agent}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </aside>
  );
}