import { describe, it, expect } from 'vitest';
import {
  rootJsonPath,
  nodeJsonPath,
  nodeDirPath,
  designDocPath,
  designDocPathFromNodePath,
  buildNodePath,
  type PathResolverOptions,
} from '../core/path-resolver.ts';

const opts: PathResolverOptions = { specsRoot: '.harnesson/specs' };
const draftOpts: PathResolverOptions = { specsRoot: '.harnesson/specs', draft: true };

// ---- rootJsonPath ----

describe('rootJsonPath', () => {
  it('resolves to project.json in specs root', () => {
    const p = rootJsonPath(opts);
    expect(p).toMatch(/\.harnesson[\\/]specs[\\/]project\.json$/);
  });

  it('resolves to draft/project.json when draft mode', () => {
    const p = rootJsonPath(draftOpts);
    expect(p).toMatch(/\.harnesson[\\/]specs[\\/]draft[\\/]project\.json$/);
  });
});

// ---- nodeJsonPath ----

describe('nodeJsonPath', () => {
  it('resolves to <id>/node.json for any node', () => {
    const p = nodeJsonPath('project.ai-agent', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]node\.json$/);
  });

  it('resolves deeply nested node', () => {
    const p = nodeJsonPath('project.ai-agent.message-input', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]message-input[\\/]node\.json$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = nodeJsonPath('project.ai-agent', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes[\\/]ai-agent[\\/]node\.json$/);
  });

  it('handles 4-level deep path', () => {
    const p = nodeJsonPath('project.ai-agent.session-control.abort-execution', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]session-control[\\/]abort-execution[\\/]node\.json$/);
  });
});

// ---- nodeDirPath ----

describe('nodeDirPath', () => {
  it('returns nodes/ for root', () => {
    const p = nodeDirPath('project', opts);
    expect(p).toMatch(/[\\/]nodes$/);
  });

  it('returns directory for a non-root node', () => {
    const p = nodeDirPath('project.ai-agent', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = nodeDirPath('project', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes$/);
  });
});

// ---- designDocPathFromNodePath ----

describe('designDocPathFromNodePath', () => {
  it('resolves to <id>/design.md from nodePath', () => {
    const p = designDocPathFromNodePath('project.ai-agent', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]design\.md$/);
  });

  it('resolves deeply nested design doc', () => {
    const p = designDocPathFromNodePath('project.ai-agent.message-input', opts);
    expect(p).toMatch(/nodes[\\/]ai-agent[\\/]message-input[\\/]design\.md$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = designDocPathFromNodePath('project.ai-agent', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes[\\/]ai-agent[\\/]design\.md$/);
  });
});

// ---- designDocPath (legacy) ----

describe('designDocPath', () => {
  it('resolves design doc via relative path', () => {
    const p = designDocPath('nodes/ai-agent/design.md', opts);
    expect(p).toMatch(/\.harnesson[\\/]specs[\\/]nodes[\\/]ai-agent[\\/]design\.md$/);
  });

  it('uses draft prefix when draft mode', () => {
    const p = designDocPath('nodes/ai-agent/design.md', draftOpts);
    expect(p).toMatch(/draft[\\/]nodes[\\/]ai-agent[\\/]design\.md$/);
  });
});

// ---- buildNodePath ----

describe('buildNodePath', () => {
  it('returns just nodeId when parentPath is null', () => {
    expect(buildNodePath('project', null)).toBe('project');
  });

  it('concatenates parent and node id', () => {
    expect(buildNodePath('ai-agent', 'project')).toBe('project.ai-agent');
  });

  it('handles deeply nested paths', () => {
    expect(buildNodePath('abort', 'project.ai-agent.session')).toBe('project.ai-agent.session.abort');
  });
});
