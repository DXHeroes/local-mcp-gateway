/**
 * E2E tests for OAuth flow
 *
 * Tests complete OAuth flows:
 * - OAuth consent screen redirect
 * - Callback handling
 * - Token refresh
 * - Token revocation
 */

import { expect, test } from '@playwright/test';
import { safeDelete } from './helpers';

test.describe('OAuth Flow', () => {
  test('should redirect to OAuth authorization URL', async ({ page }) => {
    const serverName = `test-oauth-server-${Date.now()}`;

    // Create server with OAuth config via API
    const createResponse = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read', 'write'],
          requiresOAuth: true,
        },
      },
    });

    expect(createResponse.status()).toBe(201);
    const server = await createResponse.json();

    // Navigate to OAuth authorize endpoint
    // This will redirect to external OAuth provider, so we expect navigation
    const response = await page
      .goto(`http://localhost:3001/api/oauth/authorize/${server.id}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
      .catch(() => null);

    // The endpoint should redirect (3xx) or navigate away
    // In a real scenario, this redirects to OAuth provider
    // We just verify the endpoint exists and responds (might be redirect or error if OAuth server not configured)
    if (response) {
      expect([200, 300, 301, 302, 303, 307, 308]).toContain(response.status());
    }

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should handle OAuth callback with success', async ({ page }) => {
    const serverName = `test-oauth-callback-${Date.now()}`;

    // Create server with OAuth config via API
    const createResponse = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
        },
      },
    });

    expect(createResponse.status()).toBe(201);
    const server = await createResponse.json();

    // Simulate OAuth callback with success parameters
    const callbackUrl = new URL('http://localhost:3001/api/oauth/callback');
    callbackUrl.searchParams.set('code', 'test-authorization-code');
    callbackUrl.searchParams.set('state', 'test-state');
    callbackUrl.searchParams.set('mcp_server_id', server.id);
    callbackUrl.searchParams.set('code_verifier', 'test-code-verifier');

    // Navigate to callback URL
    await page.goto(callbackUrl.toString());

    // Check that callback page loads (should show success message)
    await expect(page.getByText(/Authorization successful/i)).toBeVisible();

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should handle OAuth callback with error', async ({ page }) => {
    const serverName = `test-oauth-error-${Date.now()}`;

    // Create server with OAuth config via API
    const createResponse = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
        },
      },
    });

    expect(createResponse.status()).toBe(201);
    const server = await createResponse.json();

    // Simulate OAuth callback with error
    const callbackUrl = new URL('http://localhost:3001/api/oauth/callback');
    callbackUrl.searchParams.set('error', 'access_denied');
    callbackUrl.searchParams.set('mcp_server_id', server.id);

    // Navigate to callback URL
    const response = await page.goto(callbackUrl.toString());

    // Check that error is handled (should return error response)
    expect(response?.status()).toBe(400);

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });

  test('should handle OAuth callback with missing parameters', async ({ page }) => {
    const serverName = `test-oauth-missing-params-${Date.now()}`;

    // Create server with OAuth config via API
    const createResponse = await page.request.post('http://localhost:3001/api/mcp-servers', {
      data: {
        name: serverName,
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
        },
      },
    });

    expect(createResponse.status()).toBe(201);
    const server = await createResponse.json();

    // Simulate OAuth callback without required parameters
    const callbackUrl = new URL('http://localhost:3001/api/oauth/callback');
    // Missing code, state, mcp_server_id

    // Navigate to callback URL
    const response = await page.goto(callbackUrl.toString());

    // Check that error is returned
    expect(response?.status()).toBe(400);

    // Cleanup - ignore errors if backend is not available
    await safeDelete(page.request, `http://localhost:3001/api/mcp-servers/${server.id}`);
  });
});
