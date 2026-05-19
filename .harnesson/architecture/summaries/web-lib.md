# Module: web-lib

> Source files: apps/web/src/lib/*.ts
> Last synced: 2026-05-19T00:00:00Z | Commit: 1d90ec4

## Summary

Client-side utility library providing the centralized API client for all backend communication, slash command parsing utilities, time formatting, and Tailwind CSS class utilities.

## Key Files

### serverApi.ts
Centralized fetch-based API client with all server communication functions: health check, folder dialog, project CRUD, branch operations, graph data/status/manifest/history, agent CRUD/messaging/abort/SSE, model listing, slash commands, and command execution.

### slashCommandUtils.ts
Slash command parsing utilities: detecting registered commands in input, finding `/` fragments under cursor, and filtering commands by prefix/description.

### time.ts
Relative time formatting in Chinese locale (e.g., "5 分钟前", "2 小时前").

### utils.ts
Tailwind CSS class merge utility combining clsx and tailwind-merge.

## Exports

- isServerRunning, openFolderDialog, getProjects, getProject, createProject, removeProject (functions)
- getGraphStatus, getGraphData, getGraphManifest, getGraphHistory (functions)
- getProjectBranches, checkoutBranch (functions)
- getSupportedModels, createAgent, listAgents, sendAgentMessage, abortAgent, destroyAgent, getAgentMessages, getAgentTodos (functions)
- getSlashCommands, executeCommand (functions)
- parseSlashCommand, getCurrentSlashFragment, filterCommands (functions)
- formatTimeAgo (function)
- cn (function)
- OpenFolderResponse, CreateProjectOptions, GraphStatusResponse, BranchInfo, CheckoutResponse, ModelInfo, CreateAgentResponse, AgentInfoResponse, MessageResponse (interfaces)

## Dependencies

- → @harnesson/shared (all domain types for API communication)
