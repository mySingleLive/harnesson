import { useState, useRef, useEffect } from 'react';
import { Folder, ChevronDown, Search, Plus, FolderOpen } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface ProjectDropdownProps {
  onCreateProject: () => void;
  onOpenFolder: () => void;
}

export function ProjectDropdown({ onCreateProject, onOpenFolder }: ProjectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const switchProject = useProjectStore((s) => s.switchProject);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const projectName = activeProject?.name ?? 'No Project';

  const filtered = query
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.path.toLowerCase().includes(query.toLowerCase()),
      )
    : projects;

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (projectId: string) => {
    switchProject(projectId, 'main');
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300"
      >
        <Folder className="h-3 w-3" />
        <span className="font-medium text-gray-400">{projectName}</span>
        <ChevronDown className={`h-3 w-3 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-harness-border bg-harness-sidebar shadow-xl">
          {/* Search */}
          <div className="border-b border-harness-border p-2">
            <div className="flex items-center gap-2 rounded-md bg-harness-content px-2 py-1.5">
              <Search className="h-3 w-3 text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索项目..."
                className="flex-1 bg-transparent text-xs text-gray-200 outline-none placeholder-gray-600"
              />
            </div>
          </div>

          {/* Project list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-600">
                {query ? '无匹配项目' : '暂无项目'}
              </div>
            ) : (
              filtered.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelect(project.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/5 ${
                    project.id === activeProjectId ? 'bg-white/5 text-gray-200' : 'text-gray-400'
                  }`}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{project.name}</div>
                    <div className="truncate text-[10px] text-gray-600">{project.path}</div>
                  </div>
                  {project.id === activeProjectId && (
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-harness-accent" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Quick actions */}
          <div className="border-t border-harness-border p-1">
            <button
              onClick={() => {
                setOpen(false);
                setQuery('');
                onCreateProject();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
            >
              <Plus className="h-3.5 w-3.5" />
              新建项目
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setQuery('');
                onOpenFolder();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              打开文件夹
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
