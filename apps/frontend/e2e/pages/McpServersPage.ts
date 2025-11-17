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
}
