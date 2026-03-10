/**
 * E2E tests for Organizations page
 *
 * Tests the organizations management UI:
 * - Navigate to /organizations
 * - Create organization form display and interaction
 * - Organization list rendering
 * - Set active organization
 * - Invite member form display and interaction
 *
 * Note: These tests mock the auth session and organization API responses
 * since actual authentication cannot be performed in E2E tests.
 */

import { expect, test } from '@playwright/test';

/**
 * Helper to set up authenticated session mocks for all organization tests.
 * Returns mocked session user data.
 */
async function setupAuthenticatedSession(page: import('@playwright/test').Page) {
  const sessionData = {
    session: {
      id: 'test-session-id',
      userId: 'test-user-id',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    },
  };

  await page.route('**/api/auth/get-session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionData),
    });
  });

  return sessionData;
}

test.describe('Organizations Page - Navigation', () => {
  test('should navigate to /organizations from nav bar', async ({ page }) => {
    await setupAuthenticatedSession(page);

    // Mock organizations list endpoint
    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock active organization endpoint
    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on Organizations link in nav
    const orgLink = page.getByRole('link', { name: 'Organizations' });
    await expect(orgLink).toBeVisible({ timeout: 10000 });
    await orgLink.click();

    // Should navigate to /organizations
    await page.waitForURL('**/organizations');

    // Page heading should be visible
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should show Organizations heading and Create button', async ({ page }) => {
    await setupAuthenticatedSession(page);

    // Mock organizations list endpoint
    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Heading should be visible
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible({
      timeout: 10000,
    });

    // Create Organization button should be visible
    await expect(page.getByRole('button', { name: /create organization/i })).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Organizations Page - Empty State', () => {
  test('should show empty state when no organizations exist', async ({ page }) => {
    await setupAuthenticatedSession(page);

    // Mock empty organizations list
    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Empty state message should be visible
    await expect(page.getByText(/no organizations yet\. create one to get started\./i)).toBeVisible(
      { timeout: 10000 }
    );
  });
});

test.describe('Organizations Page - Create Organization Form', () => {
  test('should show create form when Create Organization button is clicked', async ({ page }) => {
    await setupAuthenticatedSession(page);

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Click Create Organization button
    await page.getByRole('button', { name: /create organization/i }).click();

    // Form should appear with "New Organization" heading
    await expect(page.getByText('New Organization')).toBeVisible({ timeout: 5000 });

    // Name input should be visible
    const nameInput = page.getByPlaceholder('Organization name');
    await expect(nameInput).toBeVisible();

    // Slug input should be visible
    const slugInput = page.getByPlaceholder('Slug (optional)');
    await expect(slugInput).toBeVisible();

    // Create and Cancel buttons should be visible
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should allow entering organization name and slug', async ({ page }) => {
    await setupAuthenticatedSession(page);

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Open create form
    await page.getByRole('button', { name: /create organization/i }).click();

    // Fill in organization name
    const nameInput = page.getByPlaceholder('Organization name');
    await nameInput.fill('My Test Organization');
    await expect(nameInput).toHaveValue('My Test Organization');

    // Fill in slug
    const slugInput = page.getByPlaceholder('Slug (optional)');
    await slugInput.fill('my-test-org');
    await expect(slugInput).toHaveValue('my-test-org');
  });

  test('should hide create form when Cancel is clicked', async ({ page }) => {
    await setupAuthenticatedSession(page);

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Open create form
    await page.getByRole('button', { name: /create organization/i }).click();
    await expect(page.getByText('New Organization')).toBeVisible({ timeout: 5000 });

    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Form should disappear
    await expect(page.getByText('New Organization')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Organizations Page - Organization List', () => {
  test('should display organizations in a list', async ({ page }) => {
    await setupAuthenticatedSession(page);

    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Engineering Team',
        slug: 'engineering-team',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'org-2',
        name: 'Design Team',
        slug: 'design-team',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOrgs),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Both organizations should be visible
    await expect(page.getByText('Engineering Team')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Design Team')).toBeVisible();

    // Slugs should be displayed
    await expect(page.getByText('engineering-team')).toBeVisible();
    await expect(page.getByText('design-team')).toBeVisible();
  });

  test('should show Set Active button for non-active organizations', async ({ page }) => {
    await setupAuthenticatedSession(page);

    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Engineering Team',
        slug: 'engineering-team',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'org-2',
        name: 'Design Team',
        slug: 'design-team',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOrgs),
      });
    });

    // No active org set
    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Wait for orgs to render
    await expect(page.getByText('Engineering Team')).toBeVisible({ timeout: 10000 });

    // Set Active buttons should be visible for both orgs
    const setActiveButtons = page.getByRole('button', { name: 'Set Active' });
    await expect(setActiveButtons.first()).toBeVisible();
    expect(await setActiveButtons.count()).toBe(2);
  });

  test('should show Active badge for the active organization', async ({ page }) => {
    await setupAuthenticatedSession(page);

    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Engineering Team',
        slug: 'engineering-team',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'org-2',
        name: 'Design Team',
        slug: 'design-team',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOrgs),
      });
    });

    // Set org-1 as active
    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'org-1', name: 'Engineering Team', slug: 'engineering-team' }),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Wait for orgs to render
    await expect(page.getByText('Engineering Team')).toBeVisible({ timeout: 10000 });

    // Active badge should be visible
    await expect(page.getByText('Active')).toBeVisible();

    // Only one Set Active button should be visible (for the non-active org)
    const setActiveButtons = page.getByRole('button', { name: 'Set Active' });
    expect(await setActiveButtons.count()).toBe(1);
  });
});

test.describe('Organizations Page - Invite Member', () => {
  test('should show Invite button when an org is active', async ({ page }) => {
    await setupAuthenticatedSession(page);

    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Engineering Team',
        slug: 'engineering-team',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOrgs),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'org-1', name: 'Engineering Team', slug: 'engineering-team' }),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Members section heading should be visible
    await expect(page.getByText(/members of engineering team/i)).toBeVisible({ timeout: 10000 });

    // Invite button should be visible
    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();
  });

  test('should show invite form when Invite button is clicked', async ({ page }) => {
    await setupAuthenticatedSession(page);

    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Engineering Team',
        slug: 'engineering-team',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOrgs),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'org-1', name: 'Engineering Team', slug: 'engineering-team' }),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Click Invite button
    await page.getByRole('button', { name: /invite/i }).click();

    // Invite form should appear
    await expect(page.getByText('Invite Member')).toBeVisible({ timeout: 5000 });

    // Email input should be visible
    const emailInput = page.getByPlaceholder('Email address');
    await expect(emailInput).toBeVisible();

    // Role select should be visible
    const roleSelect = page.locator('select');
    await expect(roleSelect).toBeVisible();

    // Send Invite and Cancel buttons should be visible
    await expect(page.getByRole('button', { name: 'Send Invite' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('should allow entering email and selecting role in invite form', async ({ page }) => {
    await setupAuthenticatedSession(page);

    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Engineering Team',
        slug: 'engineering-team',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOrgs),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'org-1', name: 'Engineering Team', slug: 'engineering-team' }),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Open invite form
    await page.getByRole('button', { name: /invite/i }).click();
    await expect(page.getByText('Invite Member')).toBeVisible({ timeout: 5000 });

    // Fill email
    const emailInput = page.getByPlaceholder('Email address');
    await emailInput.fill('colleague@example.com');
    await expect(emailInput).toHaveValue('colleague@example.com');

    // Select admin role
    const roleSelect = page.locator('select');
    await roleSelect.selectOption('admin');
    await expect(roleSelect).toHaveValue('admin');
  });

  test('should not show invite section when no org is active', async ({ page }) => {
    await setupAuthenticatedSession(page);

    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Engineering Team',
        slug: 'engineering-team',
        createdAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/auth/list-organizations', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockOrgs),
      });
    });

    // No active org
    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Wait for page to render
    await expect(page.getByText('Engineering Team')).toBeVisible({ timeout: 10000 });

    // Members section and Invite button should not be visible
    await expect(page.getByText(/members of/i)).not.toBeVisible();
    // The specific "Invite" button in the members section should not exist
    // (Create Organization button is different)
    const inviteButtons = page.getByRole('button', { name: /^invite$/i });
    expect(await inviteButtons.count()).toBe(0);
  });
});

test.describe('Organizations Page - Loading State', () => {
  test('should show loading state while organizations are being fetched', async ({ page }) => {
    await setupAuthenticatedSession(page);

    // Delay the organizations response
    await page.route('**/api/auth/list-organizations', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/api/auth/get-active-organization', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/organizations');

    // Loading text should be visible
    await expect(page.getByText(/loading organizations/i)).toBeVisible({ timeout: 5000 });
  });
});
