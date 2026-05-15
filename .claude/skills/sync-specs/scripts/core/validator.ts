import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SpecNode, RootSpecNode, Status } from './schema.ts';
import { isKebabCase, isStatus, isTreeScenario, fillDefaults, defaultTestCases } from './schema.ts';
import { getShortHash, getBranch } from '../utils/git.ts';
import {
  readRootNode,
  readTree,
  writeRootNode,
  writeNode,
} from './file-io.ts';
import { designDocPath, type PathResolverOptions } from './path-resolver.ts';

// ---- Validation types ----

export interface CheckResult {
  pass: boolean;
  errors: string[];
}

export interface NodeValidationResult {
  nodePath: string;
  nodeId: string;
  checks: {
    format: CheckResult;
    version: CheckResult;
    content: CheckResult;
    uniqueness: CheckResult;
    designDoc: CheckResult;
    coverage: CheckResult & { warnings: string[] };
  };
  needsReview: boolean; // true if leaf review requires LLM source analysis
}

export interface ValidateReport {
  totalNodes: number;
  passed: number;
  failed: number;
  results: NodeValidationResult[];
}

function pass(): CheckResult {
  return { pass: true, errors: [] };
}

function fail(...errors: string[]): CheckResult {
  return { pass: false, errors };
}

// ---- 6 Validation Checks ----

/** Check 1: Format validation */
function checkFormat(node: SpecNode | RootSpecNode): CheckResult {
  const errors: string[] = [];

  if (!node.id) errors.push('id is missing');
  else if (!isKebabCase(node.id) && node.id !== 'project') errors.push(`id "${node.id}" is not kebab-case`);

  if (!node.name) errors.push('name is missing');
  if (typeof node.level !== 'number' || node.level < 1) errors.push('level must be a positive integer');
  if (node.parent !== null && typeof node.parent !== 'string') errors.push('parent must be string or null');
  if (!Array.isArray(node.children)) errors.push('children must be an array');
  else if (node.isLeaf && node.children.length > 0) errors.push('leaf node must have empty children array');
  if (typeof node.isLeaf !== 'boolean') errors.push('isLeaf must be boolean');
  if (!node.summary) errors.push('summary is missing');
  if (!node.status) errors.push('status is missing');
  else if (!isStatus(node.status)) errors.push(`status "${node.status}" is not a valid enum value`);

  if (!node.syncMeta) errors.push('syncMeta is missing');
  else {
    if (!node.syncMeta.baseCommit) errors.push('syncMeta.baseCommit is missing');
    if (!node.syncMeta.branch) errors.push('syncMeta.branch is missing');
    if (!Array.isArray(node.syncMeta.sourceFiles)) errors.push('syncMeta.sourceFiles must be an array');
  }

  // Root node checks
  if ('treeDepth' in node) {
    const root = node as RootSpecNode;
    if (typeof root.treeDepth !== 'number') errors.push('root: treeDepth must be a number');
    if (!root.treeScenario || !isTreeScenario(root.treeScenario)) errors.push('root: treeScenario is invalid');
    if (root.id !== 'project') errors.push('root: id must be "project"');
    if (root.level !== 1) errors.push('root: level must be 1');
    if (root.parent !== null) errors.push('root: parent must be null');
  }

  // specDetail.parameters must be string[] not object[]
  if (node.specDetail) {
    if (Array.isArray(node.specDetail.parameters)) {
      for (let i = 0; i < node.specDetail.parameters.length; i++) {
        if (typeof node.specDetail.parameters[i] !== 'string') {
          errors.push(`specDetail.parameters[${i}] must be a string, got ${typeof node.specDetail.parameters[i]}`);
        }
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 2: Version validation */
function checkVersion(node: SpecNode | RootSpecNode, repoPath: string): CheckResult {
  const errors: string[] = [];
  try {
    const headHash = getShortHash(repoPath);
    if (node.syncMeta.baseCommit !== headHash) {
      errors.push(`baseCommit "${node.syncMeta.baseCommit}" !== HEAD "${headHash}"`);
    }
    const currentBranch = getBranch(repoPath);
    if ('treeScenario' in node) {
      // Root node: check branch
      if (node.syncMeta.branch !== currentBranch) {
        errors.push(`root branch "${node.syncMeta.branch}" !== current "${currentBranch}"`);
      }
    }
  } catch (e) {
    errors.push(`git check failed: ${(e as Error).message}`);
  }
  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 3: Content validation */
function checkContent(node: SpecNode | RootSpecNode): CheckResult {
  const errors: string[] = [];

  // Leaf nodes with sourceFiles must have specDetail and constraints
  if (node.isLeaf && node.syncMeta.sourceFiles && node.syncMeta.sourceFiles.length > 0) {
    if (!node.specDetail) {
      errors.push('leaf node with sourceFiles must have specDetail');
    } else {
      if (!node.specDetail.description) errors.push('specDetail.description is empty');
      if (!node.specDetail.parameters || node.specDetail.parameters.length === 0) {
        errors.push('specDetail.parameters must have at least 1 entry');
      }
    }
    if (!node.constraints || node.constraints.length === 0) {
      errors.push('leaf node with sourceFiles must have at least 1 constraint');
    } else {
      for (let i = 0; i < node.constraints.length; i++) {
        if (!node.constraints[i].trim()) errors.push(`constraints[${i}] is empty`);
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 4: Uniqueness validation */
function checkUniqueness(
  node: SpecNode | RootSpecNode,
  siblings: (SpecNode | RootSpecNode)[],
): CheckResult {
  const errors: string[] = [];

  for (const sibling of siblings) {
    if (sibling.id === node.id) continue;
    if (sibling.name === node.name) {
      errors.push(`duplicate name "${node.name}" with sibling ${sibling.id}`);
    }
    // Exact summary match is a strong signal of duplication
    if (sibling.summary === node.summary && node.summary.length > 0) {
      errors.push(`duplicate summary with sibling ${sibling.id}`);
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 5: Design document validation */
function checkDesignDoc(node: SpecNode | RootSpecNode, opts: PathResolverOptions): CheckResult {
  const errors: string[] = [];

  if (node.design) {
    const docPath = designDocPath(node.design, opts);
    if (!fs.existsSync(docPath)) {
      errors.push(`design file not found: ${docPath}`);
    } else {
      const content = fs.readFileSync(docPath, 'utf-8');
      if (content.trim().length === 0) {
        errors.push(`design file is empty: ${docPath}`);
      }
    }
  }

  return errors.length > 0 ? fail(...errors) : pass();
}

/** Check 6: Coverage validation */
function checkCoverage(node: SpecNode | RootSpecNode): CheckResult & { warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // acceptanceCriteria should exist for leaf nodes with sourceFiles
  if (node.isLeaf && node.syncMeta.sourceFiles && node.syncMeta.sourceFiles.length > 0) {
    if (!node.acceptanceCriteria || node.acceptanceCriteria.length === 0) {
      errors.push('leaf node with sourceFiles must have at least 1 acceptance criterion');
    } else {
      // Check GWT structure
      for (let i = 0; i < node.acceptanceCriteria.length; i++) {
        const ac = node.acceptanceCriteria[i];
        if (!ac.given || !ac.when || !ac.then) {
          errors.push(`acceptanceCriteria[${i}] must have given, when, then`);
        }
      }
    }

    // Check goals coverage (warning, not error)
    if (node.goals && node.goals.length > 0 && node.acceptanceCriteria) {
      if (node.acceptanceCriteria.length < node.goals.length) {
        warnings.push(`only ${node.acceptanceCriteria.length} acceptanceCriteria for ${node.goals.length} goals`);
      }
    }
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
  };
}

// ---- Main validate function ----

export function validateTree(opts: PathResolverOptions, repoPath: string = process.cwd()): ValidateReport {
  const tree = readTree(opts);
  const results: NodeValidationResult[] = [];

  // Group nodes by parent for uniqueness checks
  const byParent = new Map<string, (SpecNode | RootSpecNode)[]>();
  for (const [, node] of tree) {
    const parentKey = node.parent ?? '__root__';
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey)!.push(node);
  }

  for (const [nodePath, node] of tree) {
    const siblings = byParent.get(node.parent ?? '__root__')?.filter(s => s.id !== node.id) ?? [];

    const formatResult = checkFormat(node);
    const versionResult = checkVersion(node, repoPath);
    const contentResult = checkContent(node);
    const uniquenessResult = checkUniqueness(node, siblings);
    const designDocResult = checkDesignDoc(node, opts);
    const coverageResult = checkCoverage(node);

    results.push({
      nodePath,
      nodeId: node.id,
      checks: {
        format: formatResult,
        version: versionResult,
        content: contentResult,
        uniqueness: uniquenessResult,
        designDoc: designDocResult,
        coverage: coverageResult,
      },
      needsReview: node.isLeaf && (node.syncMeta?.sourceFiles?.length ?? 0) > 0,
    });
  }

  const passed = results.filter(r =>
    Object.values(r.checks).every(c => c.pass)
  ).length;

  return {
    totalNodes: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}

// ---- Fix mode ----

export function fixTree(opts: PathResolverOptions, repoPath: string = process.cwd()): ValidateReport {
  const tree = readTree(opts);
  const gitInfo = { shortHash: '', branch: '' };
  try {
    gitInfo.shortHash = getShortHash(repoPath);
    gitInfo.branch = getBranch(repoPath);
  } catch (e) {
    process.stderr.write(`Warning: git info unavailable: ${(e as Error).message}\n`);
  }

  for (const [nodePath, node] of tree) {
    let modified = false;

    // Fill defaults for missing fields
    if (!node.children) { node.children = []; modified = true; }
    if (node.isLeaf === undefined) { node.isLeaf = node.children.length === 0; modified = true; }
    if (!node.syncMeta) {
      node.syncMeta = { lastSyncAt: new Date().toISOString(), baseCommit: '', baseCommitMessage: '', branch: '', sourceFiles: [] };
      modified = true;
    }
    if (!node.status) { node.status = 'draft'; modified = true; }

    // Fix testCases structure
    if (node.testCases) {
      if (!node.testCases['unit-test']) { node.testCases['unit-test'] = []; modified = true; }
      if (!node.testCases['end-to-end']) { node.testCases['end-to-end'] = []; modified = true; }
      if (!node.testCases['script-test']) { node.testCases['script-test'] = []; modified = true; }
    }

    // Fix specDetail.parameters: convert object[] to string[]
    if (node.specDetail?.parameters) {
      const fixed = node.specDetail.parameters.map(p =>
        typeof p === 'string' ? p : JSON.stringify(p)
      );
      if (fixed.some((f, i) => f !== node.specDetail!.parameters[i])) {
        node.specDetail.parameters = fixed;
        modified = true;
      }
    }

    // Update version info
    if (gitInfo.shortHash && node.syncMeta.baseCommit !== gitInfo.shortHash) {
      node.syncMeta.baseCommit = gitInfo.shortHash;
      modified = true;
    }
    if (gitInfo.branch && node.syncMeta.branch !== gitInfo.branch) {
      node.syncMeta.branch = gitInfo.branch;
      modified = true;
    }

    if (modified) {
      if (nodePath === 'project') {
        writeRootNode(node as RootSpecNode, opts);
      } else {
        writeNode(nodePath, node as SpecNode, opts);
      }
    }
  }

  // Re-validate after fixes
  return validateTree(opts, repoPath);
}
