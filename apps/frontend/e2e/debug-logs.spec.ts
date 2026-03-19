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
  test('should display overview first with tabs and filters', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Debug Logs' })).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Events' })).toBeVisible();

    // Filter controls should be visible
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
    await expect(page.getByLabel('Profile')).toBeVisible();
    await expect(page.getByLabel('MCP Server')).toBeVisible();
    await expect(page.getByLabel('Request Type')).toBeVisible();
    await expect(page.getByLabel('Status')).toBeVisible();
  });

  test('should show overview content on initial load', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/log pulse/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Success Rate', { exact: true })).toBeVisible({
      timeout: 10000,
    });
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

    const optionCount = await requestTypeSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(1);
  });

  test('should switch from overview to events tab', async ({ page }) => {
    await page.goto('/debug-logs');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: 'Events' }).click();
    await expect(page.getByText(/page \d+ of \d+/i)).toBeVisible({ timeout: 10000 });
  });
});
