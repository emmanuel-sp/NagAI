export function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function buildDirectionalOrder<T>(
  items: T[],
  itemId: number,
  direction: -1 | 1,
  getId: (item: T) => number
): number[] | null {
  const ids = items.map(getId);
  const currentIndex = ids.indexOf(itemId);
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ids.length) {
    return null;
  }
  return moveArrayItem(ids, currentIndex, targetIndex);
}

export function buildDraggedOrder<T>(
  items: T[],
  activeId: number,
  overId: number,
  getId: (item: T) => number
): number[] | null {
  const ids = items.map(getId);
  const activeIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return null;
  }
  return moveArrayItem(ids, activeIndex, overIndex);
}
