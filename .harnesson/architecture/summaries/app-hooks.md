# Module: app-hooks

## Summary
Shared React hooks providing reusable functionality across the application: Emacs-style keybindings for contentEditable editors, image upload/paste handling, slash command auto-completion, and keyboard navigation.

## Key Files
- `apps/web/src/hooks/useEmacsKeybindings.ts` — Readline-compatible keybindings (Ctrl+A/E/B/F/P/N/D/H/W/K/U/Y) with kill ring
- `apps/web/src/hooks/useImageInput.ts` — Image upload via file picker or clipboard paste, with base64 conversion
- `apps/web/src/hooks/useSlashCompletion.ts` — Slash command autocomplete with filtering, keyboard navigation, and selection
- `apps/web/src/hooks/useKeyboardNavigation.ts` — Generic keyboard navigation for lists (arrow keys, enter, space, escape)
- `apps/web/src/hooks/useElapsedTime.ts` — Elapsed time display hook

## Exports
- `useEmacsKeybindings` — Emacs keybinding hook
- `useImageInput` — Image input hook
- `useSlashCompletion` — Slash completion hook
- `useKeyboardNavigation` — Keyboard navigation hook
- `useElapsedTime` — Elapsed time hook

## Dependencies
- `react` — React hooks
- `@harnesson/shared` — SlashCommand, ImageAttachment types
- `useSlashCommandStore` — Command cache

## Source files
- apps/web/src/hooks/useEmacsKeybindings.ts
- apps/web/src/hooks/useImageInput.ts
- apps/web/src/hooks/useSlashCompletion.ts
- apps/web/src/hooks/useKeyboardNavigation.ts
- apps/web/src/hooks/useElapsedTime.ts
