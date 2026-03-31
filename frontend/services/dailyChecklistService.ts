import { apiRequest, ApiError } from "@/lib/api";
import {
  DailyChecklist,
  DailyChecklistItem,
  DailyChecklistConfig,
  UpdateDailyChecklistConfigDto,
  CreateDailyItemDto,
  UpdateDailyItemDto,
  ReorderDailyItemsDto,
} from "@/types/dailyChecklist";

export async function fetchTodayChecklist(): Promise<DailyChecklist | null> {
  try {
    return await apiRequest<DailyChecklist>("/daily-checklists/today");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function generateDailyChecklist(): Promise<DailyChecklist> {
  return apiRequest<DailyChecklist>("/daily-checklists/generate", {
    method: "POST",
  });
}

export async function toggleDailyItem(
  dailyItemId: number
): Promise<DailyChecklistItem> {
  return apiRequest<DailyChecklistItem>(
    `/daily-checklists/items/${dailyItemId}/toggle`,
    { method: "PATCH" }
  );
}

export async function deleteDailyItem(dailyItemId: number): Promise<void> {
  return apiRequest<void>(`/daily-checklists/items/${dailyItemId}`, {
    method: "DELETE",
  });
}

export async function fetchDailyChecklistConfig(): Promise<DailyChecklistConfig> {
  return apiRequest<DailyChecklistConfig>("/daily-checklists/config");
}

export async function updateDailyChecklistConfig(
  data: UpdateDailyChecklistConfigDto
): Promise<DailyChecklistConfig> {
  return apiRequest<DailyChecklistConfig>("/daily-checklists/config", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function addDailyItem(
  data: CreateDailyItemDto
): Promise<DailyChecklistItem> {
  return apiRequest<DailyChecklistItem>("/daily-checklists/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDailyItem(
  dailyItemId: number,
  data: UpdateDailyItemDto
): Promise<DailyChecklistItem> {
  return apiRequest<DailyChecklistItem>(`/daily-checklists/items/${dailyItemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function reorderTodayChecklistItems(
  data: ReorderDailyItemsDto
): Promise<DailyChecklist> {
  return apiRequest<DailyChecklist>("/daily-checklists/today/reorder", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
