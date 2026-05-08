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
    const divider = container.firstElementChild as HTMLElement;
    expect(divider).toBeTruthy();
    expect(divider.className).toContain('w-px');
  });

  it('shows accent color and wider width on hover', () => {
    const { container } = render(<ResizableDivider {...defaultProps} />);
    const divider = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(divider);
    expect(divider.className).toContain('bg-harness-accent');
    expect(divider.className).toContain('w-[3px]');
  });

  it('calls onResize during drag', () => {
    const onResize = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onResize={onResize} />);
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 460 });
    expect(onResize).toHaveBeenCalledWith(400);
  });

  it('calls onCollapse when dragged below minWidth', () => {
    const onCollapse = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onCollapse={onCollapse} />);
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 100 });
    expect(onCollapse).toHaveBeenCalled();
  });

  it('renders collapsed state with wider width', () => {
    const { container } = render(<ResizableDivider {...defaultProps} isCollapsed={true} />);
    const divider = container.firstElementChild as HTMLElement;
    expect(divider.style.width).toBe('6px');
    expect(divider.className).toContain('cursor-ew-resize');
  });

  it('calls onExpand when dragging out from collapsed state', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <ResizableDivider {...defaultProps} isCollapsed={true} onExpand={onExpand} />,
    );
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 515 });
    expect(onExpand).toHaveBeenCalled();
  });

  it('does not expand on small drag from collapsed state', () => {
    const onExpand = vi.fn();
    const { container } = render(
      <ResizableDivider {...defaultProps} isCollapsed={true} onExpand={onExpand} />,
    );
    const divider = container.firstElementChild as HTMLElement;

    fireEvent.mouseDown(divider, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 505 });
    expect(onExpand).not.toHaveBeenCalled();
  });
});
