export interface DailyChecklistItem {
  dailyItemId: number;
  parentChecklistId: number | null;
  parentGoalId: number | null;
  parentGoalTitle: string | null;
  sortOrder: number;
  title: string;
  notes?: string;
  scheduledTime?: string;
  completed: boolean;
  completedAt?: string;
}

export interface DailyChecklist {
  dailyChecklistId: number;
  planDate: string;
  generatedAt: string;
  items: DailyChecklistItem[];
}

export interface DailyChecklistConfig {
  configId: number;
  maxItems: number;
  recurringItems: string[] | null;
  includedGoalIds: number[] | null;
}

export interface UpdateDailyChecklistConfigDto {
  maxItems?: number;
  recurringItems?: string[];
  includedGoalIds?: number[] | null;
}
