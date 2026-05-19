import { useMemo } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { MarkdownViewer } from './MarkdownViewer';

function buildDocument(
  nodeId: string,
  nodeMap: Record<string, import('@harnesson/shared').SpecTreeNode>,
  depth: number,
): string {
  const node = nodeMap[nodeId];
  if (!node) return '';

  const prefix = '#'.repeat(Math.min(depth + 1, 6));
  let md = `${prefix} ${node.name}\n\n`;

  if (node.summary) {
    md += `> ${node.summary}\n\n`;
  }

  if (node.goals.length > 0) {
    md += `**Goals:**\n`;
    for (const goal of node.goals) {
      md += `- ${goal}\n`;
    }
    md += '\n';
  }

  if (node.acceptanceCriteria.length > 0) {
    md += `**Acceptance Criteria:**\n`;
    for (const ac of node.acceptanceCriteria) {
      md += `- Given ${ac.given}, when ${ac.when}, then ${ac.then}\n`;
    }
    md += '\n';
  }

  for (const childId of node.children) {
    md += buildDocument(childId, nodeMap, depth + 1);
  }

  return md;
}

export function SpecsDocument() {
  const specsTree = useGraphStore((s) => s.specsTree);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);

  const document = useMemo(() => {
    if (!specsTree || !specsNodeMap) return null;
    return buildDocument(specsTree.id, specsNodeMap, 0);
  }, [specsTree, specsNodeMap]);

  return <MarkdownViewer content={document} emptyMessage="No specs tree data available" />;
}
