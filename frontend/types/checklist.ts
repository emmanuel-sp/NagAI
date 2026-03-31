// Checklist types — aligned with backend ChecklistResponse

export interface ChecklistItem {
  checklistId: number;
  goalId: number;
  title: string;
  notes?: string;
  deadline?: string;
  completed: boolean;
  completedAt?: string;
  sortOrder: number;
}

// Frontend-only grouping for display (one per goal)
export interface Checklist {
  goalId: number;
  goalTitle: string;
  items: ChecklistItem[];
}

export interface CreateChecklistItemDto {
  goalId: number;
  title: string;
  notes?: string;
  deadline?: string;
  sortOrder?: number;
}

export interface UpdateChecklistItemDto {
  checklistId: number;
  title: string;
  notes?: string;
  deadline?: string;
  sortOrder?: number;
  completed?: boolean;
}

export interface ReorderChecklistItemsDto {
  orderedItemIds: number[];
}
