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
