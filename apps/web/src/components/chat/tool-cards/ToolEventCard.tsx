import type { ComponentType } from 'react';
import type { AgentStreamEvent } from '@harnesson/shared';
import { pairEvents, type PairedToolEvent } from './pairEvents';
import { GlobCard } from './GlobCard';
import { GrepCard } from './GrepCard';
import { ReadCard } from './ReadCard';
import { WriteCard } from './WriteCard';
import { EditCard } from './EditCard';
import { BashCard } from './BashCard';
import { LSPCard } from './LSPCard';
import { GenericCard } from './GenericCard';
import { AgentCard } from './AgentCard';
import { AskUserQuestionCard } from './AskUserQuestionCard';

const toolCardMap: Record<string, ComponentType<{ event: PairedToolEvent }>> = {
  Glob: GlobCard,
  Grep: GrepCard,
  Read: ReadCard,
  Write: WriteCard,
  Edit: EditCard,
  Bash: BashCard,
  LSP: LSPCard,
  Agent: AgentCard,
  AskUserQuestion: AskUserQuestionCard,
};

export function ToolEventCardList({ events }: { events: AgentStreamEvent[] }) {
  const paired = pairEvents(events);

  return (
    <div className="mt-2 space-y-2">
      {paired.map((event, i) => {
        const Card = toolCardMap[event.tool] ?? GenericCard;
        return <Card key={i} event={event} />;
      })}
    </div>
  );
}

export function SingleToolEventCard({ event }: { event: PairedToolEvent }) {
  const Card = toolCardMap[event.tool] ?? GenericCard;
  return <Card event={event} />;
}
