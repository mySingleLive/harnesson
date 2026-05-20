import { useMemo } from 'react';
import { FlowGraph } from './FlowGraph';
import { buildGraphFromTree } from './buildGraphFromTree';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphData } from '@harnesson/shared';

export function SpecsGraph() {
  const specsTree = useGraphStore((s) => s.specsTree);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);

  const graphData: GraphData | null = useMemo(() => {
    if (!specsTree || !specsNodeMap) return null;
    return buildGraphFromTree(specsTree, specsNodeMap);
  }, [specsTree, specsNodeMap]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs tree data available. Run sync-specs to generate.</p>
      </div>
    );
  }

  return <FlowGraph graphData={graphData} />;
}
