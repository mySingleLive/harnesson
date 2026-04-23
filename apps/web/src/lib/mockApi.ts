import type { Project } from '@harnesson/shared';

const STORAGE_KEY = 'harnesson_projects';

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

function readStore(): Project[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeStore(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export const mockApi = {
  async getProjects(): Promise<Project[]> {
    await delay(200);
    return readStore();
  },

  async getProject(id: string): Promise<Project | null> {
    await delay(100);
    return readStore().find((p) => p.id === id) ?? null;
  },

  async removeProject(id: string): Promise<void> {
    await delay(200);
    writeStore(readStore().filter((p) => p.id !== id));
  },

  async openFolder(): Promise<Project> {
    await delay(500);
    const project: Project = {
      id: crypto.randomUUID(),
      name: 'my-project',
      path: '/Users/developer/projects/my-project',
      source: 'local',
      agentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStore([...readStore(), project]);
    return project;
  },

  async cloneRepo(url: string, localPath: string): Promise<Project> {
    await delay(1500);
    const name = url.split('/').pop()?.replace('.git', '') ?? 'cloned-project';
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      path: `${localPath}/${name}`,
      source: 'clone',
      agentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStore([...readStore(), project]);
    return project;
  },

  async createProject(opts: {
    name: string;
    path: string;
    description?: string;
    gitInit: boolean;
  }): Promise<Project> {
    await delay(800);
    const project: Project = {
      id: crypto.randomUUID(),
      name: opts.name,
      path: `${opts.path}/${opts.name}`,
      description: opts.description,
      source: 'create',
      agentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeStore([...readStore(), project]);
    return project;
  },

  async revealFolder(_id: string): Promise<void> {
    await delay(100);
  },
};
