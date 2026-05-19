# Module: Slash Commands

> Source files: apps/server/src/lib/slash-commands.ts, apps/web/src/lib/slashCommandUtils.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Slash command discovery and processing. Server-side scans plugin cache directories and project skill directories for available commands. Client-side provides utility functions for filtering commands and extracting slash fragments from input text.

## Key Files

### slash-commands.ts
Server-side command discovery: scans ~/.claude/plugins/cache for plugin skills and .claude/skills/ for project skills. Provides built-in commands (clear, compact, model, help).

### slashCommandUtils.ts
Client-side utilities: filterCommands for fuzzy matching, getCurrentSlashFragment for parsing / prefix from input text.

## Exports

- getAvailableCommands (function)
- filterCommands (function)
- getCurrentSlashFragment (function)
- BUILTIN_COMMANDS (const)

## Dependencies

- → shared-types (SlashCommand type)
