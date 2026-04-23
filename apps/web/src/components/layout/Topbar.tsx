import { Settings, Folder, GitBranch, ChevronDown } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';

interface TopbarProps {
  runningAgentCount: number;
}

export function Topbar({ runningAgentCount }: TopbarProps) {
  const { activeProjectId, activeBranch } = useProjectStore();
  const projectName = activeProjectId ?? 'No Project';
  const branch = activeBranch ?? '—';

  return (
    <header className="flex items-center justify-between border-b border-harness-border bg-[#1a1a2e] px-4 py-2 text-[13px]">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold text-harness-accent">Harnesson</span>
        <span className="text-gray-600">|</span>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
          <Folder className="h-3 w-3" />
          <span className="font-medium text-gray-400">{projectName}</span>
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </button>
        <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
          <GitBranch className="h-3 w-3" />
          <span className="font-medium text-gray-400">{branch}</span>
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-green-500 px-2 py-[2px] text-[11px] font-semibold text-black">
          {runningAgentCount} Agents Running
        </span>
        <button className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[12px] text-gray-400">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </button>
      </div>
    </header>
  );
}