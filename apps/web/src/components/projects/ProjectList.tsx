import { useState, useMemo, useCallback } from 'react';
import { Search, LayoutGrid, List, Plus, FolderOpen, GitBranch } from 'lucide-react';
import type { Project } from '@harnesson/shared';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectActions } from '@/hooks/useProjectActions';
import { mockApi } from '@/lib/mockApi';
import { ProjectCard } from './ProjectCard';
import { ProjectRow } from './ProjectRow';
import { ProjectDetailModal } from './ProjectDetailModal';
import { CloneRepoModal } from './CloneRepoModal';
import { CreateProjectModal } from './CreateProjectModal';
import { cn } from '@/lib/utils';

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  const viewMode = useProjectStore((s) => s.viewMode);
  const searchQuery = useProjectStore((s) => s.searchQuery);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const setSearchQuery = useProjectStore((s) => s.setSearchQuery);
  const switchProject = useProjectStore((s) => s.switchProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const { openFolder, cloneRepo, createProject, isCloning, isCreating } = useProjectActions();

  const [menuOpen, setMenuOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const handleOpen = useCallback(
    (project: Project) => switchProject(project.id, 'main'),
    [switchProject],
  );

  const handleReveal = useCallback(async (id: string) => {
    await mockApi.revealFolder(id);
  }, []);

  const handleOpenFolder = useCallback(async () => {
    await openFolder();
  }, [openFolder]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-harness-border px-6 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-200">项目</h1>
          <span className="rounded-full bg-harness-accent/20 px-2 py-0.5 text-[11px] text-harness-accent">
            {projects.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="w-48 rounded-lg border border-harness-border bg-harness-content py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-harness-border">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                'rounded-l-lg p-1.5 transition-colors',
                viewMode === 'card' ? 'bg-harness-accent/20 text-harness-accent' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-r-lg p-1.5 transition-colors',
                viewMode === 'list' ? 'bg-harness-accent/20 text-harness-accent' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Add project */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 rounded-lg bg-harness-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90"
            >
              <Plus className="h-3.5 w-3.5" />
              添加项目
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-harness-border bg-harness-sidebar py-1 shadow-xl">
                  <button
                    onClick={() => { handleOpenFolder(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    打开文件夹
                  </button>
                  <button
                    onClick={() => { setShowCloneModal(true); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    克隆仓库
                  </button>
                  <button
                    onClick={() => { setShowCreateModal(true); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    创建项目
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 && searchQuery ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            未找到匹配的项目
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onReveal={handleReveal}
                onRemove={removeProject}
                onViewDetail={setDetailProject}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onReveal={handleReveal}
                onRemove={removeProject}
                onViewDetail={setDetailProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
          onOpen={handleOpen}
          onDelete={(id) => { removeProject(id); setDetailProject(null); }}
        />
      )}
      {showCloneModal && (
        <CloneRepoModal
          onClose={() => setShowCloneModal(false)}
          onClone={cloneRepo}
          isCloning={isCloning}
        />
      )}
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
