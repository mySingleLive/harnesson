# Module: chat-ui

## Summary
Chat UI components including rich text input with Emacs keybindings, slash command autocomplete, image support, message rendering with markdown, and specialized tool cards for rendering agent tool outputs (Bash, Read, Write, Edit, Glob, Grep, LSP, etc.).

## Key Files
- `apps/web/src/components/chat/RichTextInput.tsx` — Rich text input with image upload, model selector, slash commands, and Emacs keybindings
- `apps/web/src/components/chat/MessageRenderer.tsx` — Renders chat messages with markdown and tool cards
- `apps/web/src/components/chat/ThinkingBar.tsx` — Animated thinking indicator
- `apps/web/src/components/chat/ThinkingIndicator.tsx` — Static thinking text
- `apps/web/src/components/chat/TodoBar.tsx` — Todo progress bar
- `apps/web/src/components/chat/SlashCommandPopup.tsx` — Slash command autocomplete popup
- `apps/web/src/components/chat/AskUserQuestionPanel.tsx` — Interactive question panel
- `apps/web/src/components/chat/ImagePreview.tsx` — Image preview with remove
- `apps/web/src/components/chat/HighlightOverlay.tsx` — Highlight overlay
- `apps/web/src/components/chat/tool-cards/BashCard.tsx` — Bash command output card
- `apps/web/src/components/chat/tool-cards/ReadCard.tsx` — File read output card
- `apps/web/src/components/chat/tool-cards/WriteCard.tsx` — File write output card
- `apps/web/src/components/chat/tool-cards/EditCard.tsx` — File edit diff card
- `apps/web/src/components/chat/tool-cards/GlobCard.tsx` — Glob search results card
- `apps/web/src/components/chat/tool-cards/GrepCard.tsx` — Grep search results card
- `apps/web/src/components/chat/tool-cards/LSPCard.tsx` — LSP diagnostics card
- `apps/web/src/components/chat/tool-cards/GenericCard.tsx` — Generic tool output card
- `apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx` — Question card in messages
- `apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx` — Streaming agent card
- `apps/web/src/components/chat/tool-cards/TodoCard.tsx` — Todo card in messages
- `apps/web/src/components/chat/tool-cards/ToolEventCard.tsx` — Generic tool event card
- `apps/web/src/components/chat/tool-cards/QAResultCard.tsx` — QA result card
- `apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx` — Collapsible wrapper card
- `apps/web/src/components/chat/tool-cards/CodeLine.tsx` — Code line component

## Exports
- `RichTextInput` — Chat input component
- `MessageRenderer` — Message display component
- All tool card components

## Dependencies
- `react` — UI framework
- `react-markdown` + `remark-gfm` — Markdown rendering
- `prism-react-renderer` — Syntax highlighting
- `diff` — Diff display for edits
- `@harnesson/shared` — Types
- `@xyflow/react` + `@dagrejs/dagre` — Graph visualization (for some cards)

## Source files
- apps/web/src/components/chat/RichTextInput.tsx
- apps/web/src/components/chat/MessageRenderer.tsx
- apps/web/src/components/chat/ThinkingBar.tsx
- apps/web/src/components/chat/ThinkingIndicator.tsx
- apps/web/src/components/chat/TodoBar.tsx
- apps/web/src/components/chat/SlashCommandPopup.tsx
- apps/web/src/components/chat/AskUserQuestionPanel.tsx
- apps/web/src/components/chat/ImagePreview.tsx
- apps/web/src/components/chat/HighlightOverlay.tsx
- apps/web/src/components/chat/tool-cards/BashCard.tsx
- apps/web/src/components/chat/tool-cards/ReadCard.tsx
- apps/web/src/components/chat/tool-cards/WriteCard.tsx
- apps/web/src/components/chat/tool-cards/EditCard.tsx
- apps/web/src/components/chat/tool-cards/GlobCard.tsx
- apps/web/src/components/chat/tool-cards/GrepCard.tsx
- apps/web/src/components/chat/tool-cards/LSPCard.tsx
- apps/web/src/components/chat/tool-cards/GenericCard.tsx
- apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx
- apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx
- apps/web/src/components/chat/tool-cards/TodoCard.tsx
- apps/web/src/components/chat/tool-cards/ToolEventCard.tsx
- apps/web/src/components/chat/tool-cards/QAResultCard.tsx
- apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx
- apps/web/src/components/chat/tool-cards/CodeLine.tsx
