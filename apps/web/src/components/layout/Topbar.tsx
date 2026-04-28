import { Settings } from 'lucide-react';
import { ProjectDropdown } from './ProjectDropdown';
import { BranchDropdown } from './BranchDropdown';

interface TopbarProps {
  runningAgentCount: number;
  onCreateProject: () => void;
  onOpenFolder: () => void;
}

export function Topbar({ runningAgentCount, onCreateProject, onOpenFolder }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-harness-border bg-[#1a1a2e] px-4 py-2 text-[13px]">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-bold text-harness-accent">Harnesson</span>
        <span className="text-gray-600">|</span>
        <ProjectDropdown onCreateProject={onCreateProject} onOpenFolder={onOpenFolder} />
        <BranchDropdown />
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
