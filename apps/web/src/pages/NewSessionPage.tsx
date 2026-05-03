import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Layers, GitBranch, ChevronDown, ArrowUp, Sparkles, Bug, Code, TestTube } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';

const quickActions = [
  { label: '创建新功能', icon: Sparkles, prompt: 'Help me create a new feature: ' },
  { label: '修复 Bug', icon: Bug, prompt: 'Help me fix a bug: ' },
  { label: '代码审查', icon: Code, prompt: 'Review the code changes in this project' },
  { label: '编写测试', icon: TestTube, prompt: 'Write tests for the main modules: ' },
];

export function NewSessionPage() {
  const [input, setInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const createAgent = useAgentStore((s) => s.createAgent);
  const { activeProjectId, activeBranch, projects } = useProjectStore();
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === activeProjectId);
  const projectPath = project?.path ?? '';
  const branch = activeBranch ?? 'main';

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !projectPath || isCreating) return;

    setIsCreating(true);
    try {
      await createAgent({
        cwd: projectPath,
        type: 'claude-code',
        taskTitle: text,
      });
      const agentId = useAgentStore.getState().activeAgentId;
      if (agentId) {
        await useAgentStore.getState().sendMessage(agentId, text);
      }
      navigate('/projects');
      setInput('');
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-harness-content px-4">
      <h1 className="mb-8 text-[42px] font-bold tracking-wide text-harness-accent">
        HARNESSON
      </h1>

      <div className="w-full max-w-[700px]">
        <div className="rounded-2xl border border-white/10 bg-harness-sidebar transition-colors focus-within:border-harness-accent focus-within:shadow-[0_0_0_1px_rgba(139,92,246,0.15)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={projectPath ? "Message Harnesson...  Type @ for files, / for commands" : "请先选择或创建一个项目"}
            className="h-auto max-h-[140px] min-h-[24px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-harness-text outline-none placeholder:text-gray-600"
            rows={1}
            disabled={!projectPath || isCreating}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center gap-1">
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Plus className="h-[18px] w-[18px]" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <Layers className="h-3 w-3" />
                <span className="font-medium text-gray-400">Claude Code</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <GitBranch className="h-3 w-3" />
                <span className="font-medium text-gray-400">{branch}</span>
                <ChevronDown className="h-3 w-3 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300">
                <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
                Sonnet 4.7
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || !projectPath || isCreating}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-harness-accent text-white hover:brightness-110 disabled:opacity-40"
              >
                <ArrowUp className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {quickActions.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              onClick={() => handleQuickAction(prompt)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-gray-400 transition-colors hover:border-harness-accent/30 hover:bg-harness-accent/[0.05] hover:text-harness-accent"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="mt-2 text-center text-[10px] text-gray-600">
          <kbd className="rounded border border-harness-border bg-harness-sidebar px-1.5 py-[1px] text-[10px]">Enter</kbd> 发送 · <kbd className="rounded border border-harness-border bg-harness-sidebar px-1.5 py-[1px] text-[10px]">Shift+Enter</kbd> 换行
        </div>
      </div>
    </div>
  );
}
