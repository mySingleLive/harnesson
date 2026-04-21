import type { AgentStatus } from '@harnesson/shared';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentStatusDotProps {
  status: AgentStatus;
  className?: string;
}

export function AgentStatusDot({ status, className }: AgentStatusDotProps) {
  if (status === 'error') {
    return (
      <span className={cn('flex items-center justify-center', className)}>
        <AlertCircle className="h-4 w-4 text-red-500" />
      </span>
    );
  }

  const colorMap: Record<Exclude<AgentStatus, 'error'>, string> = {
    running: 'bg-orange-500 animate-[pulse-scale_1.8s_ease-in-out_infinite]',
    completed: 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.3)]',
    waiting: 'bg-amber-500 opacity-70',
    idle: 'bg-gray-500',
  };

  return (
    <span className={cn('flex items-center justify-center', className)}>
      <span className={cn('h-2 w-2 rounded-full', colorMap[status])} />
    </span>
  );
}