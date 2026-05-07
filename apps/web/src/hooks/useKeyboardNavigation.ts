import { useState, useCallback, useRef } from 'react';

export interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  onToggle?: (index: number) => void;
  wrap?: boolean;
  initialIndex?: number;
}

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  onToggle,
  wrap = true,
  initialIndex = -1,
}: UseKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(initialIndex);
  const hasFocusRef = useRef(false);

  const moveFocus = useCallback(
    (direction: 'up' | 'down') => {
      setFocusedIndex((prev) => {
        if (prev === -1) {
          return direction === 'down' ? 0 : itemCount - 1;
        }
        const next = direction === 'down' ? prev + 1 : prev - 1;
        if (wrap) {
          return ((next % itemCount) + itemCount) % itemCount;
        }
        return Math.max(0, Math.min(itemCount - 1, next));
      });
    },
    [itemCount, wrap],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (e.key === 'ArrowDown' || (isCtrl && e.key === 'n')) {
        e.preventDefault();
        moveFocus('down');
        return;
      }

      if (e.key === 'ArrowUp' || (isCtrl && e.key === 'p')) {
        e.preventDefault();
        moveFocus('up');
        return;
      }

      if (e.key === 'Escape') {
        setFocusedIndex(-1);
        return;
      }

      if (focusedIndex < 0) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(focusedIndex);
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        if (onToggle) {
          onToggle(focusedIndex);
        } else {
          onSelect(focusedIndex);
        }
        return;
      }
    },
    [moveFocus, onSelect, onToggle, focusedIndex],
  );

  const handleFocus = useCallback(() => {
    hasFocusRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    hasFocusRef.current = false;
  }, []);

  const isFocused = useCallback(
    (index: number) => focusedIndex === index,
    [focusedIndex],
  );

  const setFocused = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  return {
    focusedIndex,
    isFocused,
    setFocused,
    containerProps: {
      tabIndex: 0,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
    },
    itemProps: (index: number) => ({
      onMouseEnter: () => {},
      onMouseLeave: () => {},
    }),
  };
}
