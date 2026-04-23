import { useState, useCallback } from 'react';
import { mockApi } from '@/lib/mockApi';
import { useProjectStore } from '@/stores/projectStore';
import type { Project } from '@harnesson/shared';

export function useProjectActions() {
  const addProjectToList = useProjectStore((s) => s.addProjectToList);
  const switchProject = useProjectStore((s) => s.switchProject);
  const projects = useProjectStore((s) => s.projects);

  const [isOpening, setIsOpening] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const activateProject = useCallback(
    (project: Project) => {
      switchProject(project.id, 'main');
    },
    [switchProject],
  );

  const openFolder = useCallback(async () => {
    setIsOpening(true);
    try {
      const project = await mockApi.openFolder();
      if (projects.some((p) => p.path === project.path)) {
        return null;
      }
      addProjectToList(project);
      activateProject(project);
      return project;
    } finally {
      setIsOpening(false);
    }
  }, [addProjectToList, activateProject, projects]);

  const cloneRepo = useCallback(
    async (url: string, localPath: string) => {
      setIsCloning(true);
      try {
        const project = await mockApi.cloneRepo(url, localPath);
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsCloning(false);
      }
    },
    [addProjectToList, activateProject],
  );

  const createProject = useCallback(
    async (opts: { name: string; path: string; description?: string; gitInit: boolean }) => {
      setIsCreating(true);
      try {
        const project = await mockApi.createProject(opts);
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsCreating(false);
      }
    },
    [addProjectToList, activateProject],
  );

  const openProjectWithPath = useCallback(
    async (path: string) => {
      setIsOpening(true);
      try {
        if (projects.some((p) => p.path === path)) {
          const existing = projects.find((p) => p.path === path)!;
          activateProject(existing);
          return null;
        }
        const name = path.split('/').pop() ?? 'untitled';
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          path,
          source: 'local' as const,
          agentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsOpening(false);
      }
    },
    [addProjectToList, activateProject, projects],
  );

  return {
    openFolder,
    cloneRepo,
    createProject,
    openProjectWithPath,
    isOpening,
    isCloning,
    isCreating,
  };
}
