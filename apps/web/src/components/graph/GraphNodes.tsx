import { Handle, Position, type NodeProps } from '@xyflow/react';

interface GraphNodeData {
  label: string;
  content?: string;
  level: number;
  status?: string;
  domainId?: string;
  [key: string]: unknown;
}

const statusColors: Record<string, { dot: string; text: string }> = {
  draft: { dot: '#f9e2af', text: '#f9e2af' },
  review: { dot: '#89b4fa', text: '#89b4fa' },
  done: { dot: '#a6e3a1', text: '#a6e3a1' },
};

const domainPalette = [
  { border: 'border-blue-500/60', bg: 'bg-blue-500/10', text: 'text-blue-400', handle: '#3b82f6', shadow: 'hover:shadow-blue-500/20' },
  { border: 'border-emerald-500/60', bg: 'bg-emerald-500/10', text: 'text-emerald-400', handle: '#10b981', shadow: 'hover:shadow-emerald-500/20' },
  { border: 'border-amber-500/60', bg: 'bg-amber-500/10', text: 'text-amber-400', handle: '#f59e0b', shadow: 'hover:shadow-amber-500/20' },
  { border: 'border-rose-500/60', bg: 'bg-rose-500/10', text: 'text-rose-400', handle: '#f43f5e', shadow: 'hover:shadow-rose-500/20' },
  { border: 'border-cyan-500/60', bg: 'bg-cyan-500/10', text: 'text-cyan-400', handle: '#06b6d4', shadow: 'hover:shadow-cyan-500/20' },
  { border: 'border-violet-500/60', bg: 'bg-violet-500/10', text: 'text-violet-400', handle: '#8b5cf6', shadow: 'hover:shadow-violet-500/20' },
];

const domainColorMap = new Map<string, number>();
let domainColorIndex = 0;

function getDomainColor(domainId: string) {
  if (!domainColorMap.has(domainId)) {
    domainColorMap.set(domainId, domainColorIndex % domainPalette.length);
    domainColorIndex++;
  }
  return domainPalette[domainColorMap.get(domainId)!];
}

function resetDomainColors() {
  domainColorMap.clear();
  domainColorIndex = 0;
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status];
  if (!color) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: color.dot }} />
      <span style={{ fontSize: 10, color: color.text, fontWeight: 600 }}>{status}</span>
    </div>
  );
}

function SummaryLine({ content, maxLen = 50 }: { content?: string; maxLen?: number }) {
  if (!content) return null;
  const truncated = content.length > maxLen ? content.slice(0, maxLen) + '…' : content;
  return (
    <div style={{ fontSize: 10, color: '#6c7086', lineHeight: 1.3, marginTop: 2 }}>
      {truncated}
    </div>
  );
}

export function ProjectNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border-2 border-harness-accent bg-harness-accent/20 px-4 py-2.5 shadow-lg transition-shadow hover:shadow-harness-accent/20" style={{ minWidth: 160, maxWidth: 180 }}>
      <Handle type="target" position={Position.Left} className="!bg-harness-accent" />
      {d.status && <StatusBadge status={d.status} />}
      <div className="text-[13px] font-semibold text-harness-accent" style={{ marginTop: d.status ? 4 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={60} />
      <Handle type="source" position={Position.Right} className="!bg-harness-accent" />
    </div>
  );
}

export function DomainNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  const color = d.domainId ? getDomainColor(d.domainId) : domainPalette[0];
  return (
    <div className={`cursor-pointer rounded-lg border ${color.border} ${color.bg} px-3 py-2 shadow-md transition-shadow ${color.shadow}`} style={{ minWidth: 140, maxWidth: 170 }}>
      <Handle type="target" position={Position.Left} style={{ background: color.handle }} />
      {d.status && <StatusBadge status={d.status} />}
      <div className={`text-[12px] font-medium ${color.text}`} style={{ marginTop: d.status ? 3 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={45} />
      <Handle type="source" position={Position.Right} style={{ background: color.handle }} />
    </div>
  );
}

export function FeatureNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  const color = d.domainId ? getDomainColor(d.domainId) : domainPalette[0];
  return (
    <div className={`cursor-pointer rounded-lg border ${color.border} ${color.bg} px-3 py-1.5 shadow-sm transition-shadow ${color.shadow}`} style={{ minWidth: 120, maxWidth: 160 }}>
      <Handle type="target" position={Position.Left} style={{ background: color.handle }} />
      {d.status && <StatusBadge status={d.status} />}
      <div className={`text-[11px] ${color.text}`} style={{ marginTop: d.status ? 2 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={40} />
      <Handle type="source" position={Position.Right} style={{ background: color.handle }} />
    </div>
  );
}

export const nodeTypes = {
  project: ProjectNode,
  domain: DomainNode,
  feature: FeatureNode,
} as const;

export { resetDomainColors };
