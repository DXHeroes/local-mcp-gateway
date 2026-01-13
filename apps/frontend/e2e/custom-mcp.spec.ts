/**
 * E2E tests for Custom MCP
 *
 * Tests complete custom MCP flows:
 * - Create custom MCP
 * - Edit custom MCP
 * - Use custom MCP in profile
 */

import { expect, test } from '@playwright/test';
import { safeDelete } from './helpers';
import { McpServersPage } from './pages/McpServersPage';
import { ProfilesPage } from './pages/ProfilesPage';

test.describe('Custom MCP', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up any existing test servers and profiles before each test (with rate limit handling)
    try {
      const serversResponse = await page.request.get('http://localhost:3001/api/mcp-servers');
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        for (const server of servers) {
          if (server.name.startsWith('test-custom-') || server.name.startsWith('Test Custom')) {
            const deleteResponse = await page.request
              .delete(`http://localhost:3001/api/mcp-servers/${server.id}`)
              .catch(() => null);
            if (deleteResponse?.status() === 429) {
              await page.waitForTimeout(500);
            }
            await page.waitForTimeout(100);
          }
        }
      }
      const profilesResponse = await page.request.get('http://localhost:3001/api/profiles');
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-profile-custom-')) {
            const deleteResponse = await page.request
              .delete(`http://localhost:3001/api/profiles/${profile.id}`)
              .catch(() => null);
            if (deleteResponse?.status() === 429) {
              await page.waitForTimeout(500);
            }
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    // Wait a bit after cleanup to let rate limit reset
    await page.waitForTimeout(500);
  });
  test('should create custom MCP server', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-custom-mcp-${Date.now()}`;

    // Create custom MCP server via API
    const response = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'custom',
        config: {
          // Custom MCP config would include module path
          modulePath: '/custom-mcps/example',
        },
      },
    });

    expect(response.status()).toBe(201);
    const server = await response.json();
    expect(server.name).toBe(serverName);
    expect(server.type).toBe('custom');

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for server to appear
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Check if custom MCP server is displayed
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible();
    const serverCard = serversPage.getServerCard(serverName);
    await expect(serverCard.getByText(/Type: custom/i)).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should update custom MCP server', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-custom-mcp-update-${Date.now()}`;
    const updatedName = `updated-${serverName}`;

    // Create custom MCP server via API
    const createResponse = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'custom',
        config: {
          modulePath: '/custom-mcps/example',
        },
      },
    });

    expect(createResponse.status()).toBe(201);
    const server = await createResponse.json();

    // Update server via API
    const updateResponse = await page.request.put(
      `http://localhost:3001/api/mcp-servers/${server.id}`,
      {
        data: {
          name: updatedName,
          config: {
            modulePath: '/custom-mcps/updated-example',
          },
        },
      }
    );

    expect(updateResponse.status()).toBe(200);
    const updatedServer = await updateResponse.json();
    expect(updatedServer.name).toBe(updatedName);

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for updated server to appear
    await expect(page.getByRole('heading', { name: updatedName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Check if updated name is displayed
    await expect(page.getByRole('heading', { name: updatedName, level: 3 })).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should use custom MCP in profile workflow', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    const serversPage = new McpServersPage(page);

    const profileName = `test-profile-custom-${Date.now()}`;
    const serverName = `test-custom-mcp-profile-${Date.now()}`;

    // Create custom MCP server via API
    const serverResponse = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'custom',
        config: {
          modulePath: '/custom-mcps/example',
        },
      },
    });

    expect(serverResponse.status()).toBe(201);
    const server = await serverResponse.json();

    // Create profile via API
    const profileResponse = await page.request.post('http://localhost:3001/api/profiles', {
      data: {
        name: profileName,
        description: 'Profile with custom MCP',
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = await profileResponse.json();

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Verify profile has MCP endpoint
    await profilesPage.goto();

    // Wait for profile to appear
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({ timeout: 15000 });
    await profilesPage.waitForProfiles();

    // Check MCP endpoint is displayed (might be multiple, so check first one matching profile name)
    const mcpEndpoint = page.locator('code').filter({ hasText: profileName }).first();
    await expect(mcpEndpoint).toBeVisible({ timeout: 10000 });
    const endpointText = await mcpEndpoint.textContent();
    expect(endpointText).toContain(`/api/mcp/${profileName}`);

    // Verify custom MCP server exists
    await serversPage.goto();

    // Wait for server to appear
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/profiles/${profile.id}`);
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should display custom MCP server details', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `test-custom-mcp-details-${Date.now()}`;

    // Create custom MCP server via API
    const response = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'custom',
        config: {
          modulePath: '/custom-mcps/example',
          description: 'Example custom MCP server',
        },
      },
    });

    expect(response.status()).toBe(201);
    const server = await response.json();

    // Wait a bit for backend to process
    await page.waitForTimeout(500);

    // Reload page
    await serversPage.goto();

    // Wait for server to appear
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });
    await serversPage.waitForServers();

    // Check server details are displayed
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible();
    const serverCard = serversPage.getServerCard(serverName);
    await expect(serverCard.getByText(/Type: custom/i)).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });
});
