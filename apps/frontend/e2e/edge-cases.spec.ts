/**
 * E2E tests for edge cases and error handling
 *
 * Tests:
 * - Rapid navigation between pages
 * - Create item appears without full reload
 * - Long profile name handling
 * - Profile description display
 * - Empty state shows Quick Start guide
 */

import { expect, test } from '@playwright/test';
import { API_BASE, retryRequest, safeDelete } from './helpers';

const API_URL = API_BASE;

test.describe('Edge Cases', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({ request }) => {
    try {
      const profiles = await (await request.get(`${API_URL}/api/profiles`)).json();
      for (const p of profiles) {
        if (p.name.startsWith('e2e-edge-')) {
          await safeDelete(request, `${API_URL}/api/profiles/${p.id}`);
        }
      }
    } catch {
      // Ignore
    }
    try {
      const servers = await (await request.get(`${API_URL}/api/mcp-servers`)).json();
      for (const s of servers) {
        if (s.name.startsWith('e2e-edge-')) {
          await safeDelete(request, `${API_URL}/api/mcp-servers/${s.id}`);
        }
      }
    } catch {
      // Ignore
    }
  });

  test('rapid navigation between pages should not break state', async ({ page }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Rapidly navigate between pages
    await page.goto('/mcp-servers');
    await page.goto('/debug-logs');
    await page.goto('/profiles');
    await page.goto('/organizations');
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Page should still be functional
    await expect(page.getByRole('button', { name: /new profile/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('created profile should appear without full page reload', async ({ page, request }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    const profileName = `e2e-edge-immediate-${Date.now()}`;

    // Create via UI dialog
    await page.getByRole('button', { name: /new profile/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByLabel(/name/i).first().fill(profileName);
    await page.getByRole('button', { name: 'Create' }).click();

    // Should appear immediately in the list without page reload
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });
  });

  test('long profile name should be handled gracefully', async ({ page, request }) => {
    const longName = `e2e-edge-${'a'.repeat(80)}-${Date.now()}`;

    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: longName },
    });
    expect(response.status()).toBe(201);

    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Profile should be visible (name may be truncated in display but should load)
    await expect(page.getByRole('heading', { name: longName })).toBeVisible({ timeout: 15000 });
  });

  test('profile with description should display it', async ({ page, request }) => {
    const profileName = `e2e-edge-desc-${Date.now()}`;

    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Create via UI dialog with description
    await page.getByRole('button', { name: /new profile/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible({
      timeout: 5000,
    });

    await page.getByLabel(/name/i).first().fill(profileName);
    await page.locator('#profile-description').fill('A test description for edge case');
    await page.getByRole('button', { name: 'Create' }).click();

    // Profile should appear
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // Navigate to edit page to see description
    await page.getByRole('heading', { name: profileName }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('A test description for edge case')).toBeVisible({
      timeout: 15000,
    });
  });

  test('health endpoint should return status info', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  });

  test('MCP server with long URL should display correctly', async ({ page, request }) => {
    const serverName = `e2e-edge-longurl-${Date.now()}`;
    const longUrl = `https://very-long-domain-name-for-testing-purposes.example.com/api/v1/mcp/endpoint/with/many/path/segments?param1=value1&param2=value2`;

    const response = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: longUrl },
      },
    });
    expect(response.status()).toBe(201);

    await page.goto('/mcp-servers');
    await page.waitForLoadState('networkidle');

    // Server should be visible
    await expect(page.getByRole('heading', { name: serverName })).toBeVisible({ timeout: 15000 });
  });

  test('multiple API operations in sequence should not corrupt state', async ({ request }) => {
    const baseName = `e2e-edge-seq-${Date.now()}`;

    // Create 3 profiles rapidly
    const profiles = [];
    for (let i = 0; i < 3; i++) {
      const res = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
        data: { name: `${baseName}-${i}` },
      });
      expect(res.status()).toBe(201);
      profiles.push(await res.json());
    }

    // Read all profiles
    const listRes = await request.get(`${API_URL}/api/profiles`);
    expect(listRes.ok()).toBeTruthy();
    const allProfiles = await listRes.json();

    // All 3 should exist
    for (let i = 0; i < 3; i++) {
      const found = allProfiles.find(
        (p: { name: string }) => p.name === `${baseName}-${i}`,
      );
      expect(found).toBeTruthy();
    }

    // Delete them in reverse order
    for (let i = 2; i >= 0; i--) {
      const deleteRes = await request.delete(`${API_URL}/api/profiles/${profiles[i].id}`);
      expect(deleteRes.status()).toBe(204);
    }

    // Verify all are gone
    const verifyRes = await request.get(`${API_URL}/api/profiles`);
    const remaining = await verifyRes.json();
    for (let i = 0; i < 3; i++) {
      const found = remaining.find(
        (p: { name: string }) => p.name === `${baseName}-${i}`,
      );
      expect(found).toBeFalsy();
    }
  });
});
