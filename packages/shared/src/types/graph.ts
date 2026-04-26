export type GraphTab =
  | 'specs-graph'
  | 'specs-list'
  | 'specs-document'
  | 'architect-graph'
  | 'technical-document';

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error';

export type StorageLocation = 'project' | 'user';

export type SyncType = 'full' | 'incremental';

export interface Manifest {
  projectName: string;
  projectPath: string;
  storageLocation: StorageLocation;
  lastSyncCommit: string | null;
  lastSyncTime: string | null;
  syncStatus: SyncStatus;
  version: number;
}

export interface GraphNode {
  id: string;
  type: 'project' | 'domain' | 'feature';
  level: number;
  title: string;
  content?: string;
  children?: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SpecsListItem {
  id: string;
  type: 'project' | 'domain' | 'feature';
  level: number;
  title: string;
  content?: string;
  parentId?: string;
}

export interface SpecsData {
  graph: GraphData | null;
  graphSummary: string | null;
  list: SpecsListItem[];
  document: string | null;
}

export interface ArchitectData {
  graph: GraphData | null;
  graphSummary: string | null;
  document: string | null;
}

export interface SyncOptions {
  projectPath: string;
  storageLocation: StorageLocation;
  syncType: SyncType;
}

export interface GraphFullData {
  manifest: Manifest | null;
  specs: SpecsData | null;
  architect: ArchitectData | null;
}

export interface HistoryEntry {
  timestamp: string;
  hasSpecs: boolean;
  hasArchitect: boolean;
}
