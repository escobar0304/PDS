const TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [600, 1400];

async function attemptFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch wrapper with:
 * - 10s timeout per attempt via AbortController
 * - Auto-retry with exponential backoff for GET (3 attempts total)
 * - No retry for POST/PUT/DELETE (mutations must not repeat)
 * - Throws ApiError with user-friendly PT-PT messages
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isReadOnly = !options.method || options.method === 'GET';
  const maxAttempts = isReadOnly ? 3 : 1;
  let lastError: Error = new ApiError('Erro desconhecido');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1])
      );
    }

    try {
      const res = await attemptFetch(url, options);

      // 4xx: client error — don't retry, surface message from API
      if (res.status >= 400 && res.status < 500) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(body?.error ?? `Erro ${res.status}`, res.status);
      }

      // 5xx: server error — retryable
      if (!res.ok) {
        throw new ApiError(`Erro do servidor (${res.status})`, res.status);
      }

      return res.json() as Promise<T>;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(
          'O pedido expirou. Verifique a sua ligação e tente novamente.'
        );
      }
      // 4xx: don't retry
      if (
        err instanceof ApiError &&
        err.status !== undefined &&
        err.status >= 400 &&
        err.status < 500
      ) {
        throw err;
      }
      lastError = err instanceof Error ? err : new ApiError(String(err));
    }
  }

  // After all retries: wrap network TypeErrors into a user-friendly message
  if (lastError instanceof TypeError) {
    throw new ApiError(
      'Não foi possível ligar ao servidor. Verifique a sua ligação e tente novamente.'
    );
  }
  throw lastError;
}
