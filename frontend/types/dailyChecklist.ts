export interface DailyChecklistBusyBlock {
  startTime: string;
  endTime: string;
  summary: string;
}

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
  generationCount: number;
  items: DailyChecklistItem[];
  busyBlocks: DailyChecklistBusyBlock[];
}

export interface DailyChecklistConfig {
  configId: number;
  maxItems: number;
  recurringItems: string[] | null;
  includedGoalIds: number[] | null;
  calendarEnabled: boolean;
  calendarConnected: boolean;
}

export interface UpdateDailyChecklistConfigDto {
  maxItems?: number;
  recurringItems?: string[];
  includedGoalIds?: number[] | null;
  calendarEnabled?: boolean;
}

export interface CreateDailyItemDto {
  title: string;
  notes?: string;
  scheduledTime?: string; // HH:MM
}

export interface UpdateDailyItemDto {
  title?: string;
  notes?: string;
  scheduledTime?: string | null;
}

export interface ReorderDailyItemsDto {
  orderedItemIds: number[];
}
