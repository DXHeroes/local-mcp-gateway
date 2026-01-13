/**
 * Helper functions for E2E tests
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: safe for tests */

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

/**
 * Create a test profile
 */
export async function createTestProfile(
  request: APIRequestContext,
  name: string,
  description?: string
): Promise<{ id: string; name: string; description?: string }> {
  const response = await retryRequest(request, 'post', 'http://localhost:3001/api/profiles', {
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
  config: { url?: string; command?: string; args?: string[]; env?: Record<string, string> }
): Promise<{ id: string; name: string; type: string; config: any }> {
  const response = await retryRequest(request, 'post', 'http://localhost:3001/api/mcp-servers', {
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
  serverId: string
): Promise<void> {
  const response = await retryRequest(
    request,
    'post',
    `http://localhost:3001/api/profiles/${profileId}/servers`,
    {
      data: {
        mcpServerId: serverId,
      },
    }
  );

  if (response.status() !== 200 && response.status() !== 201) {
    throw new Error(`Failed to assign server to profile: ${response.status()}`);
  }
}

/**
 * Customize a tool for a profile-server combination
 */
export async function customizeTool(
  request: APIRequestContext,
  profileId: string,
  serverId: string,
  toolName: string,
  customizations: {
    enabled?: boolean;
    customName?: string;
    customDescription?: string;
    customInputSchema?: any;
  }
): Promise<void> {
  // First, get current tools
  const getResponse = await retryRequest(
    request,
    'get',
    `http://localhost:3001/api/profiles/${profileId}/servers/${serverId}/tools`,
    {}
  );

  if (getResponse.status() !== 200) {
    throw new Error(`Failed to get tools: ${getResponse.status()}`);
  }

  const currentTools = await getResponse.json();

  // Update the specific tool
  const updatedTools = currentTools.map((tool: any) => {
    if (tool.name === toolName) {
      return {
        ...tool,
        ...customizations,
      };
    }
    return tool;
  });

  // Save updated tools
  const putResponse = await retryRequest(
    request,
    'put',
    `http://localhost:3001/api/profiles/${profileId}/servers/${serverId}/tools`,
    {
      data: { tools: updatedTools },
    }
  );

  if (putResponse.status() !== 200) {
    throw new Error(`Failed to customize tool: ${putResponse.status()}`);
  }
}

/**
 * Wait for tools cache to refresh (default 6 seconds to account for 5min cache + buffer)
 */
export async function waitForToolsCache(page: any, timeout = 6000): Promise<void> {
  await page.waitForTimeout(timeout);
}

/**
 * Expect a validation error message to be visible
 */
export async function expectValidationError(page: any, errorMessage: string): Promise<void> {
  const errorLocator = page.locator(`text=${errorMessage}`);
  await errorLocator.waitFor({ state: 'visible', timeout: 5000 });
}
