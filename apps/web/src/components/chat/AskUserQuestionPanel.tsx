import { useState } from 'react';
import type { QuestionData, QuestionOption } from '@harnesson/shared';

interface AskUserQuestionPanelProps {
  question: QuestionData;
  onSubmit: (answer: string | string[]) => void;
}

export function AskUserQuestionPanel({ question, onSubmit }: AskUserQuestionPanelProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [customAnswer, setCustomAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return null;

  const hasPreview = question.options.some((o) => o.preview);
  const hasDescription = question.options.some((o) => o.description);

  function handleSingleSelect(label: string) {
    setSubmitted(true);
    onSubmit(label);
  }

  function handleToggleOption(label: string) {
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
    <div className="ml-[68px] mr-3 mb-2 rounded-[10px] border border-[#2a2a4e] bg-[#16162e] p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.3)]">
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
          onSelect={question.multiSelect ? handleToggleOption : (label) => handleSingleSelect(label)}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {question.options.map((opt) => (
            <OptionItem
              key={opt.label}
              option={opt}
              multiSelect={question.multiSelect}
              selected={question.multiSelect ? selectedOptions.has(opt.label) : false}
              onSelect={question.multiSelect ? () => handleToggleOption(opt.label) : () => handleSingleSelect(opt.label)}
              showDescription={hasDescription}
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
      <div className="mt-3 border-t border-[#2a2a4e] pt-2.5">
        <div className="mb-1.5 text-xs text-gray-500">自定义回答</div>
        <div className="flex gap-2">
          <input
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
  onSelect,
  showDescription,
}: {
  option: QuestionOption;
  multiSelect: boolean;
  selected: boolean;
  onSelect: () => void;
  showDescription: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
        selected
          ? 'border-harness-accent bg-[#1e1e3a]'
          : 'border-[#2a2a4e] bg-[#1a1a2e] hover:border-[#3a3a5c]'
      }`}
    >
      <div className="flex items-center gap-2">
        {multiSelect ? (
          <span className={`text-sm ${selected ? 'text-harness-accent' : 'text-gray-500'}`}>
            {selected ? '☑' : '☐'}
          </span>
        ) : (
          <div
            className={`h-4 w-4 rounded-full border-2 ${
              selected ? 'border-harness-accent' : 'border-[#4a4a6e]'
            } flex items-center justify-center`}
          >
            {selected && <div className="h-2 w-2 rounded-full bg-harness-accent" />}
          </div>
        )}
        <span className={`text-sm font-medium ${selected ? 'text-[#e0e0f0]' : 'text-[#c0c0e0]'}`}>
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
}: {
  options: QuestionOption[];
  multiSelect: boolean;
  selected: Set<string>;
  onSelect: (label: string) => void;
}) {
  const [previewContent, setPreviewContent] = useState<string>(options[0]?.preview ?? '');

  return (
    <div className="flex gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              onSelect(opt.label);
              if (opt.preview) setPreviewContent(opt.preview);
            }}
            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
              selected.has(opt.label)
                ? 'border-harness-accent bg-[#1e1e3a]'
                : 'border-[#2a2a4e] bg-[#1a1a2e] hover:border-[#3a3a5c]'
            }`}
          >
            <div className="flex items-center gap-2">
              {multiSelect ? (
                <span className={`text-sm ${selected.has(opt.label) ? 'text-harness-accent' : 'text-gray-500'}`}>
                  {selected.has(opt.label) ? '☑' : '☐'}
                </span>
              ) : (
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    selected.has(opt.label) ? 'border-harness-accent' : 'border-[#4a4a6e]'
                  } flex items-center justify-center`}
                >
                  {selected.has(opt.label) && <div className="h-2 w-2 rounded-full bg-harness-accent" />}
                </div>
              )}
              <span className={`text-sm font-medium ${selected.has(opt.label) ? 'text-[#e0e0f0]' : 'text-[#c0c0e0]'}`}>
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
