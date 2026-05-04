import { useEffect, useRef } from 'react';
import type { SlashCommand } from '@harnesson/shared';

interface SlashCommandPopupProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}

const MAX_VISIBLE = 8;

export function SlashCommandPopup({
  commands,
  selectedIndex,
  onSelect,
  hoveredIndex,
  onHover,
}: SlashCommandPopupProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = listRef.current?.querySelectorAll('.slash-popup-item');
    items?.[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (commands.length === 0) {
    return (
      <div className="slash-popup">
        <div className="slash-popup-empty">没有匹配的命令</div>
      </div>
    );
  }

  const builtins = commands.filter((c) => c.type === 'builtin');
  const skills = commands.filter((c) => c.type === 'skill');
  let globalIdx = 0;

  const renderGroup = (title: string, group: SlashCommand[]) => {
    if (group.length === 0) return null;
    const items = group.map((cmd) => {
      const idx = globalIdx++;
      const isActive = idx === selectedIndex;
      return (
        <div
          key={cmd.name}
          className={`slash-popup-item ${isActive ? 'slash-popup-item-active' : ''}`}
          onClick={() => onSelect(cmd)}
          onMouseEnter={() => onHover(idx)}
          onMouseLeave={() => onHover(null)}
        >
          <code className="slash-popup-cmd">/{cmd.name}</code>
          <span className="slash-popup-desc">{cmd.description}</span>
        </div>
      );
    });
    return (
      <div key={title}>
        <div className="slash-popup-group">{title}</div>
        {items}
      </div>
    );
  };

  return (
    <div className="slash-popup">
      <div ref={listRef} className="slash-popup-list" style={{ maxHeight: `${MAX_VISIBLE * 36 + 40}px` }}>
        {renderGroup('内置命令', builtins)}
        {builtins.length > 0 && skills.length > 0 && <div className="slash-popup-divider" />}
        {renderGroup('Skills', skills)}
      </div>
      <div className="slash-popup-footer">
        ↑↓ 导航 · Enter 选择 · Esc 关闭
      </div>
    </div>
  );
}