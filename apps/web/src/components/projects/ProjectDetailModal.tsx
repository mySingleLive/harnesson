import { X } from 'lucide-react';
import type { Project } from '@harnesson/shared';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onOpen: (project: Project) => void;
  onDelete: (id: string) => void;
}

const sourceLabels: Record<Project['source'], string> = {
  local: '本地文件夹',
  clone: 'Git 克隆',
  create: '手动创建',
};

export function ProjectDetailModal({ project, onClose, onOpen, onDelete }: ProjectDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-harness-border bg-harness-sidebar p-0 shadow-2xl">
        <div className="flex items-center justify-between border-b border-harness-border px-5 py-3">
          <span className="text-sm font-medium text-gray-200">项目详情</span>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <DetailRow label="名称" value={project.name} />
          <DetailRow label="路径" value={project.path} />
          <DetailRow label="来源" value={sourceLabels[project.source]} />
          {project.description && <DetailRow label="描述" value={project.description} />}
          <DetailRow
            label="Agent"
            value={project.agentCount > 0 ? `${project.agentCount} 个活跃` : ''}
            fallback="无活跃 Agent"
            fallbackClassName="text-gray-600"
          />
          <DetailRow label="创建" value={new Date(project.createdAt).toLocaleDateString('zh-CN')} />
          <DetailRow label="更新" value={new Date(project.updatedAt).toLocaleDateString('zh-CN')} />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-harness-border px-5 py-3">
          <button
            onClick={() => onDelete(project.id)}
            className="rounded-md px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10"
          >
            删除
          </button>
          <button
            onClick={() => { onOpen(project); onClose(); }}
            className="rounded-md bg-harness-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-harness-accent/90"
          >
            打开项目
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  fallback,
  fallbackClassName,
}: {
  label: string;
  value: string;
  fallback?: string;
  fallbackClassName?: string;
}) {
  const displayValue = value || fallback;
  const isFallback = !value && fallback;
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={isFallback ? fallbackClassName : 'text-gray-200'}>{displayValue}</span>
    </div>
  );
}
