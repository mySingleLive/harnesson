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
    pluginName?: string,
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
            results.push({ name: entry, type: 'skill', description, ...(pluginName && { plugin: pluginName }) });
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

        // Scan all plugin subdirectories: <publisher>/<plugin>/<version>/skills/
        try {
          const subDirs = await readdir(pluginPath);
          for (const subDir of subDirs) {
            const subDirPath = join(pluginPath, subDir);
            try {
              const ss = await stat(subDirPath);
              if (!ss.isDirectory()) continue;
              const versionDirs = await readdir(subDirPath);
              for (const versionDir of versionDirs) {
                const versionPath = join(subDirPath, versionDir);
                try {
                  const vs = await stat(versionPath);
                  if (vs.isDirectory()) {
                    const skills = await scanDirectoryForSkills(
                      join(versionPath, 'skills'),
                      subDir, // Use actual plugin name (e.g. "superpowers")
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
          }
        } catch {}

        // Top-level skills (no specific plugin)
        const topLevelSkills = await scanDirectoryForSkills(
          join(pluginPath, 'skills'),
          undefined,
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
