export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function getBaseUrl() {
  // If you set NEXT_PUBLIC_API_BASE_URL (e.g. http://localhost:8080), requests go there.
  // Otherwise, it uses same-origin (useful for Next.js route handlers under /api).
  return (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = baseUrl ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : path;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  const body = text ? (safeJsonParse(text) ?? text) : null;

  if (!res.ok) {
    const message =
      typeof body === 'object' && body && 'message' in body
        ? String((body as any).message)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }

  return body as T;
}

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

