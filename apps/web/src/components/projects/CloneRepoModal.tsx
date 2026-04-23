import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CloneRepoModalProps {
  onClose: () => void;
  onClone: (url: string, localPath: string) => Promise<unknown>;
  isCloning: boolean;
}

export function CloneRepoModal({ onClose, onClone, isCloning }: CloneRepoModalProps) {
  const [url, setUrl] = useState('');
  const [localPath, setLocalPath] = useState('~/projects');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setError('');
    try {
      await onClone(url.trim(), localPath.trim() || '~/projects');
      onClose();
    } catch {
      setError('克隆失败，请检查仓库地址');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-harness-border bg-harness-sidebar shadow-2xl">
        <div className="flex items-center justify-between border-b border-harness-border px-5 py-3">
          <span className="text-sm font-medium text-gray-200">克隆 Git 仓库</span>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">仓库 URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">本地存放路径</label>
            <input
              type="text"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="~/projects"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          {isCloning && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              克隆中...
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-harness-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-gray-400 hover:bg-white/5"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url.trim() || isCloning}
            className="rounded-md bg-harness-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            克隆
          </button>
        </div>
      </div>
    </div>
  );
}
