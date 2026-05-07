# Slash Command Plugin Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show plugin names and real skill descriptions in the slash command autocomplete popup.

**Architecture:** Extend the shared `SlashCommand` type with an optional `plugin` field, parse `SKILL.md` frontmatter on the server to extract real descriptions and plugin names, and update the UI popup to render `(plugin-name)` before each description.

**Tech Stack:** TypeScript, React, Node.js fs, vitest

---

### Task 1: Extend the SlashCommand type

**Files:**
- Modify: `packages/shared/src/types/agent.ts:97-103`

- [ ] **Step 1: Add `plugin` field to SlashCommand interface**

In `packages/shared/src/types/agent.ts`, change the `SlashCommand` interface:

```typescript
export interface SlashCommand {
  name: string;
  type: SlashCommandType;
  description: string;
  plugin?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/types/agent.ts
git commit -m "feat: add optional plugin field to SlashCommand type"
```

---

### Task 2: Server — read SKILL.md frontmatter and capture plugin name

**Files:**
- Modify: `apps/server/src/lib/slash-commands.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/server/src/lib/__tests__/slash-commands.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailableCommands } from '../slash-commands';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Override homedir so scans use our temp dir
vi.mock('node:os', () => ({
  homedir: () => testDir,
}));

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `slash-test-${Date.now()}`);
  const cacheDir = join(testDir, '.claude', 'plugins', 'cache');
  const pluginDir = join(cacheDir, 'test-plugin', 'skills');
  await mkdir(pluginDir, { recursive: true });
  await writeFile(
    join(pluginDir, 'my-skill', 'SKILL.md'),
    '---\nname: my-skill\ndescription: Does something useful\n---\nContent here',
  );
  // Also create a skill without SKILL.md (fallback case)
  await mkdir(join(pluginDir, 'no-meta-skill'), { recursive: true });
});

describe('getAvailableCommands', () => {
  it('includes builtin commands', async () => {
    const cmds = await getAvailableCommands();
    const names = cmds.map((c) => c.name);
    expect(names).toContain('clear');
    expect(names).toContain('model');
  });

  it('includes skills from plugins with plugin name', async () => {
    const cmds = await getAvailableCommands();
    const skill = cmds.find((c) => c.name === 'my-skill');
    expect(skill).toBeDefined();
    expect(skill!.type).toBe('skill');
    expect(skill!.plugin).toBe('test-plugin');
    expect(skill!.description).toBe('Does something useful');
  });

  it('falls back to Skill: name when SKILL.md is missing', async () => {
    const cmds = await getAvailableCommands();
    const skill = cmds.find((c) => c.name === 'no-meta-skill');
    expect(skill).toBeDefined();
    expect(skill!.description).toBe('Skill: no-meta-skill');
    expect(skill!.plugin).toBe('test-plugin');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/server && npx vitest run src/lib/__tests__/slash-commands.test.ts`
Expected: FAIL — skills don't have `plugin` field, descriptions are `Skill: xxx`

- [ ] **Step 3: Implement — rewrite `scanSkills` in `apps/server/src/lib/slash-commands.ts`**

Replace the entire file with:

```typescript
import { readdir, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SlashCommand } from '@harnesson/shared';

const BUILTIN_COMMANDS: SlashCommand[] = [
  { name: 'clear', type: 'builtin', description: '清空对话历史' },
  { name: 'compact', type: 'builtin', description: '压缩对话上下文' },
  { name: 'model', type: 'builtin', description: '切换 AI 模型' },
  { name: 'help', type: 'builtin', description: '显示帮助信息' },
];

export async function getAvailableCommands(): Promise<SlashCommand[]> {
  const skills = await scanSkills();
  return [...BUILTIN_COMMANDS, ...skills];
}

function parseDescription(frontmatter: string): string | null {
  const match = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m);
  return match ? match[1] : null;
}

async function readSkillDescription(skillDir: string): Promise<string | null> {
  try {
    const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      return parseDescription(fmMatch[1]);
    }
  } catch {}
  return null;
}

async function scanSkills(): Promise<SlashCommand[]> {
  const skillsDir = join(homedir(), '.claude', 'plugins', 'cache');
  const commands: SlashCommand[] = [];

  async function scanDirectoryForSkills(
    dir: string,
    pluginName: string,
  ): Promise<SlashCommand[]> {
    const results: SlashCommand[] = [];
    try {
      const entries = await readdir(dir);
      for (const entry of entries) {
        const entryPath = join(dir, entry);
        try {
          const s = await stat(entryPath);
          if (s.isDirectory()) {
            const description =
              (await readSkillDescription(entryPath)) ?? `Skill: ${entry}`;
            results.push({ name: entry, type: 'skill', description, plugin: pluginName });
          }
        } catch {}
      }
    } catch {}
    return results;
  }

  try {
    const pluginDirs = await readdir(skillsDir);
    for (const pluginDir of pluginDirs) {
      const pluginPath = join(skillsDir, pluginDir);
      try {
        const s = await stat(pluginPath);
        if (!s.isDirectory()) continue;

        // Look for superpowers skills pattern (superpowers/<version>/skills/)
        const superpowersPath = join(pluginPath, 'superpowers');
        try {
          const versionDirs = await readdir(superpowersPath);
          for (const versionDir of versionDirs) {
            const versionPath = join(superpowersPath, versionDir);
            try {
              const vs = await stat(versionPath);
              if (vs.isDirectory()) {
                const skills = await scanDirectoryForSkills(
                  join(versionPath, 'skills'),
                  pluginDir,
                );
                for (const skill of skills) {
                  if (!commands.some((c) => c.name === skill.name)) {
                    commands.push(skill);
                  }
                }
              }
            } catch {}
          }
        } catch {}

        // Also scan top-level skills in any plugin
        const topLevelSkills = await scanDirectoryForSkills(
          join(pluginPath, 'skills'),
          pluginDir,
        );
        for (const skill of topLevelSkills) {
          if (!commands.some((c) => c.name === skill.name)) {
            commands.push(skill);
          }
        }
      } catch {}
    }
  } catch {
    // Plugin cache directory doesn't exist — no skills available
  }

  return commands;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/server && npx vitest run src/lib/__tests__/slash-commands.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/lib/slash-commands.ts apps/server/src/lib/__tests__/slash-commands.test.ts
git commit -m "feat: read skill descriptions from SKILL.md and capture plugin names"
```

---

### Task 3: UI — display plugin name in the popup

**Files:**
- Modify: `apps/web/src/components/chat/SlashCommandPopup.tsx`
- Modify: `apps/web/src/globals.css:171-174` (add `.slash-popup-plugin` style)

- [ ] **Step 1: Update the popup component**

In `apps/web/src/components/chat/SlashCommandPopup.tsx`, update the item rendering inside the `renderGroup` function. Replace the single `<span className="slash-popup-desc">` line with plugin-aware rendering:

```tsx
<div
  key={cmd.name}
  className={`slash-popup-item ${isActive ? 'slash-popup-item-active' : ''}`}
  onClick={() => onSelect(cmd)}
  onMouseEnter={() => onHover(idx)}
  onMouseLeave={() => onHover(null)}
>
  <code className="slash-popup-cmd">/{cmd.name}</code>
  <span className="slash-popup-desc">
    {cmd.plugin && (
      <span className="slash-popup-plugin">({cmd.plugin})</span>
    )}
    {cmd.description}
  </span>
</div>
```

- [ ] **Step 2: Add the `.slash-popup-plugin` CSS class**

In `apps/web/src/globals.css`, add after the `.slash-popup-desc` block (after line 174):

```css
.slash-popup-plugin {
  color: #a78bfa;
  margin-right: 6px;
  font-weight: 500;
}
```

- [ ] **Step 3: Verify manually**

Run: `cd apps/web && npm run dev`
- Open the app in a browser
- Focus the chat input and type `/`
- Verify that plugin skills show `(superpowers)` before their real description
- Verify builtin commands display unchanged
- Verify keyboard navigation (↑↓, Enter, Esc) still works

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/chat/SlashCommandPopup.tsx apps/web/src/globals.css
git commit -m "feat: display plugin name in slash command popup suggestions"
```
