// Goal types

export interface Goal {
  goalId: number;
  title: string;
  description: string;
  createdAt: string;
  targetDate: string;
  journalMarkdown?: string | null;
}

export interface GoalWithDetails extends Goal {
  specific?: string;
  measurable?: string;
  attainable?: string;
  relevant?: string;
  timely?: string;
  stepsTaken?: string;
  journalMarkdown?: string | null;
}

export interface CreateGoalRequest {
  title: string;
  description: string;
  targetDate: string;
  specific?: string;
  measurable?: string;
  attainable?: string;
  relevant?: string;
  timely?: string;
  stepsTaken?: string;
  journalMarkdown?: string | null;
}

export type UpdateGoalRequest = Partial<CreateGoalRequest>;
