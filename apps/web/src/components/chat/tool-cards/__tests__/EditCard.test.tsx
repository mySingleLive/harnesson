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
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('−');
  });

  it('renders added lines with plus prefix', () => {
    render(<EditCard event={{ ...baseEvent, output: 'ok' }} />);
    const allText = document.body.textContent ?? '';
    expect(allText).toContain('+');
  });

  it('numbers lines by file position (not diff array index)', () => {
    const event: PairedToolEvent = {
      tool: 'Edit',
      input: {
        file_path: 'src/test.ts',
        old_string: 'line1\nline2\nline3\nline4\nline5',
        new_string: 'line1\nline3\nline5',
      },
      output: 'ok',
    };
    render(<EditCard event={event} />);

    const lineNumbers = Array.from(
      document.querySelectorAll('[class*="w-8"]')
    ).map((el) => el.textContent);

    // Expected:
    //   context "line1" → 1
    //   deleted "line2" → 2 (old file position)
    //   context "line3" → 2 (new file position, was old line 3)
    //   deleted "line4" → 4 (old file position)
    //   context "line5" → 3 (new file position, was old line 5)
    expect(lineNumbers).toEqual(['1', '2', '2', '4', '3']);
  });
});
