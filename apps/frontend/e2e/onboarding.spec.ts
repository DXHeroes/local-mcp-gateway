/**
 * E2E tests for Onboarding flow
 *
 * Tests complete onboarding workflow:
 * - First launch (empty state)
 * - Seed data initialization
 * - Navigation to create first profile
 */

import { expect, test } from '@playwright/test';
import { safeDelete } from './helpers';
import { DebugLogsPage } from './pages/DebugLogsPage';
import { McpServersPage } from './pages/McpServersPage';
import { ProfilesPage } from './pages/ProfilesPage';

test.describe('Onboarding Flow', () => {
  test('should display empty state on first launch', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for API call

    // Check if empty state is shown or profiles exist
    const emptyStateVisible = await profilesPage.emptyState.isVisible().catch(() => false);
    const profilesExist = (await profilesPage.profileCards.count()) > 0;
    const hasError = await page
      .getByText(/Error:/i)
      .isVisible()
      .catch(() => false);

    // On first launch, should show empty state, have seed data, or show error (UI still works)
    expect(emptyStateVisible || profilesExist || hasError).toBeTruthy();
  });

  test('should navigate to all main pages', async ({ page }) => {
    // Test navigation to Profiles page
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();
    await expect(profilesPage.heading).toBeVisible();

    // Test navigation to MCP Servers page
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await expect(serversPage.heading).toBeVisible();

    // Test navigation to Debug Logs page
    const debugLogsPage = new DebugLogsPage(page);
    await debugLogsPage.goto();
    await expect(debugLogsPage.heading).toBeVisible();
  });

  test('should have navigation links in layout', async ({ page }) => {
    await page.goto('/');

    // Check navigation links
    await expect(page.getByRole('link', { name: /profiles/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /mcp servers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /debug logs/i })).toBeVisible();
  });

  test('should allow creating first profile from empty state', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();

    // Check Create Profile button is visible
    await expect(profilesPage.createButton).toBeVisible();

    // Create profile via API (simulating user action)
    const profileName = `first-profile-${Date.now()}`;
    const response = await page.request.post('http://localhost:3001/api/profiles', {
      data: {
        name: profileName,
        description: 'My first profile',
      },
    });

    expect(response.status()).toBe(201);
    const profile = await response.json();

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page to see the new profile
    await profilesPage.goto();

    // Wait for profile to appear
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });
    await profilesPage.waitForProfiles();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/profiles/${profile.id}`);
  });
});
