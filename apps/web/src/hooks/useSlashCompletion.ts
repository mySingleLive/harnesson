import { useState, useCallback, useRef, useEffect } from 'react';
import type { SlashCommand } from '@harnesson/shared';
import { useSlashCommandStore } from '@/stores/slashCommandStore';
import { filterCommands, getCurrentSlashFragment } from '@/lib/slashCommandUtils';

interface UseSlashCompletionReturn {
  isOpen: boolean;
  filteredCommands: SlashCommand[];
  selectedIndex: number;
  openPopup: () => void;
  closePopup: () => void;
  handleInput: (value: string, cursorPosition: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  selectCommand: (cmd: SlashCommand) => void;
  hoveredIndex: number | null;
  setHoveredIndex: (idx: number | null) => void;
}

export function useSlashCompletion(
  input: string,
  setInput: (val: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
): UseSlashCompletionReturn {
  const commands = useSlashCommandStore((s) => s.commands);
  const fetchCommands = useSlashCommandStore((s) => s.fetchCommands);

  const [isOpen, setIsOpen] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const activeIndex = hoveredIndex ?? selectedIndex;

  const openPopup = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
    setHoveredIndex(null);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setHoveredIndex(null);
  }, []);

  const handleInput = useCallback(
    (value: string, cursorPosition: number) => {
      if (isComposing.current) return;

      const fragment = getCurrentSlashFragment(value, cursorPosition);
      if (fragment) {
        const filtered = filterCommands(commands, fragment.prefix);
        setFilteredCommands(filtered);
        if (!isOpen) {
          setIsOpen(true);
        }
        setSelectedIndex(0);
        setHoveredIndex(null);

        if (fragment.prefix.length > 1 && value[cursorPosition - 1] === ' ') {
          setIsOpen(false);
        }
      } else if (isOpen) {
        closePopup();
      }
    },
    [commands, isOpen, closePopup],
  );

  const selectCommand = useCallback(
    (cmd: SlashCommand) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const afterCursor = input.slice(cursorPos);

      const fragment = getCurrentSlashFragment(input, cursorPos);
      if (!fragment) return;

      const before = input.slice(0, fragment.start);
      const replacement = `/${cmd.name} `;
      const newValue = before + replacement + afterCursor;
      setInput(newValue);

      const newCursorPos = before.length + replacement.length;
      requestAnimationFrame(() => {
        textarea.selectionStart = newCursorPos;
        textarea.selectionEnd = newCursorPos;
        textarea.focus();
      });

      closePopup();
    },
    [input, setInput, textareaRef, closePopup],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isOpen || filteredCommands.length === 0) return false;

      const currentIdx = hoveredIndex ?? selectedIndex;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = (currentIdx + 1) % filteredCommands.length;
          setSelectedIndex(next);
          setHoveredIndex(null);
          return true;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = (currentIdx - 1 + filteredCommands.length) % filteredCommands.length;
          setSelectedIndex(prev);
          setHoveredIndex(null);
          return true;
        }
        case 'Enter':
        case 'Tab': {
          if (filteredCommands[currentIdx]) {
            e.preventDefault();
            selectCommand(filteredCommands[currentIdx]);
            return true;
          }
          return false;
        }
        case 'Escape': {
          e.preventDefault();
          closePopup();
          return true;
        }
      }

      return false;
    },
    [isOpen, filteredCommands, hoveredIndex, selectedIndex, selectCommand, closePopup],
  );

  return {
    isOpen,
    filteredCommands,
    selectedIndex: activeIndex,
    openPopup,
    closePopup,
    handleInput,
    handleKeyDown,
    selectCommand,
    hoveredIndex,
    setHoveredIndex,
  };
}