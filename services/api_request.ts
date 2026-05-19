function localFetch(url: string, options: RequestInit) {
  const isLocalhost = url.startsWith("https://localhost") || url.startsWith("https://127.0.0.1");
  if (!isLocalhost) return fetch(url, options);

  const prev = process.env["NODE_TLS_REJECT_UNAUTHORIZED"];
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  return fetch(url, options).finally(() => {
    if (prev === undefined) delete process.env["NODE_TLS_REJECT_UNAUTHORIZED"];
    else process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = prev;
  });
}

class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export default class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env["API_BASE_URL"] ?? "https://apicopa.omegafox.me/";
  }

  public async get<T>(
    endpoint: string,
    headers?: Record<string, string>,
    options?: { retries?: number; retryDelay?: number },
  ): Promise<T> {
    const retries = options?.retries ?? 0;
    const retryDelay = options?.retryDelay ?? 1000;

    return this.withRetry(
      async () => {
        const requestOptions: RequestInit = {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          method: "GET",
        };
        const url = `${this.baseUrl}${endpoint}`;

        const response = await localFetch(url, requestOptions);
        if (!response.ok) {
          let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
          try {
            const errorObject = await response.json();
            errorMessage = errorObject.message || errorObject.error || errorMessage;
          } catch {
            // If JSON parsing fails, use the default error message
          }
          throw new HttpError(errorMessage, response.status);
        }

        const jsonResponse: { data: T } = await response.json();
        return jsonResponse.data;
      },
      retries,
      retryDelay,
    );
  }

  public async post<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>,
    options?: { retries?: number; retryDelay?: number },
  ): Promise<T> {
    const retries = options?.retries ?? 0;
    const retryDelay = options?.retryDelay ?? 1000;

    return this.withRetry(
      async () => {
        const requestOptions: RequestInit = {
          body: JSON.stringify(data),
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          method: "POST",
        };
        const url = `${this.baseUrl}${endpoint}`;

        const response = await localFetch(url, requestOptions);
        if (!response.ok) {
          let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
          try {
            const errorObject = await response.json();
            errorMessage = errorObject.message || errorObject.error || errorMessage;
          } catch {
            // If JSON parsing fails, use the default error message
          }
          throw new HttpError(errorMessage, response.status);
        }
        const jsonResponse: { data: T } = await response.json();
        return jsonResponse.data;
      },
      retries,
      retryDelay,
    );
  }

  public async websocket(endpoint: string) {
    const url = `${this.baseUrl}${endpoint}`;
    return new WebSocket(url);
  }

  private isRetryableError(error: Error): boolean {
    // Network errors (no status) should be retried
    if (!(error instanceof HttpError) || error.status === undefined) {
      return true;
    }

    const status = error.status;
    // Retry on server errors (5xx), request timeout, and rate limiting
    return (
      status >= 500 || // Server errors
      status === 408 || // Request Timeout
      status === 429 // Too Many Requests
    );
  }

  private async withRetry<T>(operation: () => Promise<T>, retries: number = 0, retryDelay: number = 1000): Promise<T> {
    let lastError: Error;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if this is the last attempt or if error is not retryable
        if (attempt === retries || !this.isRetryableError(lastError)) {
          throw lastError;
        }

        // Exponential backoff: delay increases with each attempt
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
    throw lastError!;
  }
}
