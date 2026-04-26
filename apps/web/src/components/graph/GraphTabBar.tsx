import { cn } from '@/lib/utils';
import type { GraphTab } from '@harnesson/shared';

interface Tab {
  id: GraphTab;
  label: string;
}

const tabs: Tab[] = [
  { id: 'specs-graph', label: 'Specs Graph' },
  { id: 'specs-list', label: 'Specs List' },
  { id: 'specs-document', label: 'Specs Document' },
  { id: 'architect-graph', label: 'Architect Graph' },
  { id: 'technical-document', label: 'Technical Document' },
];

interface GraphTabBarProps {
  activeTab: GraphTab;
  onTabChange: (tab: GraphTab) => void;
}

export function GraphTabBar({ activeTab, onTabChange }: GraphTabBarProps) {
  return (
    <div className="flex items-center gap-0 border-b border-harness-border bg-harness-sidebar px-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative px-4 py-2.5 text-[12px] font-medium transition-colors',
            activeTab === tab.id
              ? 'text-harness-accent'
              : 'text-gray-500 hover:text-gray-300',
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-harness-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
