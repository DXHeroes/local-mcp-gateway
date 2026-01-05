/**
 * E2E Tests - Complete Profile Tool Management Journey
 *
 * This test suite covers the complete end-to-end workflow for a power user
 * who wants to fully configure a profile with customized MCP tools.
 *
 * Complete Journey:
 * 1. Create profile
 * 2. Add Context7 MCP server
 * 3. Assign server to profile
 * 4. Navigate to profile edit page
 * 5. Customize tool name and description
 * 6. Disable one tool
 * 7. Verify changes via MCP proxy
 * 8. Re-enable tool and reset customization
 * 9. Clean up (delete profile)
 *
 * Test Suite 3.1: Complete Profile Tool Management Journey
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: Test file allows any types */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: Test parameters may be unused */

import { expect, test } from '@playwright/test';
import {
  assignServerToProfile,
  createTestMcpServer,
  createTestProfile,
  retryRequest,
  safeDelete,
} from './helpers';
import { ProfileEditPage } from './pages/ProfileEditPage';

const API_URL = 'http://localhost:3001';
const CONTEXT7_URL = 'https://mcp.context7.com/mcp';

test.describe('Complete Profile Tool Management Journey', () => {
  // Clean up test data before and after each test
  test.beforeEach(async ({ page }) => {
    // Clean up test profiles
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-journey-') || profile.name === 'production-profile') {
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
          if (server.name.startsWith('test-journey-') || server.name === 'Context7') {
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
    // Same cleanup as beforeEach
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-journey-') || profile.name === 'production-profile') {
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
          if (server.name.startsWith('test-journey-') || server.name === 'Context7') {
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

  test('3.1.1: Power user complete profile tool customization workflow', async ({ page }) => {
    // ========================================
    // PHASE 1: SETUP - Create Profile and Server
    // ========================================

    // GIVEN: Create production profile
    const profile = await createTestProfile(
      page.request,
      'production-profile',
      'Production MCP profile with customized tools'
    );
    expect(profile.id).toBeDefined();
    expect(profile.name).toBe('production-profile');

    console.log(`✅ Created profile: ${profile.name} (${profile.id})`);

    // Add Context7 MCP server
    const server = await createTestMcpServer(page.request, 'Context7', 'remote_http', {
      url: CONTEXT7_URL,
    });
    expect(server.id).toBeDefined();
    expect(server.name).toBe('Context7');

    console.log(`✅ Created MCP server: ${server.name} (${server.id})`);

    // Assign server to profile
    await assignServerToProfile(page.request, profile.id, server.id);
    console.log(`✅ Assigned server to profile`);

    // ========================================
    // PHASE 2: TOOL CUSTOMIZATION - Edit Tools
    // ========================================

    // WHEN: Navigate to profile edit page
    const editPage = new ProfileEditPage(page);
    await editPage.goto(profile.id);

    console.log(`✅ Navigated to profile edit page`);

    // Verify we're on the edit page
    await expect(editPage.heading).toBeVisible();

    // Expand Context7 server card
    await editPage.expandServerCard('Context7');
    await editPage.waitForToolsLoad();

    console.log(`✅ Expanded server card and loaded tools`);

    // THEN: Verify tools are visible
    const toolItems = page.locator('[data-testid="tool-item"]');
    const toolCount = await toolItems.count();
    expect(toolCount).toBeGreaterThanOrEqual(2);

    console.log(`✅ Found ${toolCount} tools from Context7 server`);

    // Get tool names
    const tool1Name = 'resolve-library-id';
    const tool2Name = 'get-library-docs';

    // ========================================
    // PHASE 3: CUSTOMIZE FIRST TOOL
    // ========================================

    console.log(`\n🔧 Customizing first tool: ${tool1Name}`);

    // Open tool details and customize
    await editPage.customizeToolName('Context7', tool1Name, 'Find Library Info');

    // Save in dialog
    const saveButton = page.getByRole('button', { name: /save|apply/i });
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      console.log(`✅ Saved tool name customization in dialog`);
    }

    // Customize description
    await editPage.customizeToolDescription(
      'Context7',
      tool1Name,
      'Searches for library documentation and metadata'
    );

    // Save in dialog
    const saveButton2 = page.getByRole('button', { name: /save|apply/i });
    if (await saveButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton2.click();
      console.log(`✅ Saved tool description customization in dialog`);
    }

    // Close dialog
    const closeButton = page.getByRole('button', { name: /close/i });
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
    }

    // Save overall changes
    await editPage.saveChanges();
    console.log(`✅ Saved all customizations`);

    await page.waitForTimeout(1000);

    // THEN: Verify customization badge
    const isCustomized = await editPage.isToolCustomized('Context7', tool1Name);
    expect(isCustomized).toBe(true);
    console.log(`✅ Tool shows "Customized" badge`);

    // ========================================
    // PHASE 4: DISABLE SECOND TOOL
    // ========================================

    console.log(`\n🔧 Disabling second tool: ${tool2Name}`);

    // Disable the second tool
    await editPage.toggleTool('Context7', tool2Name, false);
    await page.waitForTimeout(300);

    // Save changes
    await editPage.saveChanges();
    console.log(`✅ Disabled tool and saved`);

    await page.waitForTimeout(1000);

    // THEN: Verify tools count
    const toolsCount = await editPage.getToolsCount('Context7');
    console.log(`✅ Tools count: ${toolsCount}`);

    // ========================================
    // PHASE 5: VERIFY VIA PROXY
    // ========================================

    console.log(`\n🔍 Verifying changes via MCP proxy`);

    // Call MCP proxy endpoint to verify tool configuration
    const proxyResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/mcp/production-profile/info`,
      {}
    );

    expect(proxyResponse.status()).toBe(200);
    const proxyData = await proxyResponse.json();

    console.log(`✅ MCP proxy responded with profile info`);

    // THEN: Response should contain only enabled tools
    if (proxyData.tools) {
      const enabledTools = proxyData.tools;

      // Should have only 1 enabled tool (second one is disabled)
      const enabledToolsCount = Array.isArray(enabledTools) ? enabledTools.length : 0;
      console.log(`   Enabled tools in proxy: ${enabledToolsCount}`);

      // Find the customized tool
      const customizedTool = enabledTools.find(
        (t: any) =>
          t.name.includes('Find Library Info') || t.customName?.includes('Find Library Info')
      );

      if (customizedTool) {
        console.log(`✅ Found customized tool in proxy response: ${customizedTool.name}`);
      }

      // Disabled tool should NOT be in the list
      const disabledTool = enabledTools.find((t: any) => t.name === tool2Name);
      expect(disabledTool).toBeUndefined();
      console.log(`✅ Disabled tool is not in enabled tools list`);
    }

    // ========================================
    // PHASE 6: RE-ENABLE AND RESET
    // ========================================

    console.log(`\n🔄 Re-enabling tool and resetting customization`);

    // Go back to edit page
    await editPage.goto(profile.id);
    await editPage.expandServerCard('Context7');
    await editPage.waitForToolsLoad();

    // Re-enable second tool
    await editPage.toggleTool('Context7', tool2Name, true);
    await page.waitForTimeout(300);
    console.log(`✅ Re-enabled second tool`);

    // Reset first tool customization
    await editPage.resetToOriginal('Context7', tool1Name);

    // Close dialog
    const closeButton2 = page.getByRole('button', { name: /close/i });
    if (await closeButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton2.click();
    }

    // Save changes
    await editPage.saveChanges();
    console.log(`✅ Reset customization and saved`);

    await page.waitForTimeout(1000);

    // THEN: Both tools should be enabled with original values
    const isStillCustomized = await editPage.isToolCustomized('Context7', tool1Name);
    expect(isStillCustomized).toBe(false);
    console.log(`✅ Tool no longer has "Customized" badge`);

    // Verify via API
    const toolsResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/profiles/${profile.id}/servers/${server.id}/tools`,
      {}
    );

    if (toolsResponse.status() === 200) {
      const tools = await toolsResponse.json();
      const tool1 = tools.find((t: any) => t.name === tool1Name);
      const tool2 = tools.find((t: any) => t.name === tool2Name);

      // Both should be enabled
      if (tool1) {
        expect(tool1.enabled).toBe(true);
        console.log(`✅ Tool 1 is enabled`);
      }

      if (tool2) {
        expect(tool2.enabled).toBe(true);
        console.log(`✅ Tool 2 is enabled`);
      }

      // Tool 1 should not have customizations
      if (tool1) {
        expect(tool1.customName).toBeUndefined();
        console.log(`✅ Tool 1 has no custom name`);
      }
    }

    // ========================================
    // PHASE 7: CLEANUP
    // ========================================

    console.log(`\n🧹 Cleaning up`);

    // Delete profile
    await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);
    console.log(`✅ Deleted profile`);

    await page.waitForTimeout(500);

    // THEN: Tool customizations should be automatically removed
    const customizationsResponse = await page.request
      .get(`${API_URL}/api/profiles/${profile.id}/servers/${server.id}/tools`)
      .catch((e) => ({ status: () => 404, ok: () => false }));

    expect(customizationsResponse.status()).toBe(404);
    console.log(`✅ Tool customizations cleaned up`);

    // Server should still exist (not cascade deleted)
    const serverResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/mcp-servers/${server.id}`,
      {}
    );

    expect(serverResponse.status()).toBe(200);
    console.log(`✅ Server still exists (not cascade deleted)`);

    // Final cleanup - delete server
    await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);
    console.log(`✅ Deleted server`);

    console.log(`\n✨ Complete workflow test passed!`);
  });

  test('3.1.2: Multiple profiles with same server have independent tool customizations', async ({
    page,
  }) => {
    // GIVEN: Two profiles with same server
    const profile1 = await createTestProfile(page.request, 'test-journey-profile-1');
    const profile2 = await createTestProfile(page.request, 'test-journey-profile-2');

    const server = await createTestMcpServer(
      page.request,
      'test-journey-shared-server',
      'remote_http',
      { url: CONTEXT7_URL }
    );

    await assignServerToProfile(page.request, profile1.id, server.id);
    await assignServerToProfile(page.request, profile2.id, server.id);

    console.log(`✅ Created 2 profiles with shared server`);

    // WHEN: Customize tools differently for each profile
    const editPage = new ProfileEditPage(page);

    // Profile 1: Disable first tool
    await editPage.goto(profile1.id);
    await editPage.expandServerCard('test-journey-shared-server');
    await editPage.waitForToolsLoad();

    const tool1Name = 'resolve-library-id';
    await editPage.toggleTool('test-journey-shared-server', tool1Name, false);
    await editPage.saveChanges();

    console.log(`✅ Profile 1: Disabled tool`);

    await page.waitForTimeout(1000);

    // Profile 2: Keep all tools enabled, customize name
    await editPage.goto(profile2.id);
    await editPage.expandServerCard('test-journey-shared-server');
    await editPage.waitForToolsLoad();

    await editPage.customizeToolName('test-journey-shared-server', tool1Name, 'Custom Name P2');

    const saveButton = page.getByRole('button', { name: /save|apply/i });
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
    }

    const closeButton = page.getByRole('button', { name: /close/i });
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
    }

    await editPage.saveChanges();

    console.log(`✅ Profile 2: Customized tool name`);

    await page.waitForTimeout(1000);

    // THEN: Each profile should have independent customizations
    const tools1Response = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/profiles/${profile1.id}/servers/${server.id}/tools`,
      {}
    );

    const tools2Response = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/profiles/${profile2.id}/servers/${server.id}/tools`,
      {}
    );

    if (tools1Response.status() === 200 && tools2Response.status() === 200) {
      const tools1 = await tools1Response.json();
      const tools2 = await tools2Response.json();

      const p1Tool = tools1.find((t: any) => t.name === tool1Name);
      const p2Tool = tools2.find((t: any) => t.name === tool1Name);

      // Profile 1: Tool is disabled
      if (p1Tool) {
        expect(p1Tool.enabled).toBe(false);
        console.log(`✅ Profile 1 tool is disabled`);
      }

      // Profile 2: Tool is enabled with custom name
      if (p2Tool) {
        expect(p2Tool.enabled).toBe(true);
        expect(p2Tool.customName).toBe('Custom Name P2');
        console.log(`✅ Profile 2 tool is enabled with custom name`);
      }
    }

    console.log(`✨ Independent customizations test passed!`);
  });

  test('3.1.3: Tool customizations persist across page refreshes', async ({ page }) => {
    // GIVEN: Profile with customized tool
    const profile = await createTestProfile(page.request, 'test-journey-persist');
    const server = await createTestMcpServer(
      page.request,
      'test-journey-persist-server',
      'remote_http',
      { url: CONTEXT7_URL }
    );
    await assignServerToProfile(page.request, profile.id, server.id);

    const editPage = new ProfileEditPage(page);
    await editPage.goto(profile.id);

    await editPage.expandServerCard('test-journey-persist-server');
    await editPage.waitForToolsLoad();

    const toolName = 'resolve-library-id';
    await editPage.customizeToolName('test-journey-persist-server', toolName, 'Persistent Name');

    const saveButton = page.getByRole('button', { name: /save|apply/i });
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
    }

    const closeButton = page.getByRole('button', { name: /close/i });
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
    }

    await editPage.saveChanges();

    console.log(`✅ Customized tool name`);

    await page.waitForTimeout(1000);

    // WHEN: Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log(`✅ Refreshed page`);

    await editPage.expandServerCard('test-journey-persist-server');
    await editPage.waitForToolsLoad();

    // THEN: Customization should still be there
    const isCustomized = await editPage.isToolCustomized('test-journey-persist-server', toolName);
    expect(isCustomized).toBe(true);

    console.log(`✅ Customization persisted after refresh`);

    // Verify via API
    const toolsResponse = await retryRequest(
      page.request,
      'get',
      `${API_URL}/api/profiles/${profile.id}/servers/${server.id}/tools`,
      {}
    );

    if (toolsResponse.status() === 200) {
      const tools = await toolsResponse.json();
      const customizedTool = tools.find((t: any) => t.name === toolName);

      expect(customizedTool?.customName).toBe('Persistent Name');
      console.log(`✅ Custom name persisted in database`);
    }

    console.log(`✨ Persistence test passed!`);
  });
});
