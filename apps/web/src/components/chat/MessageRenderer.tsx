import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AgentMessage, ImageAttachment, ContentBlock } from '@harnesson/shared';
import { buildEventTree, type TreeSegment } from './tool-cards/buildEventTree';
import { SingleToolEventCard } from './tool-cards/ToolEventCard';
import { StreamingAgentCard } from './tool-cards/StreamingAgentCard';
import { QAResultCard } from './tool-cards/QAResultCard';
import { TodoCard } from './tool-cards/TodoCard';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ImagePreview } from './ImagePreview';

interface MessageRendererProps {
  message: AgentMessage;
  agentName: string;
  isStreaming: boolean;
}

export function MessageRenderer({ message, agentName, isStreaming }: MessageRendererProps) {
  if (message.todoSnapshot) {
    return (
      <div className="py-3.5 pl-10 pr-5">
        <TodoCard todos={message.todoSnapshot} />
      </div>
    );
  }

  if (message.role === 'user') {
    return <UserMessage content={message.content} images={message.images} contentBlocks={message.contentBlocks} />;
  }

  return <AgentMessageBubble events={message.events ?? []} agentName={agentName} isStreaming={isStreaming} />;
}

function UserMessage({ content, images, contentBlocks }: { content: string; images?: ImageAttachment[]; contentBlocks?: ContentBlock[] }) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const renderContent = () => {
    // Priority 1: contentBlocks (rich inline content)
    if (contentBlocks && contentBlocks.length > 0) {
      return contentBlocks.map((block, i) => {
        if (block.type === 'text') {
          return <span key={i} className="whitespace-pre-wrap">{block.text}</span>;
        }
        if (block.type === 'image' && block.image) {
          const src = `data:${block.image.mediaType};base64,${block.image.base64}`;
          return (
            <img
              key={i}
              src={src}
              alt={block.image.name ?? 'Image'}
              className="inline max-h-[200px] max-w-[300px] rounded cursor-pointer align-middle"
              onClick={() => setPreviewSrc(src)}
            />
          );
        }
        return null;
      });
    }

    // Priority 2: images array (text + image grid)
    if (images && images.length > 0) {
      return (
        <>
          {content}
          <div className="flex flex-wrap gap-2 mt-2">
            {images.map((img) => {
              const src = `data:${img.mediaType};base64,${img.base64}`;
              return (
                <img
                  key={img.id}
                  src={src}
                  alt={img.name ?? 'Image'}
                  className="max-h-[200px] max-w-[300px] rounded cursor-pointer"
                  onClick={() => setPreviewSrc(src)}
                />
              );
            })}
          </div>
        </>
      );
    }

    // Priority 3: plain text (backward compatible)
    return content;
  };

  return (
    <>
      {previewSrc && <ImagePreview src={previewSrc} onClose={() => setPreviewSrc(null)} />}
      <div className="px-5 py-4 flex justify-start">
        <div
          className="flex-1 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed text-gray-300"
          style={{ background: '#2a2a48', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
}

function AgentMessageBubble({ events, agentName, isStreaming }: {
  events: AgentMessage['events'];
  agentName: string;
  isStreaming: boolean;
}) {
  const tree = buildEventTree(events ?? []);

  if (tree.length === 0 && !isStreaming) {
    return null;
  }

  return (
    <div className="py-3.5 pl-10 pr-5">
      {tree.map((seg, i) => renderTreeSegment(seg, i))}
      {isStreaming && tree.length === 0 && <ThinkingIndicator />}
      {events?.filter((e) => e.type === 'agent.error').map((event, i) => (
        <div key={`error-${i}`} className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-[12px] text-red-400">
          {event.message}
        </div>
      ))}
    </div>
  );
}

function renderTreeSegment(seg: TreeSegment, key: number): React.ReactNode {
  if (seg.type === 'text') {
    return (
      <div key={key} className="mb-5 text-[13px] leading-relaxed text-gray-300 prose prose-invert prose-sm max-w-none prose-headings:text-gray-200 prose-p:text-gray-300 prose-strong:text-gray-200 prose-code:text-harness-accent prose-code:before:content-none prose-code:after:content-none prose-pre:bg-harness-sidebar prose-a:text-harness-accent prose-li:text-gray-300">
        <Markdown remarkPlugins={[remarkGfm]}>{seg.content}</Markdown>
      </div>
    );
  }
  if (seg.type === 'qa-result') {
    return (
      <div key={key} className="mb-3">
        <QAResultCard question={seg.question} answer={seg.answer} />
      </div>
    );
  }
  if (seg.event.tool === 'Agent') {
    return (
      <div key={key} className="mb-3">
        <StreamingAgentCard event={seg.event} treeChildren={seg.children} />
      </div>
    );
  }
  return (
    <div key={key} className="mb-3">
      <SingleToolEventCard event={seg.event} />
    </div>
  );
}
