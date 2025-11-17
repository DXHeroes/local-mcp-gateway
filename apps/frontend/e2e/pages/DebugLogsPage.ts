/**
 * Page Object Model for Debug Logs page
 */

import type { Locator, Page } from '@playwright/test';

export class DebugLogsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly placeholder: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /debug logs/i });
    this.placeholder = page.getByText(/debug logs viewer will display/i);
  }

  async goto() {
    await this.page.goto('/debug-logs');
    await this.page.waitForLoadState('networkidle');
    // Wait for page content to be ready
    await this.page.waitForSelector('h2, [class*="p-6"]', { timeout: 10000 });
  }
}
