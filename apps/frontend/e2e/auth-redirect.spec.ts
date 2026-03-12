import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('MCP auth redirect', () => {
  test('renders the login screen on the dedicated sign-in route', async ({ page }) => {
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

    await page.goto(
      '/sign-in?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code',
      { waitUntil: 'domcontentloaded' }
    );

    await expect(page.getByRole('heading', { name: 'Local MCP Gateway' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('resumes MCP authorization after the session is available', async ({ page }) => {
    await page.route('**/api/auth/get-session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
          },
          user: {
            id: 'user-1',
            name: 'Cursor User',
            email: 'cursor@example.com',
            image: null,
          },
        }),
      });
    });

    await page.route('http://localhost:3001/api/auth/mcp/authorize**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>authorize reached</body></html>',
      });
    });

    await page.goto(
      '/sign-in?client_id=cursor&redirect_uri=https://cursor.sh/callback&response_type=code',
      { waitUntil: 'domcontentloaded' }
    );

    await expect(page.getByText('authorize reached')).toBeVisible();
    await expect(page).toHaveURL(/http:\/\/localhost:3001\/api\/auth\/mcp\/authorize/);
  });
});
