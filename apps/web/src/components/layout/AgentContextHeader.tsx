import { Maximize2, Minimize2, X } from 'lucide-react';
import type { Agent } from '@harnesson/shared';
import { useElapsedTime } from '@/hooks/useElapsedTime';

interface AgentContextHeaderProps {
  agent: Agent;
  onToggleMaximize: () => void;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  running: { label: 'Running', className: 'bg-orange-500/15 text-orange-500' },
  waiting: { label: 'Waiting', className: 'bg-amber-500/15 text-amber-500' },
  completed: { label: 'Completed', className: 'bg-green-500/15 text-green-500' },
  error: { label: 'Error', className: 'bg-red-500/15 text-red-500' },
  idle: { label: 'Idle', className: 'bg-gray-500/15 text-gray-400' },
};

export function AgentContextHeader({ agent, onToggleMaximize, onClose }: AgentContextHeaderProps) {
  const elapsed = useElapsedTime(agent.createdAt);
  const status = statusConfig[agent.status] ?? statusConfig.idle;
  const ctx = agent.sessionContext;
  const isMaximized = agent.panelState.isMaximized;

  return (
    <div className="flex-shrink-0">
      {/* 第一行：名称 + 状态 + 运行时间 + 按钮 */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="text-[14px] font-semibold text-gray-200">{agent.name}</span>
        <span className={`rounded-full px-2 py-[1px] text-[11px] ${status.className}`}>
          {status.label}
        </span>
        <span className="ml-auto mr-2 text-[11px] text-gray-600">{elapsed}</span>
        <button
          onClick={onToggleMaximize}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 第二行：上下文信息 */}
      <div className="px-4 pb-2.5">
        {ctx?.taskTitle && (
          <div className="text-[12px] text-gray-300">{ctx.taskTitle}</div>
        )}
        <div className="text-[11px] text-gray-500 font-mono">{agent.worktreePath}</div>
        <div className="mt-0.5 text-[11px] text-gray-500">
          {agent.model ?? 'Unknown'}
          {ctx?.tokenUsage != null && (
            <span> · {(ctx.tokenUsage / 1000).toFixed(1)}k tokens</span>
          )}
        </div>
      </div>
    </div>
  );
}
