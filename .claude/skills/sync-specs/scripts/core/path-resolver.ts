import * as path from 'node:path';
import type { SpecNode, RootSpecNode } from './schema.ts';

export interface PathResolverOptions {
  /** Root directory of specs tree, e.g. `.harnesson/specs` */
  specsRoot: string;
  /** Whether operating on draft (adds `draft/` prefix to node/design paths) */
  draft?: boolean;
}

/**
 * Resolve the file path for the root node.
 */
export function rootJsonPath(opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, 'project.json');
}

/**
 * Resolve the file path for a non-root node.
 * Requires the node object (to check isLeaf) and parent chain.
 *
 * @param nodePath - dot-separated ancestor IDs from root, e.g. "project.ai-agent.message-input"
 * @param isLeaf - whether the node is a leaf
 */
export function nodeJsonPath(nodePath: string, isLeaf: boolean, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');
  const parts = nodePath.split('.');
  // parts[0] = "project" (root), parts[1..n-1] = ancestors, parts[n] = this node's id
  const relativeDirs = parts.slice(1, -1); // ancestor dirs (between root and this node)
  const id = parts[parts.length - 1];

  const dir = path.join(base, ...relativeDirs);
  if (isLeaf) {
    return path.join(dir, `${id}.json`);
  }
  return path.join(dir, id, 'index.json');
}

/**
 * Resolve the directory that contains a node's children.
 * For root: `<root>/nodes/` (or draft equivalent)
 * For non-root non-leaf: the directory containing index.json
 * For leaf: never called (leaf has no children)
 */
export function nodeDirPath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');

  if (nodePath === 'project') return base;

  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1); // all non-root segments
  return path.join(base, ...relativeDirs);
}

/**
 * Resolve the design document path for a node.
 * @param designRelativePath - the `design` field value from the node, e.g. "design/ai-agent/message-input.md"
 */
export function designDocPath(designRelativePath: string, opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, designRelativePath);
}

/**
 * Build the full nodePath (dot-separated) for a node given its id and parentId.
 * Requires a lookup map of id→nodePath for all existing nodes.
 */
export function buildNodePath(
  nodeId: string,
  parentPath: string | null,
): string {
  if (parentPath === null) return nodeId;
  return `${parentPath}.${nodeId}`;
}