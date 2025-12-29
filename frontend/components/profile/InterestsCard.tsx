/** InterestsCard Component - Wrapper for ListCard with interests-specific props. Parent: ProfileContent */
"use client";
import ListCard from "./ListCard";

interface InterestsCardProps {
  items: string[];
  isEditing: boolean;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export default function InterestsCard({ items, isEditing, onAdd, onRemove }: InterestsCardProps) {
  return <ListCard title="Interests" subtitle="Things you care about" items={items} isEditing={isEditing} placeholder="Add an interest..." onAdd={onAdd} onRemove={onRemove} />;
}
