import { SingleToolEventCard } from './ToolEventCard';
import type { PairedToolEvent } from './pairEvents';

interface AgentEventTreeProps {
  subEvents: PairedToolEvent[];
  subTexts: string[];
  depth?: number;
}

export function AgentEventTree({ subEvents, subTexts, depth = 0 }: AgentEventTreeProps) {
  const items: Array<{ type: 'text'; content: string } | { type: 'tool'; event: PairedToolEvent }> = [];

  const texts = [...subTexts];
  for (const evt of subEvents) {
    if (texts.length > 0) {
      items.push({ type: 'text', content: texts.shift()! });
    }
    items.push({ type: 'tool', event: evt });
  }
  while (texts.length > 0) {
    items.push({ type: 'text', content: texts.shift()! });
  }

  return (
    <div className={depth > 0 ? 'ml-3 border-l border-gray-700 pl-2' : ''}>
      {items.map((item, i) =>
        item.type === 'text' ? (
          <div key={`text-${i}`} className="flex items-start gap-1.5 py-0.5 text-[11px]">
            <span className="shrink-0 text-gray-600">💬</span>
            <span className="text-gray-400 italic line-clamp-2">{item.content.slice(0, 200)}</span>
          </div>
        ) : (
          <div key={`tool-${i}`} className="py-0.5">
            <SingleToolEventCard event={item.event} />
          </div>
        )
      )}
    </div>
  );
}
