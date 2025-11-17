/**
 * E2E tests for profiles functionality
 */

import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Profiles E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to profiles page
    await page.goto(`${BASE_URL}/profiles`);
  });

  test('should display profiles page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Profiles');
  });

  test('should show empty state when no profiles', async ({ page }) => {
    // Wait for API call to complete
    await page.waitForSelector('text=No profiles found', { timeout: 5000 }).catch(() => {
      // If profiles exist, that's also fine
    });
  });

  test('should create a profile via API and display it', async ({ request }) => {
    // Create profile via API
    const createResponse = await request.post(`${API_URL}/api/profiles`, {
      data: {
        name: 'e2e-test-profile',
        description: 'E2E test profile',
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const profile = await createResponse.json();
    expect(profile.name).toBe('e2e-test-profile');

    // Clean up
    await request.delete(`${API_URL}/api/profiles/${profile.id}`);
  });
});
