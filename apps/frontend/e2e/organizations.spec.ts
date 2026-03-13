/**
 * E2E tests for Organizations page
 *
 * Tests:
 * - Page loads with heading
 * - Shows active organization with badge
 * - Create Organization form toggle
 * - Org name and slug display
 * - Members section visible
 */

import { expect, test } from '@playwright/test';

test.describe('Organizations', () => {
  test('should display Organizations heading', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show active organization with Active badge', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // The E2E Test Org should be listed with Active badge (use heading to target org card)
    await expect(
      page.getByRole('heading', { name: 'E2E Test Org', exact: true }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Active').first()).toBeVisible();
  });

  test('should show Create Organization button', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /create organization/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should toggle Create Organization form', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Click Create Organization
    await page.getByRole('button', { name: /create organization/i }).click();

    // Form should appear
    await expect(page.getByPlaceholder('Organization name')).toBeVisible();
    await expect(page.getByPlaceholder('Slug (optional)')).toBeVisible();
    const form = page.locator('.bg-white.border.rounded-lg.p-4').first();
    await expect(form.getByRole('button', { name: 'Create' })).toBeVisible();

    // Cancel should close it
    await form.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByPlaceholder('Organization name')).not.toBeVisible();
  });

  test('should show org slug', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // The slug should be displayed under the org name
    // Auth setup creates org with slug like 'e2e-test-org-...'
    await expect(page.locator('p.text-sm.text-gray-500').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show Members section with Invite button', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Members section heading
    await expect(page.getByText(/Members of/)).toBeVisible({ timeout: 10000 });

    // Invite button
    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();
  });

  test('should toggle Invite Member form', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /invite/i }).click();

    // Invite form should appear
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Invite' })).toBeVisible();

    // Cancel should close it
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByPlaceholder('Email address')).not.toBeVisible();
  });
});
