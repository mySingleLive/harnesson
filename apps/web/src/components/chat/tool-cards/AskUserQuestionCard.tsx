import { CollapsibleCard } from './CollapsibleCard';
import type { PairedToolEvent } from './pairEvents';

export function AskUserQuestionCard({ event }: { event: PairedToolEvent }) {
  const questions = event.input?.questions as Array<Record<string, unknown>> | undefined;
  const question = questions?.[0];
  const header = question ? String(question.header ?? '') : '';
  const answer = event.output ?? '';

  return (
    <CollapsibleCard
      icon={<span className="text-harness-accent">?</span>}
      summary={<span className="font-medium text-gray-400">AskUserQuestion{header ? `: ${header}` : ''}</span>}
      isRunning={!event.output}
    >
      {question && (
        <div className="mb-1 text-[11px] text-gray-500">{String(question.question ?? '')}</div>
      )}
      {answer && (
        <div>
          <div className="text-[10px] font-semibold uppercase text-gray-500 mb-0.5">回答</div>
          <pre className="font-mono text-[11px] text-gray-500 whitespace-pre-wrap">{answer.slice(0, 500)}</pre>
        </div>
      )}
    </CollapsibleCard>
  );
}