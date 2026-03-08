// AI-generated checklist suggestions (mock — no backend AI endpoint yet)

export interface AiChecklistSuggestion {
  title: string;
  notes?: string;
  deadline?: string;
}

const aiSuggestions: string[] = [
  "Complete the next milestone",
  "Review and refine approach",
  "Seek feedback from peers",
  "Document progress and learnings",
];

export async function generateChecklistItem(
  goalId: number,
  existingItems: { title: string }[]
): Promise<AiChecklistSuggestion> {
  // TODO: replace with real API call
  // return await apiRequest<AiChecklistSuggestion>("/ai/checklist-item", {
  //   method: "POST",
  //   body: JSON.stringify({ goalId, existingTitles: existingItems.map(i => i.title) }),
  // });

  await new Promise((resolve) => setTimeout(resolve, 200));

  const existingTitles = existingItems.map((item) => item.title.toLowerCase());
  const available = aiSuggestions.filter(
    (title) => !existingTitles.includes(title.toLowerCase())
  );

  const title =
    available[Math.floor(Math.random() * available.length)] ||
    "Complete next task";

  return { title, notes: "AI-generated suggestion" };
}

export async function generateFullChecklist(
  goalId: number
): Promise<AiChecklistSuggestion[]> {
  // TODO: replace with real API call
  // return await apiRequest<AiChecklistSuggestion[]>("/ai/full-checklist", {
  //   method: "POST",
  //   body: JSON.stringify({ goalId }),
  // });

  await new Promise((resolve) => setTimeout(resolve, 400));

  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return [
    { title: "Research best practices", notes: "AI-generated" },
    { title: "Break down goal into smaller milestones", notes: "AI-generated" },
    {
      title: "Create action plan with deadlines",
      notes: "AI-generated",
      deadline: weekFromNow,
    },
    { title: "Start working on first milestone", notes: "AI-generated" },
    {
      title: "Review progress and adjust plan",
      notes: "AI-generated",
      deadline: twoWeeks,
    },
  ];
}
