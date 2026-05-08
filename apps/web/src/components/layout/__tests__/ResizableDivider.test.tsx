import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ResizableDivider } from '../ResizableDivider';

describe('ResizableDivider', () => {
  const defaultProps = {
    minWidth: 320,
    currentWidth: 440,
    isCollapsed: false,
    onResize: vi.fn(),
    onResizeEnd: vi.fn(),
    onCollapse: vi.fn(),
    onExpand: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a thin divider by default', () => {
    const { container } = render(<ResizableDivider {...defaultProps} />);
    const outer = container.firstElementChild as HTMLElement;
    const inner = outer.firstElementChild as HTMLElement;
    expect(outer).toBeTruthy();
    expect(outer.style.width).toBe('8px');
    expect(inner.className).toContain('w-px');
    expect(inner.className).toContain('bg-harness-border');
  });

  it('shows accent color and wider width on hover', () => {
    const { container } = render(<ResizableDivider {...defaultProps} />);
    const outer = container.firstElementChild as HTMLElement;
    const inner = outer.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(outer);
    expect(inner.className).toContain('bg-harness-accent');
    expect(inner.className).toContain('w-[3px]');
  });

  it('calls onResize during drag', () => {
    const onResize = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onResize={onResize} />);
    const outer = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(outer, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 460 });
    expect(onResize).toHaveBeenCalledWith(400);
  });

  it('calls onCollapse when dragged below minWidth', () => {
    const onCollapse = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onCollapse={onCollapse} />);
    const outer = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(outer, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 100 });
    expect(onCollapse).toHaveBeenCalled();
  });

  it('renders collapsed state with wider width', () => {
    const { container } = render(<ResizableDivider {...defaultProps} isCollapsed={true} />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.style.width).toBe('6px');
    expect(outer.className).toContain('cursor-ew-resize');
  });

  it('calls onExpand when dragging out from collapsed state', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <ResizableDivider {...defaultProps} isCollapsed={true} onExpand={onExpand} />,
    );
    const outer = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(outer, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 515 });
    expect(onExpand).toHaveBeenCalled();
  });

  it('does not expand on small drag from collapsed state', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <ResizableDivider {...defaultProps} isCollapsed={true} onExpand={onExpand} />,
    );
    const outer = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(outer, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 505 });
    expect(onExpand).not.toHaveBeenCalled();
  });
});
