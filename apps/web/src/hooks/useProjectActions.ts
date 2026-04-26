import { useState, useCallback } from 'react';
import * as serverApi from '@/lib/serverApi';
import { useProjectStore } from '@/stores/projectStore';
import type { Project } from '@harnesson/shared';

export function useProjectActions() {
  const addProjectToList = useProjectStore((s) => s.addProjectToList);
  const switchProject = useProjectStore((s) => s.switchProject);

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
      const serverUp = await serverApi.isServerRunning();
      if (!serverUp) {
        alert('无法连接后端服务');
        return null;
      }

      const result = await serverApi.openFolderDialog();
      if (result.error) {
        alert(`无法打开文件夹: ${result.error}`);
        return null;
      }
      if (result.cancelled || !result.path) {
        return null;
      }

      const name = result.path.replace(/\/$/, '').split('/').pop() ?? 'untitled';
      const project = await serverApi.createProject({
        name,
        path: result.path,
        source: 'local',
      });
      addProjectToList(project);
      activateProject(project);
      return project;
    } finally {
      setIsOpening(false);
    }
  }, [addProjectToList, activateProject]);

  const cloneRepo = useCallback(
    async (url: string, localPath: string) => {
      setIsCloning(true);
      try {
        const name = url.split('/').pop()?.replace('.git', '') ?? 'cloned-project';
        const project = await serverApi.createProject({
          name,
          path: `${localPath}/${name}`,
          source: 'clone',
        });
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
        const project = await serverApi.createProject({
          name: opts.name,
          path: `${opts.path}/${opts.name}`,
          description: opts.description,
          source: 'create',
          gitInit: opts.gitInit,
        });
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
        const name = path.replace(/\/$/, '').split('/').pop() ?? 'untitled';
        const project = await serverApi.createProject({
          name,
          path,
          source: 'local',
        });
        addProjectToList(project);
        activateProject(project);
        return project;
      } finally {
        setIsOpening(false);
      }
    },
    [addProjectToList, activateProject],
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
