import { spawn, type ChildProcess } from 'node:child_process';
import type { Manifest, SyncOptions } from '@harnesson/shared';
import {
  resolveBaseDir,
  hasData,
  archiveCurrentData,
  writeManifest,
  getManifest,
} from './graph-storage.js';

const activeSyncs = new Map<string, ChildProcess>();

export function isSyncing(projectPath: string): boolean {
  return activeSyncs.has(projectPath);
}

export function cancelSync(projectPath: string): boolean {
  const proc = activeSyncs.get(projectPath);
  if (!proc) return false;
  proc.kill('SIGTERM');
  activeSyncs.delete(projectPath);
  return true;
}

interface SSEWriter {
  write: (event: string, data: Record<string, unknown>) => void;
}

export async function runSync(
  options: SyncOptions,
  sse: SSEWriter,
): Promise<void> {
  const { projectPath, storageLocation, syncType } = options;
  const baseDir = resolveBaseDir(projectPath, storageLocation);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (activeSyncs.has(projectPath)) {
    sse.write('error', { message: 'Sync already in progress', code: -1 });
    return;
  }

  try {
    sse.write('progress', {
      phase: 'initializing',
      progress: 5,
      message: 'Checking project structure...',
    });

    if (await hasData(baseDir)) {
      await archiveCurrentData(baseDir, timestamp);
    }

    sse.write('progress', {
      phase: 'scanning',
      progress: 10,
      message: 'Starting project scan...',
    });

    const syncCommand = process.env.HARNESSON_SYNC_COMMAND ?? 'echo';
    const syncArgs = process.env.HARNESSON_SYNC_ARGS
      ? JSON.parse(process.env.HARNESSON_SYNC_ARGS) as string[]
      : [JSON.stringify({ projectPath, baseDir, syncType })];

    await new Promise<void>((resolvePromise, reject) => {
      const proc = spawn(syncCommand, syncArgs, {
        cwd: projectPath,
        env: { ...process.env, PROJECT_PATH: projectPath, BASE_DIR: baseDir },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      activeSyncs.set(projectPath, proc);

      proc.stdout?.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'progress') {
              sse.write('progress', {
                phase: parsed.phase ?? 'scanning',
                progress: parsed.progress ?? 30,
                message: parsed.message ?? line,
              });
            } else if (parsed.type === 'node') {
              sse.write('node-generated', { tab: parsed.tab, node: parsed.node });
            }
          } catch {
            sse.write('progress', {
              phase: 'scanning',
              progress: 30,
              message: line.slice(0, 200),
            });
          }
        }
      });

      let stderr = '';
      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        activeSyncs.delete(projectPath);
        if (code === 0) {
          resolvePromise();
        } else {
          reject(new Error(`CLI process exited with code ${code}: ${stderr.slice(0, 500)}`));
        }
      });

      proc.on('error', (err) => {
        activeSyncs.delete(projectPath);
        reject(err);
      });
    });

    sse.write('progress', {
      phase: 'completing',
      progress: 95,
      message: 'Writing manifest...',
    });

    const projectName = projectPath.split('/').pop() ?? 'unknown';
    let lastSyncCommit: string | null = null;
    try {
      const { execSync } = await import('node:child_process');
      lastSyncCommit = execSync('git rev-parse HEAD', { cwd: projectPath, encoding: 'utf-8' }).trim();
    } catch {
      // Not a git repo
    }

    const manifest: Manifest = {
      projectName,
      projectPath,
      storageLocation,
      lastSyncCommit,
      lastSyncTime: new Date().toISOString(),
      syncStatus: 'completed',
      version: 1,
    };
    await writeManifest(baseDir, manifest);

    sse.write('complete', {
      commit: lastSyncCommit ?? '',
      timestamp: manifest.lastSyncTime,
      filesGenerated: 7,
    });
  } catch (err) {
    const existingManifest = await getManifest(baseDir);
    if (existingManifest) {
      await writeManifest(baseDir, { ...existingManifest, syncStatus: 'error' });
    }
    sse.write('error', {
      message: err instanceof Error ? err.message : String(err),
      code: 1,
    });
  }
}
