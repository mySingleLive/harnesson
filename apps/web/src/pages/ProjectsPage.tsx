import { useEffect, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useProjectActions } from '@/hooks/useProjectActions';
import { EmptyState } from '@/components/projects/EmptyState';
import { ProjectList } from '@/components/projects/ProjectList';
import { CloneRepoModal } from '@/components/projects/CloneRepoModal';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const isLoading = useProjectStore((s) => s.isLoading);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const { openFolder, openProjectWithPath, cloneRepo, createProject, isOpening, isCloning, isCreating } = useProjectActions();

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-harness-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {projects.length === 0 ? (
        <EmptyState
          onOpenFolder={openFolder}
          onCloneRepo={() => setShowCloneModal(true)}
          onCreateProject={() => setShowCreateModal(true)}
          onDropFolder={openProjectWithPath}
          isLoading={isOpening}
        />
      ) : (
        <ProjectList projects={projects} />
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
    </>
  );
}
