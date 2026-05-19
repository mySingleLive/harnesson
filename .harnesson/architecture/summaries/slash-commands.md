# Module: slash-commands

## Summary
Slash command system for the agent chat interface. Scans for available commands from built-in commands, plugin skills, and project-local skills. Built-in commands include /clear, /compact, /model, and /help. The frontend provides auto-completion with filtering.

## Key Files
- `apps/server/src/lib/slash-commands.ts` — Server-side command scanning: built-in, plugin, and project skills
- `apps/web/src/lib/slashCommandUtils.ts` — Frontend parsing and filtering utilities
- `apps/web/src/stores/slashCommandStore.ts` — Zustand store for command cache

## Exports
- `getAvailableCommands(cwd?)` — Returns all available slash commands
- `parseSlashCommand()` — Parses input text for slash commands
- `getCurrentSlashFragment()` — Extracts slash fragment at cursor
- `filterCommands()` — Filters commands by prefix
- `useSlashCommandStore` — Zustand store for commands

## Dependencies
- `@harnesson/shared` — SlashCommand type
- `node:fs` — Directory scanning for skills
- `node:os` — Home directory for plugin cache

## Source files
- apps/server/src/lib/slash-commands.ts
- apps/web/src/lib/slashCommandUtils.ts
- apps/web/src/stores/slashCommandStore.ts
