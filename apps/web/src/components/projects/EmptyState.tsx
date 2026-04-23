import { useState, useCallback, type DragEvent } from 'react';
import { FolderOpen, GitBranch, Plus } from 'lucide-react';
import { ActionCard } from './ActionCard';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  onOpenFolder: () => void;
  onCloneRepo: () => void;
  onCreateProject: () => void;
  onDropFolder: (path: string) => void;
  isLoading: boolean;
}

export function EmptyState({ onOpenFolder, onCloneRepo, onCreateProject, onDropFolder, isLoading }: EmptyStateProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const items = e.dataTransfer.items;
      if (!items) return;

      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry?.isDirectory) {
          onDropFolder(entry.fullPath || (entry as FileSystemDirectoryEntry).name);
          return;
        }
      }

      // Fallback: try file path
      const file = e.dataTransfer.files[0];
      if (file) {
        const path = (file as File & { path?: string }).path;
        if (path) {
          onDropFolder(path);
        }
      }
    },
    [onDropFolder],
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex h-full flex-col items-center justify-center p-8 transition-all duration-200',
        isDragOver && 'relative',
      )}
    >
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-harness-accent bg-harness-accent/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <FolderOpen className="h-10 w-10 text-harness-accent" />
            <span className="text-sm font-medium text-harness-accent">释放以打开项目文件夹</span>
          </div>
        </div>
      )}

      <div className={cn('flex flex-col items-center gap-8 transition-opacity duration-200', isDragOver && 'opacity-30')}>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-gray-100">Harnesson</h1>
          <p className="text-sm text-gray-500">开始你的第一个项目</p>
        </div>

        <div className="grid w-full max-w-xl grid-cols-3 gap-4">
          <ActionCard icon={FolderOpen} title="打开文件夹" description="选择本地项目文件夹" onClick={onOpenFolder} />
          <ActionCard icon={GitBranch} title="克隆仓库" description="从远程 Git 仓库克隆" onClick={onCloneRepo} />
          <ActionCard icon={Plus} title="创建项目" description="创建一个新的空项目" onClick={onCreateProject} />
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-harness-accent border-t-transparent" />
            处理中...
          </div>
        )}
      </div>
    </div>
  );
}
