import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SpecNode, RootSpecNode } from './schema.ts';
import {
  rootJsonPath,
  nodeJsonPath,
  nodeDirPath,
  designDocPathFromNodePath,
  type PathResolverOptions,
} from './path-resolver.ts';

// ---- Read operations ----

export function readRootNode(opts: PathResolverOptions): RootSpecNode | null {
  const filePath = rootJsonPath(opts);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function readNode(
  nodePath: string,
  opts: PathResolverOptions,
): SpecNode | null {
  const filePath = nodeJsonPath(nodePath, opts);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function readTree(opts: PathResolverOptions): Map<string, SpecNode | RootSpecNode> {
  const result = new Map<string, SpecNode | RootSpecNode>();
  const root = readRootNode(opts);
  if (!root) return result;

  result.set('project', root);

  const visited = new Set<string>(root.children ?? []);
  const queue: string[] = [...(root.children ?? [])];

  while (queue.length > 0) {
    const childId = queue.shift()!;
    const node = findAndReadNode(childId, result, opts);
    if (node) {
      const fullNodePath = buildFullPath(node, result);
      result.set(fullNodePath, node);
      if (!node.isLeaf && node.children) {
        for (const c of node.children) {
          if (!visited.has(c)) {
            visited.add(c);
            queue.push(c);
          }
        }
      }
    }
  }

  return result;
}

export function readSubtree(
  startPath: string,
  opts: PathResolverOptions,
): Map<string, SpecNode | RootSpecNode> {
  const result = new Map<string, SpecNode | RootSpecNode>();
  const startNode = startPath === 'project'
    ? readRootNode(opts)
    : readNode(startPath, opts);

  if (!startNode) return result;

  result.set(startPath, startNode);

  if (!startNode.isLeaf && startNode.children) {
    const visited = new Set<string>(startNode.children);
    const queue: string[] = [...startNode.children];
    while (queue.length > 0) {
      const childId = queue.shift()!;
      const node = findAndReadNode(childId, result, opts);
      if (node) {
        const fullNodePath = buildFullPath(node, result);
        result.set(fullNodePath, node);
        if (!node.isLeaf && node.children) {
          for (const c of node.children) {
            if (!visited.has(c)) {
              visited.add(c);
            }
          }
        }
      }
    }
  }

  return result;
}

// ---- Write operations ----

export function writeRootNode(node: RootSpecNode, opts: PathResolverOptions): string {
  const filePath = rootJsonPath(opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function writeNode(nodePath: string, node: SpecNode, opts: PathResolverOptions): string {
  const filePath = nodeJsonPath(nodePath, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function writeDesignDocForNode(nodePath: string, content: string, opts: PathResolverOptions): string {
  const filePath = designDocPathFromNodePath(nodePath, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ---- Delete operations ----

export function deleteNode(nodePath: string, opts: PathResolverOptions): boolean {
  const dir = nodeDirPath(nodePath, opts);
  if (!fs.existsSync(dir)) return false;
  fs.rmSync(dir, { recursive: true });
  return true;
}

// ---- Merge operation ----

export function mergeNodeData(existing: SpecNode, updates: Partial<SpecNode>): SpecNode {
  const result = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const existingValue = (result as Record<string, unknown>)[key];

    if (Array.isArray(value) && Array.isArray(existingValue)) {
      const existingArr = existingValue as unknown[];
      const newArr = value as unknown[];
      const merged = [...existingArr];
      for (const item of newArr) {
        const json = JSON.stringify(item);
        if (!merged.some(e => JSON.stringify(e) === json)) {
          merged.push(item);
        }
      }
      (result as Record<string, unknown>)[key] = merged;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)
               && typeof existingValue === 'object' && existingValue !== null && !Array.isArray(existingValue)) {
      (result as Record<string, unknown>)[key] = { ...(existingValue as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}

// ---- Directory operations ----

export function initSpecsDir(opts: PathResolverOptions): void {
  const base = opts.specsRoot;
  const dirs = [
    base,
    path.join(base, 'nodes'),
    path.join(base, 'draft', 'nodes'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---- Migration ----

export interface MigrationResult {
  migrated: number;
  errors: string[];
}

export function migrateStructure(opts: PathResolverOptions): MigrationResult {
  const errors: string[] = [];
  let migrated = 0;

  const nodesBase = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');

  if (!fs.existsSync(nodesBase)) return { migrated: 0, errors };

  // Phase 1 & 2: Migrate all node files
  scanAndMigrate(nodesBase);

  // Phase 3: Move design docs and update design fields
  const designBase = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'design')
    : path.join(opts.specsRoot, 'design');

  if (fs.existsSync(designBase)) {
    const tree = readTree(opts);
    for (const [nodePath, node] of tree) {
      if (nodePath === 'project' || !node.design) continue;

      const oldDesignPath = path.join(
        opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot,
        node.design,
      );

      if (fs.existsSync(oldDesignPath)) {
        const newDesignPath = designDocPathFromNodePath(nodePath, opts);
        fs.mkdirSync(path.dirname(newDesignPath), { recursive: true });
        fs.renameSync(oldDesignPath, newDesignPath);
        migrated++;

        // Update design field to new path
        const parts = nodePath.split('.');
        node.design = path.join('nodes', ...parts.slice(1), 'design.md').replace(/\\/g, '/');
        writeNode(nodePath, node, opts);
      }
    }

    // Clean up design directory
    try {
      if (fs.existsSync(designBase)) {
        const remaining = fs.readdirSync(designBase);
        if (remaining.length === 0) {
          fs.rmSync(designBase, { recursive: true });
        }
      }
    } catch {
      // Directory not empty, that's fine
    }
  }

  function scanAndMigrate(dir: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check for old non-leaf format: <id>/index.json
        const indexPath = path.join(dir, entry.name, 'index.json');
        const newNodeJsonPath = path.join(dir, entry.name, 'node.json');

        if (fs.existsSync(indexPath) && !fs.existsSync(newNodeJsonPath)) {
          fs.renameSync(indexPath, newNodeJsonPath);
          migrated++;
        }

        // Recurse into children
        scanAndMigrate(path.join(dir, entry.name));
      } else if (
        entry.isFile()
        && entry.name !== 'index.json'
        && entry.name !== 'node.json'
        && entry.name !== 'design.md'
        && entry.name.endsWith('.json')
      ) {
        // Old leaf format: <id>.json → <id>/node.json
        const oldFilePath = path.join(dir, entry.name);
        const id = entry.name.replace('.json', '');
        const newDir = path.join(dir, id);
        const newFilePath = path.join(newDir, 'node.json');

        fs.mkdirSync(newDir, { recursive: true });
        fs.renameSync(oldFilePath, newFilePath);
        migrated++;
      }
    }
  }

  return { migrated, errors };
}

// ---- Internal helpers ----

function findAndReadNode(
  childId: string,
  loadedNodes: Map<string, SpecNode | RootSpecNode>,
  opts: PathResolverOptions,
): SpecNode | null {
  for (const [parentPath, parentNode] of loadedNodes) {
    if (parentNode.children?.includes(childId)) {
      const childFullPath = `${parentPath}.${childId}`;
      return readNode(childFullPath, opts);
    }
  }
  return null;
}

function buildFullPath(
  node: SpecNode,
  loadedNodes: Map<string, SpecNode | RootSpecNode>,
): string {
  if (node.parent === null) return node.id;
  for (const [p, n] of loadedNodes) {
    if (n.id === node.parent) return `${p}.${node.id}`;
  }
  return node.id;
}
