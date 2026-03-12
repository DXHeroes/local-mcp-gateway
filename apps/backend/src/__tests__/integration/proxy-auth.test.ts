/**
 * Integration Tests: Proxy controller auth
 *
 * Verifies:
 * - McpOAuthGuard enforces Bearer token when MCP_AUTH_REQUIRED=true
 * - WWW-Authenticate header with resource_metadata_uri on 401
 * - Valid tokens resolve user and pass through
 * - MCP_AUTH_REQUIRED=false preserves backward compat (unauthenticated fallback)
 * - Org-scoped profile lookup through the proxy service
 * - Gateway endpoint uses default profile with user scoping
 */

import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthService, type AuthUser } from '../../modules/auth/auth.service.js';
import type { McpRequest, McpResponse, ProxyService } from '../../modules/proxy/proxy.service.js';
import type { SettingsService } from '../../modules/settings/settings.service.js';

// Dynamic import to handle ESM
const { McpOAuthGuard } = await import('../../modules/auth/mcp-oauth.guard.js');
const { ProxyController } = await import('../../modules/proxy/proxy.controller.js');

// ────────────────────────────────────────────────
// Mock factories
// ────────────────────────────────────────────────

function createMockAuthService() {
  return {
    getAuth: vi.fn(),
    getSession: vi.fn().mockResolvedValue(null),
    validateMcpToken: vi.fn().mockResolvedValue(null),
    getUserOrganizations: vi.fn().mockResolvedValue([]),
    onModuleInit: vi.fn(),
  };
}

function createMockConfigService(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    'app.mcpAuthRequired': true,
    'app.port': 3001,
    BETTER_AUTH_URL: 'http://localhost:3001',
  };
  const config = { ...defaults, ...overrides };
  return {
    get: vi.fn((key: string) => config[key]),
  };
}

function createMockProxyService() {
  return {
    handleRequest: vi.fn().mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: { tools: [] },
    } as McpResponse),
    handleRequestByOrgSlug: vi.fn().mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: { tools: [] },
    } as McpResponse),
    getProfileInfo: vi.fn().mockResolvedValue({
      tools: [],
      serverStatus: { total: 0, connected: 0, servers: {} },
    }),
    getProfileInfoByOrgSlug: vi.fn().mockResolvedValue({
      tools: [],
      serverStatus: { total: 0, connected: 0, servers: {} },
    }),
    getToolsForServer: vi.fn().mockResolvedValue([]),
  };
}

function createMockSettingsService() {
  return {
    getDefaultGatewayProfile: vi.fn().mockResolvedValue('default'),
    getSetting: vi.fn(),
    setSetting: vi.fn(),
  };
}

function createMockEventEmitter() {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
}

function createMockRequest(headers: Record<string, string> = {}, query: Record<string, string> = {}) {
  return {
    headers,
    query,
    on: vi.fn(),
    user: undefined as any,
  } as unknown as import('express').Request;
}

function createMockExecutionContext(req: import('express').Request) {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

// ────────────────────────────────────────────────
// McpOAuthGuard tests
// ────────────────────────────────────────────────

describe('McpOAuthGuard', () => {
  describe('MCP_AUTH_REQUIRED=true', () => {
    let guard: InstanceType<typeof McpOAuthGuard>;
    let authService: ReturnType<typeof createMockAuthService>;

    beforeEach(() => {
      authService = createMockAuthService();
      const configService = createMockConfigService({ 'app.mcpAuthRequired': true });
      guard = new McpOAuthGuard(
        authService as unknown as AuthService,
        configService as any
      );
    });

    it('rejects request without Bearer token with 401', async () => {
      const req = createMockRequest();
      const ctx = createMockExecutionContext(req);

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('returns WWW-Authenticate header on missing token', async () => {
      const req = createMockRequest();
      const ctx = createMockExecutionContext(req);

      try {
        await guard.canActivate(ctx);
      } catch (error: any) {
        expect(error.wwwAuthenticate).toContain('resource_metadata=');
        expect(error.wwwAuthenticate).toContain('resource_metadata_uri=');
        expect(error.wwwAuthenticate).toContain('/.well-known/oauth-protected-resource');
      }
    });

    it('rejects invalid Bearer token', async () => {
      authService.validateMcpToken.mockResolvedValue(null);
      const req = createMockRequest({ authorization: 'Bearer bad-token' });
      const ctx = createMockExecutionContext(req);

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
      expect(authService.validateMcpToken).toHaveBeenCalledWith('bad-token');
    });

    it('allows valid Bearer token and attaches user', async () => {
      const user: AuthUser = { id: 'user-1', name: 'Test', email: 'test@example.com' };
      authService.validateMcpToken.mockResolvedValue(user);
      const req = createMockRequest({ authorization: 'Bearer valid-token' });
      const ctx = createMockExecutionContext(req);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(req.user).toEqual(user);
    });

    it('accepts access_token query param (SSE fallback)', async () => {
      const user: AuthUser = { id: 'user-1', name: 'Test', email: 'test@example.com' };
      authService.validateMcpToken.mockResolvedValue(user);
      const req = createMockRequest({}, { access_token: 'sse-token' });
      const ctx = createMockExecutionContext(req);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(authService.validateMcpToken).toHaveBeenCalledWith('sse-token');
    });
  });

  describe('MCP_AUTH_REQUIRED=false', () => {
    it('passes through without token', async () => {
      const authService = createMockAuthService();
      const configService = createMockConfigService({ 'app.mcpAuthRequired': false });
      const guard = new McpOAuthGuard(
        authService as unknown as AuthService,
        configService as any
      );

      const req = createMockRequest();
      const ctx = createMockExecutionContext(req);

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(authService.validateMcpToken).not.toHaveBeenCalled();
    });
  });
});

// ────────────────────────────────────────────────
// Proxy controller auth (auth disabled — backward compat)
// ────────────────────────────────────────────────

describe('Proxy controller auth (auth disabled)', () => {
  let controller: InstanceType<typeof ProxyController>;
  let authService: ReturnType<typeof createMockAuthService>;
  let proxyService: ReturnType<typeof createMockProxyService>;
  let settingsService: ReturnType<typeof createMockSettingsService>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    authService = createMockAuthService();
    proxyService = createMockProxyService();
    settingsService = createMockSettingsService();
    eventEmitter = createMockEventEmitter();

    controller = new ProxyController(
      proxyService as unknown as ProxyService,
      settingsService as unknown as SettingsService,
      eventEmitter as unknown as EventEmitter2,
      authService as unknown as AuthService
    );
  });

  describe('unauthenticated access (no Bearer token)', () => {
    it('org-scoped POST request passes __unauthenticated__ to proxy service', async () => {
      const req = createMockRequest();
      const mcpRequest: McpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      await controller.handleOrgMcpRequest(req, 'my-org', 'my-profile', mcpRequest);

      expect(proxyService.handleRequestByOrgSlug).toHaveBeenCalledWith(
        'my-profile',
        'my-org',
        mcpRequest,
        '__unauthenticated__'
      );
    });

    it('gateway POST request passes __unauthenticated__', async () => {
      const req = createMockRequest();
      const mcpRequest: McpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
      };

      await controller.handleGatewayRequest(req, mcpRequest);

      expect(proxyService.handleRequest).toHaveBeenCalledWith(
        'default',
        mcpRequest,
        '__unauthenticated__'
      );
    });

    it('non-Bearer Authorization header falls back to __unauthenticated__', async () => {
      const req = createMockRequest({
        authorization: 'Basic dXNlcjpwYXNz',
      });
      const mcpRequest: McpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      await controller.handleOrgMcpRequest(req, 'my-org', 'my-profile', mcpRequest);

      expect(authService.validateMcpToken).not.toHaveBeenCalled();
      expect(proxyService.handleRequestByOrgSlug).toHaveBeenCalledWith(
        'my-profile',
        'my-org',
        mcpRequest,
        '__unauthenticated__'
      );
    });
  });

  describe('authenticated access with Bearer tokens (guard disabled)', () => {
    const validUser: AuthUser = {
      id: 'user-1',
      name: 'Token User',
      email: 'token@example.com',
    };

    it('valid Bearer token resolves to authenticated user for org-scoped request', async () => {
      authService.validateMcpToken.mockResolvedValue(validUser);
      const req = createMockRequest({
        authorization: 'Bearer valid-mcp-token',
      });
      const mcpRequest: McpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      await controller.handleOrgMcpRequest(req, 'my-org', 'my-profile', mcpRequest);

      expect(authService.validateMcpToken).toHaveBeenCalledWith('valid-mcp-token');
      expect(proxyService.handleRequestByOrgSlug).toHaveBeenCalledWith(
        'my-profile',
        'my-org',
        mcpRequest,
        'user-1'
      );
    });

    it('invalid Bearer token throws UnauthorizedException', async () => {
      authService.validateMcpToken.mockResolvedValue(null);
      const req = createMockRequest({
        authorization: 'Bearer invalid-token',
      });
      const mcpRequest: McpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      await expect(
        controller.handleOrgMcpRequest(req, 'my-org', 'my-profile', mcpRequest)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('no Authorization header falls back to __unauthenticated__', async () => {
      const req = createMockRequest();
      const mcpRequest: McpRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      await controller.handleOrgMcpRequest(req, 'my-org', 'my-profile', mcpRequest);

      expect(authService.validateMcpToken).not.toHaveBeenCalled();
      expect(proxyService.handleRequestByOrgSlug).toHaveBeenCalledWith(
        'my-profile',
        'my-org',
        mcpRequest,
        '__unauthenticated__'
      );
    });
  });

  describe('guard-authenticated user passthrough', () => {
    it('uses req.user set by McpOAuthGuard', async () => {
      const guardUser: AuthUser = { id: 'guard-user', name: 'Guard', email: 'g@test.com' };
      const req = createMockRequest({ authorization: 'Bearer some-token' });
      (req as any).user = guardUser;

      const mcpRequest: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleOrgMcpRequest(req, 'my-org', 'my-profile', mcpRequest);

      // Should NOT call validateMcpToken since req.user is already set
      expect(authService.validateMcpToken).not.toHaveBeenCalled();
      expect(proxyService.handleRequestByOrgSlug).toHaveBeenCalledWith(
        'my-profile',
        'my-org',
        mcpRequest,
        'guard-user'
      );
    });
  });

  describe('org-scoped profile lookup', () => {
    const userA: AuthUser = { id: 'user-a', name: 'User A', email: 'a@test.com' };
    const userB: AuthUser = { id: 'user-b', name: 'User B', email: 'b@test.com' };

    it('org slug and user are passed through to proxy service', async () => {
      authService.validateMcpToken.mockResolvedValue(userA);
      const req = createMockRequest({ authorization: 'Bearer token-a' });
      const mcpRequest: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleOrgMcpRequest(req, 'org-a', 'user-a-profile', mcpRequest);

      expect(proxyService.handleRequestByOrgSlug).toHaveBeenCalledWith(
        'user-a-profile',
        'org-a',
        mcpRequest,
        'user-a'
      );
    });

    it('different users get different userId passed to proxy', async () => {
      authService.validateMcpToken.mockResolvedValue(userA);
      const reqA = createMockRequest({ authorization: 'Bearer token-a' });
      const mcpReq: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleOrgMcpRequest(reqA, 'shared-org', 'shared-profile', mcpReq);

      authService.validateMcpToken.mockResolvedValue(userB);
      const reqB = createMockRequest({ authorization: 'Bearer token-b' });

      await controller.handleOrgMcpRequest(reqB, 'shared-org', 'shared-profile', mcpReq);

      expect(proxyService.handleRequestByOrgSlug).toHaveBeenNthCalledWith(
        1,
        'shared-profile',
        'shared-org',
        mcpReq,
        'user-a'
      );
      expect(proxyService.handleRequestByOrgSlug).toHaveBeenNthCalledWith(
        2,
        'shared-profile',
        'shared-org',
        mcpReq,
        'user-b'
      );
    });

    it('gateway endpoint uses default profile with user scoping', async () => {
      authService.validateMcpToken.mockResolvedValue(userA);
      settingsService.getDefaultGatewayProfile.mockResolvedValue('my-default');

      const req = createMockRequest({ authorization: 'Bearer token-a' });
      const mcpRequest: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleGatewayRequest(req, mcpRequest);

      expect(proxyService.handleRequest).toHaveBeenCalledWith('my-default', mcpRequest, 'user-a');
    });

    it('gateway wraps NotFoundException with descriptive message', async () => {
      authService.validateMcpToken.mockResolvedValue(userA);
      settingsService.getDefaultGatewayProfile.mockResolvedValue('missing-profile');
      proxyService.handleRequest.mockRejectedValue(
        new NotFoundException('Profile "missing-profile" not found')
      );

      const req = createMockRequest({ authorization: 'Bearer token-a' });
      const mcpRequest: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await expect(controller.handleGatewayRequest(req, mcpRequest)).rejects.toThrow(
        NotFoundException
      );
    });

    it('org-scoped profile info endpoint uses orgSlug', async () => {
      await controller.getOrgProfileInfo('my-org', 'my-profile');

      expect(proxyService.getProfileInfoByOrgSlug).toHaveBeenCalledWith('my-profile', 'my-org');
    });
  });
});
