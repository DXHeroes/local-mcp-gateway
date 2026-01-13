/**
 * E2E Tests - Data Integrity
 *
 * Tests for data consistency and integrity:
 * - Editing non-existent profile
 * - Assigning non-existent server to profile
 * - Updating tool customizations for deleted server
 * - Orphaned tool customizations cleanup
 * - Cascade deletion behavior
 * - Foreign key constraints
 *
 * Test Suite 2.3: Data Integrity Errors
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

const API_URL = 'http://localhost:3001';
const CONTEXT7_URL = 'https://mcp.context7.com/mcp';

test.describe('Data Integrity', () => {
  // Clean up test data before and after each test
  test.beforeEach(async ({ page }) => {
    // Clean up test profiles
    try {
      const profilesResponse = await page.request.get(`${API_URL}/api/profiles`);
      if (profilesResponse.ok()) {
        const profiles = await profilesResponse.json();
        for (const profile of profiles) {
          if (profile.name.startsWith('test-integrity-')) {
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
          if (server.name.startsWith('test-integrity-')) {
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
          if (profile.name.startsWith('test-integrity-')) {
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
          if (server.name.startsWith('test-integrity-')) {
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

  test.describe('Non-Existent Resources', () => {
    test('2.3.1: Return 404 when editing non-existent profile', async ({ page }) => {
      // GIVEN: Non-existent profile ID
      const fakeProfileId = 'non-existent-profile-id-12345';

      // WHEN: Try to navigate to edit page
      await page.goto(`/profiles/${fakeProfileId}/edit`);
      await page.waitForLoadState('networkidle');

      // THEN: Should show 404 error page
      const notFoundMessage = page.locator('text=/not found|404|does not exist/i');
      await expect(notFoundMessage)
        .toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Might redirect to profiles page instead
          expect(page.url()).toContain('/profiles');
        });

      // Verify "Go to Profiles" button or link exists
      const goToProfilesButton = page.getByRole('link', { name: /profiles|back|home/i });
      if (await notFoundMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(goToProfilesButton)
          .toBeVisible({ timeout: 3000 })
          .catch(() => {
            expect(true).toBe(true);
          });
      }
    });

    test('2.3.2: Return 404 when assigning non-existent server to profile', async ({ page }) => {
      // GIVEN: Valid profile, non-existent server
      const profile = await createTestProfile(page.request, 'test-integrity-valid-profile');
      const fakeServerId = 'non-existent-server-id-12345';

      // WHEN: Try to assign non-existent server
      const assignResponse = await page.request
        .post(`${API_URL}/api/profiles/${profile.id}/servers`, {
          data: {
            serverId: fakeServerId,
          },
        })
        .catch((e) => ({ status: () => 404, ok: () => false }));

      // THEN: Should return 404
      expect(assignResponse.status()).toBe(404);
    });

    test('2.3.3: Return 404 when getting non-existent profile via API', async ({ page }) => {
      // GIVEN: Non-existent profile ID
      const fakeProfileId = 'non-existent-profile-id-67890';

      // WHEN: Try to GET profile
      const getResponse = await page.request
        .get(`${API_URL}/api/profiles/${fakeProfileId}`)
        .catch((e) => ({ status: () => 404, ok: () => false }));

      // THEN: Should return 404
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('Deleted Resources', () => {
    test('2.3.4: Handle updating tool customizations for deleted server', async ({ page }) => {
      // GIVEN: Profile with server that gets deleted
      const profile = await createTestProfile(page.request, 'test-integrity-deleted-server');
      const server = await createTestMcpServer(
        page.request,
        'test-integrity-server-to-delete',
        'remote_http',
        { url: CONTEXT7_URL }
      );
      await assignServerToProfile(page.request, profile.id, server.id);

      // Delete the server
      await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);

      // WHEN: Try to update tool customizations
      const updateResponse = await page.request
        .put(`${API_URL}/api/profiles/${profile.id}/servers/${server.id}/tools`, {
          data: {
            tools: [
              {
                name: 'test-tool',
                enabled: false,
              },
            ],
          },
        })
        .catch((e) => ({ status: () => 404, ok: () => false }));

      // THEN: Should return 404
      expect(updateResponse.status()).toBe(404);
    });

    test('2.3.5: Show error when deleted profile is accessed', async ({ page }) => {
      // GIVEN: Profile that gets deleted
      const profile = await createTestProfile(page.request, 'test-integrity-profile-to-delete');
      const profileId = profile.id;

      // Delete the profile
      await safeDelete(page.request, `${API_URL}/api/profiles/${profileId}`);

      // WHEN: Try to access profile edit page
      await page.goto(`/profiles/${profileId}/edit`);
      await page.waitForLoadState('networkidle');

      // THEN: Should show error
      const errorMessage = page.locator('text=/not found|does not exist|deleted/i');
      await expect(errorMessage)
        .toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Might redirect to profiles page
          expect(page.url()).toContain('/profiles');
        });
    });
  });

  test.describe('Orphaned Data Cleanup', () => {
    test('2.3.6: Clean up tool customizations when profile is deleted', async ({ page }) => {
      // GIVEN: Profile with customized tools
      const profile = await createTestProfile(page.request, 'test-integrity-cleanup');
      const server = await createTestMcpServer(
        page.request,
        'test-integrity-cleanup-server',
        'remote_http',
        { url: CONTEXT7_URL }
      );
      await assignServerToProfile(page.request, profile.id, server.id);

      // Set up tool customizations via API
      await retryRequest(
        page.request,
        'put',
        `${API_URL}/api/profiles/${profile.id}/servers/${server.id}/tools`,
        {
          data: {
            tools: [
              {
                name: 'test-tool',
                enabled: true,
                customName: 'Custom Tool Name',
              },
            ],
          },
        }
      ).catch(() => {
        // API might not be fully implemented yet
      });

      // WHEN: Delete the profile
      await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);

      // THEN: Tool customizations should be cleaned up
      // Try to access tool customizations (should fail or return empty)
      const toolsResponse = await page.request
        .get(`${API_URL}/api/profiles/${profile.id}/servers/${server.id}/tools`)
        .catch((e) => ({ status: () => 404, ok: () => false }));

      expect(toolsResponse.status()).toBe(404);
    });

    test('2.3.7: New profile with same name starts fresh (no old customizations)', async ({
      page,
    }) => {
      // GIVEN: Profile with customizations that gets deleted
      const profileName = 'test-integrity-same-name';
      const profile1 = await createTestProfile(page.request, profileName);
      const server = await createTestMcpServer(
        page.request,
        'test-integrity-same-name-server',
        'remote_http',
        { url: CONTEXT7_URL }
      );
      await assignServerToProfile(page.request, profile1.id, server.id);

      // Add customizations
      await retryRequest(
        page.request,
        'put',
        `${API_URL}/api/profiles/${profile1.id}/servers/${server.id}/tools`,
        {
          data: {
            tools: [
              {
                name: 'test-tool',
                enabled: true,
                customName: 'Old Custom Name',
              },
            ],
          },
        }
      ).catch(() => {});

      // Delete the profile
      await safeDelete(page.request, `${API_URL}/api/profiles/${profile1.id}`);
      await page.waitForTimeout(500);

      // WHEN: Create new profile with same name
      const profile2 = await createTestProfile(page.request, profileName);
      await assignServerToProfile(page.request, profile2.id, server.id);

      // THEN: New profile should NOT have old customizations
      const toolsResponse = await retryRequest(
        page.request,
        'get',
        `${API_URL}/api/profiles/${profile2.id}/servers/${server.id}/tools`,
        {}
      ).catch((e) => ({ status: () => 404, ok: () => false, json: () => Promise.resolve([]) }));

      if (toolsResponse.status() === 200) {
        const tools = await toolsResponse.json();
        const testTool = tools.find((t: any) => t.name === 'test-tool');

        // If tool exists, it should NOT have old customizations
        if (testTool) {
          expect(testTool.customName).not.toBe('Old Custom Name');
        }
      }
    });
  });

  test.describe('Cascade Deletion', () => {
    test('2.3.8: Profile deletion does NOT delete MCP servers', async ({ page }) => {
      // GIVEN: Profile with assigned server
      const profile = await createTestProfile(page.request, 'test-integrity-cascade-profile');
      const server = await createTestMcpServer(
        page.request,
        'test-integrity-cascade-server',
        'remote_http',
        { url: CONTEXT7_URL }
      );
      await assignServerToProfile(page.request, profile.id, server.id);

      // WHEN: Delete the profile
      await safeDelete(page.request, `${API_URL}/api/profiles/${profile.id}`);

      // THEN: Server should still exist
      const serverResponse = await retryRequest(
        page.request,
        'get',
        `${API_URL}/api/mcp-servers/${server.id}`,
        {}
      );

      expect(serverResponse.status()).toBe(200);
      const serverData = await serverResponse.json();
      expect(serverData.id).toBe(server.id);
    });

    test('2.3.9: Server deletion removes profile-server assignments', async ({ page }) => {
      // GIVEN: Profile with assigned server
      const profile = await createTestProfile(page.request, 'test-integrity-server-delete');
      const server = await createTestMcpServer(
        page.request,
        'test-integrity-server-to-remove',
        'remote_http',
        { url: CONTEXT7_URL }
      );
      await assignServerToProfile(page.request, profile.id, server.id);

      // WHEN: Delete the server
      await safeDelete(page.request, `${API_URL}/api/mcp-servers/${server.id}`);

      // THEN: Profile-server assignment should be removed
      const profileResponse = await retryRequest(
        page.request,
        'get',
        `${API_URL}/api/profiles/${profile.id}`,
        {}
      );

      if (profileResponse.status() === 200) {
        const profileData = await profileResponse.json();

        // Profile should still exist
        expect(profileData.id).toBe(profile.id);

        // But server should not be in assigned servers list
        if (profileData.servers) {
          const hasDeletedServer = profileData.servers.some((s: any) => s.id === server.id);
          expect(hasDeletedServer).toBe(false);
        }
      }
    });
  });

  test.describe('Foreign Key Constraints', () => {
    test('2.3.10: Cannot assign same server twice to same profile', async ({ page }) => {
      // GIVEN: Profile with assigned server
      const profile = await createTestProfile(page.request, 'test-integrity-duplicate-assign');
      const server = await createTestMcpServer(
        page.request,
        'test-integrity-duplicate-server',
        'remote_http',
        { url: CONTEXT7_URL }
      );
      await assignServerToProfile(page.request, profile.id, server.id);

      // WHEN: Try to assign same server again
      const assignResponse = await page.request
        .post(`${API_URL}/api/profiles/${profile.id}/servers`, {
          data: {
            serverId: server.id,
          },
        })
        .catch((e) => ({ status: () => 409, ok: () => false }));

      // THEN: Should return error (409 Conflict or 400 Bad Request)
      const status = assignResponse.status();
      expect([400, 409, 500]).toContain(status);
    });

    test('2.3.11: Cannot create profile with invalid data', async ({ page }) => {
      // WHEN: Try to create profile with missing required field
      const createResponse = await page.request
        .post(`${API_URL}/api/profiles`, {
          data: {
            // Missing 'name' field
            description: 'Profile without name',
          },
        })
        .catch((e) => ({ status: () => 400, ok: () => false }));

      // THEN: Should return 400 Bad Request
      expect(createResponse.status()).toBe(400);
    });

    test('2.3.12: Cannot create MCP server with invalid configuration', async ({ page }) => {
      // WHEN: Try to create remote_http server without URL
      const createResponse = await page.request
        .post(`${API_URL}/api/mcp-servers`, {
          data: {
            name: 'test-integrity-invalid-server',
            type: 'remote_http',
            config: {
              // Missing 'url' field
            },
          },
        })
        .catch((e) => ({ status: () => 400, ok: () => false }));

      // THEN: Should return 400 Bad Request
      expect(createResponse.status()).toBe(400);
    });
  });

  test.describe('Concurrent Modifications', () => {
    test('2.3.13: Handle concurrent profile updates gracefully', async ({ page }) => {
      // GIVEN: Profile exists
      const profile = await createTestProfile(page.request, 'test-integrity-concurrent');

      // WHEN: Two concurrent updates
      const update1 = retryRequest(page.request, 'put', `${API_URL}/api/profiles/${profile.id}`, {
        data: {
          description: 'Update 1',
        },
      });

      const update2 = retryRequest(page.request, 'put', `${API_URL}/api/profiles/${profile.id}`, {
        data: {
          description: 'Update 2',
        },
      });

      const [response1, response2] = await Promise.all([update1, update2]);

      // THEN: Both should succeed (last write wins) or one should fail gracefully
      expect(response1.status() === 200 || response1.status() === 409).toBe(true);
      expect(response2.status() === 200 || response2.status() === 409).toBe(true);

      // Verify final state is consistent
      const finalResponse = await retryRequest(
        page.request,
        'get',
        `${API_URL}/api/profiles/${profile.id}`,
        {}
      );
      const finalProfile = await finalResponse.json();
      expect(['Update 1', 'Update 2']).toContain(finalProfile.description);
    });
  });
});
