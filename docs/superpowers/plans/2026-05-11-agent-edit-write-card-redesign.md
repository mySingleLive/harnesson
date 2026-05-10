# Edit/Write Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign EditCard and WriteCard to always stay expanded with unified diff/code view, Prism syntax highlighting, and aligned line numbers.

**Architecture:** Extract a shared `CodeLine` component for consistent line rendering (line number + prefix + code). Rewrite `EditCard` to compute unified diffs using the `diff` package and render with Prism tokens. Rewrite `WriteCard` to show code with line numbers and Prism highlighting. Both cards drop the `CollapsibleCard` wrapper.

**Tech Stack:** React 19, TypeScript, Tailwind 4, prism-react-renderer v2, diff v9, Vitest + @testing-library/react

---

### Task 1: Install dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add prism-react-renderer and diff packages**

```bash
cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web add prism-react-renderer diff
```

- [ ] **Step 2: Verify packages installed**

```bash
cd /Users/dt_flys/Projects/harnesson && node -e "require('apps/web/node_modules/prism-react-renderer'); require('apps/web/node_modules/diff'); console.log('OK')"
```

Expected: prints "OK" with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: add prism-react-renderer and diff dependencies

For EditCard/WriteCard redesign: syntax highlighting and unified diff computation.
EOF
)"
```

---

### Task 2: Create shared CodeLine component

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/CodeLine.tsx`

- [ ] **Step 1: Write the component**

```tsx
import type { ReactNode } from 'react';

interface CodeLineProps {
  lineNumber: number;
  type?: 'context' | 'deleted' | 'added';
  children: ReactNode;
}

const TYPE_STYLES: Record<string, string> = {
  deleted:
    'bg-red-500/[0.15] [box-shadow:inset_3px_0_0_#ef4444]',
  added:
    'bg-green-500/[0.12] [box-shadow:inset_3px_0_0_#22c55e]',
};

const PREFIX: Record<string, { char: string; className: string }> = {
  deleted:  { char: '−', className: 'text-red-400' },
  added:    { char: '+',     className: 'text-green-400' },
};

export function CodeLine({ lineNumber, type = 'context', children }: CodeLineProps) {
  const style = TYPE_STYLES[type];
  const prefix = PREFIX[type];

  return (
    <div className={`flex px-2.5 ${style ?? ''}`}>
      <span className="w-8 shrink-0 mr-3 text-right text-[#555] select-none text-[12px] leading-[1.65]">
        {lineNumber}
      </span>
      <span className={`w-[10px] shrink-0 text-[12px] leading-[1.65] ${prefix?.className ?? ''}`}>
        {prefix?.char ?? ''}
      </span>
      <span className={`flex-1 text-[12px] leading-[1.65] whitespace-pre ${type === 'deleted' ? 'text-red-300/80' : ''}`}>
        {children}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/CodeLine.tsx
git commit -m "feat: add CodeLine component for shared diff/code line rendering"
```

---

### Task 3: Rewrite EditCard with unified diff and Prism highlighting

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/EditCard.tsx`

- [ ] **Step 1: Write the new EditCard**

Replace the entire file content:

```tsx
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
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty
```

Expected: no errors related to EditCard or CodeLine.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/EditCard.tsx
git commit -m "feat: rewrite EditCard with unified diff, Prism highlighting, always expanded"
```

---

### Task 4: Rewrite WriteCard with code view and Prism highlighting

**Files:**
- Modify: `apps/web/src/components/chat/tool-cards/WriteCard.tsx`

- [ ] **Step 1: Write the new WriteCard**

Replace the entire file content:

```tsx
import { useMemo } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { CodeLine } from './CodeLine';
import type { PairedToolEvent } from './pairEvents';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function WriteCard({ event }: { event: PairedToolEvent }) {
  const filePath = (event.input.file_path as string) ?? '';
  const content = (event.input.content as string) ?? '';
  const contentLines = content.split('\n');
  const displayLines = contentLines.slice(0, 30);
  const remaining = contentLines.length - displayLines.length;
  const size = formatBytes(new Blob([content]).size);
  const isRunning = !event.output;

  const lang = useMemo(() => {
    const ext = filePath.split('.').pop() ?? '';
    const map: Record<string, string> = {
      ts: 'tsx', tsx: 'tsx', js: 'jsx', jsx: 'jsx',
      json: 'json', css: 'css', html: 'html', md: 'markdown',
      py: 'python', rs: 'rust', go: 'go', yaml: 'yaml', yml: 'yaml',
    };
    return map[ext] ?? 'tsx';
  }, [filePath]);

  const displayText = displayLines.join('\n');

  return (
    <div className="overflow-hidden rounded-md border border-harness-border bg-harness-bg">
      {/* Header */}
      <div className="flex items-center gap-2 bg-[#15152a] px-2.5 py-1 text-[11px] border-b border-harness-border">
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
          ) : (
            <span className="text-green-500">✓</span>
          )}
        </span>
      </div>

      {/* Code body */}
      <div className="max-h-[300px] overflow-y-auto bg-[#0d0d1a] py-1.5">
        <Highlight theme={themes.vsDark} code={displayText} language={lang}>
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
        {remaining > 0 && (
          <div className="px-2.5 text-[11px] text-gray-600 mt-1">
            ... {remaining} more lines
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Remove unused imports from WriteCard (no more CollapsibleCard)**

The old `import { CollapsibleCard } from './CollapsibleCard';` is already replaced by the new code above. Verify no references to `CollapsibleCard` remain:

```bash
grep -n "CollapsibleCard" /Users/dt_flys/Projects/harnesson/apps/web/src/components/chat/tool-cards/WriteCard.tsx
```

Expected: no matches.

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty
```

Expected: no errors related to WriteCard.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/WriteCard.tsx
git commit -m "feat: rewrite WriteCard with code view, Prism highlighting, always expanded"
```

---

### Task 5: Write tests for CodeLine

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/__tests__/CodeLine.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CodeLine } from '../CodeLine';

describe('CodeLine', () => {
  it('renders line number and content for context type', () => {
    const { container } = render(
      <CodeLine lineNumber={42} type="context">
        <span>const x = 1;</span>
      </CodeLine>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('flex');

    expect(container.textContent).toContain('42');
    expect(container.textContent).toContain('const x = 1;');
  });

  it('renders deleted line with red background and box-shadow', () => {
    const { container } = render(
      <CodeLine lineNumber={10} type="deleted">
        <span>old code</span>
      </CodeLine>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('bg-red-500/[0.15]');
    expect(root.getAttribute('style') || root.className).toBeTruthy();

    // Verify minus prefix
    expect(container.textContent).toContain('−');
  });

  it('renders added line with green background and box-shadow', () => {
    const { container } = render(
      <CodeLine lineNumber={5} type="added">
        <span>new code</span>
      </CodeLine>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('bg-green-500/[0.12]');
    expect(container.textContent).toContain('+');
  });

  it('defaults to context type when type is omitted', () => {
    const { container } = render(
      <CodeLine lineNumber={1}>
        <span>code</span>
      </CodeLine>,
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toContain('bg-red');
    expect(root.className).not.toContain('bg-green');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx vitest run src/components/chat/tool-cards/__tests__/CodeLine.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/__tests__/CodeLine.test.tsx
git commit -m "test: add CodeLine component tests"
```

---

### Task 6: Verify EditCard and WriteCard render correctly with sample data

**Files:**
- Create: `apps/web/src/components/chat/tool-cards/__tests__/EditCard.test.tsx`
- Create: `apps/web/src/components/chat/tool-cards/__tests__/WriteCard.test.tsx`

- [ ] **Step 1: Write EditCard tests**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EditCard } from '../EditCard';
import type { PairedToolEvent } from '../pairEvents';

const baseEvent: PairedToolEvent = {
  tool: 'Edit',
  input: {
    file_path: 'src/foo.ts',
    old_string: "const oldValue = data.value;\nreturn <div>{oldValue}</div>;",
    new_string: "const newValue = data.value ?? '';\nconst result = newValue.toUpperCase();\nreturn <div>{result}</div>;",
  },
};

describe('EditCard', () => {
  it('renders file path in header', () => {
    render(<EditCard event={{ ...baseEvent, output: 'ok' }} />);
    expect(document.body.textContent).toContain('src/foo.ts');
  });

  it('shows running state when no output', () => {
    render(<EditCard event={{ ...baseEvent, output: undefined }} />);
    expect(document.body.textContent).toContain('running...');
  });

  it('shows change counts in header', () => {
    render(<EditCard event={{ ...baseEvent, output: 'ok' }} />);
    expect(document.body.textContent).toContain('+3');
    expect(document.body.textContent).toContain('−2');
  });

  it('renders deleted lines with minus prefix', () => {
    render(<EditCard event={{ ...baseEvent, output: 'ok' }} />);
    const minuses = document.body.querySelectorAll('[class*="text-red-400"]');
    // There should be at least one minus sign element
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('−');
  });

  it('renders added lines with plus prefix', () => {
    render(<EditCard event={{ ...baseEvent, output: 'ok' }} />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('+');
  });
});
```

- [ ] **Step 2: Write WriteCard tests**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WriteCard } from '../WriteCard';
import type { PairedToolEvent } from '../pairEvents';

const baseEvent: PairedToolEvent = {
  tool: 'Write',
  input: {
    file_path: 'src/new-file.ts',
    content: 'export function hello() {\n  return "world";\n}\n',
  },
};

describe('WriteCard', () => {
  it('renders file path and size in header', () => {
    render(<WriteCard event={{ ...baseEvent, output: 'ok' }} />);
    expect(document.body.textContent).toContain('src/new-file.ts');
    expect(document.body.textContent).toContain('B');
  });

  it('shows running state when no output', () => {
    render(<WriteCard event={{ ...baseEvent, output: undefined }} />);
    expect(document.body.textContent).toContain('running...');
  });

  it('renders code lines with line numbers', () => {
    render(<WriteCard event={{ ...baseEvent, output: 'ok' }} />);
    expect(document.body.textContent).toContain('1');
    expect(document.body.textContent).toContain('export function hello()');
    expect(document.body.textContent).toContain('2');
    expect(document.body.textContent).toContain('return "world"');
  });

  it('shows remaining count for large files', () => {
    const lines = Array.from({ length: 35 }, (_, i) => `line ${i}`);
    const event: PairedToolEvent = {
      tool: 'Write',
      input: { file_path: 'big.ts', content: lines.join('\n') },
      output: 'ok',
    };
    render(<WriteCard event={event} />);
    expect(document.body.textContent).toContain('... 5 more lines');
  });
});
```

- [ ] **Step 3: Run both test files**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx vitest run src/components/chat/tool-cards/__tests__/EditCard.test.tsx src/components/chat/tool-cards/__tests__/WriteCard.test.tsx
```

Expected: all tests pass (6 EditCard tests + 4 WriteCard tests = 10 total).

- [ ] **Step 4: Run all tool-card tests to check for regressions**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx vitest run src/components/chat/
```

Expected: all tests pass, no regressions.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/chat/tool-cards/__tests__/EditCard.test.tsx apps/web/src/components/chat/tool-cards/__tests__/WriteCard.test.tsx
git commit -m "test: add EditCard and WriteCard tests"
```

---

### Task 7: Visual verification with dev server

- [ ] **Step 1: Start dev server and open browser**

```bash
cd /Users/dt_flys/Projects/harnesson && pnpm --filter @harnesson/web dev
```

Open the app in your browser. Trigger an agent that performs file edits and writes. Verify:

1. Edit card appears auto-expanded with unified diff (context + deleted + added lines)
2. Line numbers are aligned across all line types
3. Deleted lines have red background with box-shadow inset left indicator
4. Added lines have green background with box-shadow inset left indicator
5. Context lines have no background
6. Prism syntax highlighting is active on code tokens
7. Write card shows code with line numbers and Prism highlighting
8. Running state shows pulsing purple dot before completion
9. Unchanged cards (Read, Bash, etc.) still collapse/expand normally

- [ ] **Step 2: Fix any visual issues found, commit fixes**

```bash
git add -A
git commit -m "fix: visual polish for EditCard/WriteCard after dev server review"
```

---

### Task 8: Full test suite and typecheck

- [ ] **Step 1: Run full web test suite**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Run full typecheck**

```bash
cd /Users/dt_flys/Projects/harnesson/apps/web && npx tsc --noEmit --pretty
```

Expected: no errors.

- [ ] **Step 3: Commit any remaining changes**

```bash
git status
```
