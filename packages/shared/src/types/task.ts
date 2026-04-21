export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'testing' | 'done' | 'failed';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  sourceSpecId?: string;
  sourceDiff?: string;
  assignedAgentId?: string;
  branch: string;
  assignee?: string;
  labels?: string[];
  estimatedHours?: number;
  startedAt?: string;
  reviewedAt?: string;
  testedAt?: string;
  createdAt: string;
  updatedAt: string;
}