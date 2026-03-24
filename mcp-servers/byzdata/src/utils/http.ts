export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
  ) {
    super(`HTTP ${status} ${statusText} for ${url}`);
    this.name = 'HttpError';
  }
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T | null> {
  const response = await fetch(url, {
    signal: options?.signal ?? AbortSignal.timeout(15_000),
    ...options,
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, url);
  }

  return (await response.json()) as T;
}
