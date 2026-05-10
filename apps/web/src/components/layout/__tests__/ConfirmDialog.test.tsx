import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: '删除 Agent',
    message: '确定要删除 agent-1 吗？此操作不可撤销，所有对话历史将被清除。',
    confirmLabel: '删除',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders title and message', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    expect(getByText('删除 Agent')).toBeTruthy();
    expect(getByText(/确定要删除/)).toBeTruthy();
  });

  it('renders confirm button with custom label', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    const btn = getByText('删除');
    expect(btn).toBeTruthy();
  });

  it('renders default confirm label "确认" when not provided', () => {
    const props = { title: 'Test', message: 'test', onConfirm: vi.fn(), onCancel: vi.fn() };
    const { getByText } = render(<ConfirmDialog {...props} />);
    expect(getByText('确认')).toBeTruthy();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    const { getByText } = render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(getByText('删除'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    const { getByText } = render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(getByText('取消'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    // Dialog is rendered via createPortal to document.body
    const backdrop = document.querySelector('[data-testid="confirm-dialog-backdrop"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onConfirm on Enter key', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel on Escape key', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('auto-focuses cancel button on mount', () => {
    const { getByText } = render(<ConfirmDialog {...defaultProps} />);
    const cancelBtn = getByText('取消');
    expect(document.activeElement).toBe(cancelBtn);
  });
});
