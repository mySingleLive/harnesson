import { X } from 'lucide-react';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphNode } from '@harnesson/shared';

const typeLabelMap: Record<string, string> = {
  project: 'Project',
  domain: 'Domain',
  feature: 'Feature',
};

const typeColorMap: Record<string, string> = {
  project: 'bg-harness-accent/15 text-harness-accent',
  domain: 'bg-blue-500/15 text-blue-400',
  feature: 'bg-green-500/15 text-green-400',
};

function findNode(nodes: GraphNode[], id: string): GraphNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function DetailPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const closeDetailPanel = useGraphStore((s) => s.closeDetailPanel);

  if (!selectedNodeId) return null;

  const node =
    findNode(specsData?.graph?.nodes ?? [], selectedNodeId) ??
    findNode(architectData?.graph?.nodes ?? [], selectedNodeId);

  if (!node) return null;

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-harness-border bg-harness-sidebar">
      <div className="flex items-center justify-between border-b border-harness-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-[1px] text-[10px] font-semibold ${typeColorMap[node.type] ?? 'bg-gray-500/15 text-gray-400'}`}>
            {typeLabelMap[node.type] ?? node.type}
          </span>
          <span className="text-[13px] font-medium text-gray-200">{node.title}</span>
        </div>
        <button
          onClick={closeDetailPanel}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">ID</span>
          <p className="mt-0.5 font-mono text-[11px] text-gray-400">{node.id}</p>
        </div>

        <div className="mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Level</span>
          <p className="mt-0.5 text-[12px] text-gray-400">{node.level}</p>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="mb-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Children</span>
            <p className="mt-0.5 text-[12px] text-gray-400">{node.children.join(', ')}</p>
          </div>
        )}

        {node.content && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Content</span>
            <div className="mt-1 rounded-md border border-harness-border bg-harness-bg p-3">
              <p className="text-[12px] leading-relaxed text-gray-300 whitespace-pre-wrap">{node.content}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
