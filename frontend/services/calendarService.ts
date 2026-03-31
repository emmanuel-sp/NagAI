const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Calendar API error: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function fetchCalendarAuthUrl(): Promise<{ url: string }> {
  return apiRequest<{ url: string }>("/calendar/auth-url");
}

export async function disconnectCalendar(): Promise<void> {
  return apiRequest<void>("/calendar/disconnect", { method: "DELETE" });
}
