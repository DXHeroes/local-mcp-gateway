import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type OAuthClientRegistrationRepository,
  OAuthManager,
  type OAuthTokenRepository,
} from '../../src/abstractions/OAuthManager.js';
import type { OAuthToken } from '../../src/types/database.js';

describe('OAuthManager', () => {
  let tokenRepository: OAuthTokenRepository;
  let clientRegistrationRepository: OAuthClientRegistrationRepository;
  let manager: OAuthManager;

  beforeEach(() => {
    const tokens = new Map<string, OAuthToken>();
    const registrations = new Map<
      string,
      { clientId: string; clientSecret?: string; registrationAccessToken?: string }
    >();

    tokenRepository = {
      async store(mcpServerId, tokenData) {
        const token: OAuthToken = {
          id: `token-${Date.now()}`,
          mcpServerId,
          ...tokenData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        tokens.set(mcpServerId, token);
        return token;
      },
      async get(mcpServerId) {
        return tokens.get(mcpServerId) || null;
      },
      async update(mcpServerId, updates) {
        const existing = tokens.get(mcpServerId);
        if (!existing) {
          throw new Error('Token not found');
        }
        const updated: OAuthToken = {
          ...existing,
          ...updates,
          updatedAt: Date.now(),
        };
        tokens.set(mcpServerId, updated);
        return updated;
      },
      async delete(mcpServerId) {
        tokens.delete(mcpServerId);
      },
    };

    clientRegistrationRepository = {
      async store(registration) {
        const key = `${registration.mcpServerId}:${registration.authorizationServerUrl}`;
        registrations.set(key, {
          clientId: registration.clientId,
          clientSecret: registration.clientSecret,
          registrationAccessToken: registration.registrationAccessToken,
        });
      },
      async get(mcpServerId, authorizationServerUrl) {
        const key = `${mcpServerId}:${authorizationServerUrl}`;
        return registrations.get(key) || null;
      },
    };

    manager = new OAuthManager(tokenRepository, clientRegistrationRepository);
  });

  describe('generatePKCE', () => {
    it('should generate code verifier and challenge', () => {
      const { codeVerifier, codeChallenge } = manager.generatePKCE();

      expect(codeVerifier).toBeDefined();
      expect(codeVerifier.length).toBeGreaterThan(0);
      expect(codeChallenge).toBeDefined();
      expect(codeChallenge.length).toBeGreaterThan(0);
    });

    it('should generate different values each time', () => {
      const pkce1 = manager.generatePKCE();
      const pkce2 = manager.generatePKCE();

      expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
    });
  });

  describe('generateState', () => {
    it('should generate state parameter', () => {
      const state = manager.generateState();

      expect(state).toBeDefined();
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate different states each time', () => {
      const state1 = manager.generateState();
      const state2 = manager.generateState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('buildAuthorizationUrl', () => {
    it('should throw error when clientId is missing', () => {
      const config = {
        authorizationServerUrl: 'https://auth.example.com/authorize',
        scopes: ['read'],
        requiresOAuth: true,
        // clientId is missing
      };
      const state = 'test-state';

      expect(() => manager.buildAuthorizationUrl(config, state)).toThrow(
        'OAuth client ID is required'
      );
    });

    it('should build authorization URL with required parameters', () => {
      const config = {
        authorizationServerUrl: 'https://auth.example.com/authorize',
        scopes: ['read', 'write'],
        requiresOAuth: true,
        clientId: 'test-client-id',
      };
      const state = 'test-state';

      const url = manager.buildAuthorizationUrl(config, state);

      expect(url).toContain('https://auth.example.com/authorize');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=read+write');
      expect(url).toContain('client_id=test-client-id');
    });

    it('should include PKCE parameters when provided', () => {
      const config = {
        authorizationServerUrl: 'https://auth.example.com/authorize',
        scopes: ['read'],
        requiresOAuth: true,
        clientId: 'test-client-id',
      };
      const state = 'test-state';
      const codeChallenge = 'test-challenge';

      const url = manager.buildAuthorizationUrl(config, state, codeChallenge);

      expect(url).toContain('code_challenge=test-challenge');
      expect(url).toContain('code_challenge_method=S256');
    });

    it('should include resource parameter when provided', () => {
      const config = {
        authorizationServerUrl: 'https://auth.example.com/authorize',
        scopes: ['read'],
        requiresOAuth: true,
        clientId: 'test-client-id',
        resource: 'https://api.example.com',
      };
      const state = 'test-state';

      const url = manager.buildAuthorizationUrl(config, state);

      expect(url).toContain('resource=https%3A%2F%2Fapi.example.com');
    });
  });

  describe('storeToken', () => {
    it('should store OAuth token', async () => {
      const token = await manager.storeToken('server1', {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        scope: 'read write',
      });

      expect(token.accessToken).toBe('test-access-token');
      expect(token.refreshToken).toBe('test-refresh-token');
    });
  });

  describe('getToken', () => {
    it('should retrieve stored token', async () => {
      await manager.storeToken('server1', {
        accessToken: 'test-access-token',
      });

      const token = await manager.getToken('server1');
      expect(token).toBeDefined();
      expect(token?.accessToken).toBe('test-access-token');
    });

    it('should return null for non-existent token', async () => {
      const token = await manager.getToken('non-existent');
      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for token without expiration', () => {
      const token: OAuthToken = {
        id: '1',
        mcpServerId: 'server1',
        accessToken: 'token',
        tokenType: 'Bearer',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(manager.isTokenExpired(token)).toBe(false);
    });

    it('should return false for non-expired token', () => {
      const token: OAuthToken = {
        id: '1',
        mcpServerId: 'server1',
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(manager.isTokenExpired(token)).toBe(false);
    });

    it('should return true for expired token', () => {
      const token: OAuthToken = {
        id: '1',
        mcpServerId: 'server1',
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(manager.isTokenExpired(token)).toBe(true);
    });
  });

  describe('injectHeaders', () => {
    it('should inject Authorization header', async () => {
      await manager.storeToken('server1', {
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
      });

      const headers = await manager.injectHeaders('server1', {});

      expect(headers.Authorization).toBe('Bearer test-access-token');
    });

    it('should merge with existing headers', async () => {
      await manager.storeToken('server1', {
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
      });

      const headers = await manager.injectHeaders('server1', {
        'Content-Type': 'application/json',
      });

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toBe('Bearer test-access-token');
    });

    it('should return original headers if no token', async () => {
      const originalHeaders = { 'Content-Type': 'application/json' };
      const headers = await manager.injectHeaders('non-existent', originalHeaders);

      expect(headers).toEqual(originalHeaders);
    });

    it('should return original headers if token is expired', async () => {
      await manager.storeToken('server1', {
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
        expiresAt: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      });

      const originalHeaders = { 'Content-Type': 'application/json' };
      const headers = await manager.injectHeaders('server1', originalHeaders);

      // Should return original headers without Authorization when token is expired
      expect(headers).toEqual(originalHeaders);
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('exchangeAuthorizationCode', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should exchange authorization code for token', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'read write',
          })
        ),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      const result = await manager.exchangeAuthorizationCode(
        'auth-code',
        'code-verifier',
        'https://example.com/callback',
        'https://auth.example.com/token',
        'client-id'
      );

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(3600);
      expect(result.scope).toBe('read write');
    });

    it('should include resource parameter when provided', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: 'token',
            token_type: 'Bearer',
          })
        ),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await manager.exchangeAuthorizationCode(
        'auth-code',
        'code-verifier',
        'https://example.com/callback',
        'https://auth.example.com/token',
        'client-id',
        undefined,
        'https://api.example.com'
      );

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = fetchCall[1]?.body as string;
      expect(body).toContain('resource=https%3A%2F%2Fapi.example.com');
    });

    it('should include client secret in Authorization header when provided', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            access_token: 'token',
            token_type: 'Bearer',
          })
        ),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await manager.exchangeAuthorizationCode(
        'auth-code',
        'code-verifier',
        'https://example.com/callback',
        'https://auth.example.com/token',
        'client-id',
        'client-secret'
      );

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const headers = fetchCall[1]?.headers as Record<string, string>;
      expect(headers.Authorization).toContain('Basic');
    });

    it('should handle JSON error response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code',
          })
        ),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await expect(
        manager.exchangeAuthorizationCode(
          'invalid-code',
          'code-verifier',
          'https://example.com/callback',
          'https://auth.example.com/token',
          'client-id'
        )
      ).rejects.toThrow('Token exchange failed');
    });

    it('should handle HTML error response', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue('<html><title>Error</title><h1>Bad Request</h1></html>'),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await expect(
        manager.exchangeAuthorizationCode(
          'invalid-code',
          'code-verifier',
          'https://example.com/callback',
          'https://auth.example.com/token',
          'client-id'
        )
      ).rejects.toThrow('Token exchange failed');
    });

    it('should throw error for non-JSON success response', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: vi.fn().mockResolvedValue('<html>Success</html>'),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await expect(
        manager.exchangeAuthorizationCode(
          'auth-code',
          'code-verifier',
          'https://example.com/callback',
          'https://auth.example.com/token',
          'client-id'
        )
      ).rejects.toThrow('Token endpoint returned');
    });

    it('should handle JSON parse error', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: vi.fn().mockResolvedValue('invalid json {'),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await expect(
        manager.exchangeAuthorizationCode(
          'auth-code',
          'code-verifier',
          'https://example.com/callback',
          'https://auth.example.com/token',
          'client-id'
        )
      ).rejects.toThrow('Failed to parse token response');
    });

    it('should handle error response with non-JSON parseable content', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: vi.fn().mockResolvedValue('invalid json {'),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await expect(
        manager.exchangeAuthorizationCode(
          'invalid-code',
          'code-verifier',
          'https://example.com/callback',
          'https://auth.example.com/token',
          'client-id'
        )
      ).rejects.toThrow('Token exchange failed');
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should refresh access token', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'read write',
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      const result = await manager.refreshToken(
        'server1',
        'old-refresh-token',
        'https://auth.example.com/token',
        'client-id'
      );

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should include resource parameter when provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'token',
          token_type: 'Bearer',
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await manager.refreshToken(
        'server1',
        'refresh-token',
        'https://auth.example.com/token',
        'client-id',
        undefined,
        'https://api.example.com'
      );

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = fetchCall[1]?.body as string;
      expect(body).toContain('resource=https%3A%2F%2Fapi.example.com');
    });

    it('should include client secret in Authorization header when provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'token',
          token_type: 'Bearer',
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await manager.refreshToken(
        'server1',
        'refresh-token',
        'https://auth.example.com/token',
        'client-id',
        'client-secret'
      );

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const headers = fetchCall[1]?.headers as Record<string, string>;
      expect(headers.Authorization).toContain('Basic');
    });

    it('should handle refresh error', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Invalid refresh token'),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      await expect(
        manager.refreshToken(
          'server1',
          'invalid-refresh-token',
          'https://auth.example.com/token',
          'client-id'
        )
      ).rejects.toThrow('Token refresh failed');
    });

    it('should use old refresh token if new one not provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'new-access-token',
          token_type: 'Bearer',
          // No refresh_token in response
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as never);

      const result = await manager.refreshToken(
        'server1',
        'old-refresh-token',
        'https://auth.example.com/token',
        'client-id'
      );

      expect(result.refreshToken).toBe('old-refresh-token');
    });
  });

  describe('revokeToken', () => {
    it('should delete token from repository', async () => {
      await manager.storeToken('server1', {
        accessToken: 'token',
      });

      await manager.revokeToken('server1');

      const token = await manager.getToken('server1');
      expect(token).toBeNull();
    });
  });

  describe('getClientRegistration', () => {
    it('should retrieve client registration', async () => {
      await clientRegistrationRepository.store({
        mcpServerId: 'server1',
        authorizationServerUrl: 'https://auth.example.com',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      });

      const registration = await manager.getClientRegistration(
        'server1',
        'https://auth.example.com'
      );

      expect(registration).toBeDefined();
      expect(registration?.clientId).toBe('client-id');
      expect(registration?.clientSecret).toBe('client-secret');
    });

    it('should return null for non-existent registration', async () => {
      const registration = await manager.getClientRegistration(
        'non-existent',
        'https://auth.example.com'
      );

      expect(registration).toBeNull();
    });
  });
});
