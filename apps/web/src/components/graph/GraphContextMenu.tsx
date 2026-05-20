import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGraphStore } from '@/stores/graphStore';

interface GraphContextMenuProps {
  nodeId: string;
  x: number;
  y: number;
  onClose: () => void;
}

function getAllDescendantIds(
  nodeId: string,
  nodeMap: Record<string, { children: string[] }>,
): string[] {
  const node = nodeMap[nodeId];
  if (!node) return [];
  const children = node.children;
  return [...children, ...children.flatMap((id) => getAllDescendantIds(id, nodeMap))];
}

export function GraphContextMenu({ nodeId, x, y, onClose }: GraphContextMenuProps) {
  const specsNodeMap = useGraphStore((s) => s.specsNodeMap);
  const selectNodes = useGraphStore((s) => s.selectNodes);
  const addToSelection = useGraphStore((s) => s.addToSelection);

  const [position, setPosition] = useState({ x, y });
  const menuRef = useRef<HTMLDivElement>(null);
  const listenerTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const node = specsNodeMap?.[nodeId];
  const hasChildren = (node?.children?.length ?? 0) > 0;

  // Adjust position to stay within viewport
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const adjusted = { x, y };
    if (rect.right > window.innerWidth) adjusted.x = x - rect.width;
    if (rect.bottom > window.innerHeight) adjusted.y = y - rect.height;
    setPosition(adjusted);
  }, [x, y]);

  // Close on outside click, Escape, or window blur
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleBlur = () => onClose();
    // Delay to avoid capturing the triggering right-click
    listenerTimerRef.current = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', handleBlur);
    }, 0);
    return () => {
      if (listenerTimerRef.current) clearTimeout(listenerTimerRef.current);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onClose]);

  const handleSelect = useCallback(
    (event: React.MouseEvent) => {
      if (event.shiftKey) {
        addToSelection([nodeId]);
      } else {
        selectNodes([nodeId]);
      }
      onClose();
    },
    [nodeId, addToSelection, selectNodes, onClose],
  );

  const handleSelectDirectChildren = useCallback(() => {
    if (!node) return;
    selectNodes(node.children);
    onClose();
  }, [node, selectNodes, onClose]);

  const handleSelectAllChildren = useCallback(() => {
    if (!specsNodeMap) return;
    const allDescendants = getAllDescendantIds(nodeId, specsNodeMap);
    selectNodes(allDescendants);
    onClose();
  }, [nodeId, specsNodeMap, selectNodes, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[#252540] border border-white/10 rounded-[10px] py-1 min-w-[180px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        onClick={handleSelect}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
      >
        选择
      </button>

      {hasChildren && (
        <>
          <div className="h-px bg-white/[0.06] mx-2 my-1" />
          <button
            onClick={handleSelectDirectChildren}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
          >
            选择下一层子节点
          </button>
          <button
            onClick={handleSelectAllChildren}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-gray-200 hover:bg-white/[0.06] rounded-md mx-1 transition-colors"
          >
            选择所有子节点
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
