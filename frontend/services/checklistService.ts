import {
  Checklist,
  ChecklistItem,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from "@/types/checklist";

// Dummy data
let mockChecklists: Checklist[] = [
  {
    id: "checklist-1",
    goalId: "goal-1",
    goalTitle: "Learn TypeScript",
    items: [
      {
        id: "item-1",
        title: "Read TypeScript handbook",
        completed: true,
        createdAt: new Date("2024-01-15"),
        completedAt: new Date("2024-01-18"),
        order: 0,
      },
      {
        id: "item-2",
        title: "Complete advanced types tutorial",
        completed: false,
        createdAt: new Date("2024-01-16"),
        order: 1,
      },
    ],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-18"),
  },
  {
    id: "checklist-2",
    goalId: "goal-2",
    goalTitle: "Build a SaaS Product",
    items: [
      {
        id: "item-3",
        title: "Define product requirements",
        completed: true,
        createdAt: new Date("2024-01-20"),
        completedAt: new Date("2024-01-22"),
        order: 0,
      },
      {
        id: "item-4",
        title: "Design database schema",
        completed: false,
        createdAt: new Date("2024-01-21"),
        order: 1,
      },
      {
        id: "item-5",
        title: "Implement authentication",
        completed: false,
        createdAt: new Date("2024-01-21"),
        order: 2,
      },
    ],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-22"),
  },
];
// Dummy data

export async function fetchChecklists(): Promise<Checklist[]> {
  // API call here
  // return await apiRequest<Checklist[]>("/checklists");

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockChecklists.map((checklist) => ({
    ...checklist,
    items: checklist.items.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
    })),
    createdAt: new Date(checklist.createdAt),
    updatedAt: new Date(checklist.updatedAt),
  }));
  // Dummy data
}

export async function fetchChecklistByGoalId(
  goalId: string
): Promise<Checklist | null> {
  // API call here
  // return await apiRequest<Checklist>(`/checklists/goal/${goalId}`);

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 200));
  const checklist = mockChecklists.find((c) => c.goalId === goalId);
  if (!checklist) return null;

  return {
    ...checklist,
    items: checklist.items.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
    })),
    createdAt: new Date(checklist.createdAt),
    updatedAt: new Date(checklist.updatedAt),
  };
  // Dummy data
}

export async function createChecklistItem(
  checklistId: string,
  item: CreateChecklistItemDto
): Promise<ChecklistItem> {
  // API call here
  // return await apiRequest<ChecklistItem>(`/checklists/${checklistId}/items`, {
  //   method: "POST",
  //   body: item,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 200));
  const checklist = mockChecklists.find((c) => c.id === checklistId);
  if (!checklist) throw new Error("Checklist not found");

  const newItem: ChecklistItem = {
    id: `item-${Date.now()}`,
    title: item.title,
    notes: item.notes,
    deadline: item.deadline,
    completed: false,
    createdAt: new Date(),
    order: checklist.items.length,
  };

  checklist.items.push(newItem);
  checklist.updatedAt = new Date();
  return newItem;
  // Dummy data
}

export async function updateChecklistItem(
  checklistId: string,
  itemId: string,
  updates: UpdateChecklistItemDto
): Promise<ChecklistItem> {
  // API call here
  // return await apiRequest<ChecklistItem>(`/checklists/${checklistId}/items/${itemId}`, {
  //   method: "PATCH",
  //   body: updates,
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 200));
  const checklist = mockChecklists.find((c) => c.id === checklistId);
  if (!checklist) throw new Error("Checklist not found");

  const item = checklist.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item not found");

  if (updates.title !== undefined) item.title = updates.title;
  if (updates.notes !== undefined) item.notes = updates.notes;
  if (updates.deadline !== undefined) item.deadline = updates.deadline;
  if (updates.order !== undefined) item.order = updates.order;
  if (updates.completed !== undefined) {
    item.completed = updates.completed;
    item.completedAt = updates.completed ? new Date() : undefined;
  }

  checklist.updatedAt = new Date();
  return item;
  // Dummy data
}

export async function deleteChecklistItem(
  checklistId: string,
  itemId: string
): Promise<void> {
  // API call here
  // await apiRequest(`/checklists/${checklistId}/items/${itemId}`, {
  //   method: "DELETE",
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 200));
  const checklist = mockChecklists.find((c) => c.id === checklistId);
  if (!checklist) throw new Error("Checklist not found");

  const itemIndex = checklist.items.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) throw new Error("Item not found");

  checklist.items.splice(itemIndex, 1);
  checklist.updatedAt = new Date();
  // Dummy data
}

export async function reorderChecklistItems(
  checklistId: string,
  itemIds: string[]
): Promise<void> {
  // API call here
  // await apiRequest(`/checklists/${checklistId}/reorder`, {
  //   method: "PATCH",
  //   body: { itemIds },
  // });

  // Dummy data
  await new Promise((resolve) => setTimeout(resolve, 200));
  const checklist = mockChecklists.find((c) => c.id === checklistId);
  if (!checklist) throw new Error("Checklist not found");

  itemIds.forEach((itemId, index) => {
    const item = checklist.items.find((i) => i.id === itemId);
    if (item) item.order = index;
  });

  checklist.items.sort((a, b) => a.order - b.order);
  checklist.updatedAt = new Date();
  // Dummy data
}
