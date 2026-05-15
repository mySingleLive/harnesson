import { execSync } from 'node:child_process';

export interface GitInfo {
  shortHash: string;
  fullHash: string;
  branch: string;
  message: string;
}

export function getGitInfo(repoPath: string = process.cwd()): GitInfo {
  const opts = { cwd: repoPath, encoding: 'utf-8' as const };
  const fullHash = execSync('git rev-parse HEAD', opts).trim();
  const shortHash = execSync('git rev-parse --short HEAD', opts).trim();
  const branch = execSync('git rev-parse --abbrev-ref HEAD', opts).trim();
  const message = execSync('git log -1 --format=%s', opts).trim();
  return { shortHash, fullHash, branch, message };
}

export function getShortHash(repoPath: string = process.cwd()): string {
  return execSync('git rev-parse --short HEAD', {
    cwd: repoPath, encoding: 'utf-8',
  }).trim();
}

export function getBranch(repoPath: string = process.cwd()): string {
  return execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: repoPath, encoding: 'utf-8',
  }).trim();
}