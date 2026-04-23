import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

export function ActionCard({ icon: Icon, title, description, onClick, className }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full flex-col items-center gap-3 rounded-xl border border-transparent p-6',
        'bg-harness-sidebar transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-harness-accent hover:shadow-lg hover:shadow-harness-accent/10',
        'focus:outline-none focus:ring-2 focus:ring-harness-accent/50',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-harness-accent/10 text-harness-accent transition-colors group-hover:bg-harness-accent/20">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-200">{title}</div>
        <div className="mt-1 text-xs text-gray-500">{description}</div>
      </div>
    </button>
  );
}
