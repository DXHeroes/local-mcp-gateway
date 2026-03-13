/**
 * E2E tests for Profile management
 *
 * Tests:
 * - Profile list display
 * - Create profile via dialog
 * - Edit profile
 * - Delete profile
 * - MCP endpoint URL display
 * - Profile form validation
 */

import { expect, test } from '@playwright/test';
import { API_BASE, retryRequest, safeDelete } from './helpers';

const API_URL = API_BASE;

test.describe('Profiles', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({ request }) => {
    try {
      const response = await request.get(`${API_URL}/api/profiles`);
      if (response.ok()) {
        const profiles = await response.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('e2e-profile-')) {
            await safeDelete(request, `${API_URL}/api/profiles/${profile.id}`);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should display "New Profile" button', async ({ page }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /new profile/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should create a profile via dialog', async ({ page }) => {
    const profileName = `e2e-profile-${Date.now()}`;

    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Click New Profile button
    await page.getByRole('button', { name: /new profile/i }).click();

    // Dialog should open
    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible({
      timeout: 5000,
    });

    // Fill form
    await page.getByLabel(/name/i).first().fill(profileName);
    await page.locator('#profile-description').fill('E2E test profile');

    // Submit
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for dialog to close and profile to appear
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // Verify MCP endpoint is displayed
    const endpoint = page.locator('code').filter({ hasText: profileName }).first();
    await expect(endpoint).toBeVisible({ timeout: 5000 });
  });

  test('should create profile via API and verify display', async ({ page, request }) => {
    const profileName = `e2e-profile-${Date.now()}`;

    // Create via API
    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName, description: 'API created profile' },
    });
    expect(response.status()).toBe(201);

    // Navigate to profiles page
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Profile should be visible
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // MCP endpoint should contain the profile name
    const endpoint = page.locator('code').filter({ hasText: profileName }).first();
    await expect(endpoint).toBeVisible({ timeout: 5000 });
  });

  test('should display multiple profiles', async ({ page, request }) => {
    const names = [`e2e-profile-a-${Date.now()}`, `e2e-profile-b-${Date.now()}`];

    // Create profiles
    for (const name of names) {
      const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
        data: { name },
      });
      expect(response.status()).toBe(201);
    }

    // Navigate
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Both should be visible
    for (const name of names) {
      await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 15000 });
    }
  });

  test('should delete a profile', async ({ page, request }) => {
    const profileName = `e2e-profile-${Date.now()}`;

    // Create via API
    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    expect(response.status()).toBe(201);
    const profile = await response.json();

    // Navigate
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // Click the menu button on the profile card (three dots)
    const profileCard = page.locator(`h3:has-text("${profileName}")`).locator('..').locator('..');
    await profileCard.getByRole('button').filter({ has: page.locator('svg') }).first().click();

    // Click Delete from dropdown
    await page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm deletion in dialog
    await expect(page.getByRole('heading', { name: /delete profile/i })).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole('button', { name: 'Delete' }).click();

    // Profile should be gone
    await expect(page.getByRole('heading', { name: profileName })).not.toBeVisible({
      timeout: 10000,
    });
  });

  test('should validate profile name - empty', async ({ page }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Open create dialog
    await page.getByRole('button', { name: /new profile/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible();

    // Try to submit with empty name
    await page.getByRole('button', { name: 'Create' }).click();

    // Error should appear
    await expect(page.getByText(/name is required/i)).toBeVisible({ timeout: 5000 });
  });

  test('should validate profile name - special characters', async ({ page }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Open create dialog
    await page.getByRole('button', { name: /new profile/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible();

    // Fill with invalid name
    await page.getByLabel(/name/i).first().fill('invalid name!@#');
    await page.getByRole('button', { name: 'Create' }).click();

    // Error should appear
    await expect(page.getByText('Name must contain only alphanumeric')).toBeVisible({ timeout: 5000 });
  });

  test('should edit a profile', async ({ page, request }) => {
    const profileName = `e2e-profile-${Date.now()}`;
    const updatedName = `e2e-profile-updated-${Date.now()}`;

    // Create via API
    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName, description: 'Original description' },
    });
    expect(response.status()).toBe(201);

    // Navigate
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // Click the menu button on the profile card
    const profileCard = page.locator(`h3:has-text("${profileName}")`).locator('..').locator('..');
    await profileCard.getByRole('button').filter({ has: page.locator('svg') }).first().click();

    // Click Edit from dropdown
    await page.getByRole('menuitem', { name: /edit/i }).click();

    // Dialog should open with "Edit Profile"
    await expect(page.getByRole('heading', { name: 'Edit Profile' })).toBeVisible({
      timeout: 5000,
    });

    // Update name
    const nameInput = page.getByLabel(/name/i).first();
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // Submit
    await page.getByRole('button', { name: 'Update' }).click();

    // Updated profile should be visible
    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to profile edit page on card click', async ({ page, request }) => {
    const profileName = `e2e-profile-${Date.now()}`;

    // Create via API
    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    expect(response.status()).toBe(201);
    const profile = await response.json();

    // Navigate
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Click the profile card (not the endpoint area)
    await page.getByRole('heading', { name: profileName }).click();

    // Should navigate to profile edit page
    await page.waitForURL(`**/profiles/${profile.id}/edit`, { timeout: 10000 });
  });

  test('should display Gateway config section', async ({ page }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Gateway label should be visible
    await expect(page.getByText('Gateway', { exact: true })).toBeVisible({ timeout: 10000 });

    // Gateway endpoint code element
    await expect(page.locator('code').filter({ hasText: /\/api\/mcp/ }).first()).toBeVisible();

    // Copy button for gateway endpoint
    await expect(page.getByLabel('Copy gateway endpoint')).toBeVisible();

    // Profile selector
    await expect(page.getByText('Profile:')).toBeVisible();
  });

  test('should display server and tools count on profile card', async ({ page, request }) => {
    const profileName = `e2e-profile-${Date.now()}`;

    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    expect(response.status()).toBe(201);

    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // Status text like "0/0 servers · 0 tools" should be visible on the card
    await expect(page.getByText(/\d+\/\d+ servers · \d+ tools/).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to edit page via View menu item', async ({ page, request }) => {
    const profileName = `e2e-profile-${Date.now()}`;

    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    expect(response.status()).toBe(201);
    const profile = await response.json();

    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // Open dropdown menu
    const profileCard = page.locator(`h3:has-text("${profileName}")`).locator('..').locator('..');
    await profileCard.getByRole('button').filter({ has: page.locator('svg') }).first().click();

    // Click View from dropdown
    await page.getByRole('menuitem', { name: /view/i }).click();

    // Should navigate to edit page
    await page.waitForURL(`**/profiles/${profile.id}/edit`, { timeout: 10000 });
  });

  test('should display MCP endpoint URL on profile card', async ({ page, request }) => {
    const profileName = `e2e-profile-${Date.now()}`;

    const response = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    expect(response.status()).toBe(201);

    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });

    // Endpoint URL with profile name should be displayed in code element
    const endpoint = page.locator('code').filter({ hasText: profileName }).first();
    await expect(endpoint).toBeVisible({ timeout: 5000 });
  });

  test('should close create dialog on cancel', async ({ page }) => {
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');

    // Open create dialog
    await page.getByRole('button', { name: /new profile/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Profile' })).toBeVisible({
      timeout: 5000,
    });

    // Fill in some data
    await page.getByLabel(/name/i).first().fill('should-not-be-saved');

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Dialog should close
    await expect(page.getByRole('heading', { name: 'Create Profile' })).not.toBeVisible();

    // Profile should NOT appear in list
    await expect(page.getByRole('heading', { name: 'should-not-be-saved' })).not.toBeVisible();
  });
});
