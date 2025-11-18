/**
 * E2E tests for critical flows
 *
 * Tests complete user workflows:
 * - Create profile via form
 * - Create MCP server via form (HTTP and SSE)
 * - Complete flow: Profile + MCP Server
 */

import { expect, test } from '@playwright/test';
import { retryRequest, safeDelete } from './helpers';
import { McpServersPage } from './pages/McpServersPage';
import { ProfilesPage } from './pages/ProfilesPage';

test.describe('Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up any existing test data before each test
    try {
      const profilesResponse = await page.request.get('http://localhost:3001/api/profiles');
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-profile-')) {
            await safeDelete(page.request, `http://localhost:3001/api/profiles/${profile.id}`);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    try {
      const serversResponse = await page.request.get('http://localhost:3001/api/mcp-servers');
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        for (const server of servers) {
          if (server.name.startsWith('test-server-')) {
            await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    // Wait a bit after cleanup
    await page.waitForTimeout(500);
  });

  test('should create profile via form', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click Create Profile button
    await profilesPage.clickCreateProfile();

    // Wait for form dialog to appear
    await page.waitForSelector('input[placeholder*="name" i], input[id*="name"]', {
      timeout: 5000,
    });

    // Fill profile form
    const profileName = `test-profile-${Date.now()}`;
    const profileDescription = 'Test profile description';

    await profilesPage.fillProfileForm(profileName, profileDescription);

    // Submit form
    await profilesPage.submitProfileForm();

    // Wait for form to close and page to reload
    await page.waitForTimeout(1000);
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify profile is displayed
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({
      timeout: 15000,
    });

    // Verify MCP endpoint URL is displayed
    const mcpEndpoint = page.locator('code').filter({ hasText: profileName }).first();
    await expect(mcpEndpoint).toBeVisible({ timeout: 10000 });
    const endpointText = await mcpEndpoint.textContent();
    expect(endpointText).toContain(`/api/mcp/${profileName}`);

    // Cleanup
    try {
      const profilesResponse = await page.request.get('http://localhost:3001/api/profiles');
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        const profile = profiles.find((p: { name: string }) => p.name === profileName);
        if (profile) {
          await safeDelete(page.request, `http://localhost:3001/api/profiles/${profile.id}`);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should create remote HTTP MCP server via form', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click Add MCP Server button
    await serversPage.clickAddServer();

    // Wait for form dialog to appear
    await page.waitForSelector('input[placeholder*="name" i], input[id*="name"]', {
      timeout: 5000,
    });

    // Fill server form
    const serverName = `test-server-http-${Date.now()}`;
    const serverUrl = 'https://example.com/mcp';

    await serversPage.fillServerForm({
      name: serverName,
      type: 'remote_http',
      url: serverUrl,
    });

    // Submit form
    await serversPage.submitServerForm();

    // Wait for form to close and page to reload
    await page.waitForTimeout(1000);
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify server is displayed
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });

    // Verify server type is displayed
    await expect(page.getByText(/Type: remote_http/i).first()).toBeVisible();

    // Cleanup
    try {
      const serversResponse = await page.request.get('http://localhost:3001/api/mcp-servers');
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        const server = servers.find((s: { name: string }) => s.name === serverName);
        if (server) {
          await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should create remote SSE MCP server via form', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click Add MCP Server button
    await serversPage.clickAddServer();

    // Wait for form dialog to appear
    await page.waitForSelector('input[placeholder*="name" i], input[id*="name"]', {
      timeout: 5000,
    });

    // Fill server form
    const serverName = `test-server-sse-${Date.now()}`;
    const serverUrl = 'https://example.com/mcp/sse';

    // Fill name
    const nameInput = page.locator('input[id*="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(serverName);

    // Select server type
    const typeSelect = page.locator('button:has-text("Type"), select[id*="type"]').first();
    await typeSelect.click();
    await page.waitForTimeout(200);
    await page.getByRole('option', { name: /remote sse/i }).click();

    // Fill URL
    const urlInput = page.locator('input[id*="url"], input[placeholder*="url" i]').first();
    await urlInput.fill(serverUrl);

    // Submit form
    await serversPage.submitServerForm();

    // Wait for form to close and page to reload
    await page.waitForTimeout(1000);
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify server is displayed
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });

    // Verify server type is displayed
    await expect(page.getByText(/Type: remote_sse/i).first()).toBeVisible();

    // Cleanup
    try {
      const serversResponse = await page.request.get('http://localhost:3001/api/mcp-servers');
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        const server = servers.find((s: { name: string }) => s.name === serverName);
        if (server) {
          await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should create profile and MCP server in sequence', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    const serversPage = new McpServersPage(page);

    // Step 1: Create profile
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await profilesPage.clickCreateProfile();
    await page.waitForSelector('input[placeholder*="name" i], input[id*="name"]', {
      timeout: 5000,
    });

    const profileName = `test-profile-${Date.now()}`;
    await profilesPage.fillProfileForm(profileName);
    await profilesPage.submitProfileForm();

    await page.waitForTimeout(1000);
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({
      timeout: 15000,
    });

    // Step 2: Create MCP server
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await serversPage.clickAddServer();
    await page.waitForSelector('input[placeholder*="name" i], input[id*="name"]', {
      timeout: 5000,
    });

    const serverName = `test-server-${Date.now()}`;
    await serversPage.fillServerForm({
      name: serverName,
      type: 'remote_http',
      url: 'https://example.com/mcp',
    });
    await serversPage.submitServerForm();

    await page.waitForTimeout(1000);
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });

    // Verify both are displayed
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({
      timeout: 5000,
    });

    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 5000,
    });

    // Cleanup
    try {
      const profilesResponse = await page.request.get('http://localhost:3001/api/profiles');
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        const profile = profiles.find((p: { name: string }) => p.name === profileName);
        if (profile) {
          await safeDelete(page.request, `http://localhost:3001/api/profiles/${profile.id}`);
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    try {
      const serversResponse = await page.request.get('http://localhost:3001/api/mcp-servers');
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        const server = servers.find((s: { name: string }) => s.name === serverName);
        if (server) {
          await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });
});
