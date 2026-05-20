import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraphStore } from '@/stores/graphStore';
import type { SpecTreeNode } from '@harnesson/shared';

const statusColors: Record<string, string> = {
  draft: 'text-yellow-400',
  review: 'text-blue-400',
  done: 'text-green-400',
};

function StatusDot({ status }: { status?: string }) {
  if (!status) return null;
  const color = statusColors[status] ?? 'text-gray-500';
  return (
    <span className={cn('flex items-center gap-1 text-[10px] font-medium', color)}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function TreeNodeRow({
  node,
  depth,
  onSelect,
}: {
  node: SpecTreeNode;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node.id);
        }}
        className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/[0.03]"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-600" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <span className="text-[12px] font-medium text-gray-300">{node.name}</span>
        <StatusDot status={node.status} />
        <span className="ml-auto truncate text-[11px] text-gray-600 max-w-[200px]">
          {node.summary?.slice(0, 80)}{(node.summary?.length ?? 0) > 80 ? '…' : ''}
        </span>
      </button>
      {expanded &&
        node.children.map((childId) => {
          const { specsNodeMap } = useGraphStore.getState();
          const child = specsNodeMap?.[childId];
          if (!child) return null;
          return (
            <TreeNodeRow key={childId} node={child} depth={depth + 1} onSelect={onSelect} />
          );
        })}
    </div>
  );
}

export function SpecsList() {
  const specsTree = useGraphStore((s) => s.specsTree);
  const selectNodes = useGraphStore((s) => s.selectNodes);

  if (!specsTree) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs tree data available</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <TreeNodeRow node={specsTree} depth={0} onSelect={(id) => selectNodes([id])} />
    </div>
  );
}
