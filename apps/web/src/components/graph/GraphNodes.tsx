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
  { border: 'border-blue-500/60', selectedBorder: 'border-blue-500', bg: 'bg-blue-500/10', selectedBg: 'bg-blue-500/25', text: 'text-blue-400', handle: '#3b82f6', shadow: 'hover:shadow-blue-500/20', selectedShadow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]' },
  { border: 'border-emerald-500/60', selectedBorder: 'border-emerald-500', bg: 'bg-emerald-500/10', selectedBg: 'bg-emerald-500/25', text: 'text-emerald-400', handle: '#10b981', shadow: 'hover:shadow-emerald-500/20', selectedShadow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' },
  { border: 'border-amber-500/60', selectedBorder: 'border-amber-500', bg: 'bg-amber-500/10', selectedBg: 'bg-amber-500/25', text: 'text-amber-400', handle: '#f59e0b', shadow: 'hover:shadow-amber-500/20', selectedShadow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]' },
  { border: 'border-rose-500/60', selectedBorder: 'border-rose-500', bg: 'bg-rose-500/10', selectedBg: 'bg-rose-500/25', text: 'text-rose-400', handle: '#f43f5e', shadow: 'hover:shadow-rose-500/20', selectedShadow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]' },
  { border: 'border-cyan-500/60', selectedBorder: 'border-cyan-500', bg: 'bg-cyan-500/10', selectedBg: 'bg-cyan-500/25', text: 'text-cyan-400', handle: '#06b6d4', shadow: 'hover:shadow-cyan-500/20', selectedShadow: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]' },
  { border: 'border-violet-500/60', selectedBorder: 'border-violet-500', bg: 'bg-violet-500/10', selectedBg: 'bg-violet-500/25', text: 'text-violet-400', handle: '#8b5cf6', shadow: 'hover:shadow-violet-500/20', selectedShadow: 'shadow-[0_0_12px_rgba(139,92,246,0.35)]' },
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

export function ProjectNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className={`cursor-pointer rounded-lg border-2 border-harness-accent px-4 py-2.5 shadow-lg transition-all ${selected ? 'bg-harness-accent/40 shadow-[0_0_12px_rgba(139,92,246,0.4)]' : 'bg-harness-accent/20 hover:shadow-harness-accent/20'}`} style={{ minWidth: 160, maxWidth: 180 }}>
      <Handle type="target" position={Position.Left} className="!bg-harness-accent" />
      {d.status && <StatusBadge status={d.status} />}
      <div className="text-[13px] font-semibold text-harness-accent" style={{ marginTop: d.status ? 4 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={60} />
      <Handle type="source" position={Position.Right} className="!bg-harness-accent" />
    </div>
  );
}

export function DomainNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  const color = d.domainId ? getDomainColor(d.domainId) : domainPalette[0];
  return (
    <div className={`cursor-pointer rounded-lg border px-3 py-2 shadow-md transition-all ${selected ? `${color.selectedBorder} ${color.selectedBg} ${color.selectedShadow}` : `${color.border} ${color.bg} ${color.shadow}`}`} style={{ minWidth: 140, maxWidth: 170 }}>
      <Handle type="target" position={Position.Left} style={{ background: color.handle }} />
      {d.status && <StatusBadge status={d.status} />}
      <div className={`text-[12px] font-medium ${color.text}`} style={{ marginTop: d.status ? 3 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={45} />
      <Handle type="source" position={Position.Right} style={{ background: color.handle }} />
    </div>
  );
}

export function FeatureNode({ data, selected }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  const color = d.domainId ? getDomainColor(d.domainId) : domainPalette[0];
  return (
    <div className={`cursor-pointer rounded-lg border px-3 py-1.5 shadow-sm transition-all ${selected ? `${color.selectedBorder} ${color.selectedBg} ${color.selectedShadow}` : `${color.border} ${color.bg} ${color.shadow}`}`} style={{ minWidth: 120, maxWidth: 160 }}>
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
