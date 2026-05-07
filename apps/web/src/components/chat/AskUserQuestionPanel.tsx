import { useState, useRef, useEffect, useCallback } from 'react';
import type { QuestionData, QuestionOption } from '@harnesson/shared';
import { cn } from '../../lib/utils';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';

interface AskUserQuestionPanelProps {
  question: QuestionData;
  onSubmit: (answer: string | string[]) => void;
}

export function AskUserQuestionPanel({ question, onSubmit }: AskUserQuestionPanelProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [customAnswer, setCustomAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const customInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const optionCount = question.options.length;
  const totalItems = optionCount + 1;

  const handleSelect = useCallback(
    (index: number) => {
      if (index < optionCount) {
        const label = question.options[index].label;
        setSubmitted(true);
        onSubmit(label);
      }
    },
    [optionCount, question.options, onSubmit],
  );

  const handleToggle = useCallback(
    (index: number) => {
      if (index < optionCount) {
        const label = question.options[index].label;
        setSelectedOptions((prev) => {
          const next = new Set(prev);
          if (next.has(label)) next.delete(label);
          else next.add(label);
          return next;
        });
      }
    },
    [optionCount, question.options],
  );

  const { focusedIndex, isFocused, setFocused, containerProps } = useKeyboardNavigation({
    itemCount: totalItems,
    onSelect: handleSelect,
    onToggle: question.multiSelect ? handleToggle : undefined,
    initialIndex: 0,
  });

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isFocused(optionCount) && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [focusedIndex, optionCount, isFocused]);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  if (submitted) return null;

  const hasPreview = question.options.some((o) => o.preview);
  const hasDescription = question.options.some((o) => o.description);

  function handleSingleSelect(index: number) {
    setFocused(index);
    submitTimerRef.current = setTimeout(() => {
      const label = question.options[index].label;
      setSubmitted(true);
      onSubmit(label);
    }, 300);
  }

  function handleMultiToggle(index: number) {
    const label = question.options[index].label;
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleMultiConfirm() {
    if (selectedOptions.size === 0) return;
    setSubmitted(true);
    onSubmit(Array.from(selectedOptions));
  }

  function handleCustomSubmit() {
    const trimmed = customAnswer.trim();
    if (!trimmed) return;
    setSubmitted(true);
    onSubmit(trimmed);
  }

  function handleCustomKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
  }

  return (
    <div
      ref={containerRef}
      {...containerProps}
      className="ml-[68px] mr-3 mb-2 rounded-[10px] border border-[#2a2a4e] bg-[#16162e] p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.3)] outline-none"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-harness-accent">
          <span className="text-[11px] font-bold text-white">?</span>
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-harness-accent">
          {question.header}
        </span>
      </div>

      {/* Question */}
      <div className="mb-3.5 text-sm leading-relaxed text-[#e0e0f0]">{question.question}</div>

      {/* Options */}
      {hasPreview ? (
        <PreviewLayout
          options={question.options}
          multiSelect={question.multiSelect}
          selected={selectedOptions}
          onSelect={question.multiSelect ? handleMultiToggle : handleSingleSelect}
          focusedIndex={focusedIndex}
          hoveredIndex={hoveredIndex}
          isFocused={isFocused}
          onHover={setHoveredIndex}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {question.options.map((opt, i) => (
            <OptionItem
              key={opt.label}
              option={opt}
              multiSelect={question.multiSelect}
              selected={question.multiSelect ? selectedOptions.has(opt.label) : false}
              focused={isFocused(i)}
              hovered={hoveredIndex === i}
              onSelect={
                question.multiSelect ? () => handleMultiToggle(i) : () => handleSingleSelect(i)
              }
              showDescription={hasDescription}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(-1)}
            />
          ))}
        </div>
      )}

      {/* Multi-select confirm button */}
      {question.multiSelect && (
        <button
          onClick={handleMultiConfirm}
          disabled={selectedOptions.size === 0}
          className="mt-3 rounded-lg bg-harness-accent px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-40"
        >
          确认
        </button>
      )}

      {/* Custom input */}
      <div
        className={cn(
          'mt-3 border-t pt-2.5 transition-colors',
          isFocused(optionCount) ? 'border-harness-accent' : 'border-[#2a2a4e]',
        )}
      >
        <div className="mb-1.5 text-xs text-gray-500">自定义回答</div>
        <div className="flex gap-2">
          <input
            ref={customInputRef}
            type="text"
            value={customAnswer}
            onChange={(e) => setCustomAnswer(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="输入你的答案..."
            className="flex-1 rounded-md border border-[#3a3a5c] bg-[#0d0d1a] px-3 py-2 text-[13px] text-[#e0e0f0] outline-none placeholder:text-gray-600 focus:border-harness-accent"
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customAnswer.trim()}
            className="rounded-md bg-harness-accent px-4 py-2 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-40"
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionItem({
  option,
  multiSelect,
  selected,
  focused,
  hovered,
  onSelect,
  showDescription,
  onMouseEnter,
  onMouseLeave,
}: {
  option: QuestionOption;
  multiSelect: boolean;
  selected: boolean;
  focused: boolean;
  hovered: boolean;
  onSelect: () => void;
  showDescription: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'w-full rounded-lg border px-3 py-2.5 text-left transition-colors',
        focused && 'border-harness-accent bg-[#1e1e3a] shadow-[0_0_0_2px_rgba(139,92,246,0.25)]',
        !focused && hovered && 'border-[#3a3a5c] bg-[#1c1c32]',
        !focused && !hovered && selected && 'border-harness-accent bg-[#1e1e3a]',
        !focused && !hovered && !selected && 'border-[#2a2a4e] bg-[#1a1a2e]',
      )}
    >
      <div className="flex items-center gap-2">
        {multiSelect ? (
          <span className={cn('text-sm', selected ? 'text-harness-accent' : 'text-gray-500')}>
            {selected ? '☑' : '☐'}
          </span>
        ) : (
          <div
            className={cn(
              'h-4 w-4 rounded-full border-2 flex items-center justify-center',
              focused || selected ? 'border-harness-accent' : 'border-[#4a4a6e]',
            )}
          >
            {(focused || selected) && <div className="h-2 w-2 rounded-full bg-harness-accent" />}
          </div>
        )}
        <span className={cn('text-sm font-medium', focused || selected ? 'text-[#e0e0f0]' : 'text-[#c0c0e0]')}>
          {option.label}
        </span>
      </div>
      {showDescription && option.description && (
        <div className="mt-1 ml-6 text-xs text-gray-500">{option.description}</div>
      )}
    </button>
  );
}

function PreviewLayout({
  options,
  multiSelect,
  selected,
  onSelect,
  focusedIndex,
  hoveredIndex,
  isFocused,
  onHover,
}: {
  options: QuestionOption[];
  multiSelect: boolean;
  selected: Set<string>;
  onSelect: (index: number) => void;
  focusedIndex: number;
  hoveredIndex: number;
  isFocused: (index: number) => boolean;
  onHover: (index: number) => void;
}) {
  const [previewContent, setPreviewContent] = useState<string>(options[0]?.preview ?? '');

  // Sync preview with focused option
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < options.length) {
      const opt = options[focusedIndex];
      if (opt?.preview) setPreviewContent(opt.preview);
    }
  }, [focusedIndex, options]);

  return (
    <div className="flex gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {options.map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => {
              onSelect(i);
              if (opt.preview) setPreviewContent(opt.preview);
            }}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(-1)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left transition-colors',
              isFocused(i) && 'border-harness-accent bg-[#1e1e3a] shadow-[0_0_0_2px_rgba(139,92,246,0.25)]',
              !isFocused(i) && hoveredIndex === i && 'border-[#3a3a5c] bg-[#1c1c32]',
              !isFocused(i) && hoveredIndex !== i && selected.has(opt.label) && 'border-harness-accent bg-[#1e1e3a]',
              !isFocused(i) && hoveredIndex !== i && !selected.has(opt.label) && 'border-[#2a2a4e] bg-[#1a1a2e]',
            )}
          >
            <div className="flex items-center gap-2">
              {multiSelect ? (
                <span className={cn('text-sm', selected.has(opt.label) ? 'text-harness-accent' : 'text-gray-500')}>
                  {selected.has(opt.label) ? '☑' : '☐'}
                </span>
              ) : (
                <div
                  className={cn(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center',
                    isFocused(i) || selected.has(opt.label) ? 'border-harness-accent' : 'border-[#4a4a6e]',
                  )}
                >
                  {(isFocused(i) || selected.has(opt.label)) && <div className="h-2 w-2 rounded-full bg-harness-accent" />}
                </div>
              )}
              <span className={cn('text-sm font-medium', isFocused(i) || selected.has(opt.label) ? 'text-[#e0e0f0]' : 'text-[#c0c0e0]')}>
                {opt.label}
              </span>
            </div>
            {opt.description && <div className="mt-1 ml-6 text-xs text-gray-500">{opt.description}</div>}
          </button>
        ))}
      </div>
      {previewContent && (
        <div className="flex-1 rounded-lg border border-[#3a3a5c] bg-[#16162a] p-3 font-mono text-xs text-[#a0a0c0]">
          <div className="mb-2 text-gray-600">Preview:</div>
          <pre className="whitespace-pre-wrap">{previewContent}</pre>
        </div>
      )}
    </div>
  );
}
