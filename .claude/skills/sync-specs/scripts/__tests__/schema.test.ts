import { describe, it, expect } from 'vitest';
import {
  isKebabCase,
  isStatus,
  isTreeScenario,
  defaultSyncMeta,
  defaultTestCases,
  fillDefaults,
  STATUS_VALUES,
  TREE_SCENARIO_VALUES,
  TEST_CASE_LEVEL_VALUES,
} from '../core/schema.ts';
import type { SpecNode, RootSpecNode, Status, TreeScenario, TestCaseLevel, SyncMeta, TestCases } from '../core/schema.ts';

// ---- isKebabCase ----

describe('isKebabCase', () => {
  it('accepts valid kebab-case strings', () => {
    expect(isKebabCase('foo')).toBe(true);
    expect(isKebabCase('foo-bar')).toBe(true);
    expect(isKebabCase('a1-b2')).toBe(true);
    expect(isKebabCase('my-component')).toBe(true);
    expect(isKebabCase('abc123')).toBe(true);
  });

  it('rejects strings starting with a digit', () => {
    expect(isKebabCase('1foo')).toBe(false);
  });

  it('rejects strings with uppercase letters', () => {
    expect(isKebabCase('Foo')).toBe(false);
    expect(isKebabCase('fooBar')).toBe(false);
    expect(isKebabCase('FOO')).toBe(false);
  });

  it('rejects strings with consecutive hyphens', () => {
    expect(isKebabCase('foo--bar')).toBe(false);
  });

  it('rejects strings starting or ending with hyphens', () => {
    expect(isKebabCase('-foo')).toBe(false);
    expect(isKebabCase('foo-')).toBe(false);
    expect(isKebabCase('-foo-bar-')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isKebabCase('')).toBe(false);
  });

  it('rejects strings with underscores', () => {
    expect(isKebabCase('foo_bar')).toBe(false);
  });

  it('rejects strings with spaces', () => {
    expect(isKebabCase('foo bar')).toBe(false);
  });
});

// ---- isStatus ----

describe('isStatus', () => {
  it.each(STATUS_VALUES)('accepts valid status "%s"', (status) => {
    expect(isStatus(status)).toBe(true);
  });

  it('rejects invalid status strings', () => {
    expect(isStatus('unknown')).toBe(false);
    expect(isStatus('')).toBe(false);
    expect(isStatus('Draft')).toBe(false);
    expect(isStatus('IN-PROGRESS')).toBe(false);
  });
});

// ---- isTreeScenario ----

describe('isTreeScenario', () => {
  it.each(TREE_SCENARIO_VALUES)('accepts valid scenario "%s"', (scenario) => {
    expect(isTreeScenario(scenario)).toBe(true);
  });

  it('rejects invalid scenario strings', () => {
    expect(isTreeScenario('unknown')).toBe(false);
    expect(isTreeScenario('')).toBe(false);
    expect(isTreeScenario('Single')).toBe(false);
  });
});

// ---- defaultSyncMeta ----

describe('defaultSyncMeta', () => {
  it('returns an object with correct shape', () => {
    const meta = defaultSyncMeta();
    expect(meta).toMatchObject({
      baseCommit: '',
      baseCommitMessage: '',
      branch: '',
      sourceFiles: [],
    });
    expect(meta.lastSyncAt).toBeTruthy();
    expect(typeof meta.lastSyncAt).toBe('string');
  });

  it('returns a new object each call', () => {
    const a = defaultSyncMeta();
    const b = defaultSyncMeta();
    expect(a).not.toBe(b);
    expect(a.sourceFiles).not.toBe(b.sourceFiles);
  });
});

// ---- defaultTestCases ----

describe('defaultTestCases', () => {
  it('returns correct structure', () => {
    const tc = defaultTestCases();
    expect(tc).toEqual({
      'unit-test': [],
      'end-to-end': [],
      'script-test': [],
    });
  });
});

// ---- fillDefaults ----

describe('fillDefaults', () => {
  it('fills missing children with empty array', () => {
    const node = fillDefaults({ id: 'test', name: 'Test', level: 2, parent: 'project', summary: 'A test', status: 'draft' });
    expect(node.children).toEqual([]);
  });

  it('infers isLeaf when children is empty', () => {
    const node = fillDefaults({ id: 'test', name: 'Test', level: 2, parent: 'project', summary: 'A test', status: 'draft' });
    expect(node.isLeaf).toBe(true);
  });

  it('infers isLeaf=false when children are present', () => {
    const node = fillDefaults({ id: 'test', name: 'Test', level: 2, parent: 'project', children: ['child1'], summary: 'A test', status: 'draft' } as any);
    expect(node.isLeaf).toBe(false);
  });

  it('fills missing syncMeta with defaults', () => {
    const node = fillDefaults({ id: 'test', name: 'Test', level: 2, parent: 'project', summary: 'A test', status: 'draft' });
    expect(node.syncMeta).toBeDefined();
    expect(node.syncMeta.sourceFiles).toEqual([]);
  });

  it('fills missing status with draft', () => {
    const node = fillDefaults({ id: 'test', name: 'Test', level: 2, parent: 'project', summary: 'A test' } as any);
    expect(node.status).toBe('draft');
  });

  it('preserves existing values', () => {
    const existing = {
      id: 'test',
      name: 'Test',
      level: 2,
      parent: 'project',
      children: ['a'],
      isLeaf: false,
      summary: 'A test node',
      status: 'released' as Status,
      syncMeta: defaultSyncMeta(),
    };
    const node = fillDefaults(existing);
    expect(node.status).toBe('released');
    expect(node.children).toEqual(['a']);
    expect(node.isLeaf).toBe(false);
  });

  it('mutates and returns the input object', () => {
    const input: Partial<SpecNode> = { id: 'test', name: 'Test', level: 2, parent: 'project', summary: 'A test' };
    const result = fillDefaults(input);
    expect(result).toBe(input as any); // same reference
  });
});

// ---- Type exports (compile-time check via values) ----

describe('enum values', () => {
  it('STATUS_VALUES has all 8 statuses', () => {
    expect(STATUS_VALUES).toHaveLength(8);
    expect(STATUS_VALUES).toContain('draft');
    expect(STATUS_VALUES).toContain('released');
  });

  it('TREE_SCENARIO_VALUES has all 4 scenarios', () => {
    expect(TREE_SCENARIO_VALUES).toHaveLength(4);
  });

  it('TEST_CASE_LEVEL_VALUES has all 4 levels', () => {
    expect(TEST_CASE_LEVEL_VALUES).toHaveLength(4);
    expect(TEST_CASE_LEVEL_VALUES).toEqual(['p0', 'p1', 'p2', 'p3']);
  });
});
