import { apiRequest } from "@/lib/api";

export async function generateSmartGoalSuggestion(
  field: "specific" | "measurable" | "attainable" | "relevant" | "timely",
  goalTitle: string,
  goalDescription: string
): Promise<string> {
  const response = await apiRequest<{ suggestion: string }>("/ai/smart-goal-suggestion", {
    method: "POST",
    body: JSON.stringify({ field, goalTitle, goalDescription }),
  });
  return response.suggestion;
}
