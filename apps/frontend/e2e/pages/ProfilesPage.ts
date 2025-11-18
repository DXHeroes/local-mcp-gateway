/**
 * Page Object Model for Profiles page
 */

import type { Locator, Page } from '@playwright/test';

export class ProfilesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly emptyState: Locator;
  readonly profileCards: Locator;
  readonly profileName: Locator;
  readonly profileDescription: Locator;
  readonly mcpEndpoint: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /profiles/i });
    this.createButton = page.getByRole('button', { name: 'Create Profile' });
    this.emptyState = page.getByText(/no profiles found/i);
    this.profileCards = page.locator('[class*="bg-white"]').filter({ hasText: /MCP Endpoint:/ });
    this.profileName = page.locator('h3');
    this.profileDescription = page.locator('p.text-sm.text-gray-600');
    this.mcpEndpoint = page.locator('code');
  }

  async goto() {
    await this.page.goto('/profiles');
    await this.page.waitForLoadState('networkidle');
    // Wait for page content to be ready
    await this.page.waitForSelector('h2, button, [class*="p-6"]', { timeout: 10000 });
  }

  async clickCreateProfile() {
    await this.createButton.click();
  }

  async waitForProfiles() {
    await this.page.waitForSelector('text=/MCP Endpoint:/i', { timeout: 5000 }).catch(() => {
      // Profiles might not exist yet
    });
  }

  getProfileCard(profileName: string) {
    return this.page.locator(`text=${profileName}`).locator('..').locator('..').locator('..');
  }

  getMcpEndpointForProfile(profileName: string) {
    const card = this.getProfileCard(profileName);
    return card.locator('code').filter({ hasText: profileName }).first();
  }

  async fillProfileForm(name: string, description?: string) {
    // Wait for form dialog to appear
    await this.page.waitForSelector('input[name="name"], input[placeholder*="name" i]', {
      timeout: 5000,
    });

    // Fill name field
    const nameInput = this.page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(name);

    // Fill description if provided
    if (description) {
      const descInput = this.page
        .locator('textarea[name="description"], textarea[placeholder*="description" i]')
        .first();
      await descInput.fill(description);
    }
  }

  async submitProfileForm() {
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
