/**
 * Unit tests for OAuth routes
 */

import type { OAuthManager } from '@dxheroes/local-mcp-core';
import type { McpServerRepository } from '@dxheroes/local-mcp-database';
import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createOAuthRoutes } from '../../../src/routes/oauth.js';

describe('OAuth Routes Unit Tests', () => {
  let mockOAuthManager: OAuthManager;
  let mockMcpServerRepository: McpServerRepository;
  let router: ReturnType<typeof createOAuthRoutes>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Mock OAuthManager
    mockOAuthManager = {
      generatePKCE: vi.fn(),
      generateState: vi.fn(),
      buildAuthorizationUrl: vi.fn(),
      exchangeAuthorizationCode: vi.fn(),
      getToken: vi.fn(),
      refreshToken: vi.fn(),
      storeToken: vi.fn(),
    } as unknown as OAuthManager;

    // Mock McpServerRepository
    mockMcpServerRepository = {
      findById: vi.fn(),
    } as unknown as McpServerRepository;

    // Create router
    router = createOAuthRoutes(mockOAuthManager, mockMcpServerRepository);

    // Mock Express request/response
    mockReq = {
      body: {},
      params: {},
      query: {},
      protocol: 'http',
      get: vi.fn().mockReturnValue('localhost:3001'),
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      redirect: vi.fn(),
      send: vi.fn(),
    };
  });

  describe('GET /authorize/:mcpServerId', () => {
    it('should redirect to authorization URL', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          tokenEndpoint: 'https://oauth.example.com/token',
          scopes: ['read', 'write'],
          requiresOAuth: true,
          clientId: 'test-client-id',
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
        },
      };

      mockReq.params = { mcpServerId: 'server-1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthManager.generatePKCE).mockReturnValue({
        codeVerifier: 'test-verifier',
        codeChallenge: 'test-challenge',
      });
      vi.mocked(mockOAuthManager.generateState).mockReturnValue('random-state');
      vi.mocked(mockOAuthManager.buildAuthorizationUrl).mockReturnValue(
        'https://oauth.example.com/authorize?client_id=test-client-id&redirect_uri=...'
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/authorize/:mcpServerId' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockMcpServerRepository.findById).toHaveBeenCalledWith('server-1');
        expect(mockOAuthManager.generatePKCE).toHaveBeenCalled();
        expect(mockOAuthManager.generateState).toHaveBeenCalled();
        expect(mockOAuthManager.buildAuthorizationUrl).toHaveBeenCalled();
        expect(mockRes.redirect).toHaveBeenCalled();
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 404 when server not found', async () => {
      mockReq.params = { mcpServerId: 'non-existent' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/authorize/:mcpServerId' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'MCP server not found' });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 when server has no OAuth config', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: null,
      };

      mockReq.params = { mcpServerId: 'server-1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/authorize/:mcpServerId' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'MCP server does not have OAuth configuration',
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 when clientId is missing', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          // clientId is missing
        },
      };

      mockReq.params = { mcpServerId: 'server-1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/authorize/:mcpServerId' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'OAuth client ID is missing',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });
  });

  describe('GET /callback', () => {
    it('should return 400 when OAuth error is present', async () => {
      mockReq.query = { error: 'access_denied' };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'OAuth authorization failed',
          details: 'access_denied',
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 when code is missing', async () => {
      mockReq.query = { state: 'test-state' };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Missing required OAuth parameters',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 when state is missing', async () => {
      mockReq.query = { code: 'test-code' };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Missing required OAuth parameters',
            message: 'State parameter is missing',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 when state is invalid', async () => {
      mockReq.query = { code: 'test-code', state: 'invalid-state' };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Invalid state parameter',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 404 when server not found in callback', async () => {
      const stateData = {
        mcpServerId: 'non-existent',
        codeVerifier: 'test-verifier',
        randomState: 'random-state',
      };
      const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64url');

      mockReq.query = { code: 'test-code', state: encodedState };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'MCP server not found or OAuth not configured',
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle successful token exchange', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          tokenEndpoint: 'https://oauth.example.com/token',
          scopes: ['read', 'write'],
          requiresOAuth: true,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
        },
      };

      const stateData = {
        mcpServerId: 'server-1',
        codeVerifier: 'test-verifier',
        randomState: 'random-state',
      };
      const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64url');

      const tokenData = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'read write',
      };

      mockReq.query = { code: 'test-code', state: encodedState };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthManager.exchangeAuthorizationCode).mockResolvedValue(tokenData as never);
      vi.mocked(mockOAuthManager.storeToken).mockResolvedValue(undefined);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockOAuthManager.exchangeAuthorizationCode).toHaveBeenCalled();
        expect(mockOAuthManager.storeToken).toHaveBeenCalledWith('server-1', expect.any(Object));
        expect(mockRes.send).toHaveBeenCalledWith(
          expect.stringContaining('Authorization successful')
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle token exchange error', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          tokenEndpoint: 'https://oauth.example.com/token',
          scopes: ['read'],
          requiresOAuth: true,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
        },
      };

      const stateData = {
        mcpServerId: 'server-1',
        codeVerifier: 'test-verifier',
        randomState: 'random-state',
      };
      const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64url');

      mockReq.query = { code: 'test-code', state: encodedState };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthManager.exchangeAuthorizationCode).mockRejectedValue(
        new Error('Token exchange failed')
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Token exchange failed'));
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return HTML error when clientId is missing in callback', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          tokenEndpoint: 'https://oauth.example.com/token',
          scopes: ['read'],
          requiresOAuth: true,
          // clientId is missing
        },
      };

      const stateData = {
        mcpServerId: 'server-1',
        codeVerifier: 'test-verifier',
        randomState: 'random-state',
      };
      const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64url');

      mockReq.query = { code: 'test-code', state: encodedState };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.send).toHaveBeenCalledWith(
          expect.stringContaining('Client ID not configured')
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should derive token endpoint from authorization URL with API subdomain', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://linear.app/oauth/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackUrl: 'http://localhost:3001/api/oauth/callback',
          // tokenEndpoint is missing
        },
      };

      const stateData = {
        mcpServerId: 'server-1',
        codeVerifier: 'test-verifier',
        randomState: 'random-state',
      };
      const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64url');

      const tokenData = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'read',
      };

      mockReq.query = { code: 'test-code', state: encodedState };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthManager.exchangeAuthorizationCode).mockResolvedValue(tokenData as never);
      vi.mocked(mockOAuthManager.storeToken).mockResolvedValue(undefined);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/callback' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should derive token endpoint as https://api.linear.app/oauth/token
        expect(mockOAuthManager.exchangeAuthorizationCode).toHaveBeenCalledWith(
          'test-code',
          'test-verifier',
          expect.any(String),
          'https://api.linear.app/oauth/token',
          'test-client-id',
          'test-client-secret',
          undefined
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle error in authorize endpoint', async () => {
      mockReq.params = { mcpServerId: 'server-1' };
      vi.mocked(mockMcpServerRepository.findById).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/authorize/:mcpServerId' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Failed to initiate OAuth flow',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });
  });

  describe('POST /refresh/:mcpServerId', () => {
    it('should refresh token successfully', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          tokenEndpoint: 'https://oauth.example.com/token',
          scopes: ['read', 'write'],
          requiresOAuth: true,
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
      };

      const currentToken = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() - 1000,
      };

      const newToken = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        scope: 'read write',
      };

      mockReq.params = { mcpServerId: 'server-1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthManager.getToken).mockResolvedValue(currentToken as never);
      vi.mocked(mockOAuthManager.refreshToken).mockResolvedValue(newToken as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/refresh/:mcpServerId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockMcpServerRepository.findById).toHaveBeenCalledWith('server-1');
        expect(mockOAuthManager.getToken).toHaveBeenCalledWith('server-1');
        expect(mockOAuthManager.refreshToken).toHaveBeenCalled();
        expect(mockRes.json).toHaveBeenCalledWith({
          success: true,
          token: {
            accessToken: newToken.accessToken,
            tokenType: newToken.tokenType,
            expiresAt: newToken.expiresAt,
            scope: newToken.scope,
          },
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 404 when server not found', async () => {
      mockReq.params = { mcpServerId: 'non-existent' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/refresh/:mcpServerId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'MCP server not found or OAuth not configured',
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 when no refresh token available', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          clientId: 'test-client-id',
        },
      };

      mockReq.params = { mcpServerId: 'server-1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthManager.getToken).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/refresh/:mcpServerId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'No refresh token available',
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 when clientId is not configured', async () => {
      const server = {
        id: 'server-1',
        name: 'test-server',
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          // clientId is missing
        },
      };

      const currentToken = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() - 1000,
      };

      mockReq.params = { mcpServerId: 'server-1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthManager.getToken).mockResolvedValue(currentToken as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/refresh/:mcpServerId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Client ID not configured',
        });
      } else {
        throw new Error('Handler not found');
      }
    });
  });
});
