import { useState, useEffect } from 'react';

export function useElapsedTime(startedAt: string): string {
  const [elapsed, setElapsed] = useState(() => computeElapsed(startedAt));

  useEffect(() => {
    setElapsed(computeElapsed(startedAt));
    const timer = setInterval(() => setElapsed(computeElapsed(startedAt)), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return elapsed;
}

function computeElapsed(startedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}