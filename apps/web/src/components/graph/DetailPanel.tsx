import { X } from 'lucide-react';
import { useGraphStore } from '@/stores/graphStore';
import type { GraphNode, SpecTreeNode } from '@harnesson/shared';

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

const statusColorMap: Record<string, string> = {
  draft: 'text-yellow-400',
  review: 'text-blue-400',
  done: 'text-green-400',
};

function findGraphNode(nodes: GraphNode[], id: string): GraphNode | undefined {
  return nodes.find((n) => n.id === id);
}

export function DetailPanel() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);
  const specsData = useGraphStore((s) => s.specsData);
  const architectData = useGraphStore((s) => s.architectData);
  const closeDetailPanel = useGraphStore((s) => s.closeDetailPanel);
  const selectNode = useGraphStore((s) => s.selectNode);

  if (!selectedNodeId) return null;

  const specNode: SpecTreeNode | undefined = specsNodeMap?.[selectedNodeId];
  const graphNode: GraphNode | undefined =
    findGraphNode(specsData?.graph?.nodes ?? [], selectedNodeId) ??
    findGraphNode(architectData?.graph?.nodes ?? [], selectedNodeId);

  if (!specNode && !graphNode) return null;

  const inferredType =
    specNode
      ? specNode.level === 1 ? 'project' : specNode.level <= 2 ? 'domain' : 'feature'
      : graphNode?.type ?? 'feature';

  const nodeTitle = specNode?.name ?? graphNode?.title ?? selectedNodeId;

  return (
    <div className="w-[400px] flex-shrink-0 border-l border-harness-border bg-harness-sidebar overflow-y-auto">
      <div className="flex items-center justify-between border-b border-harness-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-[1px] text-[10px] font-semibold ${typeColorMap[inferredType] ?? 'bg-gray-500/15 text-gray-400'}`}>
            {typeLabelMap[inferredType] ?? inferredType}
          </span>
          <span className="text-[13px] font-medium text-gray-200">{nodeTitle}</span>
        </div>
        <button
          onClick={closeDetailPanel}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {specNode?.status && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Status</span>
            <p className={`mt-0.5 text-[12px] font-medium ${statusColorMap[specNode.status] ?? 'text-gray-400'}`}>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
              {specNode.status}
            </p>
          </div>
        )}

        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Level</span>
          <p className="mt-0.5 text-[12px] text-gray-400">{specNode?.level ?? graphNode?.level}</p>
        </div>

        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">ID</span>
          <p className="mt-0.5 font-mono text-[11px] text-gray-400">{selectedNodeId}</p>
        </div>

        {specNode?.summary && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Summary</span>
            <div className="mt-1 rounded-md border border-harness-border bg-harness-bg p-3">
              <p className="text-[12px] leading-relaxed text-gray-300">{specNode.summary}</p>
            </div>
          </div>
        )}

        {specNode?.goals && specNode.goals.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Goals</span>
            <ul className="mt-1 space-y-1">
              {specNode.goals.map((goal, i) => (
                <li key={i} className="text-[12px] text-gray-400 pl-3 border-l-2 border-harness-border">
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {specNode?.acceptanceCriteria && specNode.acceptanceCriteria.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Acceptance Criteria</span>
            <div className="mt-1 space-y-2">
              {specNode.acceptanceCriteria.map((ac, i) => (
                <div key={i} className="rounded-md border border-harness-border bg-harness-bg p-2 text-[11px] text-gray-400">
                  <div><span className="text-gray-500">Given</span> {ac.given}</div>
                  <div><span className="text-gray-500">When</span> {ac.when}</div>
                  <div><span className="text-gray-500">Then</span> {ac.then}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {specNode?.children && specNode.children.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Children</span>
            <div className="mt-1 space-y-1">
              {specNode.children.map((childId) => {
                const child = specsNodeMap?.[childId];
                return (
                  <button
                    key={childId}
                    onClick={() => selectNode(childId)}
                    className="block w-full text-left text-[12px] text-harness-accent hover:text-harness-accent/80 truncate"
                  >
                    {child ? child.name : childId}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!specNode && graphNode?.content && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Content</span>
            <div className="mt-1 rounded-md border border-harness-border bg-harness-bg p-3">
              <p className="text-[12px] leading-relaxed text-gray-300 whitespace-pre-wrap">{graphNode.content}</p>
            </div>
          </div>
        )}

        {!specNode && graphNode?.children && graphNode.children.length > 0 && (
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">Children</span>
            <p className="mt-0.5 text-[12px] text-gray-400">{graphNode.children.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
