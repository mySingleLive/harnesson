import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (opts: { name: string; path: string; description?: string; gitInit: boolean }) => Promise<unknown>;
  isCreating: boolean;
}

export function CreateProjectModal({ onClose, onCreate, isCreating }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('~/projects');
  const [description, setDescription] = useState('');
  const [gitInit, setGitInit] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await onCreate({ name: name.trim(), path: path.trim() || '~/projects', description: description.trim() || undefined, gitInit });
      onClose();
    } catch {
      setError('创建失败，请检查路径');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="创建新项目"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-harness-border bg-harness-sidebar shadow-2xl">
        <div className="flex items-center justify-between border-b border-harness-border px-5 py-3">
          <span className="text-sm font-medium text-gray-200">创建新项目</span>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">项目名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-project"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">项目路径</label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="~/projects"
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">描述（选填）</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="项目描述..."
              className="w-full rounded-lg border border-harness-border bg-harness-content px-3 py-2 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-harness-accent"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={gitInit}
              onChange={(e) => setGitInit(e.target.checked)}
              className="accent-harness-accent"
            />
            初始化 Git 仓库
          </label>

          {error && <div className="text-xs text-red-400">{error}</div>}

          {isCreating && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              创建中...
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
            disabled={!name.trim() || isCreating}
            className="rounded-md bg-harness-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}
