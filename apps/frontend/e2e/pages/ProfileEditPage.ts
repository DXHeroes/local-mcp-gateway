/**
 * Page Object Model for Profile Edit page (tool customization)
 */

import type { Locator, Page } from '@playwright/test';

export class ProfileEditPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly saveChangesButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('[data-testid="profile-edit-heading"]');
    this.saveChangesButton = page.getByRole('button', { name: /save changes/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async goto(profileId: string) {
    await this.page.goto(`/profiles/${profileId}/edit`);
    await this.page.waitForLoadState('networkidle');
    // Wait for page content to be ready
    await this.page.waitForSelector('h1, h2, [data-testid="server-card"]', { timeout: 10000 });
  }

  /**
   * Get a server card by server name
   */
  getServerCard(serverName: string): Locator {
    return this.page.locator(`[data-testid="server-card"]`).filter({ hasText: serverName });
  }

  /**
   * Toggle server active/inactive state
   */
  async toggleServerActive(serverName: string, active: boolean) {
    const card = this.getServerCard(serverName);
    const toggle = card.locator('[data-testid="server-active-toggle"]');

    const isCurrentlyActive = await toggle.isChecked();

    if (isCurrentlyActive !== active) {
      await toggle.click();
      // Wait for state change
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Expand or collapse server card to show/hide tools
   */
  async expandServerCard(serverName: string) {
    const card = this.getServerCard(serverName);
    const expandButton = card.locator('[data-testid="expand-button"]');
    await expandButton.click();
    // Wait for animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Refresh tools from MCP server
   */
  async refreshServerTools(serverName: string) {
    const card = this.getServerCard(serverName);
    const refreshButton = card.locator('[data-testid="refresh-button"]');
    await refreshButton.click();
    // Wait for refresh to complete
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get a tool element within a server card by tool name
   */
  getTool(serverName: string, toolName: string): Locator {
    const card = this.getServerCard(serverName);
    // Use data-tool-name attribute for reliable selection
    return card.locator(`[data-testid="tool-item"][data-tool-name="${toolName}"]`);
  }

  /**
   * Toggle tool enabled/disabled
   */
  async toggleTool(serverName: string, toolName: string, enabled: boolean) {
    // Use page locator directly to avoid Playwright locator chain issues with filter()
    const checkbox = this.page
      .locator(`[data-testid="tool-item"][data-tool-name="${toolName}"]`)
      .getByRole('checkbox')
      .first();

    // Wait for element to be ready
    await checkbox.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(300);

    const isCurrentlyEnabled = await checkbox.isChecked();

    if (isCurrentlyEnabled !== enabled) {
      // Use keyboard Space instead of click (more reliable for Radix UI checkboxes)
      await checkbox.focus();
      await checkbox.press('Space');
      // Wait for state change and React re-render
      await this.page.waitForTimeout(1500);
    }
  }

  /**
   * Open tool details dialog/panel
   */
  async openToolDetails(serverName: string, toolName: string) {
    const tool = this.getTool(serverName, toolName);
    const detailsButton = tool.getByRole('button', { name: /show details|details|edit/i }).first();
    await detailsButton.click();
    // Wait for dialog to open
    await this.page.waitForSelector('[role="dialog"], [data-testid="tool-details"]', {
      timeout: 3000,
    });
  }

  /**
   * Customize tool name
   */
  async customizeToolName(serverName: string, toolName: string, newName: string) {
    await this.openToolDetails(serverName, toolName);

    // Switch to Edit tab if needed
    const editTab = this.page.getByRole('tab', { name: /edit/i });
    if (await editTab.isVisible()) {
      await editTab.click();
      await this.page.waitForTimeout(200);
    }

    // Fill in new name (input has id like "custom-name-{toolName}")
    const nameInput = this.page.locator(`input[id^="custom-name-"]`).first();
    await nameInput.clear();
    await nameInput.fill(newName);
  }

  /**
   * Customize tool description
   */
  async customizeToolDescription(serverName: string, toolName: string, newDescription: string) {
    await this.openToolDetails(serverName, toolName);

    // Switch to Edit tab if needed
    const editTab = this.page.getByRole('tab', { name: /edit/i });
    if (await editTab.isVisible()) {
      await editTab.click();
      await this.page.waitForTimeout(200);
    }

    // Fill in new description (textarea has id like "custom-description-{toolName}")
    const descInput = this.page.locator(`textarea[id^="custom-description-"]`).first();
    await descInput.clear();
    await descInput.fill(newDescription);
  }

  /**
   * Customize tool input schema (JSON)
   */
  async customizeToolSchema(serverName: string, toolName: string, newSchema: object) {
    await this.openToolDetails(serverName, toolName);

    // Switch to Edit tab if needed
    const editTab = this.page.getByRole('tab', { name: /edit/i });
    if (await editTab.isVisible()) {
      await editTab.click();
      await this.page.waitForTimeout(200);
    }

    // Fill in new schema (textarea has id like "custom-schema-{toolName}")
    const schemaInput = this.page.locator(`textarea[id^="custom-schema-"]`).first();
    await schemaInput.clear();
    await schemaInput.fill(JSON.stringify(newSchema, null, 2));
  }

  /**
   * Save changes to tool customizations
   */
  async saveChanges() {
    // Wait for button to be stable (it might re-render after changes)
    await this.page.waitForTimeout(500);
    await this.saveChangesButton.waitFor({ state: 'visible', timeout: 10000 });

    // Click with force if needed (sticky positioned button might be unstable)
    await this.saveChangesButton.click({ force: true });

    // Wait for save to complete
    await this.page.waitForLoadState('networkidle');
    // Wait for success toast or confirmation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Cancel changes without saving
   */
  async cancelChanges() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * View diff between original and customized tool
   */
  async viewDiff(serverName: string, toolName: string) {
    await this.openToolDetails(serverName, toolName);

    // Switch to Diff tab (scope to visible dialog to avoid multiple matches)
    const dialog = this.page
      .locator('[role="dialog"]:visible, [data-testid="tool-details"]:visible')
      .first();
    const diffTab = dialog.getByRole('tab', { name: /diff/i });
    await diffTab.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Reset tool customizations to original values
   */
  async resetToOriginal(serverName: string, toolName: string) {
    await this.openToolDetails(serverName, toolName);

    // Find and click reset button
    const resetButton = this.page.getByRole('button', { name: /reset to original|reset/i });
    await resetButton.click();

    // Confirm if there's a confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes|ok/i });
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }

    await this.page.waitForTimeout(300);
  }

  /**
   * Check if a tool has "Customized" badge
   */
  async isToolCustomized(serverName: string, toolName: string): Promise<boolean> {
    const tool = this.getTool(serverName, toolName);
    const badge = tool.locator('text=/customized/i');
    return badge.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Get tools count for a server
   */
  async getToolsCount(serverName: string): Promise<string> {
    const card = this.getServerCard(serverName);
    const countText = await card.locator('text=/\\d+\\/\\d+ enabled|\\d+ tools?/i').textContent();
    return countText || '';
  }

  /**
   * Check if server is active
   */
  async isServerActive(serverName: string): Promise<boolean> {
    const card = this.getServerCard(serverName);
    const toggle = card.locator('[role="switch"], input[type="checkbox"]').first();
    return toggle.isChecked();
  }

  /**
   * Wait for tools to load
   */
  async waitForToolsLoad(timeout = 5000) {
    await this.page.waitForSelector('[data-testid="tool-item"]', { timeout }).catch(() => {
      // Tools might not exist
    });
  }

  /**
   * Expand server card and refresh tools to ensure they're loaded
   */
  async expandAndRefreshServerTools(serverName: string) {
    // Expand card
    await this.expandServerCard(serverName);

    // Wait a moment for UI to update
    await this.page.waitForTimeout(500);

    // Click refresh to fetch tools from remote server
    const card = this.getServerCard(serverName);
    const refreshButton = card.locator('[data-testid="refresh-button"]');
    await refreshButton.click();

    // Wait for tools to load
    await this.waitForToolsLoad(10000);
  }
}
