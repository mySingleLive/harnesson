import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Bug, Code, TestTube } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { RichTextInput } from '@/components/chat/RichTextInput';
import type { ContentBlock, ImageAttachment } from '@harnesson/shared';

const quickActions = [
  { label: '创建新功能', icon: Sparkles, prompt: 'Help me create a new feature: ' },
  { label: '修复 Bug', icon: Bug, prompt: 'Help me fix a bug: ' },
  { label: '代码审查', icon: Code, prompt: 'Review the code changes in this project' },
  { label: '编写测试', icon: TestTube, prompt: 'Write tests for the main modules: ' },
];

export function NewSessionPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [quickActionText, setQuickActionText] = useState<string | undefined>(undefined);
  const createAgent = useAgentStore((s) => s.createAgent);
  const { activeProjectId, activeBranch, projects } = useProjectStore();
  const commands = useSlashCommandStore((s) => s.commands);
  const navigate = useNavigate();

  const project = projects.find((p) => p.id === activeProjectId);
  const projectPath = project?.path ?? '';
  const branch = activeBranch ?? 'main';

  const handleSend = async (data: { text: string; contentBlocks: ContentBlock[]; images: ImageAttachment[] }) => {
    const text = data.text.trim();
    if ((!text && data.images.length === 0) || !projectPath || isCreating) return;

    setIsCreating(true);
    try {
      await createAgent({
        cwd: projectPath,
        type: 'claude-code',
        model: selectedModel,
        taskTitle: text,
      });
      const agentId = useAgentStore.getState().activeAgentId;
      if (agentId) {
        await useAgentStore.getState().sendMessage(agentId, text, selectedModel, {
          contentBlocks: data.contentBlocks,
          images: data.images,
        });
      }
      navigate('/projects');
    } catch (err) {
      console.error('Failed to create agent:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setQuickActionText(prompt);
    setTimeout(() => setQuickActionText(undefined), 100);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-harness-content px-4">
      <h1 className="mb-8 text-[42px] font-bold tracking-wide text-harness-accent">
        HARNESSON
      </h1>

      <div className="w-full max-w-[700px]">
        <RichTextInput
          placeholder={projectPath ? "Message Harnesson...  Type / for commands" : "请先选择或创建一个项目"}
          disabled={!projectPath || isCreating}
          commands={commands}
          modelValue={selectedModel}
          onModelChange={setSelectedModel}
          showBranchSelector
          branchName={branch}
          onSend={handleSend}
          externalText={quickActionText}
        />

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
      </div>
    </div>
  );
}
