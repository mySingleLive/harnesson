import * as fs from 'node:fs';
import * as path from 'node:path';

// ---- Minimal arg parser ----

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // skip node + script
  let command = '';
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

function output(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function error(msg: string): void {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

// ---- Main ----

async function main() {
  const { command, positional, flags } = parseArgs(process.argv);

  const root = flags.root ?? '.harnesson/specs';
  const opts = { specsRoot: root, draft: flags.draft === 'true' };

  switch (command) {
    case 'init-tree': {
      const { initSpecsDir } = await import('./core/file-io.ts');
      initSpecsDir(opts);
      output({ ok: true, message: `Initialized specs tree at ${root}` });
      break;
    }

    case 'read-tree': {
      const { readTree, readSubtree } = await import('./core/file-io.ts');
      const node = flags.node;
      const tree = node ? readSubtree(node, opts) : readTree(opts);
      const obj: Record<string, unknown> = {};
      for (const [path, n] of tree) {
        obj[path] = n;
      }
      output({ ok: true, nodes: obj });
      break;
    }

    case 'read-node': {
      const { readNode, readRootNode } = await import('./core/file-io.ts');
      const nodeId = positional[0];
      if (!nodeId) error('Usage: specs-cli.ts read-node <node-path>');
      const node = nodeId === 'project' ? readRootNode(opts) : readNode(nodeId, opts);
      if (!node) error(`Node not found: ${nodeId}`);
      output({ ok: true, node });
      break;
    }

    case 'create-node': {
      const { writeNode, writeRootNode } = await import('./core/file-io.ts');
      const { fillDefaults } = await import('./core/schema.ts');
      const input = fs.readFileSync(process.stdin.fd, 'utf-8');
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(input);
      } catch (e) {
        error(`Invalid JSON input: ${(e as Error).message}`);
      }

      const nodePath = (data as Record<string, unknown>)._nodePath as string;
      if (!nodePath) error('_nodePath is required in input JSON');

      delete (data as Record<string, unknown>)._nodePath;
      const filled = fillDefaults(data as any);

      if (nodePath === 'project') {
        const filePath = writeRootNode(filled as any, opts);
        output({ ok: true, path: filePath });
      } else {
        const filePath = writeNode(nodePath, filled, opts);
        output({ ok: true, path: filePath });
      }
      break;
    }

    case 'update-node': {
      const { readNode, readRootNode, mergeNodeData, writeNode, writeRootNode } = await import('./core/file-io.ts');
      const nodeId = positional[0];
      if (!nodeId) error('Usage: specs-cli.ts update-node <node-path>');

      const input = fs.readFileSync(process.stdin.fd, 'utf-8');
      let updates: Record<string, unknown>;
      try {
        updates = JSON.parse(input);
      } catch (e) {
        error(`Invalid JSON input: ${(e as Error).message}`);
      }

      const existing = nodeId === 'project' ? readRootNode(opts) : readNode(nodeId, opts);
      if (!existing) error(`Node not found: ${nodeId}`);

      const merged = mergeNodeData(existing as any, updates as any);

      if (nodeId === 'project') {
        const filePath = writeRootNode(merged as any, opts);
        output({ ok: true, path: filePath });
      } else {
        const filePath = writeNode(nodeId, merged, opts);
        output({ ok: true, path: filePath });
      }
      break;
    }

    case 'delete-node': {
      const { readNode, deleteNode, readRootNode, writeRootNode, writeNode } = await import('./core/file-io.ts');
      const nodeId = positional[0];
      if (!nodeId) error('Usage: specs-cli.ts delete-node <node-path>');

      const node = nodeId === 'project' ? readRootNode(opts) : readNode(nodeId, opts);
      if (!node) error(`Node not found: ${nodeId}`);

      // Safety: only allow deletion of leaf nodes (nodes with no children)
      if (node.children && node.children.length > 0) {
        error(`Cannot delete non-leaf node with children. Remove children first.`);
      }

      // Remove from parent's children array
      if (node.parent) {
        // Find parent path: remove last segment from nodePath
        const parts = nodeId.split('.');
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join('.') : 'project';
        const parentNode = parentPath === 'project' ? readRootNode(opts) : readNode(parentPath, opts);
        if (parentNode) {
          parentNode.children = parentNode.children.filter((c: string) => c !== node.id);
          if (parentPath === 'project') {
            writeRootNode(parentNode as any, opts);
          } else {
            writeNode(parentPath, parentNode, opts);
          }
        }
      }

      const isLeaf = node.isLeaf;
      if (nodeId !== 'project') {
        deleteNode(nodeId, isLeaf, opts);
      }
      output({ ok: true, deleted: nodeId });
      break;
    }

    case 'validate': {
      const { validateTree, fixTree } = await import('./core/validator.ts');
      const doFix = flags.fix === 'true';
      const report = doFix ? fixTree(opts) : validateTree(opts);
      output({ ok: report.failed === 0, ...report });
      break;
    }

    case 'promote-draft': {
      const { readTree, writeRootNode, writeNode, writeDesignDoc } = await import('./core/file-io.ts');
      const draftOpts = { ...opts, draft: true };
      const draftTree = readTree(draftOpts);

      if (draftTree.size === 0) {
        output({ ok: true, message: 'No draft nodes to promote' });
        break;
      }

      const promotedPaths: string[] = [];

      for (const [nodePath, node] of draftTree) {
        // Update lastSyncAt
        node.syncMeta.lastSyncAt = new Date().toISOString();

        if (nodePath === 'project') {
          const p = writeRootNode(node as any, opts);
          promotedPaths.push(p);
        } else {
          const p = writeNode(nodePath, node as any, opts);
          promotedPaths.push(p);
        }

        // Copy design doc if exists
        if (node.design) {
          const draftDocPath = path.join(root, 'draft', node.design);
          if (fs.existsSync(draftDocPath)) {
            const content = fs.readFileSync(draftDocPath, 'utf-8');
            writeDesignDoc(node.design, content, opts);
            promotedPaths.push(node.design);
          }
        }
      }

      // Clean up draft directory
      const draftDir = path.join(root, 'draft');
      if (fs.existsSync(draftDir)) {
        fs.rmSync(draftDir, { recursive: true });
        fs.mkdirSync(draftDir, { recursive: true });
      }

      output({ ok: true, promoted: promotedPaths.length, paths: promotedPaths });
      break;
    }

    default:
      error(`Unknown command: ${command}\nAvailable: init-tree, read-tree, read-node, create-node, update-node, delete-node, validate, promote-draft`);
  }
}

main().catch((e) => {
  error(`Fatal: ${(e as Error).message}`);
});
