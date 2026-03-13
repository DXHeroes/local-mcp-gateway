/**
 * E2E tests for Debug Logs page
 *
 * Tests:
 * - Page loads with filters
 * - Empty state display
 * - Filter controls
 */

import { expect, test } from '@playwright/test';

test.describe('Debug Logs', () => {
  test('should display Debug Logs heading and filters', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Debug Logs' })).toBeVisible({
      timeout: 10000,
    });

    // Filter controls should be visible
    await expect(page.getByText('Filters')).toBeVisible();
    await expect(page.getByLabel('Profile')).toBeVisible();
    await expect(page.getByLabel('MCP Server')).toBeVisible();
    await expect(page.getByLabel('Request Type')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
  });

  test('should show empty state or logs', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    // Either empty message or log entries should be visible
    const hasEmptyState = await page
      .getByText(/no debug logs found/i)
      .isVisible()
      .catch(() => false);
    const hasLogs = (await page.locator('.bg-white.rounded-lg.shadow.p-4').count()) > 1; // >1 because filter panel is also .bg-white

    expect(hasEmptyState || hasLogs).toBeTruthy();
  });

  test('should have auto-refresh toggle', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    const autoRefreshCheckbox = page.getByLabel('Auto-refresh');
    await expect(autoRefreshCheckbox).toBeVisible({ timeout: 10000 });

    // Should be unchecked by default
    await expect(autoRefreshCheckbox).not.toBeChecked();

    // Toggle it on
    await autoRefreshCheckbox.check();
    await expect(autoRefreshCheckbox).toBeChecked();
  });

  test('should show total log count', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    // "X logs total" or "X log total" should be visible
    await expect(page.getByText(/\d+ logs? total/)).toBeVisible({ timeout: 10000 });
  });

  test('should have Clear Logs button', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /clear logs/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should filter by request type dropdown', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    const requestTypeSelect = page.getByLabel('Request Type');
    await expect(requestTypeSelect).toBeVisible();

    // Should have options
    await expect(requestTypeSelect.locator('option')).toHaveCount(5); // All Types + 4 types
  });
});
