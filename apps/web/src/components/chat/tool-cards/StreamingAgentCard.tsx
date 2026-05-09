import { useState, useEffect, useRef } from 'react';
import type { PairedToolEvent } from './pairEvents';
import type { TreeSegment } from './buildEventTree';
import { SingleToolEventCard } from './ToolEventCard';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type CardStatus = 'running' | 'completed' | 'error' | 'pending';

function getStatus(event?: PairedToolEvent): CardStatus {
  if (!event?.output) return 'running';
  if (event.isError) return 'error';
  return 'completed';
}

const STATUS_STYLES: Record<CardStatus, { bg: string; border: string }> = {
  running: {
    bg: 'rgba(168, 85, 247, 0.08)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
  },
  completed: {
    bg: 'rgba(74, 222, 128, 0.06)',
    border: '1px solid rgba(74, 222, 128, 0.15)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  pending: {
    bg: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
};

function StatusBadge({ status, duration }: { status: CardStatus; duration?: number }) {
  if (status === 'running') {
    return (
      <span className="flex items-center gap-1.5 text-purple-400">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
        running...
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="text-green-500">
        ✓ {duration != null ? formatDuration(duration) : ''}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="text-red-400">
        ✗ {duration != null ? formatDuration(duration) : ''}
      </span>
    );
  }
  return <span className="text-gray-600">pending</span>;
}

function TreeChildren({ children }: { children: TreeSegment[] }) {
  return (
    <div className="ml-5 border-l-[1.5px] border-gray-700 pl-3.5 pt-1.5 pb-0.5 space-y-1">
      {children.map((child, i) => {
        if (child.type === 'text') {
          return (
            <div key={`text-${i}`} className="flex items-start gap-1.5 py-0.5 text-[11px]">
              <span className="shrink-0 text-gray-600">💬</span>
              <span className="text-gray-400 italic line-clamp-2">{child.content.slice(0, 200)}</span>
            </div>
          );
        }
        if (child.type === 'qa-result') {
          return (
            <div key={`qa-${i}`} className="rounded bg-blue-500/10 px-2 py-1 text-[11px] text-blue-400">
              Q: {child.question.slice(0, 100)} → {child.answer.slice(0, 100)}
            </div>
          );
        }
        if (child.event.tool === 'Agent') {
          return (
            <div key={`agent-${i}`} className="py-0.5">
              <StreamingAgentCard event={child.event} treeChildren={child.children} />
            </div>
          );
        }
        return (
          <div key={`tool-${i}`} className="py-0.5">
            <SingleToolEventCard event={child.event} />
          </div>
        );
      })}
    </div>
  );
}

interface StreamingAgentCardProps {
  event: PairedToolEvent;
  treeChildren?: TreeSegment[];
}

export function StreamingAgentCard({ event, treeChildren }: StreamingAgentCardProps) {
  const status = getStatus(event);
  const hasChildren = (treeChildren?.length ?? 0) > 0;
  const [open, setOpen] = useState(status === 'running');
  const [manuallyOpened, setManuallyOpened] = useState(false);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (status === 'running') {
      setOpen(true);
    } else if (prevStatusRef.current === 'running' && status !== 'running' && !manuallyOpened) {
      setOpen(false);
    }
    prevStatusRef.current = status;
  }, [status, manuallyOpened]);

  const description = (event.input?.description as string) ?? 'Agent';
  const model = event.input?.model as string | undefined;
  const style = STATUS_STYLES[status];

  const handleToggle = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      setManuallyOpened(true);
    }
  };

  return (
    <div className="overflow-hidden rounded-md" style={{ background: style.bg, border: style.border }}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] text-left hover:brightness-110 transition-all"
      >
        <span className={`transition-transform duration-200 text-gray-500 ${open ? 'rotate-90' : ''}`}>▸</span>
        <span>🤖</span>
        <span className="font-medium text-gray-400">Agent</span>
        <span className="text-gray-600">·</span>
        <span className="truncate text-gray-500">{description}</span>
        {model && (
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-400">{model}</span>
        )}
        <span className="ml-auto">
          <StatusBadge status={status} duration={event.duration} />
        </span>
      </button>
      {open && hasChildren && (
        <div className="border-t border-white/5 px-1 pb-1" onClick={(e) => e.stopPropagation()}>
          <TreeChildren children={treeChildren!} />
        </div>
      )}
      {open && !hasChildren && status === 'running' && (
        <div className="border-t border-white/5 px-2.5 py-2 text-[11px] text-gray-600" onClick={(e) => e.stopPropagation()}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            waiting for events...
          </span>
        </div>
      )}
    </div>
  );
}
