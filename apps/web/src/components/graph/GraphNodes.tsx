import { Handle, Position, type NodeProps } from '@xyflow/react';

interface GraphNodeData {
  label: string;
  content?: string;
  level: number;
  status?: string;
  [key: string]: unknown;
}

const statusColors: Record<string, { dot: string; text: string }> = {
  draft: { dot: '#f9e2af', text: '#f9e2af' },
  review: { dot: '#89b4fa', text: '#89b4fa' },
  done: { dot: '#a6e3a1', text: '#a6e3a1' },
};

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
  return (
    <div className="cursor-pointer rounded-lg border border-blue-500/60 bg-blue-500/10 px-3 py-2 shadow-md transition-shadow hover:shadow-blue-500/20" style={{ minWidth: 140, maxWidth: 170 }}>
      <Handle type="target" position={Position.Left} className="!bg-blue-500" />
      {d.status && <StatusBadge status={d.status} />}
      <div className="text-[12px] font-medium text-blue-400" style={{ marginTop: d.status ? 3 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={45} />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
    </div>
  );
}

export function FeatureNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-1.5 shadow-sm transition-shadow hover:shadow-green-500/20" style={{ minWidth: 120, maxWidth: 160 }}>
      <Handle type="target" position={Position.Left} className="!bg-green-500" />
      {d.status && <StatusBadge status={d.status} />}
      <div className="text-[11px] text-green-400" style={{ marginTop: d.status ? 2 : 0 }}>{d.label}</div>
      <SummaryLine content={d.content} maxLen={40} />
      <Handle type="source" position={Position.Right} className="!bg-green-500" />
    </div>
  );
}

export const nodeTypes = {
  project: ProjectNode,
  domain: DomainNode,
  feature: FeatureNode,
} as const;
