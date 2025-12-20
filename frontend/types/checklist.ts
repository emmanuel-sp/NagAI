// Checklist types for goal progress tracking

export interface ChecklistItem {
  id: string;
  title: string;
  notes?: string;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  order: number; // For sorting items
}

export interface Checklist {
  id: string;
  goalId: string;
  goalTitle?: string; // For display purposes
  items: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChecklistItemDto {
  title: string;
  notes?: string;
  deadline?: Date;
}

export interface UpdateChecklistItemDto {
  title?: string;
  notes?: string;
  deadline?: Date;
  completed?: boolean;
  order?: number;
}
