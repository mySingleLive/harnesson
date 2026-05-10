import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = '确认', onConfirm, onCancel }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return createPortal(
    <div
      data-testid="confirm-dialog-backdrop"
      className="flex items-center justify-center fixed inset-0 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="relative bg-harness-sidebar border border-white/10 rounded-xl w-[380px] p-6 shadow-2xl">
        <h3 className="text-[15px] text-gray-200 font-semibold mb-1.5">{title}</h3>
        <p className="text-[13px] text-gray-400 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-2.5 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-5 py-2 text-[13px] text-gray-400 border border-white/10 rounded-md hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
