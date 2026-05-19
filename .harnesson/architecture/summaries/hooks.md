# Module: hooks

> Source files: apps/web/src/hooks/*.ts
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Shared React hooks providing reusable UI behavior patterns: auto-scrolling, chat panel state, elapsed time display, Emacs keybindings, image input handling, keyboard list navigation, project actions, and slash command autocomplete.

## Key Files

### useAutoScroll.ts
Auto-scrolls a container to bottom when content changes. Provides isAtBottom state and scrollToBottom function.

### useChatPanel.ts
Convenience hook wrapping agentStore for panel open/close/maximize state.

### useElapsedTime.ts
Computes and updates elapsed time strings from start timestamps, refreshing every second.

### useEmacsKeybindings.ts
Emacs/Readline keybindings for contentEditable editors: cursor movement, deletion, kill ring operations with shared kill ring.

### useImageInput.ts
Image attachment management: file selection, clipboard paste, base64 conversion, and preview URLs.

### useKeyboardNavigation.ts
Arrow key and Ctrl+N/P keyboard navigation for list items with wrap-around, selection, and focus tracking.

### useProjectActions.ts
Project management actions: open folder via native dialog, clone repo, create project, open project by path.

### useSlashCompletion.ts
Slash command autocomplete: detects `/` fragments, filters commands, manages popup with keyboard navigation.

## Exports

- useAutoScroll, useChatPanel, useElapsedTime (hooks)
- useEmacsKeybindings, useImageInput, useKeyboardNavigation (hooks)
- useProjectActions, useSlashCompletion (hooks)
- PendingImage, UseImageInputReturn, UseSlashCompletionReturn (interfaces)
- UseKeyboardNavigationOptions (interface)

## Dependencies

- → stores (agentStore, projectStore, slashCommandStore)
- → web-lib (serverApi, slashCommandUtils)
- → @harnesson/shared (SlashCommand, ImageAttachment types)
