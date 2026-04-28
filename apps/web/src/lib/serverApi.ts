import type { Project } from '@harnesson/shared';

export interface OpenFolderResponse {
  path?: string;
  cancelled?: boolean;
  error?: string;
}

export interface CreateProjectOptions {
  name: string;
  path: string;
  description?: string;
  source: 'local' | 'clone' | 'create';
  gitInit?: boolean;
}

let serverAvailable: boolean | null = null;

export async function isServerRunning(): Promise<boolean> {
  if (serverAvailable !== null) return serverAvailable;
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
    serverAvailable = res.ok;
  } catch {
    serverAvailable = false;
  }
  return serverAvailable;
}

export async function openFolderDialog(): Promise<OpenFolderResponse> {
  try {
    const res = await fetch('/api/open-folder', { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.error ?? `Server error: ${res.status}` };
    }
    return await res.json();
  } catch (err: any) {
    serverAvailable = false;
    return { error: err.message ?? 'Failed to connect to backend server' };
  }
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
  return res.json();
}

export async function createProject(opts: CreateProjectOptions): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to create project: ${res.status}`);
  }
  return res.json();
}

export async function removeProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove project: ${res.status}`);
}

// --- Graph API ---

export interface GraphStatusResponse {
  hasData: boolean;
  lastSyncCommit: string | null;
  lastSyncTime: string | null;
  syncStatus: string;
  needsSync: boolean;
}

// --- Branch API ---

export interface BranchInfo {
  local: string[];
  remote: string[];
  current: string | null;
  isGitRepo: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  branch?: string;
  error?: string;
}

export async function getProjectBranches(projectId: string): Promise<BranchInfo> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/branches`);
  if (!res.ok) throw new Error(`Failed to fetch branches: ${res.status}`);
  return res.json();
}

export async function checkoutBranch(projectId: string, branch: string): Promise<CheckoutResponse> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ branch }),
  });
  if (!res.ok && res.status !== 400) {
    throw new Error(`Checkout request failed: ${res.status}`);
  }
  return res.json();
}

export async function getGraphStatus(projectPath: string): Promise<GraphStatusResponse> {
  const res = await fetch(`/api/graph/status?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get graph status: ${res.status}`);
  return res.json();
}

export async function getGraphData(projectPath: string): Promise<import('@harnesson/shared').GraphFullData> {
  const res = await fetch(`/api/graph/data?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get graph data: ${res.status}`);
  return res.json();
}

export async function getGraphManifest(projectPath: string): Promise<import('@harnesson/shared').Manifest> {
  const res = await fetch(`/api/graph/manifest?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get manifest: ${res.status}`);
  return res.json();
}

export async function getGraphHistory(projectPath: string): Promise<import('@harnesson/shared').HistoryEntry[]> {
  const res = await fetch(`/api/graph/history?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get history: ${res.status}`);
  return res.json();
}
