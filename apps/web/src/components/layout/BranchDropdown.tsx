import { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Globe } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

export function BranchDropdown() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const branches = useProjectStore((s) => s.branches);
  const isBranchLoading = useProjectStore((s) => s.isBranchLoading);
  const doCheckout = useProjectStore((s) => s.checkoutBranch);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!activeProjectId) return null;

  const label = isBranchLoading ? '...' : branches.isGitRepo ? (branches.current ?? 'No Git') : 'No Git';

  const handleSelect = async (branch: string) => {
    if (!activeProjectId || branch === branches.current) {
      setOpen(false);
      return;
    }
    setError(null);
    const result = await doCheckout(activeProjectId, branch);
    if (result.success) {
      setOpen(false);
    } else {
      const msg = result.error || 'Checkout failed';
      setError(msg.replace(/^error:\s*/, ''));
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300"
      >
        <GitBranch className="h-3 w-3" />
        <span className="font-medium text-gray-400">{label}</span>
        <ChevronDown className={`h-3 w-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-harness-border bg-harness-sidebar shadow-xl">
          {error && (
            <div className="mx-2 mt-1 rounded-md bg-red-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-red-400">
              {error}
            </div>
          )}
          {!branches.isGitRepo ? (
            <div className="p-4 text-center">
              <p className="text-xs text-gray-500">此项目不是 Git 仓库</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto p-1">
              {/* Local branches */}
              {branches.local.length > 0 && (
                <>
                  <div className="px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                    Local
                  </div>
                  {branches.local.map((branch) => (
                    <button
                      key={branch}
                      onClick={() => handleSelect(branch)}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5 ${
                        branch === branches.current ? 'bg-white/5 text-harness-accent' : 'text-gray-400'
                      }`}
                    >
                      <GitBranch className="h-3 w-3 shrink-0" />
                      <span className="flex-1 truncate">{branch}</span>
                      {branch === branches.current && (
                        <span className="text-[10px]">✓</span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {/* Remote branches */}
              {branches.remote.length > 0 && (
                <>
                  <div className="mt-1 border-t border-harness-border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
                    Remote
                  </div>
                  {branches.remote.map((branch) => {
                    const displayName = branch.replace(/^origin\//, '');
                    return (
                      <button
                        key={branch}
                        onClick={() => handleSelect(branch)}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
                      >
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="flex-1 truncate">{displayName}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {branches.local.length === 0 && branches.remote.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-gray-600">无分支</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
