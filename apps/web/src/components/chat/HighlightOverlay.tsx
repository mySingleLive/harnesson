import { forwardRef, useMemo } from 'react';
import type { SlashCommand } from '@harnesson/shared';

interface HighlightOverlayProps {
  text: string;
  commands: SlashCommand[];
}

export const HighlightOverlay = forwardRef<HTMLDivElement, HighlightOverlayProps>(
  function HighlightOverlay({ text, commands }, ref) {
  const highlighted = useMemo(() => {
    if (commands.length === 0 || !text) return text;

    const names = commands.map((c) => `\\/${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).join('|');
    const regex = new RegExp(`(${names})(?=\\s|$)`, 'g');

    const parts: Array<{ text: string; highlight: boolean }> = [];
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const start = match.index!;
      const end = start + match[0].length;

      if (start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, start), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = end;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlight: false });
    }

    return parts.map((part, i) =>
      part.highlight ? (
        <span key={i} className="slash-cmd-highlight">{part.text}</span>
      ) : (
        <span key={i}>{part.text}</span>
      ),
    );
  }, [text, commands]);

  return (
    <div ref={ref} className="slash-highlight-overlay" aria-hidden="true">
      {highlighted}
    </div>
  );
  },
);