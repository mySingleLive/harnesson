import { useState, type ReactNode } from 'react';

interface CollapsibleCardProps {
  icon: ReactNode;
  summary: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  isRunning?: boolean;
}

export function CollapsibleCard({ icon, summary, badge, children, isRunning }: CollapsibleCardProps) {
  const [open, setOpen] = useState(false);
  const hasDetail = Boolean(children);

  if (isRunning) {
    return (
      <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
        <div className="flex items-center gap-2 px-2.5 py-1 text-[11px]">
          {icon}
          {summary}
          <span className="ml-auto flex items-center gap-1 text-purple-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            running...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
      <button
        type="button"
        onClick={() => hasDetail && setOpen(!open)}
        className="flex w-full items-center gap-2 bg-[#1a1a2e] px-2.5 py-1 text-[11px] text-left hover:bg-[#1f1f38] transition-colors"
      >
        <span className={`transition-transform duration-200 text-gray-500 ${open ? 'rotate-90' : ''}`}>▸</span>
        {icon}
        {summary}
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {open && hasDetail && (
        <div className="max-h-[300px] overflow-y-auto border-t border-harness-border px-2.5 py-2">
          {children}
        </div>
      )}
    </div>
  );
}
