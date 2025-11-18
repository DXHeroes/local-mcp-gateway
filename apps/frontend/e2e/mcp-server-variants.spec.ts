/**
 * E2E tests for all MCP server variants
 *
 * Tests for each variant:
 * - remote_http without authentication (context7)
 * - remote_http with API key
 * - remote_sse without authentication
 * - custom MCP server
 * - Edit MCP server (change type, URL, auth)
 * - Delete MCP server
 */

import { expect, test } from '@playwright/test';
import { retryRequest, safeDelete } from './helpers';
import { McpServersPage } from './pages/McpServersPage';

const API_URL = 'http://localhost:3001';
const CONTEXT7_MCP_URL = 'https://mcp.context7.com/mcp';

test.describe('MCP Server Variants', () => {
  const serverIds: string[] = [];

  test.afterEach(async ({ page }) => {
    // Cleanup all test servers
    for (const serverId of serverIds) {
      await safeDelete(page.request, `${API_URL}/api/mcp-servers/${serverId}`);
    }
    serverIds.length = 0;
  });

  test('should create remote_http server without authentication (context7)', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await page.waitForTimeout(300);

    const serverName = `test-http-no-auth-${Date.now()}`;

    await serversPage.clickAddServer();
    await serversPage.fillServerForm({
      name: serverName,
      type: 'remote_http',
      url: CONTEXT7_MCP_URL,
    });
    await serversPage.submitServerForm();

    // Verify server was created
    await page.waitForTimeout(500);
    const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
    expect(serversResponse.ok()).toBe(true);
    const servers = await serversResponse.json();
    const createdServer = servers.find((s: { name: string }) => s.name === serverName);
    expect(createdServer).toBeDefined();
    expect(createdServer.type).toBe('remote_http');
    expect(createdServer.config.url).toBe(CONTEXT7_MCP_URL);
    expect(createdServer.oauthConfig).toBeUndefined();
    expect(createdServer.apiKeyConfig).toBeUndefined();

    serverIds.push(createdServer.id);
  });

  test('should create remote_http server with API key', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await page.waitForTimeout(300);

    const serverName = `test-http-api-key-${Date.now()}`;
    const apiKey = 'test-api-key-12345';
    const headerName = 'X-API-Key';

    await serversPage.clickAddServer();
    await serversPage.fillServerForm({
      name: serverName,
      type: 'remote_http',
      url: 'https://example.com/mcp',
      apiKey,
      apiKeyHeaderName: headerName,
    });
    await serversPage.submitServerForm();

    // Verify server was created with API key config
    await page.waitForTimeout(500);
    const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
    expect(serversResponse.ok()).toBe(true);
    const servers = await serversResponse.json();
    const createdServer = servers.find((s: { name: string }) => s.name === serverName);
    expect(createdServer).toBeDefined();
    expect(createdServer.type).toBe('remote_http');
    expect(createdServer.apiKeyConfig).toBeDefined();
    expect(createdServer.apiKeyConfig.apiKey).toBe(apiKey);
    expect(createdServer.apiKeyConfig.headerName).toBe(headerName);

    serverIds.push(createdServer.id);
  });

  test('should create remote_sse server without authentication', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await page.waitForTimeout(300);

    const serverName = `test-sse-no-auth-${Date.now()}`;

    await serversPage.clickAddServer();
    await serversPage.fillServerForm({
      name: serverName,
      type: 'remote_sse',
      url: 'https://example.com/mcp/sse',
    });
    await serversPage.submitServerForm();

    // Verify server was created
    await page.waitForTimeout(500);
    const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
    expect(serversResponse.ok()).toBe(true);
    const servers = await serversResponse.json();
    const createdServer = servers.find((s: { name: string }) => s.name === serverName);
    expect(createdServer).toBeDefined();
    expect(createdServer.type).toBe('remote_sse');
    expect(createdServer.config.url).toBe('https://example.com/mcp/sse');

    serverIds.push(createdServer.id);
  });

  test('should edit MCP server - change URL', async ({ page }) => {
    // Create server first
    const serverName = `test-edit-url-${Date.now()}`;
    const createResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: CONTEXT7_MCP_URL,
          transport: 'http',
        },
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdServer = await createResponse.json();
    serverIds.push(createdServer.id);

    // Edit server URL
    const newUrl = 'https://example.com/mcp';
    const updateResponse = await retryRequest(
      page.request,
      'put',
      `${API_URL}/api/mcp-servers/${createdServer.id}`,
      {
        data: {
          name: serverName,
          type: 'remote_http',
          config: {
            url: newUrl,
            transport: 'http',
          },
        },
      }
    );
    expect(updateResponse.status()).toBe(200);

    // Verify server was updated
    await page.waitForTimeout(500);
    const getResponse = await page.request.get(`${API_URL}/api/mcp-servers/${createdServer.id}`);
    expect(getResponse.ok()).toBe(true);
    const updatedServer = await getResponse.json();
    expect(updatedServer.config.url).toBe(newUrl);
  });

  test('should edit MCP server - change type from remote_http to remote_sse', async ({ page }) => {
    // Create remote_http server first
    const serverName = `test-edit-type-${Date.now()}`;
    const createResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: CONTEXT7_MCP_URL,
          transport: 'http',
        },
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdServer = await createResponse.json();
    serverIds.push(createdServer.id);

    // Change type to remote_sse
    const updateResponse = await retryRequest(
      page.request,
      'put',
      `${API_URL}/api/mcp-servers/${createdServer.id}`,
      {
        data: {
          name: serverName,
          type: 'remote_sse',
          config: {
            url: 'https://example.com/mcp/sse',
            transport: 'sse',
          },
        },
      }
    );
    expect(updateResponse.status()).toBe(200);

    // Verify server type was changed
    await page.waitForTimeout(500);
    const getResponse = await page.request.get(`${API_URL}/api/mcp-servers/${createdServer.id}`);
    expect(getResponse.ok()).toBe(true);
    const updatedServer = await getResponse.json();
    expect(updatedServer.type).toBe('remote_sse');
    expect(updatedServer.config.url).toBe('https://example.com/mcp/sse');
  });

  test('should edit MCP server - add API key authentication', async ({ page }) => {
    // Create server without auth first
    const serverName = `test-add-api-key-${Date.now()}`;
    const createResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: CONTEXT7_MCP_URL,
          transport: 'http',
        },
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdServer = await createResponse.json();
    serverIds.push(createdServer.id);

    // Add API key config
    const apiKey = 'test-api-key-12345';
    const updateResponse = await retryRequest(
      page.request,
      'put',
      `${API_URL}/api/mcp-servers/${createdServer.id}`,
      {
        data: {
          name: serverName,
          type: 'remote_http',
          config: {
            url: CONTEXT7_MCP_URL,
            transport: 'http',
          },
          apiKeyConfig: {
            apiKey,
            headerName: 'X-API-Key',
            headerValue: `Bearer ${apiKey}`,
          },
        },
      }
    );
    expect(updateResponse.status()).toBe(200);

    // Verify API key was added
    await page.waitForTimeout(500);
    const getResponse = await page.request.get(`${API_URL}/api/mcp-servers/${createdServer.id}`);
    expect(getResponse.ok()).toBe(true);
    const updatedServer = await getResponse.json();
    expect(updatedServer.apiKeyConfig).toBeDefined();
    expect(updatedServer.apiKeyConfig.apiKey).toBe(apiKey);
  });

  test('should delete MCP server', async ({ page }) => {
    // Create server first
    const serverName = `test-delete-${Date.now()}`;
    const createResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: CONTEXT7_MCP_URL,
          transport: 'http',
        },
      },
    });
    expect(createResponse.status()).toBe(201);
    const createdServer = await createResponse.json();
    const serverId = createdServer.id;

    // Delete server
    const deleteResponse = await retryRequest(
      page.request,
      'delete',
      `${API_URL}/api/mcp-servers/${serverId}`
    );
    expect(deleteResponse.status()).toBe(200);

    // Verify server was deleted
    await page.waitForTimeout(500);
    const getResponse = await page.request.get(`${API_URL}/api/mcp-servers/${serverId}`);
    expect(getResponse.status()).toBe(404);
  });
});
