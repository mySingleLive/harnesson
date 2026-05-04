import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAvailableCommands } from '../slash-commands';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let testDir: string;

// We'll mock homedir to point to our temp dir
vi.mock('node:os', async () => {
  const actual = await vi.importActual('node:os');
  return {
    ...actual,
    homedir: () => testDir,
  };
});

beforeEach(async () => {
  testDir = join(tmpdir(), `slash-test-${Date.now()}`);
  const cacheDir = join(testDir, '.claude', 'plugins', 'cache');
  const pluginDir = join(cacheDir, 'test-plugin', 'skills');
  await mkdir(pluginDir, { recursive: true });

  // Skill with SKILL.md
  const skillDir = join(pluginDir, 'my-skill');
  await mkdir(skillDir, { recursive: true });
  await writeFile(
    join(skillDir, 'SKILL.md'),
    '---\nname: my-skill\ndescription: Does something useful\n---\nContent here',
  );

  // Skill without SKILL.md (fallback case)
  await mkdir(join(pluginDir, 'no-meta-skill'), { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true }).catch(() => {});
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
