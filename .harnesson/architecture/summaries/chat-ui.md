# Module: Chat UI

> Source files: apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/components/chat/MessageRenderer.tsx, apps/web/src/components/chat/SlashCommandPopup.tsx, apps/web/src/components/chat/ImagePreview.tsx, apps/web/src/components/chat/AskUserQuestionPanel.tsx, apps/web/src/components/chat/ThinkingBar.tsx, apps/web/src/components/chat/ThinkingIndicator.tsx, apps/web/src/components/chat/TodoBar.tsx, apps/web/src/components/chat/HighlightOverlay.tsx, apps/web/src/hooks/useSlashCompletion.ts, apps/web/src/hooks/useImageInput.ts, apps/web/src/hooks/useEmacsKeybindings.ts, apps/web/src/hooks/useAutoScroll.ts, apps/web/src/hooks/useChatPanel.ts
> Last synced: 2026-05-19T12:00:00Z | Commit: 20df4fe

## Summary

Chat interface components for AI agent interaction. RichTextInput provides a contentEditable editor with inline image embedding, slash command completion popup, and Emacs-style keybindings. MessageRenderer displays conversation history with tool cards and thinking indicators.

## Key Files

### RichTextInput.tsx
Multi-feature input component integrating useSlashCompletion (slash command popup), useImageInput (image upload/paste/drag-drop), useEmacsKeybindings (Ctrl+A/E/B/F/P/N/D/H/W/K/U/Y shortcuts). Uses contentEditable div with inline image spans and auto-resize.

### MessageRenderer.tsx
Renders agent message history including text blocks, tool event cards, thinking indicators, and todo progress bar.

### SlashCommandPopup.tsx
Popup component for slash command autocomplete, showing filtered commands with keyboard navigation.

### useSlashCompletion.ts
Hook managing slash command filtering, popup state, keyboard navigation (arrow keys, enter, tab, escape), and command insertion.

### useImageInput.ts
Hook managing image file processing (File → base64), tracking pending images, and converting to ImageAttachment format.

### useEmacsKeybindings.ts
Hook implementing Readline-compatible editing shortcuts with a global kill ring (Ctrl+W/K/U/Y for cut/paste).

## Exports

- RichTextInput (component)
- MessageRenderer (component)
- SlashCommandPopup (component)
- ImagePreview (component)
- AskUserQuestionPanel (component)
- ThinkingBar (component)
- ThinkingIndicator (component)
- TodoBar (component)
- HighlightOverlay (component)
- useSlashCompletion (hook)
- useImageInput (hook)
- useEmacsKeybindings (hook)

## Dependencies

- → shared-types (SlashCommand, ImageAttachment, ContentBlock)
- → slashCommandStore (command data)
