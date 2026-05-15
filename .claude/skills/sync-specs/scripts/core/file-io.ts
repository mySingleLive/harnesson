import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SpecNode, RootSpecNode } from './schema.ts';
import {
  rootJsonPath,
  nodeJsonPath,
  nodeDirPath,
  designDocPath,
  type PathResolverOptions,
} from './path-resolver.ts';

// ---- Read operations ----

export function readRootNode(opts: PathResolverOptions): RootSpecNode | null {
  const filePath = rootJsonPath(opts);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Read a non-root node by its full dot-separated path.
 * Returns null if file doesn't exist.
 */
export function readNode(
  nodePath: string,
  opts: PathResolverOptions,
): SpecNode | null {
  // We need to know isLeaf to resolve the file path.
  // First try leaf path, then non-leaf path.
  const leafPath = nodeJsonPath(nodePath, true, opts);
  if (fs.existsSync(leafPath)) {
    return JSON.parse(fs.readFileSync(leafPath, 'utf-8'));
  }
  const nonLeafPath = nodeJsonPath(nodePath, false, opts);
  if (fs.existsSync(nonLeafPath)) {
    return JSON.parse(fs.readFileSync(nonLeafPath, 'utf-8'));
  }
  return null;
}

/**
 * Read the full tree starting from root.
 * Returns a flat map of nodePath → SpecNode.
 */
export function readTree(opts: PathResolverOptions): Map<string, SpecNode | RootSpecNode> {
  const result = new Map<string, SpecNode | RootSpecNode>();
  const root = readRootNode(opts);
  if (!root) return result;

  result.set('project', root);

  const visited = new Set<string>(root.children);
  const queue: string[] = [...root.children];

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

/**
 * Read a subtree starting from a given node path.
 */
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
              queue.push(c);
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
  const filePath = nodeJsonPath(nodePath, node.isLeaf, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(node, null, 2) + '\n', 'utf-8');
  return filePath;
}

export function writeDesignDoc(designRelPath: string, content: string, opts: PathResolverOptions): string {
  const filePath = designDocPath(designRelPath, opts);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

// ---- Delete operations ----

export function deleteNode(nodePath: string, isLeaf: boolean, opts: PathResolverOptions): boolean {
  const filePath = nodeJsonPath(nodePath, isLeaf, opts);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);

  // For non-leaf nodes, clean up the directory if empty
  if (!isLeaf) {
    const dir = path.dirname(filePath);
    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0) {
      fs.rmdirSync(dir);
    }
  }

  return true;
}

// ---- Merge operation (for update-node) ----

export function mergeNodeData(existing: SpecNode, updates: Partial<SpecNode>): SpecNode {
  const result = { ...existing };

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    const existingValue = (result as Record<string, unknown>)[key];

    // For array fields: append new items if both exist
    if (Array.isArray(value) && Array.isArray(existingValue)) {
      const existingArr = existingValue as unknown[];
      const newArr = value as unknown[];
      // Merge by concatenating and deduplicating by JSON string
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
      // For object fields: shallow merge
      (result as Record<string, unknown>)[key] = { ...(existingValue as Record<string, unknown>), ...(value as Record<string, unknown>) };
    } else {
      // Primitive fields: overwrite
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
    path.join(base, 'design'),
    path.join(base, 'draft', 'nodes'),
    path.join(base, 'draft', 'design'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---- Internal helpers ----

/**
 * Find and read a child node when we know the parent path.
 * Searches all loaded nodes for one whose children array contains childId.
 */
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
  for (const [path, n] of loadedNodes) {
    if (n.id === node.parent) return `${path}.${node.id}`;
  }
  return node.id; // fallback
}
