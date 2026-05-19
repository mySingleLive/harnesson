import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGraphStore } from '../graphStore';
import * as serverApi from '@/lib/serverApi';
import type { SpecTreeNode } from '@harnesson/shared';

vi.mock('@/lib/serverApi', () => ({
  getSpecsTree: vi.fn(),
  getGraphData: vi.fn(),
  getGraphStatus: vi.fn(),
  getGraphManifest: vi.fn(),
  getGraphHistory: vi.fn(),
  isServerRunning: vi.fn(),
  getProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  removeProject: vi.fn(),
  openFolderDialog: vi.fn(),
  getProjectBranches: vi.fn(),
  checkoutBranch: vi.fn(),
  getSupportedModels: vi.fn(),
  createAgent: vi.fn(),
  listAgents: vi.fn(),
  sendAgentMessage: vi.fn(),
  abortAgent: vi.fn(),
  destroyAgent: vi.fn(),
  getAgentMessages: vi.fn(),
  getAgentTodos: vi.fn(),
  getSlashCommands: vi.fn(),
  executeCommand: vi.fn(),
}));

const mockRoot: SpecTreeNode = {
  id: 'project', name: 'Root', level: 1, parent: null,
  children: ['child1'], isLeaf: false, summary: 'root summary',
  goals: [], acceptanceCriteria: [], status: 'draft', design: null,
};

const mockChild: SpecTreeNode = {
  id: 'child1', name: 'Child 1', level: 2, parent: 'project',
  children: [], isLeaf: true, summary: 'child summary',
  goals: ['goal'], acceptanceCriteria: [{ given: 'x', when: 'y', then: 'z' }],
  status: 'review', design: null,
};

describe('graphStore - specsTree', () => {
  beforeEach(() => {
    useGraphStore.setState({
      specsTree: null,
      specsNodeMap: null,
      projectPath: null,
    });
    vi.clearAllMocks();
  });

  it('loadSpecsTree sets specsTree and specsNodeMap on success', async () => {
    vi.mocked(serverApi.getSpecsTree).mockResolvedValue({
      root: mockRoot,
      nodes: { project: mockRoot, child1: mockChild },
    });

    await useGraphStore.getState().loadSpecsTree('/abs/path');

    const state = useGraphStore.getState();
    expect(state.specsTree).toEqual(mockRoot);
    expect(state.specsNodeMap).toEqual({ project: mockRoot, child1: mockChild });
    expect(state.projectPath).toBe('/abs/path');
  });

  it('loadSpecsTree sets null on failure', async () => {
    vi.mocked(serverApi.getSpecsTree).mockRejectedValue(new Error('fail'));

    await useGraphStore.getState().loadSpecsTree('/bad/path');

    const state = useGraphStore.getState();
    expect(state.specsTree).toBeNull();
    expect(state.specsNodeMap).toBeNull();
  });
});
