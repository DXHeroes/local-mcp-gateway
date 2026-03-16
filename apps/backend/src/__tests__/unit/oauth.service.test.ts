/**
 * Unit tests for OAuthService — token type normalization and resource parameter
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import { OAuthService } from '../../modules/oauth/oauth.service.js';

// Mock OAuthDiscoveryService to prevent real network calls
vi.mock('@dxheroes/local-mcp-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dxheroes/local-mcp-core')>();
  return {
    ...actual,
    OAuthDiscoveryService: class MockOAuthDiscoveryService {
      discoverFromServerUrl = vi.fn();
      registerClient = vi.fn();
    },
  };
});

describe('OAuthService', () => {
  let service: OAuthService;
  let mockPrisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockPrisma = {
      mcpServer: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      oAuthToken: {
        upsert: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      oAuthClientRegistration: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new OAuthService(mockPrisma as unknown as PrismaService);
  });

  // ----------------------------------------------------------------
  // storeToken — token type normalization
  // ----------------------------------------------------------------
  describe('storeToken', () => {
    it('should normalize lowercase "bearer" to "Bearer"', async () => {
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      await service.storeToken({
        mcpServerId: 'srv-1',
        accessToken: 'access-abc',
        tokenType: 'bearer',
      });

      const call = mockPrisma.oAuthToken.upsert.mock.calls[0][0];
      expect(call.update.tokenType).toBe('Bearer');
      expect(call.create.tokenType).toBe('Bearer');
    });

    it('should normalize uppercase "BEARER" to "Bearer"', async () => {
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      await service.storeToken({
        mcpServerId: 'srv-1',
        accessToken: 'access-abc',
        tokenType: 'BEARER',
      });

      const call = mockPrisma.oAuthToken.upsert.mock.calls[0][0];
      expect(call.update.tokenType).toBe('Bearer');
      expect(call.create.tokenType).toBe('Bearer');
    });

    it('should keep "Bearer" as-is', async () => {
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      await service.storeToken({
        mcpServerId: 'srv-1',
        accessToken: 'access-abc',
        tokenType: 'Bearer',
      });

      const call = mockPrisma.oAuthToken.upsert.mock.calls[0][0];
      expect(call.update.tokenType).toBe('Bearer');
      expect(call.create.tokenType).toBe('Bearer');
    });

    it('should default to "Bearer" when tokenType is undefined', async () => {
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      await service.storeToken({
        mcpServerId: 'srv-1',
        accessToken: 'access-abc',
        tokenType: undefined,
      });

      const call = mockPrisma.oAuthToken.upsert.mock.calls[0][0];
      expect(call.update.tokenType).toBe('Bearer');
      expect(call.create.tokenType).toBe('Bearer');
    });

    it('should preserve non-bearer token types (e.g., "mac")', async () => {
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      await service.storeToken({
        mcpServerId: 'srv-1',
        accessToken: 'access-abc',
        tokenType: 'mac',
      });

      const call = mockPrisma.oAuthToken.upsert.mock.calls[0][0];
      expect(call.update.tokenType).toBe('mac');
      expect(call.create.tokenType).toBe('mac');
    });

    it('should pass through all fields to upsert', async () => {
      const expiresAt = new Date('2026-12-31T00:00:00Z');
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      await service.storeToken({
        mcpServerId: 'srv-1',
        accessToken: 'access-abc',
        refreshToken: 'refresh-xyz',
        tokenType: 'bearer',
        scope: 'read write',
        expiresAt,
      });

      const call = mockPrisma.oAuthToken.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ mcpServerId: 'srv-1' });
      expect(call.update.accessToken).toBe('access-abc');
      expect(call.update.refreshToken).toBe('refresh-xyz');
      expect(call.update.scope).toBe('read write');
      expect(call.update.expiresAt).toBe(expiresAt);
    });
  });

  // ----------------------------------------------------------------
  // handleCallback — resource parameter and error paths
  // ----------------------------------------------------------------
  describe('handleCallback', () => {
    const serverId = 'srv-callback';
    const code = 'auth-code-123';
    const callbackUrl = 'http://localhost:3000/oauth/callback';

    const serverWithOAuthConfig = (resource?: string) => ({
      id: serverId,
      name: 'Test Server',
      oauthConfig: JSON.stringify({
        tokenEndpoint: 'https://auth.example.com/token',
        clientId: 'client-abc',
        resource: resource ?? undefined,
      }),
    });

    /**
     * Helper: set up PKCE verifier in the private map so handleCallback can proceed.
     */
    function setPkceVerifier(svc: OAuthService, id: string, verifier = 'test-code-verifier') {
      (svc as any).pkceVerifiers.set(id, {
        verifier,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
    }

    /**
     * Helper: mock global.fetch for token exchange.
     * Returns a vi.fn() so callers can inspect calls.
     */
    function mockFetchTokenExchange(
      responseBody: Record<string, unknown>,
      status = 200
    ): ReturnType<typeof vi.fn> {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(responseBody),
        json: async () => responseBody,
      });
      globalThis.fetch = fetchMock;
      return fetchMock;
    }

    it('should include resource parameter in token exchange when oauthConfig.resource is set', async () => {
      const resource = 'https://api.example.com/mcp';
      mockPrisma.mcpServer.findUnique.mockResolvedValue(serverWithOAuthConfig(resource));
      setPkceVerifier(service, serverId);
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      const fetchMock = mockFetchTokenExchange({
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
      });

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(true);

      // Inspect the URLSearchParams body sent to fetch
      const [, fetchInit] = fetchMock.mock.calls[0];
      const body = fetchInit.body as URLSearchParams;
      expect(body.get('resource')).toBe(resource);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe(code);
      expect(body.get('client_id')).toBe('client-abc');
      expect(body.get('code_verifier')).toBe('test-code-verifier');
    });

    it('should NOT include resource parameter when oauthConfig.resource is null/undefined', async () => {
      mockPrisma.mcpServer.findUnique.mockResolvedValue(serverWithOAuthConfig(undefined));
      setPkceVerifier(service, serverId);
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      const fetchMock = mockFetchTokenExchange({
        access_token: 'new-access-token',
        token_type: 'Bearer',
      });

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(true);

      const [, fetchInit] = fetchMock.mock.calls[0];
      const body = fetchInit.body as URLSearchParams;
      expect(body.has('resource')).toBe(false);
    });

    it('should store token after successful exchange', async () => {
      mockPrisma.mcpServer.findUnique.mockResolvedValue(serverWithOAuthConfig());
      setPkceVerifier(service, serverId);
      mockPrisma.oAuthToken.upsert.mockResolvedValue({ id: 'tok-1' });

      mockFetchTokenExchange({
        access_token: 'stored-token',
        refresh_token: 'stored-refresh',
        token_type: 'bearer',
        scope: 'openid',
        expires_in: 7200,
      });

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(true);
      expect(mockPrisma.oAuthToken.upsert).toHaveBeenCalledTimes(1);

      const upsertCall = mockPrisma.oAuthToken.upsert.mock.calls[0][0];
      expect(upsertCall.update.accessToken).toBe('stored-token');
      expect(upsertCall.update.refreshToken).toBe('stored-refresh');
      // Token type should be normalized to "Bearer"
      expect(upsertCall.update.tokenType).toBe('Bearer');
      expect(upsertCall.update.scope).toBe('openid');
      expect(upsertCall.update.expiresAt).toBeInstanceOf(Date);
    });

    it('should return success: false when PKCE verifier is missing', async () => {
      mockPrisma.mcpServer.findUnique.mockResolvedValue(serverWithOAuthConfig());
      // Do NOT set a PKCE verifier

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/PKCE verifier not found/);
    });

    it('should return success: false when PKCE verifier is expired', async () => {
      mockPrisma.mcpServer.findUnique.mockResolvedValue(serverWithOAuthConfig());
      // Set an expired PKCE verifier
      (service as any).pkceVerifiers.set(serverId, {
        verifier: 'expired-verifier',
        expiresAt: Date.now() - 1000, // expired 1 second ago
      });

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/PKCE verifier expired/);
    });

    it('should return success: false when token exchange fails (non-200)', async () => {
      mockPrisma.mcpServer.findUnique.mockResolvedValue(serverWithOAuthConfig());
      setPkceVerifier(service, serverId);

      mockFetchTokenExchange({ error: 'invalid_grant' }, 400);

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Token exchange failed/);
    });

    it('should return success: false when server is not found', async () => {
      mockPrisma.mcpServer.findUnique.mockResolvedValue(null);

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found/);
    });

    it('should return success: false when oauthConfig is missing tokenEndpoint', async () => {
      mockPrisma.mcpServer.findUnique.mockResolvedValue({
        id: serverId,
        oauthConfig: JSON.stringify({ clientId: 'client-abc' }),
      });
      setPkceVerifier(service, serverId);

      const result = await service.handleCallback(serverId, code, callbackUrl);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/OAuth configuration incomplete/);
    });
  });
});
