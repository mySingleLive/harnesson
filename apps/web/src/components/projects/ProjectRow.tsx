import { FolderKanban, Eye, FolderOpen, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '@harnesson/shared';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/time';

interface ProjectRowProps {
  project: Project;
  onOpen: (project: Project) => void;
  onReveal: (id: string) => void;
  onRemove: (id: string) => void;
  onViewDetail: (project: Project) => void;
}

export function ProjectRow({ project, onOpen, onReveal, onRemove, onViewDetail }: ProjectRowProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handleRemoveClick = useCallback(() => {
    if (confirmRemove) {
      onRemove(project.id);
      setConfirmRemove(false);
    } else {
      setConfirmRemove(true);
      confirmTimer.current = setTimeout(() => setConfirmRemove(false), 3000);
    }
  }, [confirmRemove, onRemove, project.id]);

  const timeAgo = formatTimeAgo(project.updatedAt);

  return (
    <div
      onClick={() => onOpen(project)}
      className="group flex cursor-pointer items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-white/[0.03]"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-harness-accent/10">
        <FolderKanban className="h-4 w-4 text-harness-accent" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-200">{project.name}</div>
      </div>

      <div className="hidden min-w-0 flex-1 truncate text-xs text-gray-500 md:block">{project.path}</div>

      <span className="flex-shrink-0 text-[11px] text-gray-600">{timeAgo}</span>

      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetail(project); }}
          className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300"
          title="查看详情"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReveal(project.id); }}
          className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300"
          title="打开文件夹"
        >
          <FolderOpen className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
          className={cn(
            'rounded p-1 hover:bg-white/5',
            confirmRemove ? 'text-red-400' : 'text-gray-500 hover:text-gray-300',
          )}
          title={confirmRemove ? '确认移除？' : '移除'}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

