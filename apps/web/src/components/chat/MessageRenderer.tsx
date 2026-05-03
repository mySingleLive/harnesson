import type { AgentMessage, AgentStreamEvent } from '@harnesson/shared';

interface MessageRendererProps {
  message: AgentMessage;
  agentName: string;
  isStreaming: boolean;
}

export function MessageRenderer({ message, agentName, isStreaming }: MessageRendererProps) {
  if (message.role === 'user') {
    return <UserMessage content={message.content} />;
  }

  return <AgentMessageBubble events={message.events ?? []} content={message.content} agentName={agentName} isStreaming={isStreaming} />;
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="border-b border-white/[0.04] bg-harness-accent/[0.04] px-4 py-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-harness-accent">You</div>
      <div className="text-[13px] leading-relaxed text-gray-300">{content}</div>
    </div>
  );
}

function AgentMessageBubble({ events, content, agentName, isStreaming }: {
  events: AgentStreamEvent[];
  content: string;
  agentName: string;
  isStreaming: boolean;
}) {
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

      {content && (
        <div className="border-l-2 border-green-500/40 pl-3 text-[13px] leading-relaxed text-gray-300">
          {content}
        </div>
      )}

      <div className="mt-2 space-y-2">
        {events
          .filter((e) => e.type === 'agent.tool_use' || e.type === 'agent.tool_result')
          .map((event, i) => (
            <ToolEventCard key={i} event={event} />
          ))}
      </div>

      {events.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={i} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}

function ToolEventCard({ event }: { event: AgentStreamEvent }) {
  if (event.type === 'agent.tool_use') {
    return (
      <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
        <div className="flex items-center gap-2 bg-[#1a1a2e] px-2.5 py-1 text-[11px] text-gray-500">
          <span>🔧</span>
          <span className="font-medium text-gray-400">{event.tool}</span>
          {event.input?.file_path && (
            <span className="text-gray-600">{event.input.file_path as string}</span>
          )}
          {event.input?.command && (
            <span className="truncate text-gray-600 font-mono">{event.input.command as string}</span>
          )}
        </div>
        {event.input && !event.input.file_path && !event.input.command && (
          <div className="px-2.5 py-1.5 font-mono text-[11px] text-gray-600">
            {JSON.stringify(event.input, null, 2).slice(0, 200)}
          </div>
        )}
      </div>
    );
  }

  if (event.type === 'agent.tool_result') {
    return (
      <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
        <div className="flex items-center justify-between bg-[#1a1a2e] px-2.5 py-1 text-[11px]">
          <span className={event.isError ? 'text-red-400' : 'text-green-500'}>
            {event.isError ? '✗' : '✓'} Result
          </span>
          {event.duration != null && (
            <span className="text-gray-600">{event.duration}ms</span>
          )}
        </div>
        {event.output && (
          <div className="max-h-[200px] overflow-auto px-2.5 py-1.5 font-mono text-[11px] text-gray-500 whitespace-pre-wrap">
            {event.output.slice(0, 1000)}
          </div>
        )}
      </div>
    );
  }

  return null;
}
