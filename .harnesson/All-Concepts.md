# All Concepts

**Total concepts:** 100
**Last updated:** 2026-05-19

---

## CONC-001 — Server Infrastructure
- **Type:** domain
- **Module:** server-core
- **Summary:** Core server infrastructure including the Hono HTTP server setup, health check endpoint, and port auto-detection to ensure reliable server startup.
- **References:**
- **Source files:** apps/server/src/index.ts, apps/server/src/routes/health.ts, apps/server/src/lib/find-port.ts

## CONC-002 — Health Check API
- **Type:** operation
- **Module:** server-core
- **Summary:** Returns server status and timestamp via GET /api/health. Used by the frontend to verify backend connectivity.
- **References:** CONC-001
- **Source files:** apps/server/src/routes/health.ts

## CONC-003 — Port Auto-Detection
- **Type:** operation
- **Module:** server-core
- **Summary:** Automatically finds an available TCP port if the preferred port is occupied, ensuring the server can start without manual configuration.
- **References:** CONC-001
- **Source files:** apps/server/src/lib/find-port.ts

## CONC-004 — Agent Session Restore on Startup
- **Type:** operation
- **Module:** server-core
- **Summary:** Restores all persisted agent sessions from the database on server startup, reconnecting their runtime state and adapters.
- **References:** CONC-001, CONC-015
- **Source files:** apps/server/src/index.ts

## CONC-005 — Project Management
- **Type:** domain
- **Module:** project-management
- **Summary:** Complete project lifecycle management including creation from local folders, cloning repos, fresh creation with git init, project listing, and deletion. Persisted in SQLite via Prisma.
- **References:**
- **Source files:** apps/server/src/routes/projects.ts, apps/server/src/routes/branches.ts, apps/server/src/routes/open-folder.ts, apps/server/src/lib/native-dialog.ts

## CONC-006 — List Projects API
- **Type:** operation
- **Module:** project-management
- **Summary:** Returns all projects ordered by last updated via GET /api/projects.
- **References:** CONC-005
- **Source files:** apps/server/src/routes/projects.ts

## CONC-007 — Get Single Project API
- **Type:** operation
- **Module:** project-management
- **Summary:** Returns a single project by ID via GET /api/projects/:id. Returns 404 if not found.
- **References:** CONC-005
- **Source files:** apps/server/src/routes/projects.ts

## CONC-008 — Create Project API
- **Type:** operation
- **Module:** project-management
- **Summary:** Creates a new project via POST /api/projects. Supports local, clone, and create sources with optional git init. Deduplicates by path.
- **References:** CONC-005
- **Source files:** apps/server/src/routes/projects.ts

## CONC-009 — Delete Project API
- **Type:** operation
- **Module:** project-management
- **Summary:** Deletes a project by ID via DELETE /api/projects/:id. Returns 404 if not found.
- **References:** CONC-005
- **Source files:** apps/server/src/routes/projects.ts

## CONC-010 — List Branches API
- **Type:** operation
- **Module:** project-management
- **Summary:** Lists local and remote git branches for a project via GET /api/projects/:id/branches, identifying the current branch.
- **References:** CONC-005
- **Source files:** apps/server/src/routes/branches.ts

## CONC-011 — Checkout Branch API
- **Type:** operation
- **Module:** project-management
- **Summary:** Switches to a specified git branch via POST /api/projects/:id/checkout. Supports both local and remote branches (creates local tracking branch).
- **References:** CONC-005
- **Source files:** apps/server/src/routes/branches.ts

## CONC-012 — Open Folder Dialog API
- **Type:** operation
- **Module:** project-management
- **Summary:** Opens a native OS folder selection dialog via POST /api/open-folder. Supports macOS, Linux, and Windows platforms.
- **References:** CONC-005
- **Source files:** apps/server/src/routes/open-folder.ts, apps/server/src/lib/native-dialog.ts

## CONC-013 — Project List UI
- **Type:** component
- **Module:** project-management
- **Summary:** Displays projects in card or list view with search filtering, empty state, and modals for cloning/creating projects.
- **References:** CONC-005
- **Source files:** apps/web/src/pages/ProjectsPage.tsx, apps/web/src/components/projects/ProjectList.tsx

## CONC-014 — Project Actions
- **Type:** feature
- **Module:** project-management
- **Summary:** Frontend actions for opening folders, cloning repos, creating projects, and activating projects with loading state management.
- **References:** CONC-005
- **Source files:** apps/web/src/hooks/useProjectActions.ts

## CONC-015 — AI Agent System
- **Type:** domain
- **Module:** ai-agent
- **Summary:** Core AI agent management system with Claude Code integration. Supports creating sessions, streaming messages, handling interactive questions, managing todos, and persisting all state to SQLite.
- **References:**
- **Source files:** apps/server/src/lib/agent-service.ts, apps/server/src/lib/agent-adapter.ts, apps/server/src/lib/claude-code-adapter.ts, apps/server/src/routes/agents.ts

## CONC-016 — Agent Adapter Interface
- **Type:** interface
- **Module:** ai-agent
- **Summary:** Defines the contract for agent backends including sendMessage, createSession, destroySession, abort, model switching, and session persistence.
- **References:** CONC-015
- **Source files:** apps/server/src/lib/agent-adapter.ts

## CONC-017 — Claude Code Adapter
- **Type:** component
- **Module:** ai-agent
- **Summary:** Implements the AgentAdapter interface using the Claude Agent SDK. Manages sessions with SDK session resumption, tracks nested Agent tool calls, and handles streaming events including text, tool_use, and tool_result.
- **References:** CONC-015, CONC-016
- **Source files:** apps/server/src/lib/claude-code-adapter.ts

## CONC-018 — Agent Service
- **Type:** component
- **Module:** ai-agent
- **Summary:** Central service managing agent lifecycle: creation, message sending with question interception, SSE broadcasting, todo persistence, and database state management.
- **References:** CONC-015
- **Source files:** apps/server/src/lib/agent-service.ts

## CONC-019 — List Supported Models API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Returns available AI models via GET /api/models, fetched from the Claude Agent SDK.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-020 — Create Agent API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Creates a new agent session via POST /api/agents with specified type, model, working directory, and permission mode.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-021 — List Agents API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Lists all non-destroyed agent sessions via GET /api/agents, including pending question state for waiting sessions.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-022 — Get Single Agent API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Returns a single agent's info by ID via GET /api/agents/:id.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-023 — Get Agent Messages API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Returns paginated message history for an agent via GET /api/agents/:id/messages, with limit and cursor-based pagination.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-024 — Get Agent Todos API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Returns todo items for an agent session via GET /api/agents/:id/todos.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-025 — Send Message to Agent API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Sends a user message to an agent via POST /api/agents/:id/message. Supports text, content blocks, and image attachments.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-026 — Submit Tool Result API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Submits a user's answer to a pending AskUserQuestion prompt via POST /api/agents/:id/tool-result.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-027 — Agent SSE Stream API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Opens an SSE connection for real-time agent events via GET /api/agents/:id/stream, including thinking, text, tool_use, tool_result, question, and done events.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-028 — Abort Agent API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Aborts the current agent processing via POST /api/agents/:id/abort.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-029 — List Slash Commands API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Returns available slash commands via GET /api/slash-commands, including built-in, plugin, and project skills.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-030 — Execute Agent Command API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Executes a slash command on an agent session via POST /api/agents/:id/command. Supports /clear, /compact, /model, /help.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-031 — Destroy Agent API
- **Type:** operation
- **Module:** ai-agent
- **Summary:** Destroys an agent session via DELETE /api/agents/:id, cleaning up runtime state and marking as destroyed in DB.
- **References:** CONC-015
- **Source files:** apps/server/src/routes/agents.ts

## CONC-032 — Graph Specs System
- **Type:** domain
- **Module:** graph-specs
- **Summary:** Project specification visualization storage and synchronization system. Manages graph data (specs, architect), document storage, history archiving, and sync engine with external CLI process spawning and SSE streaming.
- **References:**
- **Source files:** apps/server/src/lib/graph-storage.ts, apps/server/src/lib/sync-engine.ts, apps/server/src/routes/graph.ts

## CONC-033 — Graph Status API
- **Type:** operation
- **Module:** graph-specs
- **Summary:** Checks if graph data exists and whether a re-sync is needed via GET /api/graph/status.
- **References:** CONC-032
- **Source files:** apps/server/src/routes/graph.ts

## CONC-034 — Graph Manifest API
- **Type:** operation
- **Module:** graph-specs
- **Summary:** Returns the graph manifest (project name, sync status, timestamps) via GET /api/graph/manifest.
- **References:** CONC-032
- **Source files:** apps/server/src/routes/graph.ts

## CONC-035 — Graph Data API
- **Type:** operation
- **Module:** graph-specs
- **Summary:** Returns all graph data (manifest, specs, architect) via GET /api/graph/data.
- **References:** CONC-032
- **Source files:** apps/server/src/routes/graph.ts

## CONC-036 — Graph History List API
- **Type:** operation
- **Module:** graph-specs
- **Summary:** Lists historical graph data entries via GET /api/graph/history.
- **References:** CONC-032
- **Source files:** apps/server/src/routes/graph.ts

## CONC-037 — Graph History Data API
- **Type:** operation
- **Module:** graph-specs
- **Summary:** Returns specific historical graph data by timestamp via GET /api/graph/history/:timestamp.
- **References:** CONC-032
- **Source files:** apps/server/src/routes/graph.ts

## CONC-038 — Graph Sync API
- **Type:** operation
- **Module:** graph-specs
- **Summary:** Starts a full or incremental sync with SSE progress streaming via POST /api/graph/sync. Archives current data before sync.
- **References:** CONC-032
- **Source files:** apps/server/src/routes/graph.ts

## CONC-039 — Cancel Graph Sync API
- **Type:** operation
- **Module:** graph-specs
- **Summary:** Cancels an active sync process via POST /api/graph/sync/cancel.
- **References:** CONC-032
- **Source files:** apps/server/src/routes/graph.ts

## CONC-040 — Slash Commands
- **Type:** domain
- **Module:** slash-commands
- **Summary:** Slash command system providing built-in commands (/clear, /compact, /model, /help) plus auto-discovery of plugin and project skills.
- **References:**
- **Source files:** apps/server/src/lib/slash-commands.ts, apps/web/src/lib/slashCommandUtils.ts, apps/web/src/stores/slashCommandStore.ts

## CONC-041 — Slash Command Scanning
- **Type:** operation
- **Module:** slash-commands
- **Summary:** Scans plugin cache directories and project .claude/skills directories to discover available slash commands with descriptions.
- **References:** CONC-040
- **Source files:** apps/server/src/lib/slash-commands.ts

## CONC-042 — Slash Command Autocomplete
- **Type:** component
- **Module:** slash-commands
- **Summary:** Frontend autocomplete for slash commands with keyboard navigation, filtering, and selection in the chat input.
- **References:** CONC-040
- **Source files:** apps/web/src/hooks/useSlashCompletion.ts, apps/web/src/components/chat/SlashCommandPopup.tsx

## CONC-043 — Database Layer
- **Type:** domain
- **Module:** database
- **Summary:** Prisma ORM with Better-SQLite3 adapter providing data persistence for projects, agent sessions, messages, and todo items.
- **References:**
- **Source files:** apps/server/src/lib/prisma.ts, apps/server/prisma.config.ts

## CONC-044 — Project Entity
- **Type:** entity
- **Module:** database
- **Summary:** Database model for projects with id, name, path, description, source, and timestamps.
- **References:** CONC-043
- **Source files:** apps/server/src/generated/models/Project.ts

## CONC-045 — Agent Session Entity
- **Type:** entity
- **Module:** database
- **Summary:** Database model for agent sessions with id, name, type, status, cwd, branch, model, permission mode, config, session data, and error tracking.
- **References:** CONC-043
- **Source files:** apps/server/src/generated/models/AgentSession.ts

## CONC-046 — Message Entity
- **Type:** entity
- **Module:** database
- **Summary:** Database model for chat messages with id, agentId, role, content, images, content blocks, events, and timestamps.
- **References:** CONC-043
- **Source files:** apps/server/src/generated/models/Message.ts

## CONC-047 — Todo Item Entity
- **Type:** entity
- **Module:** database
- **Summary:** Database model for todo items with id, agentId, subject, status, activeForm, and timestamps.
- **References:** CONC-043
- **Source files:** apps/server/src/generated/models/TodoItem.ts

## CONC-048 — Shared Types
- **Type:** domain
- **Module:** shared-types
- **Summary:** TypeScript type definitions shared across server and web packages, defining data contracts for agents, projects, tasks, specs, and graphs.
- **References:**
- **Source files:** packages/shared/src/index.ts, packages/shared/src/types/agent.ts, packages/shared/src/types/project.ts, packages/shared/src/types/task.ts, packages/shared/src/types/spec-node.ts, packages/shared/src/types/graph.ts

## CONC-049 — Application Shell
- **Type:** domain
- **Module:** app-shell
- **Summary:** Main application framework providing layout, routing, navigation sidebar, topbar, and resizable agent panel integration.
- **References:**
- **Source files:** apps/web/src/App.tsx, apps/web/src/components/layout/MainLayout.tsx

## CONC-050 — Navigation Sidebar
- **Type:** component
- **Module:** app-shell
- **Summary:** Left sidebar with navigation links (New Session, Projects, Graph, Tasks, Files, Git) and agent session list grouped by project with expand/collapse.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/Sidebar.tsx

## CONC-051 — Topbar
- **Type:** component
- **Module:** app-shell
- **Summary:** Top navigation bar with project dropdown, branch dropdown, running agent count badge, and settings button.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/Topbar.tsx

## CONC-052 — Agent Status Dot
- **Type:** component
- **Module:** app-shell
- **Summary:** Visual indicator showing agent status with color coding: pulsing for running, green for completed, amber for waiting, gray for idle, red icon for error.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/AgentStatusDot.tsx

## CONC-053 — Resizable Divider
- **Type:** component
- **Module:** app-shell
- **Summary:** Draggable divider for resizing the agent panel width with collapse/expand support.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/ResizableDivider.tsx

## CONC-054 — Agent Chat Panel
- **Type:** domain
- **Module:** agent-ui
- **Summary:** Agent chat interface providing message display, streaming indicators, todo tracking, question handling, and rich text input for sending messages.
- **References:**
- **Source files:** apps/web/src/components/layout/AgentPanel.tsx, apps/web/src/stores/agentStore.ts

## CONC-055 — Agent State Management
- **Type:** component
- **Module:** agent-ui
- **Summary:** Zustand store managing all agent state: CRUD operations, SSE connections, message streaming, todo tracking, question handling, and panel sizing persistence.
- **References:** CONC-054
- **Source files:** apps/web/src/stores/agentStore.ts

## CONC-056 — Agent Context Header
- **Type:** component
- **Module:** agent-ui
- **Summary:** Header bar for the agent panel showing agent name, status, model, and providing maximize/close controls.
- **References:** CONC-054
- **Source files:** apps/web/src/components/layout/AgentContextHeader.tsx

## CONC-057 — Agent Context Menu
- **Type:** component
- **Module:** agent-ui
- **Summary:** Right-click context menu for agent sessions in the sidebar, providing quick actions.
- **References:** CONC-054
- **Source files:** apps/web/src/components/layout/AgentContextMenu.tsx

## CONC-058 — Chat UI Components
- **Type:** domain
- **Module:** chat-ui
- **Summary:** Chat interface components including rich text input with Emacs keybindings and image support, message rendering with markdown, and specialized tool cards for visualizing agent tool outputs.
- **References:**
- **Source files:** apps/web/src/components/chat/RichTextInput.tsx, apps/web/src/components/chat/MessageRenderer.tsx

## CONC-059 — Rich Text Input
- **Type:** component
- **Module:** chat-ui
- **Summary:** ContentEditable rich text input with inline image support, slash command autocomplete, Emacs keybindings, model selector, drag-and-drop images, and IME composition handling.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/RichTextInput.tsx

## CONC-060 — Message Renderer
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders chat messages with event tree building, markdown support, user messages with images, and agent messages with tool cards.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/MessageRenderer.tsx

## CONC-061 — Bash Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders bash command execution output with collapsible sections for command and output.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/BashCard.tsx

## CONC-062 — Read Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders file content display with syntax highlighting and line numbers for the Read tool output.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/ReadCard.tsx

## CONC-063 — Write Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders file write operation feedback for the Write tool output.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/WriteCard.tsx

## CONC-064 — Edit Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders file edit operations with visual diff display showing old and new content for the Edit tool output.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/EditCard.tsx

## CONC-065 — Glob Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders file search results from the Glob tool with file path listing.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/GlobCard.tsx

## CONC-066 — Grep Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders content search results from the Grep tool with matched lines and context.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/GrepCard.tsx

## CONC-067 — LSP Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders LSP diagnostics results including errors, warnings, and code intelligence information.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/LSPCard.tsx

## CONC-068 — Generic Tool Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Fallback tool card for rendering any unrecognized tool output in a generic format.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/GenericCard.tsx

## CONC-069 — Ask User Question Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders the question display within chat message history after a user has answered an interactive question.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/AskUserQuestionCard.tsx

## CONC-070 — Streaming Agent Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders nested Agent tool calls in the message stream, showing sub-agent activity with depth tracking.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/StreamingAgentCard.tsx

## CONC-071 — Todo Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders a snapshot of todo items in the chat message flow, showing task progress.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/TodoCard.tsx

## CONC-072 — QA Result Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Renders the question and answer result pair in the message flow after an interactive question is resolved.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/QAResultCard.tsx

## CONC-073 — Collapsible Card
- **Type:** component
- **Module:** chat-ui
- **Summary:** Reusable collapsible wrapper component for tool cards with expand/collapse toggle.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/tool-cards/CollapsibleCard.tsx

## CONC-074 — Thinking Indicator
- **Type:** component
- **Module:** chat-ui
- **Summary:** Animated thinking indicator shown while the AI agent is processing a request.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/ThinkingBar.tsx, apps/web/src/components/chat/ThinkingIndicator.tsx

## CONC-075 — Todo Bar
- **Type:** component
- **Module:** chat-ui
- **Summary:** Sticky progress bar at the bottom of the chat showing active todo items during agent processing.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/TodoBar.tsx

## CONC-076 — Ask User Question Panel
- **Type:** component
- **Module:** chat-ui
- **Summary:** Interactive question panel displayed when the agent asks a question, supporting single/multi-select options and free text input.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/AskUserQuestionPanel.tsx

## CONC-077 — Image Preview
- **Type:** component
- **Module:** chat-ui
- **Summary:** Full-screen image preview overlay for viewing inline images and pasted screenshots.
- **References:** CONC-058
- **Source files:** apps/web/src/components/chat/ImagePreview.tsx

## CONC-078 — Graph Visualization
- **Type:** domain
- **Module:** graph-ui
- **Summary:** Project specification graph visualization with multiple views (graph, list, document, architect, technical document), sync progress display, and detail panel for node inspection.
- **References:**
- **Source files:** apps/web/src/pages/GraphPage.tsx, apps/web/src/stores/graphStore.ts

## CONC-079 — Graph Page
- **Type:** component
- **Module:** graph-ui
- **Summary:** Main graph page with tab bar for switching views, auto-loading graph data, and auto-sync check.
- **References:** CONC-078
- **Source files:** apps/web/src/pages/GraphPage.tsx

## CONC-080 — Specs Graph View
- **Type:** component
- **Module:** graph-ui
- **Summary:** Interactive graph visualization of project specifications using React Flow with custom nodes.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/SpecsGraph.tsx, apps/web/src/components/graph/FlowGraph.tsx, apps/web/src/components/graph/GraphNodes.tsx

## CONC-081 — Specs List View
- **Type:** component
- **Module:** graph-ui
- **Summary:** List view of project specifications showing specs in a flat, browsable format.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/SpecsList.tsx

## CONC-082 — Specs Document View
- **Type:** component
- **Module:** graph-ui
- **Summary:** Document view of project specifications showing specs as rendered markdown documents.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/SpecsDocument.tsx

## CONC-083 — Architect Graph View
- **Type:** component
- **Module:** graph-ui
- **Summary:** Architecture graph visualization showing project structure and dependencies.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/ArchitectGraph.tsx

## CONC-084 — Technical Document View
- **Type:** component
- **Module:** graph-ui
- **Summary:** Technical documentation view showing detailed technical specifications.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/TechnicalDocument.tsx

## CONC-085 — Graph Sync View
- **Type:** component
- **Module:** graph-ui
- **Summary:** Sync trigger view shown when no graph data exists, allowing users to start a full sync.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/SyncView.tsx

## CONC-086 — Graph Sync Progress
- **Type:** component
- **Module:** graph-ui
- **Summary:** Progress indicator overlay shown during active sync with phase and progress percentage.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/SyncProgress.tsx

## CONC-087 — Graph Detail Panel
- **Type:** component
- **Module:** graph-ui
- **Summary:** Side panel showing detailed information about a selected graph node.
- **References:** CONC-078
- **Source files:** apps/web/src/components/graph/DetailPanel.tsx

## CONC-088 — Graph State Management
- **Type:** component
- **Module:** graph-ui
- **Summary:** Zustand store managing graph data loading, sync state, SSE progress parsing, node selection, and auto-sync checking.
- **References:** CONC-078
- **Source files:** apps/web/src/stores/graphStore.ts

## CONC-089 — New Session Page
- **Type:** domain
- **Module:** new-session
- **Summary:** Landing page for creating new AI agent sessions with rich text input, model selection, branch display, and quick action buttons.
- **References:**
- **Source files:** apps/web/src/pages/NewSessionPage.tsx

## CONC-090 — Quick Actions
- **Type:** component
- **Module:** new-session
- **Summary:** Pre-defined quick action buttons (Create Feature, Fix Bug, Code Review, Write Tests) that pre-fill the chat input with common prompts.
- **References:** CONC-089
- **Source files:** apps/web/src/pages/NewSessionPage.tsx

## CONC-091 — Emacs Keybindings Hook
- **Type:** component
- **Module:** app-hooks
- **Summary:** Readline-compatible Emacs-style inline editing shortcuts (Ctrl+A/E/B/F/P/N/D/H/W/K/U/Y) with a shared kill ring across all instances.
- **References:**
- **Source files:** apps/web/src/hooks/useEmacsKeybindings.ts

## CONC-092 — Image Input Hook
- **Type:** component
- **Module:** app-hooks
- **Summary:** Hook for image upload via file picker or clipboard paste, handling base64 conversion, preview URLs, and image management.
- **References:**
- **Source files:** apps/web/src/hooks/useImageInput.ts

## CONC-093 — Keyboard Navigation Hook
- **Type:** component
- **Module:** app-hooks
- **Summary:** Generic keyboard navigation hook for lists with arrow key navigation, enter/space selection, escape to clear, and optional wrapping.
- **References:**
- **Source files:** apps/web/src/hooks/useKeyboardNavigation.ts

## CONC-094 — Auto Scroll Hook
- **Type:** component
- **Module:** app-hooks
- **Summary:** Hook that tracks scroll position and provides scroll-to-bottom functionality for chat message lists.
- **References:**
- **Source files:** apps/web/src/hooks/useAutoScroll.ts

## CONC-095 — Elapsed Time Hook
- **Type:** component
- **Module:** app-hooks
- **Summary:** Hook for displaying elapsed time since a given timestamp, used for agent session timing.
- **References:**
- **Source files:** apps/web/src/hooks/useElapsedTime.ts

## CONC-096 — Project Dropdown
- **Type:** component
- **Module:** app-shell
- **Summary:** Dropdown component in the topbar for selecting the active project.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/ProjectDropdown.tsx

## CONC-097 — Branch Dropdown
- **Type:** component
- **Module:** app-shell
- **Summary:** Dropdown component in the topbar for selecting and switching Git branches.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/BranchDropdown.tsx

## CONC-098 — Model Dropdown
- **Type:** component
- **Module:** app-shell
- **Summary:** Dropdown component for selecting the AI model to use in agent sessions.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/ModelDropdown.tsx

## CONC-099 — Confirm Dialog
- **Type:** component
- **Module:** app-shell
- **Summary:** Reusable confirmation dialog component for user action confirmations.
- **References:** CONC-049
- **Source files:** apps/web/src/components/layout/ConfirmDialog.tsx

## CONC-100 — Project State Management
- **Type:** component
- **Module:** project-management
- **Summary:** Zustand store managing project list, active project, branch state, view mode, and search query with localStorage persistence.
- **References:** CONC-005
- **Source files:** apps/web/src/stores/projectStore.ts
