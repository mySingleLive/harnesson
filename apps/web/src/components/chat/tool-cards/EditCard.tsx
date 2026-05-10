import { useMemo } from 'react';
import { diffLines } from 'diff';
import { Highlight, themes } from 'prism-react-renderer';
import { CodeLine } from './CodeLine';
import type { PairedToolEvent } from './pairEvents';

interface DiffLine {
  text: string;
  type: 'context' | 'deleted' | 'added';
}

export function EditCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const oldStr = (event.input.old_string as string) ?? '';
  const newStr = (event.input.new_string as string) ?? '';

  const diffLinesData = useMemo(() => {
    const parts = diffLines(oldStr, newStr, { ignoreNewlineAtEof: true });
    const lines: DiffLine[] = [];

    for (const part of parts) {
      const partLines = part.value.split('\n');
      if (partLines[partLines.length - 1] === '') partLines.pop();

      for (const line of partLines) {
        if (part.added) {
          lines.push({ text: line, type: 'added' });
        } else if (part.removed) {
          lines.push({ text: line, type: 'deleted' });
        } else {
          lines.push({ text: line, type: 'context' });
        }
      }
    }

    return lines;
  }, [oldStr, newStr]);

  const unifiedText = diffLinesData.map((l) => l.text).join('\n');

  const changedCount = diffLinesData.filter((l) => l.type === 'added').length;
  const removedCount = diffLinesData.filter((l) => l.type === 'deleted').length;

  const lang = useMemo(() => {
    const ext = filePath.split('.').pop() ?? '';
    const map: Record<string, string> = {
      ts: 'tsx', tsx: 'tsx', js: 'jsx', jsx: 'jsx',
      json: 'json', css: 'css', html: 'html', md: 'markdown',
      py: 'python', rs: 'rust', go: 'go', yaml: 'yaml', yml: 'yaml',
    };
    return map[ext] ?? 'tsx';
  }, [filePath]);

  const isRunning = !event.output;

  return (
    <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
      {/* Header */}
      <div className="flex items-center gap-2 bg-[#15152a] px-2.5 py-1 text-[11px] border-b border-harness-border">
        <span>📝</span>
        <span className="font-medium text-gray-400">Edit</span>
        <span className="text-gray-600">·</span>
        <span className="font-mono text-[#7aa2f7] truncate">{filePath}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {isRunning ? (
            <>
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" />
              <span className="text-purple-400">running...</span>
            </>
          ) : event.isError ? (
            <span className="text-red-400">✗</span>
          ) : (
            <>
              <span className="text-[10px] text-gray-600">
                +{changedCount} −{removedCount}
              </span>
              <span className="text-green-500">✓</span>
            </>
          )}
        </span>
      </div>

      {/* Diff body */}
      <div className="max-h-[300px] overflow-y-auto bg-[#0d0d1a] py-1.5">
        <Highlight theme={themes.vsDark} code={unifiedText} language={lang}>
          {({ tokens, getTokenProps }) =>
            tokens.map((line, i) => {
              const diffLine = diffLinesData[i];
              const lineType = diffLine?.type ?? 'context';

              return (
                <CodeLine
                  key={i}
                  lineNumber={i + 1}
                  type={lineType}
                >
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token });
                    if (lineType === 'deleted') {
                      return (
                        <span
                          key={key}
                          className={tokenProps.className}
                          style={{ ...tokenProps.style, color: undefined }}
                        />
                      );
                    }
                    return (
                      <span key={key} {...tokenProps} />
                    );
                  })}
                </CodeLine>
              );
            })
          }
        </Highlight>
      </div>
    </div>
  );
}
