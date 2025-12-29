/** HobbiesCard Component - Wrapper for ListCard with hobbies-specific props. Parent: ProfileContent */
"use client";
import ListCard from "./ListCard";

interface HobbiesCardProps {
  items: string[];
  isEditing: boolean;
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}

export default function HobbiesCard({ items, isEditing, onAdd, onRemove }: HobbiesCardProps) {
  return <ListCard title="Hobbies" subtitle="What you love to do" items={items} isEditing={isEditing} placeholder="Add a hobby..." onAdd={onAdd} onRemove={onRemove} />;
}
