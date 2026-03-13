/**
 * E2E tests for API integration
 *
 * Tests the API endpoints directly and verifies the complete
 * profile-server-proxy workflow via API.
 */

import { expect, test } from '@playwright/test';
import { API_BASE, retryRequest, safeDelete } from './helpers';

const API_URL = API_BASE;

test.describe('API Integration', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({ request }) => {
    // Clean up test data
    try {
      const profiles = await (await request.get(`${API_URL}/api/profiles`)).json();
      for (const p of profiles) {
        if (p.name.startsWith('e2e-api-')) {
          await safeDelete(request, `${API_URL}/api/profiles/${p.id}`);
        }
      }
    } catch {
      // Ignore
    }
    try {
      const servers = await (await request.get(`${API_URL}/api/mcp-servers`)).json();
      for (const s of servers) {
        if (s.name.startsWith('e2e-api-')) {
          await safeDelete(request, `${API_URL}/api/mcp-servers/${s.id}`);
        }
      }
    } catch {
      // Ignore
    }
  });

  test('CRUD: create, read, update, delete profile', async ({ request }) => {
    // Create
    const createRes = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: `e2e-api-crud-${Date.now()}`, description: 'test' },
    });
    expect(createRes.status()).toBe(201);
    const profile = await createRes.json();
    expect(profile.name).toContain('e2e-api-crud-');

    // Read
    const readRes = await request.get(`${API_URL}/api/profiles/${profile.id}`);
    expect(readRes.ok()).toBeTruthy();
    const readProfile = await readRes.json();
    expect(readProfile.name).toBe(profile.name);

    // Update
    const updateRes = await request.put(`${API_URL}/api/profiles/${profile.id}`, {
      data: { name: profile.name, description: 'updated' },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.description).toBe('updated');

    // Delete
    const deleteRes = await request.delete(`${API_URL}/api/profiles/${profile.id}`);
    expect(deleteRes.status()).toBe(204);

    // Verify deletion
    const verifyRes = await request.get(`${API_URL}/api/profiles/${profile.id}`);
    expect(verifyRes.status()).toBe(404);
  });

  test('CRUD: create, read, update, delete MCP server', async ({ request }) => {
    const serverName = `e2e-api-server-${Date.now()}`;

    // Create
    const createRes = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(createRes.status()).toBe(201);
    const server = await createRes.json();

    // Read
    const readRes = await request.get(`${API_URL}/api/mcp-servers/${server.id}`);
    expect(readRes.ok()).toBeTruthy();

    // Update
    const updateRes = await request.put(`${API_URL}/api/mcp-servers/${server.id}`, {
      data: {
        name: `${serverName}-updated`,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp-updated' },
      },
    });
    expect(updateRes.ok()).toBeTruthy();

    // Delete
    const deleteRes = await request.delete(`${API_URL}/api/mcp-servers/${server.id}`);
    expect(deleteRes.status()).toBe(204);
  });

  test('should assign server to profile', async ({ request }) => {
    const profileName = `e2e-api-assign-${Date.now()}`;
    const serverName = `e2e-api-assign-server-${Date.now()}`;

    // Create server
    const serverRes = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(serverRes.status()).toBe(201);
    const server = await serverRes.json();

    // Create profile
    const profileRes = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    expect(profileRes.status()).toBe(201);
    const profile = await profileRes.json();

    // Assign server to profile
    const assignRes = await retryRequest(
      request,
      'post',
      `${API_URL}/api/profiles/${profile.id}/servers`,
      {
        data: { mcpServerId: server.id, order: 0 },
      },
    );
    expect(assignRes.status()).toBe(201);

    // Verify assignment
    const getServersRes = await request.get(`${API_URL}/api/profiles/${profile.id}/servers`);
    expect(getServersRes.ok()).toBeTruthy();
    const assigned = await getServersRes.json();
    expect(Array.isArray(assigned)).toBeTruthy();
    expect(assigned.length).toBeGreaterThanOrEqual(1);

    // Cleanup
    await safeDelete(request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('should remove server from profile', async ({ request }) => {
    const profileName = `e2e-api-remove-${Date.now()}`;
    const serverName = `e2e-api-remove-server-${Date.now()}`;

    // Create server + profile + assign
    const serverRes = await retryRequest(request, 'post', `${API_URL}/api/mcp-servers`, {
      data: {
        name: serverName,
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    const server = await serverRes.json();

    const profileRes = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    const profile = await profileRes.json();

    await retryRequest(request, 'post', `${API_URL}/api/profiles/${profile.id}/servers`, {
      data: { mcpServerId: server.id, order: 0 },
    });

    // Remove server from profile
    const removeRes = await request.delete(
      `${API_URL}/api/profiles/${profile.id}/servers/${server.id}`,
    );
    expect(removeRes.ok()).toBeTruthy();

    // Verify removal
    const getServersRes = await request.get(`${API_URL}/api/profiles/${profile.id}/servers`);
    const assigned = await getServersRes.json();
    const serverIds = Array.isArray(assigned) ? assigned.map((a: { mcpServerId: string }) => a.mcpServerId) : [];
    expect(serverIds).not.toContain(server.id);

    // Cleanup
    await safeDelete(request, `${API_URL}/api/profiles/${profile.id}`);
    await safeDelete(request, `${API_URL}/api/mcp-servers/${server.id}`);
  });

  test('debug logs endpoint should respond', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/debug/logs`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('logs');
    expect(data).toHaveProperty('total');
  });

  test('settings endpoint should respond', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/settings`);
    expect(response.ok()).toBeTruthy();
  });

  test('should return 404 for non-existent profile', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/profiles/non-existent-id`);
    expect(response.status()).toBe(404);
  });

  test('should return 404 for non-existent server', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/mcp-servers/non-existent-id`);
    expect(response.status()).toBe(404);
  });

  test('should reject creating server with missing name', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/mcp-servers`, {
      data: {
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(response.status()).toBe(400);
  });

  test('should reject creating profile without name field', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/profiles`, {
      data: {},
    });
    // Should fail validation - missing required field
    expect(response.ok()).toBeFalsy();
  });

  test('should return 404 when updating non-existent profile', async ({ request }) => {
    const response = await request.put(`${API_URL}/api/profiles/non-existent-id-12345`, {
      data: { name: 'e2e-api-phantom', description: 'does not exist' },
    });
    expect(response.status()).toBe(404);
  });

  test('should return 404 when deleting already-deleted profile', async ({ request }) => {
    // Create and delete a profile
    const createRes = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: `e2e-api-double-delete-${Date.now()}` },
    });
    expect(createRes.status()).toBe(201);
    const profile = await createRes.json();

    const deleteRes = await request.delete(`${API_URL}/api/profiles/${profile.id}`);
    expect(deleteRes.status()).toBe(204);

    // Try deleting again
    const deleteAgainRes = await request.delete(`${API_URL}/api/profiles/${profile.id}`);
    expect(deleteAgainRes.status()).toBe(404);
  });

  test('settings: GET and PUT default-gateway-profile', async ({ request }) => {
    // GET settings
    const getRes = await request.get(`${API_URL}/api/settings/default-gateway-profile`);
    expect(getRes.ok()).toBeTruthy();
    const settings = await getRes.json();
    expect(settings).toHaveProperty('profileName');

    // Create a profile to set as default
    const profileName = `e2e-api-gateway-${Date.now()}`;
    const createRes = await retryRequest(request, 'post', `${API_URL}/api/profiles`, {
      data: { name: profileName },
    });
    expect(createRes.status()).toBe(201);

    // PUT to set it as default
    const putRes = await request.put(`${API_URL}/api/settings/default-gateway-profile`, {
      data: { profileName },
    });
    expect(putRes.ok()).toBeTruthy();

    // Verify it was set
    const verifyRes = await request.get(`${API_URL}/api/settings/default-gateway-profile`);
    const verified = await verifyRes.json();
    expect(verified.profileName).toBe(profileName);
  });

  test('should return 404 when updating non-existent server', async ({ request }) => {
    const response = await request.put(`${API_URL}/api/mcp-servers/non-existent-id-12345`, {
      data: {
        name: 'e2e-api-phantom-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      },
    });
    expect(response.status()).toBe(404);
  });
});
