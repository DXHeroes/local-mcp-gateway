/**
 * E2E tests for Debug Logs
 *
 * Tests debug logs functionality:
 * - Debug logs page display
 * - Log filtering (when implemented)
 */

import { expect, test } from '@playwright/test';
import { DebugLogsPage } from './pages/DebugLogsPage';

test.describe('Debug Logs', () => {
  test('should display debug logs page', async ({ page }) => {
    const debugLogsPage = new DebugLogsPage(page);
    await debugLogsPage.goto();

    // Check page heading
    await expect(debugLogsPage.heading).toBeVisible();

    // Check placeholder message (until logs viewer is implemented)
    await expect(debugLogsPage.placeholder).toBeVisible();
  });

  test('should navigate to debug logs from navigation', async ({ page }) => {
    await page.goto('/');

    // Click on Debug Logs link
    await page.getByRole('link', { name: /debug logs/i }).click();

    // Verify we're on debug logs page
    await expect(page.getByRole('heading', { name: /debug logs/i })).toBeVisible();
  });
});
