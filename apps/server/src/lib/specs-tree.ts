import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { SpecTreeNode } from '@harnesson/shared';

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function readNode(specsDir: string, nodeId: string, parentDir?: string): Promise<SpecTreeNode | null> {
  const nodeDir = parentDir ? join('nodes', parentDir, nodeId) : join('nodes', nodeId);
  const nodePath = join(specsDir, nodeDir, 'node.json');
  if (!(await fileExists(nodePath))) return null;
  const raw = await readFile(nodePath, 'utf-8');
  return JSON.parse(raw) as SpecTreeNode;
}

export interface SpecsTreeData {
  root: SpecTreeNode;
  nodes: Record<string, SpecTreeNode>;
}

export async function readSpecsTree(projectPath: string): Promise<SpecsTreeData | null> {
  const specsDir = join(projectPath, '.harnesson', 'specs');
  const projectJsonPath = join(specsDir, 'project.json');

  if (!(await fileExists(projectJsonPath))) return null;

  const raw = await readFile(projectJsonPath, 'utf-8');
  const root = JSON.parse(raw) as SpecTreeNode;
  const nodes: Record<string, SpecTreeNode> = { [root.id]: root };

  // BFS to load all children, tracking parent directory for nested node lookup
  const queue: Array<{ id: string; parentDir: string }> = root.children.map((id) => ({ id, parentDir: '' }));
  while (queue.length > 0) {
    const { id: childId, parentDir } = queue.shift()!;
    if (nodes[childId]) continue;
    const childNode = await readNode(specsDir, childId, parentDir);
    if (childNode) {
      nodes[childId] = childNode;
      const childDir = parentDir ? join(parentDir, childId) : childId;
      queue.push(...childNode.children.map((id) => ({ id, parentDir: childDir })));
    } else {
      console.warn(`[specs-tree] missing node: ${childId}`);
    }
  }

  return { root, nodes };
}
