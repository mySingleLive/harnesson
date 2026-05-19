export interface AcceptanceCriterion {
  given: string;
  when: string;
  then: string;
}

export interface SpecTreeNode {
  id: string;
  name: string;
  level: number;
  parent: string | null;
  children: string[];
  isLeaf: boolean;
  summary: string;
  goals: string[];
  acceptanceCriteria: AcceptanceCriterion[];
  status: string;
  design: unknown;
}
