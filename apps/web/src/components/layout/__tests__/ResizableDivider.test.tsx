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
    expect(divider.style.width).toBe('1px');
    expect(divider.className).toContain('bg-harness-border');
  });

  it('shows accent overlay on hover without changing layout width', () => {
    const { container } = render(<ResizableDivider {...defaultProps} />);
    const hitArea = container.firstElementChild!.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(hitArea);
    const divider = container.firstElementChild as HTMLElement;
    // Layout width stays 1px
    expect(divider.style.width).toBe('1px');
    // Accent overlay appears as a child element
    const overlay = divider.children[1];
    expect(overlay).toBeTruthy();
    expect(overlay.className).toContain('bg-harness-accent');
  });

  it('calls onResize during drag', () => {
    const onResize = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onResize={onResize} />);
    const hitArea = container.firstElementChild!.firstElementChild as HTMLElement;

    fireEvent.mouseDown(hitArea, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 460 });
    expect(onResize).toHaveBeenCalledWith(400);
  });

  it('calls onCollapse when dragged below minWidth', () => {
    const onCollapse = vi.fn();
    const { container } = render(<ResizableDivider {...defaultProps} onCollapse={onCollapse} />);
    const hitArea = container.firstElementChild!.firstElementChild as HTMLElement;

    fireEvent.mouseDown(hitArea, { clientX: 500 });
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
