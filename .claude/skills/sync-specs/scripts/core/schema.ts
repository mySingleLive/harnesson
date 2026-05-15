// ---- Enums ----
export const STATUS_VALUES = [
  'draft', 'backlog', 'todo', 'in-progress',
  'review', 'testing', 'dev-done', 'released',
] as const;
export type Status = (typeof STATUS_VALUES)[number];

export const TREE_SCENARIO_VALUES = [
  'single', 'flat', 'multi-functional', 'multi-domain',
] as const;
export type TreeScenario = (typeof TREE_SCENARIO_VALUES)[number];

export const TEST_CASE_LEVEL_VALUES = ['p0', 'p1', 'p2', 'p3'] as const;
export type TestCaseLevel = (typeof TEST_CASE_LEVEL_VALUES)[number];

// ---- Interfaces ----
export interface SyncMeta {
  lastSyncAt: string;
  baseCommit: string;
  baseCommitMessage: string;
  branch: string;
  sourceFiles: string[];
}

export interface SpecDetail {
  description: string;
  parameters: string[];
}

export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

export interface TestCase {
  level: TestCaseLevel;
  given: string;
  when: string;
  then: string;
}

export interface TestCases {
  'unit-test': TestCase[];
  'end-to-end': TestCase[];
  'script-test': TestCase[];
}

export interface SpecNode {
  id: string;
  name: string;
  level: number;
  parent: string | null;
  children: string[];
  isLeaf: boolean;
  summary: string;
  goals?: string[];
  design?: string | null;
  acceptanceCriteria?: AcceptanceCriterion[];
  testCases?: TestCases;
  specDetail?: SpecDetail | null;
  constraints?: string[];
  status: Status;
  syncMeta: SyncMeta;
}

export interface RootSpecNode extends SpecNode {
  id: 'project';
  level: 1;
  parent: null;
  treeDepth: number;
  treeScenario: TreeScenario;
}

// ---- Validation helpers ----
const KEBAB_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isKebabCase(s: string): boolean {
  return KEBAB_RE.test(s);
}

export function isStatus(s: string): s is Status {
  return (STATUS_VALUES as readonly string[]).includes(s);
}

export function isTreeScenario(s: string): s is TreeScenario {
  return (TREE_SCENARIO_VALUES as readonly string[]).includes(s);
}

// ---- Defaults ----
export function defaultSyncMeta(): SyncMeta {
  return {
    lastSyncAt: new Date().toISOString(),
    baseCommit: '',
    baseCommitMessage: '',
    branch: '',
    sourceFiles: [],
  };
}

export function defaultTestCases(): TestCases {
  return { 'unit-test': [], 'end-to-end': [], 'script-test': [] };
}

/**
 * Fill missing optional fields with defaults.
 * Mutates and returns the input object.
 */
export function fillDefaults(node: Partial<SpecNode>): SpecNode {
  if (!node.children) node.children = [];
  if (node.isLeaf === undefined) node.isLeaf = (node.children?.length ?? 0) === 0;
  if (!node.syncMeta) node.syncMeta = defaultSyncMeta();
  if (!node.status) node.status = 'draft';
  return node as SpecNode;
}

