export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  source: 'local' | 'clone' | 'create';
  agentCount: number;
  createdAt: string;
  updatedAt: string;
}
