import { apiRequest } from "@/lib/api";

type SmartField = "specific" | "measurable" | "attainable" | "relevant" | "timely";

export async function generateSmartGoalSuggestion(
  field: SmartField,
  goalTitle: string,
  goalDescription: string,
  existingFields?: Partial<Record<SmartField, string>>,
  stepsTaken?: string
): Promise<string> {
  const response = await apiRequest<{ suggestion: string }>("/ai/smart-goal-suggestion", {
    method: "POST",
    body: JSON.stringify({ field, goalTitle, goalDescription, existingFields, stepsTaken: stepsTaken || undefined }),
  });
  return response.suggestion;
}
