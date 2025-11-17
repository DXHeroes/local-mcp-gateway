import { beforeEach, describe, expect, it } from 'vitest';
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
    it('should build authorization URL with required parameters', () => {
      const config = {
        authorizationServerUrl: 'https://auth.example.com/authorize',
        scopes: ['read', 'write'],
        requiresOAuth: true,
      };
      const state = 'test-state';

      const url = manager.buildAuthorizationUrl(config, state);

      expect(url).toContain('https://auth.example.com/authorize');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=read+write');
    });

    it('should include PKCE parameters when provided', () => {
      const config = {
        authorizationServerUrl: 'https://auth.example.com/authorize',
        scopes: ['read'],
        requiresOAuth: true,
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
  });
});
