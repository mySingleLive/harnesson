import { useState } from 'react';
import { X, Layers, GitBranch, Plus, ImageIcon, FileText, Terminal, Wrench, Network, ChevronDown, ArrowUp } from 'lucide-react';
import type { Agent } from '@harnesson/shared';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  diffBlocks?: DiffBlock[];
}

interface DiffBlock {
  fileName: string;
  added: number;
  removed: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'context' | 'added' | 'removed';
  lineNum: string;
  content: string;
}

interface ChatPanelProps {
  agent: Agent;
  messages: ChatMessage[];
  onClose: () => void;
}

export function ChatPanel({ agent, messages, onClose }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  return (
    <div className="relative flex h-full w-[440px] flex-shrink-0 flex-col border-r border-harness-border bg-harness-chat">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-harness-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{agent.name}</span>
          <span className="rounded-full bg-orange-500/15 px-2 py-[1px] text-[11px] text-orange-500">
            Running
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-white/5 hover:text-gray-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages — Cursor 风格 */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'border-b border-white/[0.04] px-4 py-4',
              msg.role === 'user' && 'bg-harness-accent/[0.04]',
            )}
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              {msg.role === 'user' ? (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-harness-accent">
                  You
                </span>
              ) : (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-green-500">
                  {agent.name}
                </span>
              )}
            </div>
            <div className="text-[13px] leading-relaxed text-gray-300">{msg.content}</div>
            {msg.diffBlocks?.map((diff, i) => (
              <DiffCodeBlock key={i} diff={diff} />
            ))}
          </div>
        ))}
      </div>

      {/* Input — Claude Code 风格 */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl border border-white/10 bg-harness-sidebar transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${agent.name}...  Type @ for files, / for commands`}
            className="h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-harness-text outline-none placeholder:text-gray-600"
            rows={1}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              {/* + 按钮 */}
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
              {/* Agent 选择器 */}
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">Claude Code</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              {/* Worktree 选择器 */}
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">main</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* 模型选择器 */}
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                Sonnet 4.7
                <ChevronDown className="h-3 w-3" />
              </button>
              {/* 发送按钮 */}
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:bg-[#7c3aed]">
                <ArrowUp className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">@</kbd> 引用文件 · <kbd className="rounded border border-harness-border bg-[#252540] px-1.5 py-[1px] text-[10px]">/</kbd> 斜杠命令
        </div>
      </div>
    </div>
  );
}

function DiffCodeBlock({ diff }: { diff: DiffBlock }) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-harness-border bg-harness-bg">
      <div className="flex items-center justify-between bg-[#1a1a2e] px-2.5 py-1 text-[11px] text-gray-500">
        <span>{diff.fileName}</span>
        <div className="flex gap-2">
          <span className="text-green-500">+{diff.added}</span>
          <span className="text-red-500">-{diff.removed}</span>
        </div>
      </div>
      <div className="py-2 font-mono text-[12px] leading-[1.7]">
        {diff.lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'px-2.5 whitespace-pre',
              line.type === 'added' && 'bg-green-500/10 text-green-400',
              line.type === 'removed' && 'bg-red-500/10 text-red-400',
              line.type === 'context' && 'text-gray-600',
            )}
          >
            <span className="inline-block w-[30px] text-right mr-3 text-gray-700">{line.lineNum}</span>
            <span className="inline-block w-3.5 opacity-60">
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            {line.content}
          </div>
        ))}
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
