import { ThinkingIndicator } from './ThinkingIndicator';

export function ThinkingBar() {
  return (
    <div
      className="flex items-center justify-center border-t border-purple-500/20 bg-harness-chat/80 px-4 py-1.5"
      style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
    >
      <ThinkingIndicator size="md" />
    </div>
  );
}
