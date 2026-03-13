/**
 * Auth setup for E2E tests
 *
 * Creates a test user, organization, and stores authenticated state
 * so all other tests run as an authenticated user.
 */

import { expect, test as setup } from '@playwright/test';

const STORAGE_STATE_PATH = 'e2e/.auth/user.json';

const TEST_USER = {
  name: 'E2E Test User',
  email: `e2e-${Date.now()}@test.com`,
  password: 'testpassword123',
};

setup('authenticate', async ({ page }) => {
  // 1. Navigate to login page
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for login page to load
  await expect(page.getByRole('heading', { name: 'Local MCP Gateway' })).toBeVisible({
    timeout: 15000,
  });

  // 2. Sign up a new test user
  // Click "Sign up" to switch to signup mode
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page.getByLabel('Name')).toBeVisible({ timeout: 5000 });

  // Fill signup form
  await page.getByLabel('Name').fill(TEST_USER.name);
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);

  // Submit and wait for response
  await page.getByRole('button', { name: 'Create Account' }).click();

  // 3. Wait for auth to complete — the page should transition away from the login form.
  // It will show "Loading organization..." or "No organizations found"
  await page.waitForFunction(
    () => {
      const body = document.body.textContent || '';
      return (
        body.includes('Loading organization') ||
        body.includes('No organizations found') ||
        body.includes('Profiles') ||
        body.includes('Quick Start')
      );
    },
    { timeout: 15000 },
  );

  // Give auth cookies time to be set
  await page.waitForTimeout(1000);

  // 4. Create organization via API using Vite proxy (so cookies are sent automatically)
  const orgSlug = `e2e-org-${Date.now()}`;
  const orgResponse = await page.evaluate(
    async ({ orgSlug }) => {
      const res = await fetch('/api/auth/organization/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E Test Org', slug: orgSlug }),
        credentials: 'include',
      });
      return { status: res.status, body: await res.json() };
    },
    { orgSlug },
  );

  expect(orgResponse.status).toBe(200);
  const orgId = orgResponse.body.id;

  // 5. Set active organization
  const setActiveResponse = await page.evaluate(
    async ({ orgId }) => {
      const res = await fetch('/api/auth/organization/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
        credentials: 'include',
      });
      return { status: res.status };
    },
    { orgId },
  );

  expect(setActiveResponse.status).toBe(200);

  // 6. Reload page so the app picks up the org
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Wait for authenticated app to be visible (nav links)
  await expect(page.getByRole('link', { name: 'Profiles' })).toBeVisible({ timeout: 15000 });

  // 7. Save storage state
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
