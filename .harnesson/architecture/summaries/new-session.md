# Module: new-session

## Summary
New session page that serves as the landing page for creating AI agent conversations. Provides a rich text input with model selection, slash commands, image support, and quick action buttons for common tasks (create feature, fix bug, code review, write tests).

## Key Files
- `apps/web/src/pages/NewSessionPage.tsx` — Landing page with agent creation input, model selector, branch display, and quick actions

## Exports
- `NewSessionPage` — New session page component

## Dependencies
- `react-router` — Navigation
- `lucide-react` — Icons
- `@harnesson/shared` — ContentBlock, ImageAttachment types
- `useAgentStore` — Agent creation and messaging
- `useProjectStore` — Active project context
- `useSlashCommandStore` — Available commands
- `RichTextInput` — Chat input component

## Source files
- apps/web/src/pages/NewSessionPage.tsx
