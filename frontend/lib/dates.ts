/**
 * Parse a UTC datetime string from the backend.
 *
 * The backend stores LocalDateTime (UTC) and Jackson serializes it without
 * a timezone suffix (e.g. "2026-03-22T08:00:00"). JavaScript's Date constructor
 * treats bare ISO strings as local time, so we append "Z" to force UTC
 * interpretation. toLocaleTimeString / toLocaleDateString then correctly
 * convert to the user's browser timezone.
 */
export function parseUtcDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  // If it already ends with Z or has a timezone offset (+HH:MM / -HH:MM), leave it alone
  if (/Z$|[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  return new Date(dateStr + "Z");
}
