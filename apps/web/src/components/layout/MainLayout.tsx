import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { AgentPanel } from './AgentPanel';
import { ResizableDivider } from './ResizableDivider';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { useProjectActions } from '@/hooks/useProjectActions';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

export function MainLayout() {
  const { agents, activeAgentId, setActiveAgent, updatePanelState, messages, isStreaming, loadAgents, activateAgent, panelWidth, panelCollapsed, setPanelWidth, setPanelCollapsed } = useAgentStore();
  const switchProject = useProjectStore((s) => s.switchProject);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const projects = useProjectStore((s) => s.projects);
  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const runningCount = agents.filter((a) => a.status === 'running').length;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { createProject, openFolder, isCreating } = useProjectActions();

  const handleAgentClick = async (agent: typeof agents[number]) => {
    await activateAgent(agent.id);
    switchProject(agent.projectId, agent.branch, true);
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

  const location = useLocation();

  useEffect(() => {
    loadProjects();
    loadAgents();
  }, [loadProjects, loadAgents]);

  useEffect(() => {
    if (location.pathname === '/' && activeAgentId) {
      updatePanelState(activeAgentId, { isOpen: false });
      setActiveAgent(null);
    }
  }, [location.pathname]);

  const showPanel = activeAgent && activeAgent.panelState.isOpen;

  return (
    <div className="flex h-screen flex-col">
      <Topbar
        runningAgentCount={runningCount}
        onCreateProject={() => setShowCreateModal(true)}
        onOpenFolder={() => { openFolder(); }}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          agents={agents}
          activeAgentId={activeAgentId ?? undefined}
          onAgentClick={handleAgentClick}
          projects={projects}
        />
        {showPanel && !panelCollapsed && (
          <>
            <AgentPanel
              agent={activeAgent}
              messages={messages[activeAgent.id] ?? []}
              isMaximized={activeAgent.panelState.isMaximized}
              width={panelWidth}
              onToggleMaximize={handleToggleMaximize}
              onClose={handleClose}
            />
            <ResizableDivider
              minWidth={320}
              currentWidth={panelWidth}
              isCollapsed={false}
              onResize={setPanelWidth}
              onResizeEnd={setPanelWidth}
              onCollapse={() => setPanelCollapsed(true)}
              onExpand={() => setPanelCollapsed(false)}
            />
          </>
        )}
        {showPanel && panelCollapsed && (
          <ResizableDivider
            minWidth={320}
            currentWidth={panelWidth}
            isCollapsed={true}
            onResize={() => {}}
            onResizeEnd={() => {}}
            onCollapse={() => {}}
            onExpand={() => setPanelCollapsed(false)}
          />
        )}
        {!(showPanel && activeAgent?.panelState.isMaximized) && (
          <main className="flex-1 overflow-auto bg-harness-content" style={{ minWidth: 300 }}>
            <Outlet />
          </main>
        )}
      </div>
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createProject}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
