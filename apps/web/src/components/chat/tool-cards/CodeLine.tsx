import type { ReactNode } from 'react';

interface CodeLineProps {
  lineNumber: number;
  type?: 'context' | 'deleted' | 'added';
  children: ReactNode;
}

const TYPE_STYLES: Record<string, string> = {
  deleted: 'bg-red-500/[0.15]',
  added: 'bg-green-500/[0.12]',
};

const LINE_NUMBER_COLOR: Record<string, string> = {
  deleted: 'text-red-400',
  added: 'text-green-400',
  context: 'text-[#555]',
};

const PREFIX: Record<string, { char: string; className: string }> = {
  deleted:  { char: '−', className: 'text-red-400' },
  added:    { char: '+',     className: 'text-green-400' },
};

export function CodeLine({ lineNumber, type = 'context', children }: CodeLineProps) {
  const style = TYPE_STYLES[type];
  const prefix = PREFIX[type];

  return (
    <div className={`flex items-start px-2.5 ${style ?? ''}`}>
      <span className={`w-8 shrink-0 mr-3 text-right select-none text-[12px] leading-[1.65] ${LINE_NUMBER_COLOR[type]}`}>
        {lineNumber}
      </span>
      <span className={`w-[10px] shrink-0 text-[12px] leading-[1.65] ${prefix?.className ?? ''}`}>
        {prefix?.char ?? ''}
      </span>
      <span className={`flex-1 text-[12px] leading-[1.65] whitespace-pre-wrap break-all ${type === 'deleted' ? 'text-red-300/80' : ''}`}>
        {children}
      </span>
    </div>
  );
}
