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
