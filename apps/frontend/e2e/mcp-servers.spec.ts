/**
 * E2E tests for MCP Server management
 *
 * Tests:
 * - Server list display
 * - Create HTTP server
 * - Create SSE server
 * - Server with API key
 * - Server with OAuth
 * - Delete server
 * - Server detail page navigation
 */

import { expect, test } from '@playwright/test';
import { API_BASE, retryRequest, safeDelete } from './helpers';

const API_URL = API_BASE;

test.describe('MCP Servers', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({ request }) => {
    try {
      const response = await request.get(`${API_URL}/api/mcp-servers`);
      if (response.ok()) {
        const servers = await response.json();
        for (const server of servers) {
          if (server.name.startsWith('e2e-server-')) {
            await safeDelete(request, `${API_URL}/api/mcp-servers/${server.id}`);
          }
        }
      }
    } catch {
      // Ignore
    }
  });

  test('should display "Add MCP Server" button', async ({ page }) => {
    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Add MCP Server' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should create and display a remote HTTP server', async ({ page, request }) => {
    const serverName = `e2e-server-http-${Date.now()}`;

    // Create via API
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(response.status()).toBe(201);

    // Navigate
    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    // Server should be visible with name and type badge
    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('remote_http').first()).toBeVisible();
  });

  test('should create and display a remote SSE server', async ({ page, request }) => {
    const serverName = `e2e-server-sse-${Date.now()}`;

    // Create via API
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_sse',
        config: { url: 'https://example.com/mcp/sse' },
      },
    });
    expect(response.status()).toBe(201);

    // Navigate
    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('remote_sse').first()).toBeVisible();
  });

  test('should display API key badge when API key is configured', async ({ page, request }) => {
    const serverName = `e2e-server-apikey-${Date.now()}`;

    // Create with API key
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
        apiKeyConfig: {
          apiKey: 'test-api-key-123',
          headerName: 'X-API-Key',
          headerValue: 'test-api-key-123',
        },
      },
    });
    expect(response.status()).toBe(201);

    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
    // API Key badge and header info should be visible
    await expect(page.getByText('API Key').first()).toBeVisible();
    await expect(page.getByText(/Header: X-API-Key/i)).toBeVisible();
  });

  test('should display OAuth badge when OAuth is configured', async ({ page, request }) => {
    const serverName = `e2e-server-oauth-${Date.now()}`;

    // Create with OAuth config
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read', 'write'],
        },
      },
    });
    expect(response.status()).toBe(201);

    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
    // OAuth badge should be visible
    await expect(page.getByText('OAuth').first()).toBeVisible();
  });

  test('should delete a server via API and verify it disappears', async ({ page, request }) => {
    const serverName = `e2e-server-delete-${Date.now()}`;

    // Create
    const createResponse = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(createResponse.status()).toBe(201);
    const server = await createResponse.json();

    // Verify it shows
    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });

    // Delete via API
    const deleteResponse = await request.delete(`${API_URL}/api/mcp-servers/${server.id}`);
    expect(deleteResponse.status()).toBe(204);

    // Reload and verify it's gone
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: serverName })).not.toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to server detail page', async ({ page, request }) => {
    const serverName = `e2e-server-detail-${Date.now()}`;

    // Create
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(response.status()).toBe(201);
    const server = await response.json();

    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });

    // Click the View button
    await page.getByRole('button', { name: `View details for ${serverName}` }).click();

    // Should navigate to detail page
    await page.waitForURL(`**/mcp-servers/${server.id}`, { timeout: 10000 });
  });

  test('should create server via UI dialog', async ({ page }) => {
    const serverName = `e2e-server-ui-${Date.now()}`;

    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    // Open the form dialog
    await page.getByRole('button', { name: 'Add MCP Server' }).click();
    await expect(page.getByRole('heading', { name: 'Add MCP Server' })).toBeVisible({
      timeout: 5000,
    });

    // Fill form
    await page.locator('#server-name').fill(serverName);

    // Select type
    await page.locator('#server-type').click();
    await page.getByRole('option', { name: 'Remote HTTP' }).click();

    // Fill URL
    await page.locator('#server-url').fill('https://example.com/mcp-ui-test');

    // Submit
    await page.getByRole('button', { name: 'Create' }).click();

    // Server should appear in list
    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
  });

  test('should edit server via UI dialog', async ({ page, request }) => {
    const serverName = `e2e-server-edit-${Date.now()}`;

    // Create via API
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(response.status()).toBe(201);

    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });

    // Click Edit button
    await page.getByRole('button', { name: `Edit ${serverName}` }).click();

    // Edit dialog should open
    await expect(page.getByRole('heading', { name: 'Edit MCP Server' })).toBeVisible({
      timeout: 5000,
    });

    // Update name
    const nameInput = page.locator('#server-name');
    await nameInput.clear();
    await nameInput.fill(`${serverName}-updated`);

    // Submit
    await page.getByRole('button', { name: 'Update' }).click();

    // Updated name should appear
    await expect(page.getByRole('heading', { name: `${serverName}-updated` })).toBeVisible({
      timeout: 15000,
    });
  });

  test('should close form dialog on cancel', async ({ page }) => {
    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    // Open form
    await page.getByRole('button', { name: 'Add MCP Server' }).click();
    await expect(page.getByRole('heading', { name: 'Add MCP Server' })).toBeVisible({
      timeout: 5000,
    });

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Dialog should be closed
    await expect(page.getByRole('heading', { name: 'Add MCP Server' })).not.toBeVisible();
  });

  test('should show tools count badge', async ({ page, request }) => {
    const serverName = `e2e-server-tools-${Date.now()}`;

    // Create
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(response.status()).toBe(201);

    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
    // Tools count badge should be visible (likely "0 tools" for a non-reachable server)
    await expect(page.getByText(/\d+ tools?/).first()).toBeVisible({ timeout: 10000 });
  });
});
