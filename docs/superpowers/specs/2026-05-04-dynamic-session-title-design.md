# Dynamic Session Title

## Problem

Agent chat sessions currently use generic names like "Agent A", "Agent B", etc. in the sidebar. These names provide no information about the session's content, making it hard to distinguish between sessions.

## Solution

Generate meaningful session titles based on the user's first prompt message. Short prompts are used directly; longer prompts are summarized by a lightweight LLM call into a concise Chinese title (≤ 10 characters).

## Behavior

- **Prompt ≤ 10 characters**: Use the prompt text directly as the session title
- **Prompt > 10 characters**: Call a lightweight LLM to generate a summary title of no more than 10 Chinese characters

The title is generated synchronously during session creation, before the CreateAgentResponse is returned to the client.

## Implementation

### Core Change: `apps/server/src/lib/agent-service.ts`

1. **Add `generateTitle(prompt: string): Promise<string>`**

   - If `prompt.length <= 10`, return `prompt` directly
   - Otherwise, call the LLM with a system prompt instructing it to summarize the task in ≤ 10 Chinese characters
   - Return the generated title

2. **Replace `nextAgentName()` with `generateTitle()`**

   - Remove `agentCounter` variable and `nextAgentName()` function
   - In `createAgent()`, change `const name = nextAgentName()` to `const name = await generateTitle(opts.prompt)`

### LLM Call

Use the existing `@anthropic-ai/claude-agent-sdk` `query()` function with minimal configuration:

- `maxTurns: 1` — single turn, no tool use
- No `allowedTools` — prevents tool invocation overhead
- Lightweight model preference (Haiku if available) for speed and cost

The system prompt for title generation:

```
请用不超过10个中文字符总结以下任务的标题。只返回标题文字本身，不要加引号、编号或其他格式。
```

### Data Flow

```
User sends message → NewSessionPage → createAgent(opts)
  → generateTitle(opts.prompt)
    → short? return prompt directly
    → long? LLM summary → return title
  → create Agent with generated name
  → return CreateAgentResponse { name: "generated title", ... }
  → Sidebar displays title via agent.name
```

### Files Changed

| File | Change |
|------|--------|
| `apps/server/src/lib/agent-service.ts` | Replace `nextAgentName()` with `generateTitle()`, remove counter |

### No UI Changes Needed

The sidebar (`Sidebar.tsx`) and header (`AgentContextHeader.tsx`) already display `agent.name`. The only change is the source of the name value.

## Edge Cases

- **Empty prompt**: Should not happen (UI validates input), but fallback to "新会话"
- **LLM call failure**: Fallback to truncated prompt (first 10 chars)
- **Multilingual prompts**: The LLM should handle any language; titles default to Chinese
- **Special characters**: The LLM returns plain text; no special handling needed
