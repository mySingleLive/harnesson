import { Settings } from 'lucide-react';

interface TopbarProps {
  projectName: string;
  branch: string;
  runningAgentCount: number;
}

export function Topbar({ projectName, branch, runningAgentCount }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-harness-border bg-[#1a1a2e] px-4 py-2 text-[13px]">
      <div className="flex items-center gap-4">
        <span className="text-[15px] font-bold text-harness-accent">Harnesson</span>
        <span className="text-gray-600">|</span>
        <button className="rounded-md bg-white/5 px-3 py-1 text-gray-400">
          ▼ {projectName}
        </button>
        <span className="text-[12px] text-gray-500">{branch}</span>
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