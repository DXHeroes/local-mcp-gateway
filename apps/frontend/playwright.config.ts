import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = Number(process.env.E2E_PORT) || 5173;
const BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * Playwright E2E Testing Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [['html'], ['list']],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: BASE_URL,

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Auth setup - runs first, creates authenticated state
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Auth tests - run WITHOUT auth (they test the login page itself)
    {
      name: 'auth-tests',
      testMatch: /auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },

    // All other tests - run WITH authenticated state
    {
      name: 'chromium',
      testIgnore: /auth\.(setup|spec)\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: `pnpm --filter @dxheroes/local-mcp-backend dev`,
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
    {
      command: `pnpm --filter @dxheroes/local-mcp-frontend exec vite --port ${E2E_PORT}`,
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],
});
