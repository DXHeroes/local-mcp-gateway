/**
 * Helper functions for E2E tests
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: safe for tests */

import type { APIRequestContext } from '@playwright/test';

/**
 * Base URL for API calls via Vite proxy.
 * Uses the same port as the frontend (E2E_PORT env or 5173 by default)
 * to ensure auth cookies are sent with requests.
 */
export const API_BASE = `http://localhost:${process.env.E2E_PORT || 5173}`;

/**
 * Retry a request with exponential backoff if rate limited
 */
export async function retryRequest<T>(
  request: APIRequestContext,
  method: 'post' | 'put' | 'delete' | 'get',
  url: string,
  options?: Parameters<APIRequestContext['post']>[1],
  maxRetries = 5,
): Promise<{ status: () => number; json: () => Promise<T> }> {
  let response = await (request[method] as any)(url, options);
  let retries = 0;

  while (response.status() === 429 && retries < maxRetries) {
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

/**
 * Create a test profile
 */
export async function createTestProfile(
  request: APIRequestContext,
  name: string,
  description?: string,
): Promise<{ id: string; name: string; description?: string }> {
  const response = await retryRequest(request, 'post', `${API_BASE}/api/profiles`, {
    data: {
      name,
      description: description || `Test profile: ${name}`,
    },
  });

  if (response.status() !== 201) {
    throw new Error(`Failed to create profile: ${response.status()}`);
  }

  return await response.json();
}

/**
 * Create a test MCP server
 */
export async function createTestMcpServer(
  request: APIRequestContext,
  name: string,
  type: 'remote_http' | 'remote_sse' | 'local_stdio',
  config: { url?: string; command?: string; args?: string[]; env?: Record<string, string> },
): Promise<{ id: string; name: string; type: string; config: any }> {
  const response = await retryRequest(request, 'post', `${API_BASE}/api/mcp-servers`, {
    data: {
      name,
      type,
      config,
    },
  });

  if (response.status() !== 201) {
    throw new Error(`Failed to create MCP server: ${response.status()}`);
  }

  return await response.json();
}

/**
 * Assign an MCP server to a profile
 */
export async function assignServerToProfile(
  request: APIRequestContext,
  profileId: string,
  serverId: string,
): Promise<void> {
  const response = await retryRequest(
    request,
    'post',
    `${API_BASE}/api/profiles/${profileId}/servers`,
    {
      data: {
        mcpServerId: serverId,
      },
    },
  );

  if (response.status() !== 200 && response.status() !== 201) {
    throw new Error(`Failed to assign server to profile: ${response.status()}`);
  }
}
