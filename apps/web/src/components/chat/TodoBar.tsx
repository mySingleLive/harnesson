import type { TodoItem } from '@harnesson/shared';

interface TodoBarProps {
  todos: TodoItem[];
}

export function TodoBar({ todos }: TodoBarProps) {
  if (todos.length === 0) return null;

  return (
    <div className="mx-3 mb-2 overflow-hidden rounded-lg border border-harness-border bg-harness-sidebar/80 backdrop-blur-sm animate-todo-slide-in">
      <div className="max-h-[40vh] overflow-y-auto px-4 py-2.5">
        {todos.map((item) => (
          <div key={item.id} className="flex items-center gap-2.5 py-[3px] text-[12px] leading-snug">
            <StatusIcon id={item.id} status={item.status} />
            <span className={
              item.status === 'completed'
                ? 'text-gray-500 line-through'
                : item.status === 'in_progress'
                  ? 'text-harness-text'
                  : 'text-gray-500'
            }>
              {item.subject}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ id, status }: { id: string; status: TodoItem['status'] }) {
  if (status === 'completed') {
    return (
      <span data-testid={`todo-check-${id}`} className="flex h-4 w-4 items-center justify-center text-emerald-400">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="0.5" y="0.5" width="13" height="13" rx="3" className="stroke-emerald-400" fill="none" />
          <path d="M4 7.5L6 9.5L10 5" className="stroke-emerald-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span data-testid={`todo-spinner-${id}`} className="flex h-4 w-4 items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 14" className="animate-spin">
          <circle cx="7" cy="7" r="5.5" className="stroke-harness-accent" fill="none" strokeWidth="1.5" strokeDasharray="26 10" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-4 w-4 items-center justify-center text-gray-600">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="0.5" y="0.5" width="13" height="13" rx="3" className="stroke-gray-600" fill="none" />
      </svg>
    </span>
  );
}
