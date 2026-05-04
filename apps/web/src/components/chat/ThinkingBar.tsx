import { ThinkingIndicator } from './ThinkingIndicator';

export function ThinkingBar() {
  return (
    <div
      className="flex items-center justify-start px-10 py-1.5"
    >
      <ThinkingIndicator size="md" />
    </div>
  );
}
