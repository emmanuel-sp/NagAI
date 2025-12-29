/** HabitsCard Component - Wrapper for ListCard with habits-specific props. Parent: ProfileContent */
"use client";
import ListCard from "./ListCard";

interface HabitsCardProps {
  items: string[];
  isEditing: boolean;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export default function HabitsCard({ items, isEditing, onAdd, onRemove }: HabitsCardProps) {
  return <ListCard title="Habits" subtitle="Your daily routines" items={items} isEditing={isEditing} placeholder="Add a habit..." onAdd={onAdd} onRemove={onRemove} />;
}
