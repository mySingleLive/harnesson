import { useMemo, useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { ChevronDown } from 'lucide-react';
import { CodeLine } from './CodeLine';
import { detectLanguage } from './langUtils';
import type { PairedToolEvent } from './pairEvents';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function WriteCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const content = (event.input.content as string) ?? '';
  const size = useMemo(() => formatBytes(new Blob([content]).size), [content]);
  const isRunning = !event.output;
  const lang = useMemo(() => detectLanguage(filePath), [filePath]);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
      {/* Header */}
      <div
        className={`flex items-center gap-2 bg-[#15152a] px-2.5 py-1 text-[11px] cursor-pointer ${isExpanded ? 'border-b border-harness-border' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform shrink-0 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
        <span>✏️</span>
        <span className="font-medium text-gray-400">Write</span>
        <span className="text-gray-600">·</span>
        <span className="font-mono text-[#7aa2f7] truncate">{filePath}</span>
        <span className="text-gray-600">·</span>
        <span className="text-gray-500">{size}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {isRunning ? (
            <>
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
              <span className="text-purple-400">running...</span>
            </>
          ) : event.isError ? (
            <span className="text-red-400">✗</span>
          ) : (
            <span className="text-green-500">✓</span>
          )}
        </span>
      </div>

      {/* Code body */}
      {isExpanded && (
        <div className="bg-[#0d0d1a] py-1.5">
          <Highlight theme={themes.vsDark} code={content} language={lang}>
            {({ tokens, getTokenProps }) =>
              tokens.map((line, i) => (
                <CodeLine key={i} lineNumber={i + 1}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </CodeLine>
              ))
            }
          </Highlight>
        </div>
      )}
    </div>
  );
}
