import type { SpecTreeNode, GraphData, GraphNode } from '@harnesson/shared';

function mapType(level: number): 'project' | 'domain' | 'feature' {
  if (level === 1) return 'project';
  if (level <= 2) return 'domain';
  return 'feature';
}

export function buildGraphFromTree(
  root: SpecTreeNode,
  nodeMap: Record<string, SpecTreeNode>,
): GraphData {
  const visited = new Set<string>();
  const nodes: GraphNode[] = [];
  const edges: { source: string; target: string }[] = [];

  function walk(node: SpecTreeNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    nodes.push({
      id: node.id,
      type: mapType(node.level),
      level: node.level,
      title: node.name,
      content: node.summary,
      children: node.children,
      status: node.status,
    });

    for (const childId of node.children) {
      const child = nodeMap[childId];
      if (child && childId !== node.id) {
        edges.push({ source: node.id, target: childId });
        walk(child);
      }
    }
  }

  walk(root);
  return { nodes, edges };
}
