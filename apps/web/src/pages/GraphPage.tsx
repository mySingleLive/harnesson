import { useEffect } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { useProjectStore } from '@/stores/projectStore';
import { GraphTabBar } from '@/components/graph/GraphTabBar';
import { SpecsGraph } from '@/components/graph/SpecsGraph';
import { SpecsList } from '@/components/graph/SpecsList';
import { SpecsDocument } from '@/components/graph/SpecsDocument';
import { ArchitectGraph } from '@/components/graph/ArchitectGraph';
import { TechnicalDocument } from '@/components/graph/TechnicalDocument';
import { DetailPanel } from '@/components/graph/DetailPanel';
import { SyncView } from '@/components/graph/SyncView';
import { SyncProgress } from '@/components/graph/SyncProgress';

export function GraphPage() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const projects = useProjectStore((s) => s.projects);
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const projectPath = activeProject?.path ?? null;

  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const syncStatus = useGraphStore((s) => s.syncStatus);
  const activeTab = useGraphStore((s) => s.activeTab);
  const isDetailPanelOpen = useGraphStore((s) => s.isDetailPanelOpen);
  const setProjectPath = useGraphStore((s) => s.setProjectPath);
  const loadGraph = useGraphStore((s) => s.loadGraph);
  const setActiveTab = useGraphStore((s) => s.setActiveTab);
  const startSync = useGraphStore((s) => s.startSync);

  useEffect(() => {
    if (projectPath) {
      setProjectPath(projectPath);
      loadGraph(projectPath);
    }
  }, [projectPath, setProjectPath, loadGraph]);

  const hasData = !!(specsData || architectData);
  const isSyncing = syncStatus === 'syncing';

  if (!projectPath) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">Select a project to view graph</p>
      </div>
    );
  }

  if (!hasData && !isSyncing) {
    return (
      <div className="flex h-full flex-col">
        <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <SyncView
            projectPath={projectPath}
            onSync={(storageLocation) =>
              startSync({ projectPath, storageLocation, syncType: 'full' })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      <GraphTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      {isSyncing && (
        <div className="absolute inset-0 top-[41px] z-10 bg-harness-content/80 backdrop-blur-sm">
          <SyncProgress />
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {activeTab === 'specs-graph' && <SpecsGraph />}
          {activeTab === 'specs-list' && <SpecsList />}
          {activeTab === 'specs-document' && <SpecsDocument />}
          {activeTab === 'architect-graph' && <ArchitectGraph />}
          {activeTab === 'technical-document' && <TechnicalDocument />}
        </div>
        {isDetailPanelOpen && <DetailPanel />}
      </div>
    </div>
  );
}
