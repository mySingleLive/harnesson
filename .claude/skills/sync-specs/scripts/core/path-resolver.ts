import * as path from 'node:path';

export interface PathResolverOptions {
  specsRoot: string;
  draft?: boolean;
}

export function rootJsonPath(opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, 'project.json');
}

/**
 * Resolve the file path for a non-root node.
 * All nodes now use the same pattern: <ancestors>/<id>/node.json
 *
 * @param nodePath - dot-separated ancestor IDs from root, e.g. "project.ai-agent.message-input"
 */
export function nodeJsonPath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');
  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1);
  return path.join(base, ...relativeDirs, 'node.json');
}

/**
 * Resolve the directory that contains a node's children.
 */
export function nodeDirPath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');

  if (nodePath === 'project') return base;

  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1);
  return path.join(base, ...relativeDirs);
}

/**
 * Resolve the design document path for a node, derived from its nodePath.
 * Always resolves to nodes/<ancestors>/<id>/design.md
 */
export function designDocPathFromNodePath(nodePath: string, opts: PathResolverOptions): string {
  const base = opts.draft
    ? path.join(opts.specsRoot, 'draft', 'nodes')
    : path.join(opts.specsRoot, 'nodes');
  const parts = nodePath.split('.');
  const relativeDirs = parts.slice(1);
  return path.join(base, ...relativeDirs, 'design.md');
}

/**
 * Resolve a design document path from a relative path string.
 * Used for reading the `design` field value from node JSON.
 */
export function designDocPath(designRelativePath: string, opts: PathResolverOptions): string {
  const base = opts.draft ? path.join(opts.specsRoot, 'draft') : opts.specsRoot;
  return path.join(base, designRelativePath);
}

export function buildNodePath(
  nodeId: string,
  parentPath: string | null,
): string {
  if (parentPath === null) return nodeId;
  return `${parentPath}.${nodeId}`;
}
