import { apiRequest } from "@/lib/api";

export interface AiChecklistSuggestion {
  title: string;
  notes?: string;
  deadline?: string;
}

export async function generateChecklistItem(
  goalId: number
): Promise<AiChecklistSuggestion> {
  return await apiRequest<AiChecklistSuggestion>("/ai/checklist-item", {
    method: "POST",
    body: JSON.stringify({ goalId }),
  });
}

export async function generateFullChecklist(
  goalId: number
): Promise<AiChecklistSuggestion[]> {
  return await apiRequest<AiChecklistSuggestion[]>("/ai/full-checklist", {
    method: "POST",
    body: JSON.stringify({ goalId }),
  });
}
