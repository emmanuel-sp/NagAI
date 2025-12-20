/**
 * ChecklistsEmptyState Component
 *
 * Displays empty state when user has no checklists.
 *
 * Parent: ChecklistsContainer
 * Children: EmptyState (common component)
 */

"use client";

import { IoListOutline } from "react-icons/io5";
import EmptyState from "@/components/common/EmptyState";

export default function ChecklistsEmptyState() {
  return (
    <EmptyState
      icon={<IoListOutline size={80} />}
      title="No checklists yet"
      description="Checklists will be created automatically when you add goals."
    />
  );
}
