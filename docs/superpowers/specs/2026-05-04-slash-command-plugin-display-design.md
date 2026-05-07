# Slash Command Plugin Display

## Problem

When a user types `/` in the Agent chat input, the slash command popup shows plugin skills with generic descriptions like `Skill: brainstorming`. This provides no information about which plugin the skill belongs to, and the description is useless. Claude Code CLI displays skills as `(plugin-name) real description`, which is much more informative.

## Solution

Display plugin names alongside skill descriptions in the slash command popup, and replace the fake `Skill: xxx` description with the real description read from each skill's `SKILL.md` frontmatter.

## Design

### Type Change (`packages/shared/src/types/agent.ts`)

Add optional `plugin` field to `SlashCommand`:

```typescript
export interface SlashCommand {
  name: string;
  type: SlashCommandType;
  description: string;
  plugin?: string; // plugin directory name, e.g. "superpowers"
}
```

### Server Change (`apps/server/src/lib/slash-commands.ts`)

- Pass `pluginName` through the scan functions
- Read `SKILL.md` from each skill directory, parse YAML frontmatter to extract `description`
- Fall back to `Skill: {name}` if frontmatter is unreadable
- Set `plugin` field on each skill command

### UI Change (`apps/web/src/components/chat/SlashCommandPopup.tsx`)

- For skills with a `plugin` field, render description as:
  - `<span className="slash-popup-plugin">({plugin})</span> {description}`
- Style the plugin badge with muted color to differentiate from description text

### Display Example

```
内置命令
/clear    清空对话历史
/model    切换 AI 模型

Skills
/brainstorming  (superpowers) You MUST use this before any creative work...
/writing-plans  (superpowers) Use when you have a spec or requirements...
```

## Scope

- 3 files modified: type definition, server skill scanner, UI popup component
- No new dependencies
- No database or API changes
