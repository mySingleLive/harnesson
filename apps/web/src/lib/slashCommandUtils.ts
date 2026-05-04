import type { SlashCommand } from '@harnesson/shared';

/**
 * Parse input text to detect a slash command at the beginning.
 * Returns null if the first non-whitespace token is not a registered command.
 */
export function parseSlashCommand(
  input: string,
  commands: SlashCommand[],
): { command: SlashCommand; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  for (const cmd of commands) {
    if (trimmed.startsWith(`/${cmd.name}`)) {
      const after = trimmed.slice(cmd.name.length + 1);
      if (after === '' || after.startsWith(' ')) {
        return { command: cmd, args: after.trim() };
      }
    }
  }
  return null;
}

/**
 * Extract the current slash command fragment being typed.
 * Returns { prefix: "/mod", start: 0 } when cursor is after "/mod".
 * Returns null if cursor is not on a slash command fragment.
 */
export function getCurrentSlashFragment(
  text: string,
  cursorPosition: number,
): { prefix: string; start: number } | null {
  const beforeCursor = text.slice(0, cursorPosition);
  const slashIdx = beforeCursor.lastIndexOf('/');
  if (slashIdx === -1) return null;

  if (slashIdx > 0 && !/\s/.test(text[slashIdx - 1])) return null;

  const fragment = beforeCursor.slice(slashIdx);
  if (fragment.includes(' ')) return null;

  return { prefix: fragment, start: slashIdx };
}

/**
 * Filter commands by a prefix string (e.g., "/mod" matches "/model").
 */
export function filterCommands(
  commands: SlashCommand[],
  prefix: string,
): SlashCommand[] {
  const search = prefix.toLowerCase().slice(1);
  if (!search) return commands;
  return commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().startsWith(search) ||
      cmd.description.toLowerCase().includes(search) ||
      cmd.plugin?.toLowerCase().includes(search),
  );
}
