/**
 * E2E tests for authentication flows
 *
 * Tests the login/logout UI states:
 * - Login page renders with email+password form
 * - Google sign-in button shows only when configured
 * - Authenticated state shows nav bar with user info
 * - Sign out button works
 *
 * Note: Since real auth cannot be performed in E2E, these tests
 * use page.route() to mock API responses and verify UI states.
 */

import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication - Login Page', () => {
  test('should show login page with email+password form when not signed in', async ({ page }) => {
    // Mock auth session endpoint to simulate no session
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    // Mock auth config to return no Google
    await page.route('**/api/health/auth-config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ emailAndPassword: true, google: false }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Login page should display the app title
    await expect(page.getByRole('heading', { name: 'Local MCP Gateway' })).toBeVisible({
      timeout: 10000,
    });

    // Login page should show the sign-in prompt
    await expect(page.getByText(/sign in to manage your mcp servers and profiles/i)).toBeVisible({
      timeout: 5000,
    });

    // Email and password fields should be visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();

    // Sign In button should be visible
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should show Google button when Google OAuth is configured', async ({ page }) => {
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.route('**/api/health/auth-config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ emailAndPassword: true, google: true }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Google sign-in button should be visible
    const signInButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    await expect(signInButton).toBeEnabled();
  });

  test('should hide Google button when Google OAuth is not configured', async ({ page }) => {
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.route('**/api/health/auth-config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ emailAndPassword: true, google: false }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for login page to render
    await expect(page.getByRole('heading', { name: 'Local MCP Gateway' })).toBeVisible({
      timeout: 10000,
    });

    // Google sign-in button should NOT be visible
    await expect(page.getByRole('button', { name: /sign in with google/i })).not.toBeVisible();
  });

  test('should toggle between sign in and sign up modes', async ({ page }) => {
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.route('**/api/health/auth-config', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ emailAndPassword: true, google: false }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Should start in sign in mode
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible({ timeout: 10000 });

    // Click "Sign up" link
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Should now show sign up mode with Name field and Create Account button
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

    // Click "Sign in" link to go back
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Should be back to sign in mode
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
});

test.describe('Authentication - Authenticated State', () => {
  test('should show nav bar with user info when authenticated', async ({ page }) => {
    // Mock auth session to return an authenticated user
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Nav bar should be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible({ timeout: 10000 });

    // App title should be in the nav
    await expect(nav.getByText('Local MCP Gateway')).toBeVisible();

    // User name should be displayed
    await expect(page.getByText('Test User')).toBeVisible({ timeout: 5000 });

    // Navigation links should be present
    await expect(page.getByRole('link', { name: 'Profiles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'MCP Servers' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Debug Logs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();

    // Organizations link should be visible when authenticated
    await expect(page.getByRole('link', { name: 'Organizations' })).toBeVisible();
  });

  test('should show user avatar when user has an image', async ({ page }) => {
    // Mock auth session with user image
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 'test-session-id',
            userId: 'test-user-id',
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            image: 'https://example.com/avatar.png',
          },
        }),
      });
    });

    // Also mock the avatar image so it loads
    await page.route('https://example.com/avatar.png', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        ),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Avatar image should be visible
    const avatar = page.locator('img[src="https://example.com/avatar.png"]');
    await expect(avatar).toBeVisible({ timeout: 10000 });
    await expect(avatar).toHaveClass(/rounded-full/);
  });

  test('should show sign out button when authenticated', async ({ page }) => {
    // Mock auth session
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Sign out button should be visible (it has title="Sign out")
    const signOutButton = page.getByTitle('Sign out');
    await expect(signOutButton).toBeVisible({ timeout: 10000 });
    await expect(signOutButton).toBeEnabled();
  });
});

test.describe('Authentication - Loading State', () => {
  test('should show loading state initially', async ({ page }) => {
    // Delay the auth response to observe loading state
    await page.route('**/api/auth/get-session', async (route) => {
      // Delay response by 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Should show loading text while auth state is being determined
    await expect(page.getByText('Loading...')).toBeVisible({ timeout: 3000 });
  });
});
