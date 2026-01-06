export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errorCode?: string,
    public timestamp?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new ApiError(
      response.status,
      errorData?.message || `Request failed with status ${response.status}`,
      errorData?.errorCode,
      errorData?.timestamp
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json();
}
