import {
  Checklist,
  ChecklistItem,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
} from "@/types/checklist";
import { MOCK_CHECKLISTS } from "@/lib/mockData";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Use centralized mock data
let mockChecklists: Checklist[] = [...MOCK_CHECKLISTS];

export async function fetchChecklists(): Promise<Checklist[]> {
  try {
    // TODO: Replace with real API call
    // const response = await fetch(`${API_BASE_URL}/api/checklists`);
    // if (!response.ok) throw new Error("Failed to fetch checklists");
    // return await response.json();

    // Mock implementation
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
  } catch (error) {
    console.error("Error fetching checklists:", error);
    throw error;
  }
}

export async function fetchChecklistByGoalId(
  goalId: string
): Promise<Checklist | null> {
  try {
    // TODO: Replace with real API call
    // const response = await fetch(`${API_BASE_URL}/api/checklists/goal/${goalId}`);
    // if (response.status === 404) return null;
    // if (!response.ok) throw new Error("Failed to fetch checklist");
    // return await response.json();

    // Mock implementation
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
  } catch (error) {
    console.error("Error fetching checklist:", error);
    throw error;
  }
}

export async function createChecklistItem(
  checklistId: string,
  item: CreateChecklistItemDto
): Promise<ChecklistItem> {
  try {
    // TODO: Replace with real API call
    // const response = await fetch(`${API_BASE_URL}/api/checklists/${checklistId}/items`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(item),
    // });
    // if (!response.ok) throw new Error("Failed to create checklist item");
    // return await response.json();

    // Mock implementation
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
  } catch (error) {
    console.error("Error creating checklist item:", error);
    throw error;
  }
}

export async function updateChecklistItem(
  checklistId: string,
  itemId: string,
  updates: UpdateChecklistItemDto
): Promise<ChecklistItem> {
  try {
    // TODO: Replace with real API call
    // const response = await fetch(
    //   `${API_BASE_URL}/api/checklists/${checklistId}/items/${itemId}`,
    //   {
    //     method: "PATCH",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(updates),
    //   }
    // );
    // if (!response.ok) throw new Error("Failed to update checklist item");
    // return await response.json();

    // Mock implementation
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
  } catch (error) {
    console.error("Error updating checklist item:", error);
    throw error;
  }
}

export async function deleteChecklistItem(
  checklistId: string,
  itemId: string
): Promise<void> {
  try {
    // TODO: Replace with real API call
    // const response = await fetch(
    //   `${API_BASE_URL}/api/checklists/${checklistId}/items/${itemId}`,
    //   {
    //     method: "DELETE",
    //   }
    // );
    // if (!response.ok) throw new Error("Failed to delete checklist item");

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 200));
    const checklist = mockChecklists.find((c) => c.id === checklistId);
    if (!checklist) throw new Error("Checklist not found");

    const itemIndex = checklist.items.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) throw new Error("Item not found");

    checklist.items.splice(itemIndex, 1);
    checklist.updatedAt = new Date();
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    throw error;
  }
}

export async function reorderChecklistItems(
  checklistId: string,
  itemIds: string[]
): Promise<void> {
  try {
    // TODO: Replace with real API call
    // const response = await fetch(
    //   `${API_BASE_URL}/api/checklists/${checklistId}/reorder`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ itemIds }),
    //   }
    // );
    // if (!response.ok) throw new Error("Failed to reorder items");

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 200));
    const checklist = mockChecklists.find((c) => c.id === checklistId);
    if (!checklist) throw new Error("Checklist not found");

    itemIds.forEach((itemId, index) => {
      const item = checklist.items.find((i) => i.id === itemId);
      if (item) item.order = index;
    });

    checklist.items.sort((a, b) => a.order - b.order);
    checklist.updatedAt = new Date();
  } catch (error) {
    console.error("Error reordering checklist items:", error);
    throw error;
  }
}
