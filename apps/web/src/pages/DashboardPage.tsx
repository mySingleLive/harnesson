import { cn } from '@/lib/utils';

export function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Dashboard</h1>
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Running" value={3} color="text-orange-500" />
        <StatCard label="Pending" value={7} color="text-amber-500" />
        <StatCard label="Specs" value={24} color="text-harness-accent" />
        <StatCard label="Errors" value={1} color="text-red-500" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-harness-border bg-harness-sidebar p-4">
      <div className="mb-1 text-[11px] text-gray-500">{label}</div>
      <div className={cn('text-[28px] font-bold', color)}>{value}</div>
    </div>
  );
}
