/**
 * Checklists Page
 *
 * Main page for the Checklists module. This page only imports and renders the ChecklistsContainer component.
 * All business logic and state management is handled in the container component.
 *
 * Component Hierarchy:
 * - ChecklistsPage (this page)
 *   └── ChecklistsContainer
 *       ├── ChecklistsHeader
 *       ├── ChecklistsEmptyState (when no checklists)
 *       └── ChecklistsList
 *           └── Checklist (for each checklist)
 *               ├── ChecklistHeader
 *               ├── ChecklistItem (for each item)
 *               ├── ChecklistActions
 *               └── AddItemForm (when adding new item)
 */

import ChecklistsContainer from "@/components/checklists/ChecklistsContainer";

export default function ChecklistsPage() {
  return <ChecklistsContainer />;
}
