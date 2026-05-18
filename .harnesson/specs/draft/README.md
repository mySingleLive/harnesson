# Sync Specs - Full Mode Draft

## Mode
Full (no existing specs tree)

## Base Commit
c680f1de59bf78745e1dadfe06ac6ed6c617fdcb

## Branch
feature/specs-page

## Node Tree

```
harnesson (level 1) — Root
├── ai-agent (level 2) — AI Agent
│   ├── agent-session (level 3) — Agent Session Management
│   │   ├── session-creation (level 4, non-leaf)
│   │   │   ├── session-creation-ui (level 5, frontend leaf)
│   │   │   └── session-creation-api (level 5, backend leaf)
│   │   ├── session-switching (level 4, frontend leaf)
│   │   └── session-deletion (level 4, non-leaf)
│   │       ├── session-deletion-ui (level 5, frontend leaf)
│   │       └── session-deletion-api (level 5, backend leaf)
│   ├── agent-control (level 3) — Agent Control
│   │   ├── abort-execution (level 4, non-leaf)
│   │   │   ├── abort-button-ui (level 5, frontend leaf)
│   │   │   └── abort-api (level 5, backend leaf)
│   │   └── model-switch (level 4, non-leaf)
│   │       ├── model-selection-ui (level 5, frontend leaf)
│   │       └── model-list-api (level 5, backend leaf)
│   ├── message-display (level 3) — Message Display
│   │   ├── text-message-rendering (level 4, frontend leaf)
│   │   ├── streaming-display (level 4, non-leaf)
│   │   │   ├── streaming-agent-card (level 5, frontend leaf)
│   │   │   └── stream-endpoint (level 5, backend leaf)
│   │   └── generic-tool-card (level 4, frontend leaf)
│   └── message-input (level 3) — Message Input
│       ├── rich-text-input (level 4, frontend leaf)
│       ├── slash-commands (level 4, non-leaf)
│       │   ├── slash-completion-ui (level 5, frontend leaf)
│       │   └── slash-commands-api (level 5, backend leaf)
│       └── image-upload (level 4, frontend leaf)
├── project-management (level 2) — Project Management
│   ├── project-list (level 3, non-leaf)
│   │   ├── project-list-ui (level 4, frontend leaf)
│   │   └── projects-api (level 4, backend leaf)
│   ├── project-creation (level 3, non-leaf)
│   │   ├── create-project-ui (level 4, frontend leaf)
│   │   └── create-project-api (level 4, backend leaf)
│   ├── project-deletion (level 3, non-leaf)
│   │   ├── delete-project-ui (level 4, frontend leaf)
│   │   └── delete-project-api (level 4, backend leaf)
│   ├── folder-opening (level 3, non-leaf)
│   │   ├── open-folder-ui (level 4, frontend leaf)
│   │   └── open-folder-api (level 4, backend leaf)
│   ├── branch-management (level 3, non-leaf)
│   │   ├── branch-selector-ui (level 4, frontend leaf)
│   │   └── branches-api (level 4, backend leaf)
│   └── repository-cloning (level 3, non-leaf)
│       ├── clone-repo-ui (level 4, frontend leaf)
│       └── clone-repo-api (level 4, backend leaf)
├── graph-visualization (level 2) — Graph Visualization
│   ├── graph-sync (level 3, non-leaf)
│   │   ├── sync-progress-ui (level 4, frontend leaf)
│   │   └── sync-api (level 4, backend leaf)
│   ├── specs-visualization (level 3, frontend leaf)
│   ├── architecture-visualization (level 3, frontend leaf)
│   └── technical-documentation (level 3, frontend leaf)
├── task-management (level 2, draft, leaf)
├── file-explorer (level 2, draft, leaf)
└── git-operations (level 2, draft, leaf)
```

## Tree Stats
- treeDepth: 5
- treeScenario: multi-domain
- Total nodes: 59
- Leaf nodes: 38
- Non-leaf nodes: 21
- Draft nodes: 3

## Change Summary
All 59 nodes are NEW (full sync).
