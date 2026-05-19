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

async function readNode(specsDir: string, nodeId: string): Promise<SpecTreeNode | null> {
  const nodePath = join(specsDir, 'nodes', nodeId, 'node.json');
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

  // Recursive BFS to load all children
  const queue = [...root.children];
  while (queue.length > 0) {
    const childId = queue.shift()!;
    if (nodes[childId]) continue;
    const childNode = await readNode(specsDir, childId);
    if (childNode) {
      nodes[childId] = childNode;
      queue.push(...childNode.children);
    } else {
      console.warn(`[specs-tree] missing node: ${childId}`);
    }
  }

  return { root, nodes };
}
