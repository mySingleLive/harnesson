import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const COLLAPSED_WIDTH = 6;

interface ResizableDividerProps {
  minWidth: number;
  currentWidth: number;
  isCollapsed: boolean;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
  onCollapse: () => void;
  onExpand: () => void;
}

export function ResizableDivider({
  minWidth,
  currentWidth,
  isCollapsed,
  onResize,
  onResizeEnd,
  onCollapse,
  onExpand,
}: ResizableDividerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startWidth: number;
    expanded: boolean;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = isCollapsed ? 0 : currentWidth;

      dragRef.current = { startX, startWidth, expanded: false };
      setIsDragging(true);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [currentWidth, isCollapsed],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startX - e.clientX;

      if (isCollapsed) {
        if (delta > 10 && !dragRef.current.expanded) {
          dragRef.current.expanded = true;
          onExpand();
        }
        return;
      }

      const newWidth = dragRef.current.startWidth + delta;
      if (newWidth < minWidth) {
        onCollapse();
        dragRef.current = null;
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        return;
      }
      onResize(newWidth);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragRef.current && !isCollapsed) {
        const finalWidth = dragRef.current.startWidth + (dragRef.current.startX - e.clientX);
        if (finalWidth >= minWidth) {
          onResizeEnd(finalWidth);
        }
      }
      dragRef.current = null;
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isCollapsed, minWidth, onResize, onResizeEnd, onCollapse, onExpand]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'flex-shrink-0 transition-colors duration-150',
        isCollapsed
          ? 'cursor-ew-resize'
          : isDragging
            ? 'w-[3px] cursor-col-resize bg-harness-accent'
            : isHovered
              ? 'w-[3px] cursor-col-resize bg-harness-accent'
              : 'w-px cursor-default bg-harness-border',
        isCollapsed && isHovered && 'bg-harness-accent',
      )}
      style={isCollapsed ? { width: COLLAPSED_WIDTH } : undefined}
    />
  );
}
