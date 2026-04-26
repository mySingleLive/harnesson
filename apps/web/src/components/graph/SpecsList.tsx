import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGraphStore } from '@/stores/graphStore';
import type { SpecsListItem } from '@harnesson/shared';

interface TreeNode {
  id: string;
  type: 'project' | 'domain' | 'feature';
  level: number;
  title: string;
  content?: string;
  children: TreeNode[];
}

function buildTree(items: SpecsListItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else if (item.level === 0) {
      roots.push(node);
    }
  }

  return roots;
}

const typeIconMap = {
  project: Folder,
  domain: FolderOpen,
  feature: FileText,
};

const typeColorMap = {
  project: 'text-harness-accent',
  domain: 'text-blue-400',
  feature: 'text-green-400',
};

function TreeNodeRow({
  node,
  depth,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const Icon = typeIconMap[node.type];

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) setExpanded(!expanded);
          onSelect(node.id);
        }}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-white/[0.03]',
          node.type === 'project' && 'border-b border-harness-border',
        )}
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
        <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', typeColorMap[node.type])} />
        <span className="text-[12px] font-medium text-gray-300">{node.title}</span>
      </button>
      {expanded &&
        node.children.map((child) => (
          <TreeNodeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
        ))}
    </div>
  );
}

export function SpecsList() {
  const specsData = useGraphStore((s) => s.specsData);
  const selectNode = useGraphStore((s) => s.selectNode);

  const tree = useMemo(() => {
    if (!specsData?.list || specsData.list.length === 0) return [];
    return buildTree(specsData.list);
  }, [specsData?.list]);

  if (tree.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">No specs list data available</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((node) => (
        <TreeNodeRow key={node.id} node={node} depth={0} onSelect={selectNode} />
      ))}
    </div>
  );
}
