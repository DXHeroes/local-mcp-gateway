/**
 * Page Object Model for MCP Servers page
 */

import type { Locator, Page } from '@playwright/test';

export class McpServersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly emptyState: Locator;
  readonly serverCards: Locator;
  readonly serverName: Locator;
  readonly serverType: Locator;
  readonly oauthAuthorizeButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /mcp servers/i });
    this.addButton = page.getByRole('button', { name: 'Add MCP Server' });
    this.emptyState = page.getByText(/no mcp servers found/i);
    this.serverCards = page.locator('[class*="bg-white"]').filter({ hasText: /Type:/ });
    this.serverName = page.locator('h3');
    this.serverType = page.locator('text=/Type:/i');
    this.oauthAuthorizeButton = page.getByRole('button', { name: 'Authorize' });
    this.editButton = page.getByRole('button', { name: 'Edit' });
    this.deleteButton = page.getByRole('button', { name: 'Delete' });
  }

  async goto() {
    await this.page.goto('/mcp-servers');
    await this.page.waitForLoadState('networkidle');
    // Wait for page content to be ready
    await this.page.waitForSelector('h2, button, [class*="p-6"]', { timeout: 10000 });
  }

  async clickAddServer() {
    await this.addButton.click();
  }

  async waitForServers() {
    await this.page.waitForSelector('text=/Type:/i', { timeout: 5000 }).catch(() => {
      // Servers might not exist yet
    });
  }

  getServerCard(serverName: string) {
    return this.page.locator(`text=${serverName}`).locator('..').locator('..').locator('..');
  }

  async clickOAuthAuthorize(serverName: string) {
    const card = this.getServerCard(serverName);
    await card.getByRole('button', { name: /authorize/i }).click();
  }

  async clickEdit(serverName: string) {
    const card = this.getServerCard(serverName);
    await card.getByRole('button', { name: /edit/i }).click();
  }

  async clickDelete(serverName: string) {
    const card = this.getServerCard(serverName);
    await card.getByRole('button', { name: /delete/i }).click();
  }

  async fillServerForm(data: {
    name: string;
    type: 'remote_http' | 'remote_sse';
    url: string;
    apiKey?: string;
    apiKeyHeaderName?: string;
  }) {
    // Wait for form dialog to appear
    await this.page.waitForSelector('input[name="name"], input[placeholder*="name" i]', {
      timeout: 5000,
    });

    // Fill name field
    const nameInput = this.page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(data.name);

    // Select server type
    const typeSelect = this.page.locator('button:has-text("Type"), select[name="type"]').first();
    await typeSelect.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole('option', { name: data.type, exact: false }).click();

    // Fill URL field
    const urlInput = this.page.locator('input[name="url"], input[placeholder*="url" i]').first();
    await urlInput.fill(data.url);

    // Fill API key if provided
    if (data.apiKey) {
      // Select API Key authentication
      const authRadio = this.page.getByRole('radio', { name: /api key/i });
      await authRadio.click();
      await this.page.waitForTimeout(200);

      // Fill API key fields
      const apiKeyInput = this.page
        .locator('input[name="apiKey"], input[placeholder*="api key" i]')
        .first();
      await apiKeyInput.fill(data.apiKey);

      if (data.apiKeyHeaderName) {
        const headerNameInput = this.page
          .locator('input[name="headerName"], input[placeholder*="header" i]')
          .first();
        await headerNameInput.fill(data.apiKeyHeaderName);
      }
    }
  }

  async submitServerForm() {
    // Find and click submit button (Create or Update)
    const submitButton = this.page
      .getByRole('button', { name: /create|update|save/i })
      .filter({ hasText: /create|update|save/i })
      .first();
    await submitButton.click();
    // Wait for form to close
    await this.page.waitForTimeout(500);
  }
}
