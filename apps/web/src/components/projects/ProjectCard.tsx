import { FolderKanban, MoreHorizontal, Eye, FolderOpen, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onReveal: (id: string) => void;
  onRemove: (id: string) => void;
  onViewDetail: (project: Project) => void;
}

export function ProjectCard({ project, onOpen, onReveal, onRemove, onViewDetail }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleRemoveClick = useCallback(() => {
    if (confirmRemove) {
      onRemove(project.id);
      setConfirmRemove(false);
    } else {
      setConfirmRemove(true);
      confirmTimer.current = setTimeout(() => setConfirmRemove(false), 3000);
    }
  }, [confirmRemove, onRemove, project.id]);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const timeAgo = formatTimeAgo(project.updatedAt);

  return (
    <div
      onClick={() => onOpen(project)}
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-transparent bg-harness-sidebar p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-harness-accent/50 hover:shadow-lg hover:shadow-harness-accent/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-harness-accent/10">
            <FolderKanban className="h-4 w-4 text-harness-accent" />
          </div>
          <span className="text-sm font-medium text-gray-200">{project.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:bg-white/5 hover:text-gray-300 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <span className="truncate text-xs text-gray-500" title={project.path}>
        {project.path}
      </span>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-600">{timeAgo}</span>
        <div className="relative" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-6 right-0 z-20 w-36 rounded-lg border border-harness-border bg-harness-sidebar py-1 shadow-xl">
              <button
                onClick={(e) => { e.stopPropagation(); onViewDetail(project); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
              >
                <Eye className="h-3.5 w-3.5" />查看详情
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onReveal(project.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
              >
                <FolderOpen className="h-3.5 w-3.5" />打开文件夹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveClick(); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5',
                  confirmRemove ? 'text-red-400' : 'text-gray-300',
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmRemove ? '确认移除？' : '移除'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}
