# Module: chat-ui

> Source files: apps/web/src/components/chat/**/*.{ts,tsx}
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Chat UI components for the AI agent conversation interface. Includes message rendering with markdown, a rich-text input with image embedding and slash commands, thinking indicators, todo progress bars, and 15+ specialized tool event cards for visualizing Bash, Read, Edit, Write, Glob, Grep, LSP, and other tool operations.

## Key Files

### MessageRenderer.tsx
Top-level message renderer dispatching to TodoCard, UserMessage, or AgentMessageBubble. Renders markdown text and tool event cards from event trees.

### RichTextInput.tsx
Main chat input component. contentEditable editor with inline image embedding, slash command completion, Emacs keybindings, model selection, and abort button.

### AskUserQuestionPanel.tsx
Interactive question panel with single/multi-select options or custom answer input, keyboard navigation, and preview layouts.

### SlashCommandPopup.tsx
Floating popup for slash command suggestions grouped into builtin/skills categories with keyboard navigation.

### tool-cards/ToolEventCard.tsx
Maps tool names to specific card components. Provides ToolEventCardList and SingleToolEventCard.

### tool-cards/buildEventTree.ts
Builds hierarchical tree of TreeSegment objects from flat stream events for nested agent rendering.

### tool-cards/segmentEvents.ts
Segments flat stream events into ordered Segment objects (text, tool, qa-result).

### tool-cards/pairEvents.ts
Pairs tool_use and tool_result stream events into PairedToolEvent objects.

### tool-cards/BashCard.tsx, ReadCard.tsx, EditCard.tsx, WriteCard.tsx, GlobCard.tsx, GrepCard.tsx, LSPCard.tsx
Specialized cards for each tool type with syntax highlighting, diff views, and collapsible output.

### tool-cards/CollapsibleCard.tsx
Reusable collapsible card shell with running/collapsed/expanded states.

## Exports

- MessageRenderer, RichTextInput, AskUserQuestionPanel, SlashCommandPopup (components)
- ThinkingBar, ThinkingIndicator, TodoBar (components)
- HighlightOverlay, ImagePreview (components)
- ToolEventCardList, SingleToolEventCard (components)
- StreamingAgentCard, TodoCard, QAResultCard (components)
- BashCard, ReadCard, EditCard, WriteCard, GlobCard, GrepCard, LSPCard, GenericCard, AskUserQuestionCard (components)
- CodeLine, CollapsibleCard (components)
- buildEventTree, segmentEvents, pairEvents (functions)
- detectLanguage (function)

## Dependencies

- → @harnesson/shared (Agent, AgentMessage, ContentBlock, AgentStreamEvent, TodoItem, SlashCommand, QuestionData types)
- → hooks (useAutoScroll, useImageInput, useSlashCompletion, useEmacsKeybindings, useKeyboardNavigation)
- → stores (agentStore, slashCommandStore)
- → layout (ModelDropdown)
- → web-lib (serverApi, utils, slashCommandUtils)
