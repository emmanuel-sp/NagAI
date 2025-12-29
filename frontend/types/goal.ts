// Goal types

export interface Goal {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  targetDate: string;
}

export interface GoalWithDetails extends Goal {
  specific?: string;
  measurable?: string;
  attainable?: string;
  relevant?: string;
  timely?: string;
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
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {}
