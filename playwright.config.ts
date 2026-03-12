import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/frontend/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  globalSetup: './playwright.global-setup.ts',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: './.playwright/auth/user.json',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --dir apps/backend dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
      env: {
        NODE_ENV: 'test',
      },
    },
    {
      command: 'pnpm --dir apps/frontend dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
