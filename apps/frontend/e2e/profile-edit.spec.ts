/**
 * E2E tests for Profile Edit page (/profiles/:id/edit)
 *
 * Tests:
 * - Page load with profile name
 * - Back button navigation
 * - ProfileConfigCard with gateway endpoint
 * - Empty servers state
 * - Server card when assigned
 * - Share button
 * - Error state for non-existent profile
 */

import { expect, test } from '@playwright/test';
import { API_BASE, retryRequest, safeDelete } from './helpers';

const API_URL = API_BASE;

test.describe('Profile Edit Page', () => {
  test.describe.configure({ mode: 'serial' });

  let profileId: string;
  let profileName: string;

  test.beforeAll(async ({ request }) => {
    profileName = `e2e-edit-profile-${Date.now()}`;
    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName, description: 'Test profile for edit page' },
    });
    expect(response.status()).toBe(201);
    const profile = await response.json();
    profileId = profile.id;
  });

  test.afterAll(async ({ request }) => {
    if (profileId) {
      await safeDelete(request, `${API_URL}/api/profiles/${profileId}`);
    }
  });

  test('should display profile name in heading', async ({ page }) => {
    await page.goto(`/profiles/${profileId}/edit`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('profile-edit-heading')).toHaveText(profileName, {
      timeout: 15000,
    });
  });

  test('should display profile description', async ({ page }) => {
    await page.goto(`/profiles/${profileId}/edit`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Test profile for edit page')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate back to profiles via back button', async ({ page }) => {
    await page.goto(`/profiles/${profileId}/edit`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('profile-edit-heading')).toBeVisible({ timeout: 15000 });
    await page.getByTestId('back-button').click();
    await page.waitForURL('**/profiles', { timeout: 10000 });
  });

  test('should show empty servers state', async ({ page }) => {
    await page.goto(`/profiles/${profileId}/edit`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('No MCP servers assigned to this profile yet.')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should show Share button', async ({ page }) => {
    await page.goto(`/profiles/${profileId}/edit`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('profile-edit-heading')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
  });

  test('should show server card when server is assigned', async ({ page, request }) => {
    // Create a server and assign it
    const serverName = `e2e-edit-server-${Date.now()}`;
    const serverRes = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(serverRes.status()).toBe(201);
    const server = await serverRes.json();

    // Assign server to profile
    const assignRes = await retryRequest(
      request,
      'post',
      `${API_URL}/api/profiles/${profileId}/servers`,
      { data: { mcpServerId: server.id, order: 0 } },
    );
    expect(assignRes.status()).toBe(201);

    // Navigate to edit page
    await page.goto(`/profiles/${profileId}/edit`);
    await page.waitForLoadState('networkidle');

    // Server name should appear
    await expect(page.getByText(serverName)).toBeVisible({ timeout: 15000 });

    // Cleanup: remove server from profile and delete
    await safeDelete(request, `${API_URL}/api/profiles/${profileId}/servers/${server.id}`);
    await safeDelete(request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('should show error state for non-existent profile', async ({ page }) => {
    await page.goto('/profiles/non-existent-id-12345/edit');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('main').getByText('Profile not found')).toBeVisible();
    await expect(page.getByRole('button', { name: /back to profiles/i })).toBeVisible();
  });
});
