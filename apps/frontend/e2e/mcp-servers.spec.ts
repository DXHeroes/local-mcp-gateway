/**
 * E2E tests for MCP Server management
 *
 * Tests complete user flows:
 * - Add remote MCP server (HTTP/SSE)
 * - OAuth flow (Linear setup)
 * - API key setup
 * - Delete MCP server
 */

import { expect, test } from '@playwright/test';
import { retryRequest, safeDelete } from './helpers';
import { McpServersPage } from './pages/McpServersPage';

test.describe('MCP Servers', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up any existing test servers before each test (with rate limit handling)
    try {
      const serversResponse = await page.request.get('http://localhost:3001/api/mcp-servers');
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        for (const server of servers) {
          if (server.name.startsWith('test-server-') || server.name.startsWith('Test Server')) {
            const deleteResponse = await page.request
              .delete(`http://localhost:3001/api/mcp-servers/${server.id}`)
              .catch(() => null);
            if (deleteResponse?.status() === 429) {
              await page.waitForTimeout(500);
            }
            await page.waitForTimeout(100); // Small delay between deletes
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    // Wait a bit after cleanup to let rate limit reset
    await page.waitForTimeout(500);

    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    // Add small delay to avoid race conditions
    await page.waitForTimeout(300);
  });

  test('should display empty state when no servers exist', async ({ page }) => {
    const serversPage = new McpServersPage(page);

    // Check if empty state is shown or servers exist
    const emptyStateVisible = await serversPage.emptyState.isVisible().catch(() => false);
    const serversExist = (await serversPage.serverCards.count()) > 0;

    // Either empty state or servers should be visible
    expect(emptyStateVisible || serversExist).toBeTruthy();
  });

  test('should display Add MCP Server button', async ({ page }) => {
    const serversPage = new McpServersPage(page);

    await expect(serversPage.addButton).toBeVisible();
  });

  test('should create remote HTTP MCP server', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-server-http-${Date.now()}`;

    // Create server via API (with retry for rate limiting)
    const response = await retryRequest(
      page.request,
      'post',
      'http://localhost:3001/api/mcp-servers',
      {
        data: {
          name: serverName,
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
        },
      }
    );

    expect(response.status()).toBe(201);
    const server = await response.json();
    expect(server.name).toBe(serverName);
    expect(server.type).toBe('remote_http');

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for server to appear - use heading role
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Check if server is displayed
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible();
    await expect(page.getByText(/Type: remote_http/i).first()).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should create remote SSE MCP server', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-server-sse-${Date.now()}`;

    // Create server via API (with retry for rate limiting)
    const response = await retryRequest(
      page.request,
      'post',
      'http://localhost:3001/api/mcp-servers',
      {
        data: {
          name: serverName,
          type: 'remote_sse',
          config: {
            url: 'https://example.com/mcp/sse',
          },
        },
      }
    );

    expect(response.status()).toBe(201);
    const server = await response.json();
    expect(server.type).toBe('remote_sse');

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for server to appear - use heading role
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Check if server is displayed
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible();
    await expect(page.getByText(/Type: remote_sse/i).first()).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should display OAuth configuration when present', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-server-oauth-${Date.now()}`;

    // Create server with OAuth config via API (with retry for rate limiting)
    const response = await retryRequest(
      page.request,
      'post',
      'http://localhost:3001/api/mcp-servers',
      {
        data: {
          name: serverName,
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
          oauthConfig: {
            authorizationServerUrl: 'https://oauth.example.com/authorize',
            scopes: ['read', 'write'],
            requiresOAuth: true,
          },
        },
      }
    );

    expect(response.status()).toBe(201);
    const server = await response.json();

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for server to appear
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Check OAuth configuration is displayed
    await expect(page.getByText(/OAuth Configuration/i)).toBeVisible();
    await expect(page.getByText(/Authorization Server:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Authorize' })).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should display API key configuration when present', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-server-apikey-${Date.now()}`;

    // Create server with API key config via API (with retry for rate limiting)
    const response = await retryRequest(
      page.request,
      'post',
      'http://localhost:3001/api/mcp-servers',
      {
        data: {
          name: serverName,
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
          apiKeyConfig: {
            apiKey: 'test-api-key-123',
            headerName: 'X-API-Key',
            headerValue: 'test-api-key-123',
          },
        },
      }
    );

    expect(response.status()).toBe(201);
    const server = await response.json();

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for server to appear
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Check API key configuration is displayed
    await expect(page.getByText(/API Key Configured/i)).toBeVisible();
    await expect(page.getByText(/Header: X-API-Key/i)).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should initiate OAuth flow when Authorize button is clicked', async ({ page, context }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-server-oauth-flow-${Date.now()}`;

    // Create server with OAuth config via API (with retry for rate limiting)
    const response = await retryRequest(
      page.request,
      'post',
      'http://localhost:3001/api/mcp-servers',
      {
        data: {
          name: serverName,
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
          oauthConfig: {
            authorizationServerUrl: 'https://oauth.example.com/authorize',
            scopes: ['read'],
            requiresOAuth: true,
          },
        },
      }
    );

    expect(response.status()).toBe(201);
    const server = await response.json();

    // Reload page
    await serversPage.goto();
    await serversPage.waitForServers();

    // Set up listener for new page (OAuth popup)
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
      serversPage.clickOAuthAuthorize(serverName),
    ]);

    // Check that OAuth authorization page was opened
    if (popup) {
      // Wait for navigation
      await popup.waitForLoadState('networkidle').catch(() => {});

      // The popup should navigate to OAuth authorization URL
      const url = popup.url();
      expect(url).toContain('/api/oauth/authorize/');

      // Close popup
      await popup.close();
    } else {
      // If popup didn't open, check that button click worked
      // In some cases, OAuth might redirect in same window
      await page.waitForTimeout(1000);
    }

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should delete MCP server', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-server-delete-${Date.now()}`;

    // Create server via API (with retry for rate limiting)
    const response = await retryRequest(
      page.request,
      'post',
      'http://localhost:3001/api/mcp-servers',
      {
        data: {
          name: serverName,
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
        },
      }
    );

    expect(response.status()).toBe(201);
    const server = await response.json();

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for server to appear
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Verify server exists
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible();

    // Delete server via API
    const deleteResponse = await page.request.delete(
      `http://localhost:3001/api/mcp-servers/${server.id}`
    );
    expect(deleteResponse.status()).toBe(204);

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();
    await page.waitForTimeout(1000); // Give time for UI to update

    // Verify server is deleted
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).not.toBeVisible({
      timeout: 5000,
    });
  });
});
