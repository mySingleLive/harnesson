import { useState, useEffect } from 'react';

const STATUS_WORDS = ['thinking', 'reasoning', 'analyzing', 'processing'];

interface ThinkingIndicatorProps {
  size?: 'sm' | 'md';
}

export function ThinkingIndicator({ size = 'sm' }: ThinkingIndicatorProps) {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((i) => (i + 1) % STATUS_WORDS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-[12px]';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`inline-block rounded-full bg-purple-400 ${dotSize}`}
            style={{
              animation: 'bounce-dot 0.6s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </span>
      <span className={`${textSize} text-purple-400 animate-pulse`}>
        {STATUS_WORDS[wordIndex]}...
      </span>
    </span>
  );
}
