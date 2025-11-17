/**
 * Helper functions for E2E tests
 */

import type { APIRequestContext } from '@playwright/test';

/**
 * Retry a request with exponential backoff if rate limited
 */
export async function retryRequest<T>(
  request: APIRequestContext,
  method: 'post' | 'put' | 'delete' | 'get',
  url: string,
  options?: Parameters<APIRequestContext['post']>[1],
  maxRetries = 5
): Promise<{ status: () => number; json: () => Promise<T> }> {
  let response = await (request[method] as any)(url, options);
  let retries = 0;

  while (response.status() === 429 && retries < maxRetries) {
    // Exponential backoff: 2s, 4s, 6s, 8s, 10s
    await new Promise((resolve) => setTimeout(resolve, 2000 * (retries + 1)));
    response = await (request[method] as any)(url, options);
    retries++;
  }

  return response;
}

/**
 * Safely delete a resource, ignoring errors if backend is not available
 */
export async function safeDelete(request: APIRequestContext, url: string): Promise<void> {
  try {
    await request.delete(url);
  } catch {
    // Ignore cleanup errors - test already verified functionality
  }
}
