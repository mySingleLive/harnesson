import type { TodoItem } from '@harnesson/shared';
import { CollapsibleCard } from './CollapsibleCard';

interface TodoCardProps {
  todos: TodoItem[];
}

export function TodoCard({ todos }: TodoCardProps) {
  if (todos.length === 0) return null;

  const completed = todos.filter((t) => t.status === 'completed').length;

  return (
    <CollapsibleCard
      icon={
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="0.5" y="0.5" width="11" height="11" rx="2.5" className="stroke-harness-accent" fill="none" />
          <path d="M3 6.5L5 8.5L9 4.5" className="stroke-harness-accent" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
      summary={<span className="text-gray-400">Tasks</span>}
      badge={<span className="text-[11px] text-emerald-400">{completed}/{todos.length}</span>}
    >
      <div className="space-y-1">
        {todos.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="0.5" y="0.5" width="11" height="11" rx="2" className="stroke-emerald-400" fill="none" />
                <path d="M3 6.5L5 8L9 4" className="stroke-emerald-400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span data-testid={`todo-check-${item.id}`} className="text-gray-400 line-through">{item.subject}</span>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
}
