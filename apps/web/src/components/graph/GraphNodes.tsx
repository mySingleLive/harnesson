import { Handle, Position, type NodeProps } from '@xyflow/react';

interface GraphNodeData {
  label: string;
  content?: string;
  level: number;
  [key: string]: unknown;
}

export function ProjectNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border-2 border-harness-accent bg-harness-accent/20 px-5 py-3 text-center shadow-lg transition-shadow hover:shadow-harness-accent/20">
      <Handle type="target" position={Position.Top} className="!bg-harness-accent" />
      <div className="text-[13px] font-semibold text-harness-accent">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-harness-accent" />
    </div>
  );
}

export function DomainNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border border-blue-500/60 bg-blue-500/10 px-4 py-2 text-center shadow-md transition-shadow hover:shadow-blue-500/20">
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <div className="text-[12px] font-medium text-blue-400">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
}

export function FeatureNode({ data }: NodeProps) {
  const d = data as unknown as GraphNodeData;
  return (
    <div className="cursor-pointer rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-1.5 text-center shadow-sm transition-shadow hover:shadow-green-500/20">
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
      <div className="text-[11px] text-green-400">{d.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
}

export const nodeTypes = {
  project: ProjectNode,
  domain: DomainNode,
  feature: FeatureNode,
} as const;
