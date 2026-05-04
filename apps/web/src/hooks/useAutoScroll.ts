import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';

const BOTTOM_THRESHOLD = 80;

export function useAutoScroll(
  scrollRef: RefObject<HTMLDivElement | null>,
  deps: unknown[]
) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  const checkBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkBottom, { passive: true });
    return () => el.removeEventListener('scroll', checkBottom);
  }, [scrollRef, checkBottom]);

  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }, [scrollRef]);

  return { isAtBottom, scrollToBottom };
}