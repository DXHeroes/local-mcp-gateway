/**
 * E2E Smoke Tests - Complete Happy Path Flows
 *
 * These tests verify the complete application functionality from start to finish.
 * They serve as the "source of truth" for what the application should do.
 *
 * Test flows:
 * 1. Onboarding - First launch and navigation
 * 2. Create profile with MCP server - Complete profile setup
 * 3. Add remote MCP server with API key - API key authentication
 * 4. Add remote MCP server with OAuth - OAuth flow (simulated)
 * 5. Use MCP proxy endpoint - Test actual MCP proxy functionality
 * 6. View debug logs - Verify logging works
 * 7. Complete workflow - End-to-end user journey
 */

import { expect, test } from '@playwright/test';
import { retryRequest, safeDelete } from './helpers';
import { DebugLogsPage } from './pages/DebugLogsPage';
import { McpServersPage } from './pages/McpServersPage';
import { ProfilesPage } from './pages/ProfilesPage';

const API_URL = 'http://localhost:3001';

test.describe('Smoke Tests - Happy Paths', () => {
  // Clean up all test data before and after tests
  test.beforeEach(async ({ page }) => {
    // Clean up test profiles
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('smoke-test-')) {
            await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
            await page.waitForTimeout(100);
          }
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    // Clean up test MCP servers
    try {
      const serversResponse = await page.request.get(`${API_URL}/api/mcp-servers`);
      if (serversResponse.ok()) {
        const servers = await serversResponse.json();
        for (const server of servers) {
          if (server.name.startsWith('smoke-test-')) {
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
    // Cleanup after each test - same as beforeEach
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('smoke-test-')) {
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
          if (server.name.startsWith('smoke-test-')) {
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

  test('1. Onboarding - First launch and navigation', async ({ page }) => {
    // Navigate to profiles page
    const profilesPage = new ProfilesPage(page);
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');

    // Verify page loads
    await expect(profilesPage.heading).toBeVisible({ timeout: 10000 });
    await expect(profilesPage.createButton).toBeVisible();

    // Navigate to MCP Servers page
    const serversPage = new McpServersPage(page);
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(serversPage.heading).toBeVisible({ timeout: 10000 });

    // Navigate to Debug Logs page
    const debugLogsPage = new DebugLogsPage(page);
    await debugLogsPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(debugLogsPage.heading).toBeVisible({ timeout: 10000 });
  });

  test('2. Create profile with MCP server - Complete setup', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    const profileName = `smoke-test-profile-${Date.now()}`;
    const serverName = `smoke-test-server-${Date.now()}`;

    // Step 1: Create MCP server
    const serverResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        apiKeyConfig: {
          apiKey: 'test-api-key-123',
          headerName: 'Authorization',
          headerValue: 'Bearer {apiKey}',
        },
      },
    });

    expect(serverResponse.status()).toBe(201);
    const server = await serverResponse.json();
    expect(server.name).toBe(serverName);

    await page.waitForTimeout(500);

    // Step 2: Create profile
    const profileResponse = await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
      data: {
        name: profileName,
        description: 'Smoke test profile',
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = await profileResponse.json();
    expect(profile.name).toBe(profileName);

    await page.waitForTimeout(500);

    // Step 3: Add MCP server to profile
    const addServerResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/profiles/${profile.id}/servers`,
      {
        data: {
          mcpServerId: server.id,
          order: 0,
        },
      }
    );

    expect(addServerResponse.status()).toBe(201);

    await page.waitForTimeout(500);

    // Step 4: Verify profile displays MCP endpoint
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({
      timeout: 15000,
    });

    // Verify MCP endpoint is displayed
    const mcpEndpoint = page.locator('code').filter({ hasText: profileName }).first();
    await expect(mcpEndpoint).toBeVisible({ timeout: 10000 });
    const endpointText = await mcpEndpoint.textContent();
    expect(endpointText).toContain(`/api/mcp/${profileName}`);

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('3. Add remote MCP server with API key', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `smoke-test-api-key-${Date.now()}`;

    // Create MCP server with API key
    const response = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        apiKeyConfig: {
          apiKey: 'test-api-key-456',
          headerName: 'X-API-Key',
          headerValue: '{apiKey}',
        },
      },
    });

    expect(response.status()).toBe(201);
    const server = await response.json();
    expect(server.name).toBe(serverName);
    expect(server.apiKeyConfig).toBeDefined();
    expect(server.apiKeyConfig?.headerName).toBe('X-API-Key');

    await page.waitForTimeout(500);

    // Verify server appears in UI
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });

    // Verify API key configuration is displayed
    await expect(page.getByText(/API Key Configuration/i)).toBeVisible({ timeout: 5000 });

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('4. Add remote MCP server with OAuth configuration', async ({ page }) => {
    const serversPage = new McpServersPage(page);
    const serverName = `smoke-test-oauth-${Date.now()}`;

    // Create MCP server with OAuth config
    const response = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          resource: 'https://api.example.com',
          scopes: ['read', 'write'],
          requiresOAuth: true,
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
        },
      },
    });

    expect(response.status()).toBe(201);
    const server = await response.json();
    expect(server.name).toBe(serverName);
    expect(server.oauthConfig).toBeDefined();
    expect(server.oauthConfig?.requiresOAuth).toBe(true);

    await page.waitForTimeout(500);

    // Verify server appears in UI
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });

    // Verify OAuth configuration is displayed
    await expect(page.getByText(/OAuth Configuration/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Authorize/i })).toBeVisible({
      timeout: 5000,
    });

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('5. Use MCP proxy endpoint - Test proxy functionality', async ({ page }) => {
    const profileName = `smoke-test-proxy-${Date.now()}`;
    const serverName = `smoke-test-proxy-server-${Date.now()}`;

    // Create MCP server
    const serverResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        apiKeyConfig: {
          apiKey: 'test-proxy-key',
          headerName: 'Authorization',
          headerValue: 'Bearer {apiKey}',
        },
      },
    });

    expect(serverResponse.status()).toBe(201);
    const server = await serverResponse.json();

    await page.waitForTimeout(500);

    // Create profile
    const profileResponse = await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
      data: {
        name: profileName,
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = await profileResponse.json();

    await page.waitForTimeout(500);

    // Add server to profile
    const addServerResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/profiles/${profile.id}/servers`,
      {
        data: {
          mcpServerId: server.id,
        },
      }
    );

    expect(addServerResponse.status()).toBe(201);

    await page.waitForTimeout(1000);

    // Test MCP proxy endpoint with JSON-RPC request
    const proxyResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/mcp/${profileName}`,
      {
        data: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        },
      }
    );

    // Proxy endpoint should respond (even if remote server is not available)
    // It should return JSON-RPC response format
    expect(proxyResponse.status()).toBeGreaterThanOrEqual(200);
    expect(proxyResponse.status()).toBeLessThan(500);

    const proxyData = await proxyResponse.json().catch(() => null);
    if (proxyData) {
      // Should be JSON-RPC format
      expect(proxyData).toHaveProperty('jsonrpc', '2.0');
      expect(proxyData).toHaveProperty('id', 1);
    }

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('6. View debug logs - Verify logging works', async ({ page }) => {
    const debugLogsPage = new DebugLogsPage(page);
    const profileName = `smoke-test-logs-${Date.now()}`;
    const serverName = `smoke-test-logs-server-${Date.now()}`;

    // Create MCP server
    const serverResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
      },
    });

    expect(serverResponse.status()).toBe(201);
    const server = await serverResponse.json();

    await page.waitForTimeout(500);

    // Create profile
    const profileResponse = await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
      data: {
        name: profileName,
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = await profileResponse.json();

    await page.waitForTimeout(500);

    // Add server to profile
    await retryRequest(page.request, 'post', `${API_URL}/api/profiles/${profile.id}/servers`, {
      data: {
        mcpServerId: server.id,
      },
    });

    await page.waitForTimeout(500);

    // Make a proxy request to generate debug log
    await retryRequest(page.request, 'post', `${API_URL}/api/mcp/${profileName}`, {
      data: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      },
    }).catch(() => {
      // Ignore errors - we just want to generate a log entry
    });

    await page.waitForTimeout(1000);

    // Navigate to debug logs page
    await debugLogsPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify debug logs page loads
    await expect(debugLogsPage.heading).toBeVisible({ timeout: 10000 });

    // Verify logs are displayed (might be empty, but page should work)
    const logsVisible = await page
      .getByText(/No logs found/i)
      .isVisible()
      .catch(() => false);
    const logsExist = (await page.locator('[class*="log"]').count()) > 0;

    // Either no logs message or actual logs should be visible
    expect(logsVisible || logsExist).toBeTruthy();

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('7. Complete workflow - End-to-end user journey', async ({ page }) => {
    const profilesPage = new ProfilesPage(page);
    const serversPage = new McpServersPage(page);
    const profileName = `smoke-test-complete-${Date.now()}`;
    const serverName = `smoke-test-complete-server-${Date.now()}`;

    // Step 1: Create MCP server with API key
    const serverResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        apiKeyConfig: {
          apiKey: 'complete-workflow-key',
          headerName: 'Authorization',
          headerValue: 'Bearer {apiKey}',
        },
      },
    });

    expect(serverResponse.status()).toBe(201);
    const server = await serverResponse.json();

    await page.waitForTimeout(500);

    // Step 2: Verify server appears in UI
    await serversPage.goto();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: serverName, level: 3 })).toBeVisible({
      timeout: 15000,
    });

    // Step 3: Create profile
    const profileResponse = await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
      data: {
        name: profileName,
        description: 'Complete workflow test profile',
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = await profileResponse.json();

    await page.waitForTimeout(500);

    // Step 4: Add server to profile
    const addServerResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/profiles/${profile.id}/servers`,
      {
        data: {
          mcpServerId: server.id,
        },
      }
    );

    expect(addServerResponse.status()).toBe(201);

    await page.waitForTimeout(500);

    // Step 5: Verify profile with MCP endpoint
    await profilesPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({
      timeout: 15000,
    });

    const mcpEndpoint = page.locator('code').filter({ hasText: profileName }).first();
    await expect(mcpEndpoint).toBeVisible({ timeout: 10000 });
    const endpointText = await mcpEndpoint.textContent();
    expect(endpointText).toContain(`/api/mcp/${profileName}`);

    // Step 6: Test proxy endpoint
    const proxyResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/mcp/${profileName}`,
      {
        data: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        },
      }
    );

    expect(proxyResponse.status()).toBeGreaterThanOrEqual(200);
    expect(proxyResponse.status()).toBeLessThan(500);

    // Step 7: Verify debug logs
    const debugLogsPage = new DebugLogsPage(page);
    await debugLogsPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(debugLogsPage.heading).toBeVisible({ timeout: 10000 });

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('8. MCP proxy endpoint info - Metadata endpoint', async ({ page }) => {
    const profileName = `smoke-test-info-${Date.now()}`;
    const serverName = `smoke-test-info-server-${Date.now()}`;

    // Create server
    const serverResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
      },
    });

    expect(serverResponse.status()).toBe(201);
    const server = await serverResponse.json();

    await page.waitForTimeout(500);

    // Create profile
    const profileResponse = await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
      data: {
        name: profileName,
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = await profileResponse.json();

    await page.waitForTimeout(500);

    // Add server to profile
    await retryRequest(page.request, 'post', `${API_URL}/api/profiles/${profile.id}/servers`, {
      data: {
        mcpServerId: server.id,
      },
    });

    await page.waitForTimeout(1000);

    // Test info endpoint
    const infoResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/mcp/${profileName}/info`
    );

    // Info endpoint should exist and return metadata
    expect(infoResponse.status()).toBeGreaterThanOrEqual(200);
    expect(infoResponse.status()).toBeLessThan(500);

    const infoData = await infoResponse.json().catch(() => null);
    if (infoData) {
      // Should have tools and/or resources
      expect(infoData).toHaveProperty('tools');
      expect(infoData).toHaveProperty('resources');
    }

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('9. Context7 MCP Integration - Verify tools availability', async ({ page }) => {
    const profileName = `smoke-test-context7-${Date.now()}`;
    const serverName = `smoke-test-context7-server-${Date.now()}`;

    // Step 1: Create MCP server with Context7 URL (no authentication required)
    // Context7 MCP is HTTP server but requires Accept: application/json, text/event-stream header
    const serverResponse = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://mcp.context7.com/mcp',
          transport: 'http',
        },
        // No auth config - Context7 MCP doesn't require authentication
      },
    });

    expect(serverResponse.status()).toBe(201);
    const server = (await serverResponse.json()) as {
      id: string;
      name: string;
      config: { url: string };
    };
    expect(server.name).toBe(serverName);
    expect(server.config.url).toBe('https://mcp.context7.com/mcp');

    await page.waitForTimeout(500);

    // Step 2: Create profile
    const profileResponse = await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
      data: {
        name: profileName,
        description: 'Test profile for Context7 MCP integration',
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = (await profileResponse.json()) as { id: string; name: string };
    expect(profile.name).toBe(profileName);

    await page.waitForTimeout(500);

    // Step 3: Add MCP server to profile
    const addServerResponse = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/profiles/${profile.id}/servers`,
      {
        data: {
          mcpServerId: server.id,
          order: 0,
        },
      }
    );

    expect(addServerResponse.status()).toBe(201);

    await page.waitForTimeout(2000); // Wait longer for server initialization

    // Step 4: Call /api/mcp/:profileId/info endpoint to get tools
    const infoResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/mcp/${profileName}/info`
    );

    // Verify endpoint returns success
    expect(infoResponse.status()).toBe(200);

    const infoData = (await infoResponse.json()) as {
      tools: Array<{ name: string; description: string }>;
      resources: unknown[];
    };
    expect(infoData).toHaveProperty('tools');
    expect(infoData).toHaveProperty('resources');
    expect(Array.isArray(infoData.tools)).toBe(true);
    expect(Array.isArray(infoData.resources)).toBe(true);

    // Step 5: Verify exactly 2 tools are available
    expect(infoData.tools).toHaveLength(2);

    // Step 6: Verify tools have required properties (name, description)
    for (const tool of infoData.tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
    }

    // Step 7: Verify tools are from Context7 MCP server
    // Tools should have meaningful names and descriptions
    const toolNames = infoData.tools.map((tool) => tool.name);
    expect(toolNames.length).toBe(2);
    // Verify tools are unique
    expect(new Set(toolNames).size).toBe(2);

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('10. Profile MCP Servers Management - Verify UI and MCP endpoint', async ({ page }) => {
    const profileName = `smoke-test-servers-mgmt-${Date.now()}`;
    const server1Name = `smoke-test-server1-${Date.now()}`;
    const server2Name = `smoke-test-server2-${Date.now()}`;

    // Step 1: Create two MCP servers
    const server1Response = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: server1Name,
        type: 'remote_http',
        config: {
          url: 'https://mcp.context7.com/mcp',
          transport: 'http',
        },
      },
    });

    expect(server1Response.status()).toBe(201);
    const server1 = (await server1Response.json()) as { id: string; name: string };

    await page.waitForTimeout(500);

    const server2Response = await retryRequest(page.request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: server2Name,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      },
    });

    expect(server2Response.status()).toBe(201);
    const server2 = (await server2Response.json()) as { id: string; name: string };

    await page.waitForTimeout(500);

    // Step 2: Create profile
    const profileResponse = await retryRequest(page.request, 'post', `${API_URL}/api/profiles`, {
      data: {
        name: profileName,
        description: 'Test profile for server management',
      },
    });

    expect(profileResponse.status()).toBe(201);
    const profile = (await profileResponse.json()) as { id: string; name: string };

    await page.waitForTimeout(500);

    // Step 3: Add servers to profile via API
    const addServer1Response = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/profiles/${profile.id}/servers`,
      {
        data: {
          mcpServerId: server1.id,
          order: 0,
        },
      }
    );

    expect(addServer1Response.status()).toBe(201);

    await page.waitForTimeout(500);

    const addServer2Response = await retryRequest(
      page.request,
      'post',
      `${API_URL}/api/profiles/${profile.id}/servers`,
      {
        data: {
          mcpServerId: server2.id,
          order: 1,
        },
      }
    );

    expect(addServer2Response.status()).toBe(201);

    await page.waitForTimeout(1000);

    // Step 4: Verify profile shows server count in UI
    await page.goto('/profiles');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify profile card shows server count
    await expect(page.getByRole('heading', { name: profileName })).toBeVisible({
      timeout: 15000,
    });

    // Verify server count badge is displayed - look for badge near the profile name
    const profileCard = page
      .locator(`[data-testid="profile-${profile.id}"], :has-text("${profileName}")`)
      .first();
    const serverCountBadge = profileCard.locator('text=/\\d+ server(s)?/').first();
    await expect(serverCountBadge).toBeVisible({ timeout: 10000 });
    const badgeText = await serverCountBadge.textContent();
    expect(badgeText).toMatch(/2 server/);

    // Step 5: Verify MCP proxy endpoint returns tools from assigned servers
    const infoResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/mcp/${profileName}/info`
    );

    expect(infoResponse.status()).toBe(200);

    const infoData = (await infoResponse.json()) as {
      tools: Array<{ name: string; description: string }>;
      resources: unknown[];
    };

    expect(infoData).toHaveProperty('tools');
    expect(infoData).toHaveProperty('resources');
    expect(Array.isArray(infoData.tools)).toBe(true);

    // Should have tools from Context7 server (2 tools) + potentially from example.com server
    // At minimum, should have tools from Context7
    expect(infoData.tools.length).toBeGreaterThanOrEqual(2);

    // Step 6: Verify GET /api/profiles/:id/servers endpoint
    const profileServersResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/profiles/${profile.id}/servers`
    );

    expect(profileServersResponse.status()).toBe(200);
    const profileServersData = (await profileServersResponse.json()) as { serverIds: string[] };
    expect(profileServersData.serverIds).toHaveLength(2);
    expect(profileServersData.serverIds).toContain(server1.id);
    expect(profileServersData.serverIds).toContain(server2.id);

    // Step 7: Remove one server and verify MCP endpoint updates
    await retryRequest(
      page.request,
      'delete',
      `${API_URL}/api/profiles/${profile.id}/servers/${server2.id}`
    );

    await page.waitForTimeout(1000);

    // Verify info endpoint now has fewer tools (only from server1)
    const infoResponse2 = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/mcp/${profileName}/info`
    );

    expect(infoResponse2.status()).toBe(200);
    const infoData2 = (await infoResponse2.json()) as {
      tools: Array<{ name: string }>;
    };

    // Should have exactly 2 tools from Context7 server
    expect(infoData2.tools).toHaveLength(2);

    // Cleanup
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server1.id}`);
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server2.id}`);
  });
});
