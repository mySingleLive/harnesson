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

export async function isServerRunning(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
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

// --- Specs Tree API ---

export interface SpecsTreeResponse {
  root: import('@harnesson/shared').SpecTreeNode;
  nodes: Record<string, import('@harnesson/shared').SpecTreeNode>;
}

export async function getSpecsTree(projectPath: string): Promise<SpecsTreeResponse> {
  const res = await fetch(`/api/specs/tree?projectPath=${encodeURIComponent(projectPath)}`);
  if (!res.ok) throw new Error(`Failed to get specs tree: ${res.status}`);
  return res.json();
}

// --- Agent API ---

export interface ModelInfo {
  value: string;
  displayName: string;
  description: string;
}

export async function getSupportedModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetch('/api/models');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export interface CreateAgentResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  cwd: string;
  model?: string;
  createdAt: string;
  permissionMode: 'auto' | 'manual';
  projectId: string;
  branch: string;
}

export interface AgentInfoResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  cwd: string;
  branch: string;
  model?: string;
  createdAt: string;
  error?: string;
  permissionMode: 'auto' | 'manual';
  sessionContext?: { taskTitle?: string; tokenUsage?: number };
  projectId?: string;
  pendingQuestion?: import('@harnesson/shared').QuestionData;
}

export async function createAgent(opts: {
  cwd: string;
  type: string;
  model?: string;
  permissionMode?: 'auto' | 'manual';
  systemPrompt?: string;
  maxTurns?: number;
  prompt?: string;
}): Promise<CreateAgentResponse> {
  const res = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cwd: opts.cwd,
      type: opts.type,
      model: opts.model,
      permissionMode: opts.permissionMode ?? 'auto',
      systemPrompt: opts.systemPrompt,
      maxTurns: opts.maxTurns,
      prompt: opts.prompt,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to create agent: ${res.status}`);
  }
  return res.json();
}

export async function listAgents(): Promise<AgentInfoResponse[]> {
  const res = await fetch('/api/agents');
  if (!res.ok) throw new Error(`Failed to list agents: ${res.status}`);
  return res.json();
}

export async function sendAgentMessage(
  agentId: string,
  message: string,
  model?: string,
  extra?: { contentBlocks?: import('@harnesson/shared').ContentBlock[]; images?: import('@harnesson/shared').ImageAttachment[] },
): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      model,
      contentBlocks: extra?.contentBlocks,
      images: extra?.images,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Failed to send message: ${res.status}`);
  }
}

export async function abortAgent(agentId: string): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/abort`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to abort agent: ${res.status}`);
}

export async function destroyAgent(agentId: string): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to destroy agent: ${res.status}`);
}

export interface MessageResponse {
  id: string;
  agentId: string;
  role: string;
  content: string;
  images?: import('@harnesson/shared').ImageAttachment[] | null;
  contentBlocks?: import('@harnesson/shared').ContentBlock[] | null;
  events?: unknown[];
  createdAt: string;
}

export async function getAgentMessages(agentId: string, limit?: number): Promise<MessageResponse[]> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/messages?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

export async function getAgentTodos(agentId: string): Promise<unknown[]> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/todos`);
  if (!res.ok) return [];
  return res.json();
}

// --- Slash Command API ---

export async function getSlashCommands(cwd?: string): Promise<import('@harnesson/shared').SlashCommand[]> {
  try {
    const url = cwd ? `/api/slash-commands?cwd=${encodeURIComponent(cwd)}` : '/api/slash-commands';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json() as { commands: import('@harnesson/shared').SlashCommand[] };
    return data.commands;
  } catch {
    return [];
  }
}

export async function executeCommand(agentId: string, command: string, args?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, args }),
  });
  return res.json();
}
