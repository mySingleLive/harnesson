import { useState } from 'react';
import { Plus, Layers, GitBranch, ImageIcon, FileText, Terminal, Wrench, Network, ChevronDown, ArrowUp, StopCircle } from 'lucide-react';
import type { Agent, AgentMessage } from '@harnesson/shared';
import { useAgentStore } from '@/stores/agentStore';
import { AgentContextHeader } from './AgentContextHeader';
import { MessageRenderer } from '@/components/chat/MessageRenderer';

interface AgentPanelProps {
  agent: Agent;
  messages: AgentMessage[];
  isStreaming: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
}

export function AgentPanel({ agent, messages, isStreaming, isMaximized, onToggleMaximize, onClose }: AgentPanelProps) {
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const abortAgent = useAgentStore((s) => s.abortAgent);

  const width = isMaximized ? 'flex-1' : 'w-[440px] flex-shrink-0';

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(agent.id, text);
  };

  const handleAbort = async () => {
    await abortAgent(agent.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`relative flex h-full flex-col border-r border-harness-border bg-harness-chat ${width}`}>
      <AgentContextHeader
        agent={agent}
        onToggleMaximize={onToggleMaximize}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <MessageRenderer
            key={msg.id}
            message={msg}
            agentName={agent.name}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'agent'}
          />
        ))}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-[13px] text-gray-600">
            Waiting for response...
          </div>
        )}
      </div>

      <div className={`px-3 pb-3 ${isMaximized ? 'mx-auto w-full max-w-[800px]' : ''}`}>
        <div className="rounded-2xl border border-white/10 bg-harness-sidebar transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agent.name}...  Type @ for files, / for commands`}
            className="h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-harness-text outline-none placeholder:text-gray-600"
            rows={1}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowPlusMenu(!showPlusMenu)}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300"
                >
                  <Plus className="h-[18px] w-[18px]" />
                </button>
                {showPlusMenu && (
                  <div className="absolute bottom-[38px] left-0 z-[9999] min-w-[200px] rounded-lg border border-white/10 bg-[#252540] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                    <DropdownItem icon={ImageIcon} label="Add Image" shortcut="⌘ V" />
                    <DropdownItem icon={FileText} label="Reference File" shortcut="@" />
                    <DropdownItem icon={Terminal} label="Slash Command" shortcut="/" />
                    <DropdownItem icon={Wrench} label="Tools" />
                    <DropdownItem icon={Network} label="MCP Servers" />
                  </div>
                )}
              </div>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">{agent.type === 'claude-code' ? 'Claude Code' : agent.type}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{agent.branch}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                {agent.model ?? 'Sonnet 4.7'}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isStreaming ? (
                <button
                  onClick={handleAbort}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <StopCircle className="h-[15px] w-[15px]" />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:brightness-110 disabled:opacity-40"
                >
                  <ArrowUp className="h-[15px] w-[15px]" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行
        </div>
      </div>
    </div>
  );
}

function DropdownItem({ icon: Icon, label, shortcut }: { icon: React.ComponentType<{ className?: string }>; label: string; shortcut?: string }) {
  return (
    <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200">
      <Icon className="h-3.5 w-3.5 text-gray-500" />
      {label}
      {shortcut && <span className="ml-auto text-[11px] text-gray-600">{shortcut}</span>}
    </button>
  );
}
