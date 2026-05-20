import { useCallback, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, SelectionMode, applyNodeChanges, type Node, type Edge, type NodeChange, type ReactFlowInstance } from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';
import type { GraphData } from '@harnesson/shared';
import { nodeTypes, resetDomainColors } from './GraphNodes';
import { useGraphStore } from '@/stores/graphStore';
import { GraphContextMenu } from './GraphContextMenu';

const NODE_WIDTH = 170;
const NODE_HEIGHT_MAP: Record<string, number> = {
  project: 72,
  domain: 64,
  feature: 56,
};

function getLayoutedElements(graphData: GraphData): { nodes: Node[]; edges: Edge[] } {
  resetDomainColors();
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 15, ranksep: 160 });

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
      data: { label: node.title, content: node.content, level: node.level, status: node.status, domainId: node.domainId },
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
}

export function FlowGraph({ graphData }: FlowGraphProps) {
  const layouted = useMemo(() => getLayoutedElements(graphData), [graphData]);
  const [nodes, setNodes] = useState<Node[]>(layouted.nodes);
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const edges = layouted.edges;

  const selectNodes = useGraphStore((s) => s.selectNodes);
  const addToSelection = useGraphStore((s) => s.addToSelection);
  const clearSelection = useGraphStore((s) => s.clearSelection);

  // Callbacks for context menu: update store + React Flow internal selection
  const onSelectNodes = useCallback(
    (nodeIds: string[]) => {
      selectNodes(nodeIds);
      setNodes((nds) => {
        const changes = nds.map((n) => ({
          id: n.id,
          type: 'select' as const,
          selected: nodeIds.includes(n.id),
        }));
        return applyNodeChanges(changes, nds);
      });
    },
    [selectNodes],
  );

  const onAddToSelection = useCallback(
    (nodeIds: string[]) => {
      addToSelection(nodeIds);
      setNodes((nds) => {
        const updated = useGraphStore.getState().selectedNodeIds;
        const changes = nds.map((n) => ({
          id: n.id,
          type: 'select' as const,
          selected: updated.includes(n.id),
        }));
        return applyNodeChanges(changes, nds);
      });
    },
    [addToSelection],
  );

  // Reset node positions when graph data changes
  useMemo(() => { setNodes(layouted.nodes); }, [layouted.nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Defer pure selection changes by one frame so React Flow's Pane
      // can finish cleaning up the selection rectangle DOM before we
      // trigger a re-render via setNodes.
      if (changes.length > 0 && changes.every((c) => c.type === 'select')) {
        requestAnimationFrame(() => {
          setNodes((nds) => applyNodeChanges(changes, nds));
        });
        return;
      }
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      const ids = selectedNodes.map((n) => n.id);
      const currentIds = useGraphStore.getState().selectedNodeIds;
      if (ids.length !== currentIds.length || ids.some((id, i) => id !== currentIds[i])) {
        selectNodes(ids);
      }
    },
    [selectNodes],
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!event.shiftKey) {
        selectNodes([node.id]);
      }
    },
    [selectNodes],
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
    },
    [],
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep' as const,
      style: { stroke: '#555', strokeWidth: 2.5 },
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
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onNodesChange={onNodesChange}
        onSelectionChange={onSelectionChange}
        onPaneClick={handlePaneClick}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        panOnDrag={[1, 2]}
        multiSelectionKeyCode="Shift"
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        onInit={(instance) => { (window as any).__reactFlowInstance = instance; }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls
          className="!border-harness-border !bg-harness-sidebar [&>button]:!bg-harness-sidebar [&>button]:!border-harness-border [&>button]:!text-gray-400 [&>button:hover]:!bg-white/5"
        />
      </ReactFlow>
      {contextMenu && (
        <GraphContextMenu
          nodeId={contextMenu.nodeId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onSelectNodes={onSelectNodes}
          onAddToSelection={onAddToSelection}
        />
      )}
    </div>
  );
}
