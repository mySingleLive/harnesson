import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentMessage } from '@harnesson/shared';
import { segmentEvents, SingleToolEventCard } from './tool-cards';

interface MessageRendererProps {
  message: AgentMessage;
  agentName: string;
  isStreaming: boolean;
}

export function MessageRenderer({ message, agentName, isStreaming }: MessageRendererProps) {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />;
  }

  return <AgentMessageBubble events={message.events ?? []} agentName={agentName} isStreaming={isStreaming} />;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="border-b border-white/[0.04] bg-harness-accent/[0.04] px-4 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-harness-accent">You</div>
      <div className="text-[13px] leading-relaxed text-gray-300">{content}</div>
    </div>
  );
}

function AgentMessageBubble({ events, agentName, isStreaming }: {
  events: AgentMessage['events'];
  agentName: string;
  isStreaming: boolean;
}) {
  const segments = segmentEvents(events ?? []);

  return (
    <div className="border-b border-white/[0.04] px-4 py-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-green-500">{agentName}</span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-[11px] text-purple-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
            thinking...
          </span>
        )}
      </div>

      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <div key={i} className="mb-5 border-l-2 border-green-500/40 pl-3 text-[13px] leading-relaxed text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-strong:text-gray-200 prose-code:text-harness-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-300">
            <Markdown remarkPlugins={[remarkGfm]}>{seg.content}</Markdown>
          </div>
        ) : (
          <div key={i} className="mb-3">
            <SingleToolEventCard event={seg.event} />
          </div>
        )
      )}

      {events?.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={`error-${i}`} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}
