export type SpecNodeType = 'business' | 'tech';

export interface SpecNode {
  id: string;
  projectId: string;
  parentId?: string;
  type: SpecNodeType;
  level: number;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}