import { apiRequest } from "@/lib/api";
import {
  ChecklistItem,
  Checklist,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from "@/types/checklist";
import { fetchGoals } from "@/services/goalService";

export async function fetchChecklists(): Promise<Checklist[]> {
  const goals = await fetchGoals();
  const checklists = await Promise.all(
    goals.map(async (goal) => {
      const items = await apiRequest<ChecklistItem[]>(
        `/checklists/goal/${goal.goalId}`
      );
      return { goalId: goal.goalId, goalTitle: goal.title, items };
    })
  );
  return checklists;
}

export async function createChecklistItem(
  data: CreateChecklistItemDto
): Promise<ChecklistItem> {
  return apiRequest<ChecklistItem>("/checklists", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChecklistItem(
  data: UpdateChecklistItemDto
): Promise<ChecklistItem> {
  return apiRequest<ChecklistItem>("/checklists", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function toggleChecklistItem(
  checklistId: number
): Promise<ChecklistItem> {
  return apiRequest<ChecklistItem>(`/checklists/${checklistId}/toggle`, {
    method: "PATCH",
  });
}

export async function deleteChecklistItem(
  checklistId: number
): Promise<void> {
  return apiRequest<void>(`/checklists/${checklistId}`, {
    method: "DELETE",
  });
}
