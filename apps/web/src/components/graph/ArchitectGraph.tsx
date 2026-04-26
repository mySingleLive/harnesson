import { useCallback } from 'react';
import type { NodeMouseHandler } from '@xyflow/react';
import { FlowGraph } from './FlowGraph';
import { useGraphStore } from '@/stores/graphStore';

export function ArchitectGraph() {
  const architectData = useGraphStore((s) => s.architectData);
  const selectNode = useGraphStore((s) => s.selectNode);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  if (!architectData?.graph || architectData.graph.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No architect graph data available</p>
      </div>
    );
  }

  return <FlowGraph graphData={architectData.graph} onNodeClick={handleNodeClick} />;
}
