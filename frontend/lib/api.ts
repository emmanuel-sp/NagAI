export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  correlationId?: string;

  constructor(
    public status: number,
    public override message: string,
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
  const correlationId = crypto.randomUUID().slice(0, 8);
  const start = performance.now();

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Correlation-ID": correlationId,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const elapsed = Math.round(performance.now() - start);

    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[API] ${options.method || "GET"} ${endpoint} → ${response.status} (${elapsed}ms) [${correlationId}]`
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      // Spring ProblemDetail uses "detail" for the human-readable message.
      // Fall back through: detail → message → generic
      const message =
        errorData?.detail ||
        errorData?.message ||
        `Request failed with status ${response.status}`;
      const error = new ApiError(response.status, message, errorData?.errorCode, errorData?.timestamp);
      error.correlationId = correlationId;
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Network error (offline, DNS failure, CORS, etc.)
    const networkError = new ApiError(0, "Network error — please check your connection");
    networkError.correlationId = correlationId;
    throw networkError;
  }
}
