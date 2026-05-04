import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { getSupportedModels } from '@/lib/serverApi';
import type { ModelInfo } from '@/lib/serverApi';

interface ModelDropdownProps {
  value?: string;
  onChange: (modelId: string) => void;
}

function getModelLabel(models: ModelInfo[], modelId?: string): string {
  if (!modelId) return models[0]?.displayName ?? 'Default';
  const found = models.find((m) => m.value === modelId);
  return found ? found.displayName : modelId;
}

const DROPDOWN_HEIGHT = 280;

export function ModelDropdown({ value, onChange }: ModelDropdownProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkDirection = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropUp(rect.bottom + DROPDOWN_HEIGHT > window.innerHeight);
  }, []);

  useEffect(() => {
    getSupportedModels().then(setModels);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (model: ModelInfo) => {
    onChange(model.value);
    setOpen(false);
  };

  const label = getModelLabel(models, value);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          checkDirection();
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-harness-accent" />
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && models.length > 0 && (
        <div className={`absolute right-0 z-50 w-56 rounded-lg border border-harness-border bg-harness-sidebar shadow-xl ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-1">
            {models.map((model) => (
              <button
                key={model.value}
                onClick={() => handleSelect(model)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-white/5"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {model.value === value && <Check className="h-3 w-3 text-harness-accent" />}
                </span>
                <div className="flex-1">
                  <div className={model.value === value ? 'text-harness-accent' : 'text-gray-300'}>
                    {model.displayName}
                  </div>
                  <div className="text-[10px] text-gray-600">{model.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
