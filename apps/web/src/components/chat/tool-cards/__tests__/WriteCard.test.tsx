import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

  it('defaults to collapsed state (code not visible)', () => {
    render(<WriteCard event={{ ...baseEvent, output: 'ok' }} />);
    expect(document.body.textContent).not.toContain('export function hello()');
    expect(document.body.textContent).not.toContain('return "world"');
  });

  it('expands to show code lines on click', () => {
    render(<WriteCard event={{ ...baseEvent, output: 'ok' }} />);
    const header = document.querySelector('.cursor-pointer');
    fireEvent.click(header!);
    expect(document.body.textContent).toContain('1');
    expect(document.body.textContent).toContain('export function hello()');
    expect(document.body.textContent).toContain('2');
    expect(document.body.textContent).toContain('return "world"');
  });

  it('collapses back on second click', () => {
    render(<WriteCard event={{ ...baseEvent, output: 'ok' }} />);
    const header = document.querySelector('.cursor-pointer');
    fireEvent.click(header!);
    fireEvent.click(header!);
    expect(document.body.textContent).not.toContain('export function hello()');
  });

  it('shows all lines for large files when expanded', () => {
    const lines = Array.from({ length: 35 }, (_, i) => `line ${i}`);
    const event: PairedToolEvent = {
      tool: 'Write',
      input: { file_path: 'big.ts', content: lines.join('\n') },
      output: 'ok',
    };
    render(<WriteCard event={event} />);
    const header = document.querySelector('.cursor-pointer');
    fireEvent.click(header!);
    expect(document.body.textContent).toContain('line 0');
    expect(document.body.textContent).toContain('line 34');
  });
});
