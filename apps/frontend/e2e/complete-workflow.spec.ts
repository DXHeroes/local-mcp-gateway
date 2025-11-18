/**
 * Complete E2E workflow test with context7 MCP server
 *
 * Tests complete user flow:
 * 1. Create profile
 * 2. Add context7 MCP server (remote_http, no auth)
 * 3. Assign MCP server to profile
 * 4. Verify proxy endpoint (/api/mcp/:profileId/info)
 * 5. Call tool via proxy (/api/mcp/:profileId)
 * 6. View debug logs
 * 7. Update profile
 * 8. Remove MCP server from profile
 * 9. Delete profile
 */

import { expect, test } from '@playwright/test';
import { retryRequest, safeDelete } from './helpers';
import { DebugLogsPage } from './pages/DebugLogsPage';
import { McpServersPage } from './pages/McpServersPage';
import { ProfilesPage } from './pages/ProfilesPage';

const API_URL = 'http://localhost:3001';
const CONTEXT7_MCP_URL = 'https://mcp.context7.com/mcp';

test.describe('Complete Workflow - Context7 MCP', () => {
  let profileId: string;
  let serverId: string;
  let profileName: string;
  let serverName: string;

  test.beforeEach(async ({ page }) => {
    // Generate unique names
    const timestamp = Date.now();
    profileName = `test-workflow-profile-${timestamp}`;
    serverName = `test-workflow-context7-${timestamp}`;

    // Clean up any existing test data
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-workflow-')) {
            await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    try {
      const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        for (const server of servers) {
          if (server.name.startsWith('test-workflow-')) {
            await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    await page.waitForTimeout(500);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup
    if (profileId) {
      await safeDelete(page.request, `${API_URL}/api/profiles/${profileId}`);
    }
    if (serverId) {
      await safeDelete(page.request, `${API_URL}/api/mcp-servers/${serverId}`);
    }
  });

  test('should complete full workflow with context7 MCP server', async ({ page }) => {
    // Step 1: Create profile
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();
    await page.waitForTimeout(300);

    await profilesPage.clickCreateProfile();
    await profilesPage.fillProfileForm(profileName, 'Test profile for complete workflow');
    await profilesPage.submitProfileForm();

    // Wait for profile to be created and get its ID
    await page.waitForTimeout(500);
    const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
    expect(profilesResponse.ok()).toBe(true);
    const profiles = await profilesResponse.json();
    const createdProfile = profiles.find((p: { name: string }) => p.name === profileName);
    expect(createdProfile).toBeDefined();
    profileId = createdProfile.id;

    // Step 2: Add context7 MCP server (remote_http, no auth)
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await page.waitForTimeout(300);

    await serversPage.clickAddServer();
    await serversPage.fillServerForm({
      name: serverName,
      type: 'remote_http',
      url: CONTEXT7_MCP_URL,
    });
    await serversPage.submitServerForm();

    // Wait for server to be created and get its ID
    await page.waitForTimeout(500);
    const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
    expect(serversResponse.ok()).toBe(true);
    const servers = await serversResponse.json();
    const createdServer = servers.find((s: { name: string }) => s.name === serverName);
    expect(createdServer).toBeDefined();
    serverId = createdServer.id;
    expect(createdServer.type).toBe('remote_http');
    expect(createdServer.config.url).toBe(CONTEXT7_MCP_URL);

    // Step 3: Assign MCP server to profile
    // Use API directly for reliability (UI flow involves form with checkboxes)
    const addServerResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/profiles/${profileId}/servers`,
      {
        data: {
          mcpServerId: serverId,
          order: 0,
        },
      }
    );
    expect(addServerResponse.status()).toBe(201);

    // Wait for server initialization
    await page.waitForTimeout(2000);

    // Step 4: Verify proxy endpoint (/api/mcp/:profileId/info)
    const infoResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/mcp/${profileName}/info`
    );
    expect(infoResponse.status()).toBe(200);

    const infoData = await infoResponse.json();
    expect(infoData).toHaveProperty('tools');
    expect(infoData).toHaveProperty('resources');
    expect(Array.isArray(infoData.tools)).toBe(true);
    expect(Array.isArray(infoData.resources)).toBe(true);
    expect(infoData.tools.length).toBeGreaterThan(0);

    // Step 5: Call tool via proxy (/api/mcp/:profileId)
    // Use tools/list method to verify proxy works
    const toolsListRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    };

    const proxyResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/mcp/${profileName}`,
      {
        data: toolsListRequest,
      }
    );
    expect(proxyResponse.status()).toBe(200);

    const proxyData = await proxyResponse.json();
    expect(proxyData).toHaveProperty('jsonrpc', '2.0');
    expect(proxyData).toHaveProperty('id', 1);
    expect(proxyData).toHaveProperty('result');
    expect(proxyData.result).toHaveProperty('tools');
    expect(Array.isArray(proxyData.result.tools)).toBe(true);
    expect(proxyData.result.tools.length).toBeGreaterThan(0);

    // Step 6: View debug logs
    const debugLogsPage = new DebugLogsPage(page);
    await debugLogsPage.goto();
    await page.waitForTimeout(1000);

    // Verify debug logs are visible
    await expect(debugLogsPage.heading).toBeVisible();
    // Check if logs exist (they should after proxy call)
    const logsVisible = await debugLogsPage.logsList.isVisible().catch(() => false);
    if (logsVisible) {
      // Verify log entries exist
      const logEntries = debugLogsPage.logsList.locator('div').first();
      await expect(logEntries).toBeVisible({ timeout: 5000 });
    }

    // Step 7: Update profile
    const updatedDescription = 'Updated description for workflow test';
    const updateProfileResponse = await retryRequest(
      page.request,
      'put',
      `${API_URL}/api/profiles/${profileId}`,
      {
        data: {
          name: profileName,
          description: updatedDescription,
        },
      }
    );
    expect(updateProfileResponse.status()).toBe(200);

    // Verify profile was updated
    await page.waitForTimeout(500);
    const updatedProfileResponse = await page.request.get(`${API_URL}/api/profiles/${profileId}`);
    expect(updatedProfileResponse.ok()).toBe(true);
    const updatedProfile = await updatedProfileResponse.json();
    expect(updatedProfile.description).toBe(updatedDescription);

    // Step 8: Remove MCP server from profile
    const removeServerResponse = await retryRequest(
      page.request,
      'delete',
      `${API_URL}/api/profiles/${profileId}/servers/${serverId}`
    );
    expect(removeServerResponse.status()).toBe(200);

    // Verify server was removed
    await page.waitForTimeout(500);
    const profileServersResponse = await page.request.get(
      `${API_URL}/api/profiles/${profileId}/servers`
    );
    expect(profileServersResponse.ok()).toBe(true);
    const profileServers = await profileServersResponse.json();
    expect(profileServers.serverIds).not.toContain(serverId);

    // Step 9: Delete profile
    const deleteProfileResponse = await retryRequest(
      page.request,
      'delete',
      `${API_URL}/api/profiles/${profileId}`
    );
    expect(deleteProfileResponse.status()).toBe(200);

    // Verify profile was deleted
    await page.waitForTimeout(500);
    const deletedProfileResponse = await page.request.get(`${API_URL}/api/profiles/${profileId}`);
    expect(deletedProfileResponse.status()).toBe(404);

    // Clear IDs to prevent cleanup in afterEach
    profileId = '';
    serverId = '';
  });
});

