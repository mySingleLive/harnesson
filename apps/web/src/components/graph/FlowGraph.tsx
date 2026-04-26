import { useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, type OnNodeClick } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import type { GraphData } from '@harnesson/shared';
import { nodeTypes } from './GraphNodes';

const NODE_WIDTH = 200;
const NODE_HEIGHT_MAP: Record<string, number> = {
  project: 48,
  domain: 40,
  feature: 36,
};

function getLayoutedElements(graphData: GraphData): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 60 });

  for (const node of graphData.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT_MAP[node.type] ?? 40 });
  }

  for (const edge of graphData.edges) {
    g.setEdge(edge.source, edge.target);
  }

  Dagre.layout(g);

  const nodes: Node[] = graphData.nodes.map((node) => {
    const pos = g.node(node.id);
    const height = NODE_HEIGHT_MAP[node.type] ?? 40;
    return {
      id: node.id,
      type: node.type,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - height / 2 },
      data: { label: node.title, content: node.content, level: node.level },
    };
  });

  const edges: Edge[] = graphData.edges.map((edge) => ({
    id: `e-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
  }));

  return { nodes, edges };
}

interface FlowGraphProps {
  graphData: GraphData;
  onNodeClick?: OnNodeClick;
}

export function FlowGraph({ graphData, onNodeClick }: FlowGraphProps) {
  const { nodes, edges } = useMemo(() => getLayoutedElements(graphData), [graphData]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep' as const,
      style: { stroke: '#555' },
    }),
    [],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls
          className="!border-harness-border !bg-harness-sidebar [&>button]:!bg-harness-sidebar [&>button]:!border-harness-border [&>button]:!text-gray-400 [&>button:hover]:!bg-white/5"
        />
      </ReactFlow>
    </div>
  );
}
