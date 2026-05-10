import { useState, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import type { Agent, AgentMessage, ContentBlock, ImageAttachment } from '@harnesson/shared';
import { useAgentStore } from '@/stores/agentStore';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { parseSlashCommand } from '@/lib/slashCommandUtils';
import * as api from '@/lib/serverApi';
import { AgentContextHeader } from './AgentContextHeader';
import { MessageRenderer } from '@/components/chat/MessageRenderer';
import { ThinkingBar } from '@/components/chat/ThinkingBar';
import { TodoBar } from '@/components/chat/TodoBar';
import { AskUserQuestionPanel } from '../chat/AskUserQuestionPanel';
import { RichTextInput } from '@/components/chat/RichTextInput';
import { useAutoScroll } from '@/hooks/useAutoScroll';

interface AgentPanelProps {
  agent: Agent;
  messages: AgentMessage[];
  isMaximized: boolean;
  width?: number;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function AgentPanel({ agent, messages, isMaximized, width, onToggleMaximize, onClose }: AgentPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = useAgentStore((s) => s.isStreaming[agent.id] ?? false);
  const { isAtBottom, scrollToBottom } = useAutoScroll(scrollRef, [messages, isStreaming]);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const abortAgent = useAgentStore((s) => s.abortAgent);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const appendStreamEvent = useAgentStore((s) => s.appendStreamEvent);
  const todos = useAgentStore((s) => s.todos[agent.id]);
  const pendingQuestion = useAgentStore((s) => s.pendingQuestion[agent.id]);
  const hasPendingQuestion = pendingQuestion !== null && pendingQuestion !== undefined;
  const commands = useSlashCommandStore((s) => s.commands);

  const widthStyle = isMaximized ? 'flex-1' : 'flex-shrink-0';
  const widthProp = isMaximized ? {} : { style: { width: `${width ?? 440}px` } };

  const handleSend = async (data: { text: string; contentBlocks: ContentBlock[]; images: ImageAttachment[] }) => {
    const text = data.text.trim();
    if ((!text && data.images.length === 0) || isStreaming) return;

    const parsed = parseSlashCommand(text, commands);
    if (parsed && parsed.command.type === 'builtin') {
      // Add user message first
      useAgentStore.setState((s) => ({
        messages: {
          ...s.messages,
          [agent.id]: [...(s.messages[agent.id] ?? []), {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: text,
            timestamp: new Date().toISOString(),
          }],
        },
      }));

      const result = await api.executeCommand(agent.id, parsed.command.name, parsed.args || undefined);
      const icon = result.success ? '✓' : '✗';
      appendStreamEvent(agent.id, {
        type: 'agent.text',
        text: `${icon} ${result.success ? result.message : result.error}`,
      });
      appendStreamEvent(agent.id, { type: 'agent.done' });

      if (result.success && parsed.command.name === 'model' && parsed.args) {
        updateAgent(agent.id, { model: parsed.args });
      }
      return;
    }

    await sendMessage(agent.id, text, agent.model, {
      contentBlocks: data.contentBlocks,
      images: data.images,
    });
  };

  const handleAbort = async () => {
    await abortAgent(agent.id);
  };

  return (
    <div className={`relative flex h-full flex-col bg-harness-chat ${widthStyle}`} {...widthProp}>
      <AgentContextHeader
        agent={agent}
        onToggleMaximize={onToggleMaximize}
        onClose={onClose}
      />

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto relative">
        {messages.map((msg) => (
          <MessageRenderer
            key={msg.id}
            message={msg}
            agentName={agent.name}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'agent'}
          />
        ))}
        {messages.length === 0 && !isStreaming && (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-600">
            Waiting for response...
          </div>
        )}
        {((isStreaming && !hasPendingQuestion) || (todos && todos.length > 0)) && (
          <div className="sticky bottom-0 z-10 bg-harness-chat px-3 pt-1 pb-2">
            {isStreaming && !hasPendingQuestion && <ThinkingBar />}
            {todos && todos.length > 0 && <TodoBar todos={todos} />}
          </div>
        )}
        {!isAtBottom && (
          <div className="sticky bottom-2 z-20 flex justify-end pr-3">
            <button
              onClick={scrollToBottom}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#252540] text-gray-400 shadow-lg transition-colors hover:text-gray-200"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {hasPendingQuestion ? (
        <AskUserQuestionPanel
          question={pendingQuestion.question}
          onSubmit={(answer) =>
            useAgentStore.getState().submitQuestionAnswer(agent.id, answer)
          }
        />
      ) : (
      <div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
        <RichTextInput
          placeholder="Send a message..."
          commands={commands}
          cwd={agent.worktreePath}
          modelValue={agent.model}
          onModelChange={(modelId) => updateAgent(agent.id, { model: modelId })}
          isStreaming={isStreaming}
          onAbort={handleAbort}
          onSend={handleSend}
        />
      </div>
      )}
    </div>
  );
}
