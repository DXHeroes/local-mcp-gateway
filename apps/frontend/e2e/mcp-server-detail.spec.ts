/**
 * E2E tests for MCP Server Detail page (/mcp-servers/:id)
 *
 * Tests:
 * - Page load with server details
 * - Connection status card
 * - Tools list (empty state)
 * - Debug logs section
 * - Back to Servers navigation
 * - Share button
 * - Error state for non-existent server
 */

import { expect, test } from '@playwright/test';
import { API_BASE, retryRequest, safeDelete } from './helpers';

const API_URL = API_BASE;

test.describe('MCP Server Detail', () => {
  test.describe.configure({ mode: 'serial' });

  let serverId: string;
  let serverName: string;

  test.beforeAll(async ({ request }) => {
    serverName = `e2e-detail-server-${Date.now()}`;
    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(response.status()).toBe(201);
    const server = await response.json();
    serverId = server.id;
  });

  test.afterAll(async ({ request }) => {
    if (serverId) {
      await safeDelete(request, `${API_URL}/api/mcp-servers/${serverId}`);
    }
  });

  test('should display server name and type', async ({ page }) => {
    await page.goto(`/mcp-servers/${serverId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Type: remote_http`)).toBeVisible();
  });

  test('should display connection status card', async ({ page }) => {
    await page.goto(`/mcp-servers/${serverId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Connection Status')).toBeVisible({ timeout: 15000 });
    // Status should be one of: Connected, Error, Unknown
    const statusText = page.getByText(/Connected|Error|Unknown/);
    await expect(statusText.first()).toBeVisible();
  });

  test('should show tools section with empty state', async ({ page }) => {
    await page.goto(`/mcp-servers/${serverId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Tools \(\d+\)/)).toBeVisible({ timeout: 15000 });
    // Unreachable server should show no tools
    await expect(page.getByText('No tools available')).toBeVisible();
  });

  test('should show debug logs section', async ({ page }) => {
    await page.goto(`/mcp-servers/${serverId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Debug Logs \(\d+\)/)).toBeVisible({ timeout: 15000 });
  });

  test('should navigate back to servers list', async ({ page }) => {
    await page.goto(`/mcp-servers/${serverId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Back to Servers' }).click();
    await page.waitForURL('**/mcp-servers', { timeout: 10000 });
  });

  test('should show Share button', async ({ page }) => {
    await page.goto(`/mcp-servers/${serverId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
  });

  test('should show error state for non-existent server', async ({ page }) => {
    await page.goto('/mcp-servers/non-existent-id-12345');
    await page.waitForLoadState('networkidle');

    // Should show error or "Server not found"
    await expect(page.getByText(/server not found|failed to fetch/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Back to Servers' })).toBeVisible();
  });
});
