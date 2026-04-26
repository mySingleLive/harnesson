import { readFile, writeFile, mkdir, readdir, stat, cp } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  Manifest,
  GraphData,
  SpecsListItem,
  SpecsData,
  ArchitectData,
  GraphFullData,
  HistoryEntry,
} from '@harnesson/shared';

function harnessonDir(projectPath: string, storageLocation: 'project' | 'user'): string {
  if (storageLocation === 'user') {
    const name = projectPath.split('/').pop() ?? 'unknown';
    return join(process.env.HOME ?? '~', '.harnesson', name);
  }
  return join(projectPath, '.harnesson');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  if (!(await fileExists(path))) return null;
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw) as T;
}

async function readTextFile(path: string): Promise<string | null> {
  if (!(await fileExists(path))) return null;
  return readFile(path, 'utf-8');
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function getManifest(baseDir: string): Promise<Manifest | null> {
  return readJsonFile<Manifest>(join(baseDir, 'manifest.json'));
}

export async function getSpecsData(baseDir: string): Promise<SpecsData | null> {
  const specsDir = join(baseDir, 'specs');
  if (!(await dirExists(specsDir))) return null;

  const [graph, graphSummary, list, document] = await Promise.all([
    readJsonFile<GraphData>(join(specsDir, 'graph.json')),
    readTextFile(join(specsDir, 'graph-summary.md')),
    readJsonFile<SpecsListItem[]>(join(specsDir, 'list.json')),
    readTextFile(join(specsDir, 'document.md')),
  ]);

  return {
    graph: graph ?? null,
    graphSummary,
    list: list ?? [],
    document,
  };
}

export async function getArchitectData(baseDir: string): Promise<ArchitectData | null> {
  const archDir = join(baseDir, 'architect');
  if (!(await dirExists(archDir))) return null;

  const [graph, graphSummary, document] = await Promise.all([
    readJsonFile<GraphData>(join(archDir, 'graph.json')),
    readTextFile(join(archDir, 'graph-summary.md')),
    readTextFile(join(archDir, 'document.md')),
  ]);

  return {
    graph: graph ?? null,
    graphSummary,
    document,
  };
}

export async function getFullData(baseDir: string): Promise<GraphFullData> {
  const [manifest, specs, architect] = await Promise.all([
    getManifest(baseDir),
    getSpecsData(baseDir),
    getArchitectData(baseDir),
  ]);

  return { manifest, specs, architect };
}

export async function hasData(baseDir: string): Promise<boolean> {
  return fileExists(join(baseDir, 'manifest.json'));
}

export async function getHistoryList(baseDir: string): Promise<HistoryEntry[]> {
  const entries: HistoryEntry[] = [];

  const readHistoryDir = async (dirName: string, key: 'hasSpecs' | 'hasArchitect') => {
    const dir = join(baseDir, dirName);
    if (!(await dirExists(dir))) return;
    const timestamps = await readdir(dir);
    for (const ts of timestamps) {
      const existing = entries.find((e) => e.timestamp === ts);
      if (existing) {
        existing[key] = true;
      } else {
        entries.push({ timestamp: ts, hasSpecs: false, hasArchitect: false, [key]: true });
      }
    }
  };

  await Promise.all([
    readHistoryDir('specs-history', 'hasSpecs'),
    readHistoryDir('architect-history', 'hasArchitect'),
  ]);

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function getHistoryData(
  baseDir: string,
  timestamp: string,
): Promise<{ specs: SpecsData | null; architect: ArchitectData | null }> {
  const [specsDir, archDir] = [
    join(baseDir, 'specs-history', timestamp),
    join(baseDir, 'architect-history', timestamp),
  ];

  let specs: SpecsData | null = null;
  if (await dirExists(specsDir)) {
    const [graph, list, document] = await Promise.all([
      readJsonFile<GraphData>(join(specsDir, 'graph.json')),
      readJsonFile<SpecsListItem[]>(join(specsDir, 'list.json')),
      readTextFile(join(specsDir, 'document.md')),
    ]);
    specs = { graph: graph ?? null, graphSummary: null, list: list ?? [], document };
  }

  let architect: ArchitectData | null = null;
  if (await dirExists(archDir)) {
    const [graph, document] = await Promise.all([
      readJsonFile<GraphData>(join(archDir, 'graph.json')),
      readTextFile(join(archDir, 'document.md')),
    ]);
    architect = { graph: graph ?? null, graphSummary: null, document };
  }

  return { specs, architect };
}

export async function archiveCurrentData(baseDir: string, timestamp: string): Promise<void> {
  const archiveDir = async (src: string, dest: string) => {
    if (!(await dirExists(src))) return;
    await ensureDir(dest);
    await cp(src, dest, { recursive: true });
  };

  await Promise.all([
    archiveDir(join(baseDir, 'specs'), join(baseDir, 'specs-history', timestamp)),
    archiveDir(join(baseDir, 'architect'), join(baseDir, 'architect-history', timestamp)),
  ]);
}

export async function writeManifest(baseDir: string, manifest: Manifest): Promise<void> {
  await ensureDir(baseDir);
  await writeFile(join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
}

export async function writeSpecsData(
  baseDir: string,
  data: { graph?: GraphData; list?: SpecsListItem[]; document?: string; graphSummary?: string },
): Promise<void> {
  const specsDir = join(baseDir, 'specs');
  await ensureDir(specsDir);

  const writes: Promise<void>[] = [];
  if (data.graph) writes.push(writeFile(join(specsDir, 'graph.json'), JSON.stringify(data.graph, null, 2), 'utf-8'));
  if (data.list) writes.push(writeFile(join(specsDir, 'list.json'), JSON.stringify(data.list, null, 2), 'utf-8'));
  if (data.document) writes.push(writeFile(join(specsDir, 'document.md'), data.document, 'utf-8'));
  if (data.graphSummary) writes.push(writeFile(join(specsDir, 'graph-summary.md'), data.graphSummary, 'utf-8'));
  await Promise.all(writes);
}

export async function writeArchitectData(
  baseDir: string,
  data: { graph?: GraphData; document?: string; graphSummary?: string },
): Promise<void> {
  const archDir = join(baseDir, 'architect');
  await ensureDir(archDir);

  const writes: Promise<void>[] = [];
  if (data.graph) writes.push(writeFile(join(archDir, 'graph.json'), JSON.stringify(data.graph, null, 2), 'utf-8'));
  if (data.document) writes.push(writeFile(join(archDir, 'document.md'), data.document, 'utf-8'));
  if (data.graphSummary) writes.push(writeFile(join(archDir, 'graph-summary.md'), data.graphSummary, 'utf-8'));
  await Promise.all(writes);
}

export function resolveBaseDir(projectPath: string, storageLocation?: 'project' | 'user'): string {
  return harnessonDir(projectPath, storageLocation ?? 'project');
}
