/**
 * Integration Tests: Proxy controller auth
 *
 * Verifies:
 * - McpOAuthGuard always enforces Bearer token
 * - WWW-Authenticate header with resource_metadata_uri on 401
 * - Valid tokens resolve user and pass through
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

function createMockRequest(
  headers: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  return {
    headers,
    query,
    on: vi.fn(),
    user: undefined as any,
  } as unknown as import('express').Request;
}

function createMockResponse() {
  return {
    json: vi.fn((payload: unknown) => payload),
    setHeader: vi.fn(),
    write: vi.fn(),
  } as unknown as import('express').Response;
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
  let guard: InstanceType<typeof McpOAuthGuard>;
  let authService: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    authService = createMockAuthService();
    const configService = createMockConfigService();
    guard = new McpOAuthGuard(authService as unknown as AuthService, configService as any);
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

  it('accepts session cookie when no Bearer token is present', async () => {
    const user: AuthUser = { id: 'session-user', name: 'Session', email: 'session@example.com' };
    authService.getSession.mockResolvedValue({ user, session: { id: 's1', userId: user.id } });
    const req = createMockRequest({ cookie: 'better-auth.session_token=abc123' });
    const ctx = createMockExecutionContext(req);

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req.user).toEqual(user);
    expect(authService.validateMcpToken).not.toHaveBeenCalled();
  });

  it('rejects when neither Bearer token nor session cookie is valid', async () => {
    authService.getSession.mockResolvedValue(null);
    const req = createMockRequest({ cookie: 'better-auth.session_token=expired' });
    const ctx = createMockExecutionContext(req);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('does not fall through to session cookie when Bearer token is invalid', async () => {
    const user: AuthUser = { id: 'session-user', name: 'Session', email: 'session@example.com' };
    authService.validateMcpToken.mockResolvedValue(null);
    authService.getSession.mockResolvedValue({ user, session: { id: 's1', userId: user.id } });
    const req = createMockRequest({ authorization: 'Bearer bad-token' });
    const ctx = createMockExecutionContext(req);

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(authService.getSession).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────
// Proxy controller auth tests
// ────────────────────────────────────────────────

describe('Proxy controller auth', () => {
  let controller: InstanceType<typeof ProxyController>;
  let proxyService: ReturnType<typeof createMockProxyService>;
  let settingsService: ReturnType<typeof createMockSettingsService>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    proxyService = createMockProxyService();
    settingsService = createMockSettingsService();
    eventEmitter = createMockEventEmitter();

    controller = new ProxyController(
      proxyService as unknown as ProxyService,
      settingsService as unknown as SettingsService,
      eventEmitter as unknown as EventEmitter2
    );
  });

  describe('guard-authenticated user passthrough', () => {
    it('uses req.user set by McpOAuthGuard', async () => {
      const guardUser: AuthUser = { id: 'guard-user', name: 'Guard', email: 'g@test.com' };
      const req = createMockRequest({ authorization: 'Bearer some-token' });
      (req as any).user = guardUser;

      const mcpRequest: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleOrgMcpRequest(req, 'my-org', 'my-profile', mcpRequest);

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
      const req = createMockRequest({ authorization: 'Bearer token-a' });
      (req as any).user = userA;
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
      const reqA = createMockRequest({ authorization: 'Bearer token-a' });
      (reqA as any).user = userA;
      const mcpReq: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleOrgMcpRequest(reqA, 'shared-org', 'shared-profile', mcpReq);

      const reqB = createMockRequest({ authorization: 'Bearer token-b' });
      (reqB as any).user = userB;

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
      settingsService.getDefaultGatewayProfile.mockResolvedValue('my-default');

      const req = createMockRequest({ authorization: 'Bearer token-a' });
      (req as any).user = userA;
      const mcpRequest: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleGatewayRequest(req, mcpRequest);

      expect(proxyService.handleRequest).toHaveBeenCalledWith('my-default', mcpRequest, 'user-a');
    });

    it('gateway wraps NotFoundException with descriptive message', async () => {
      settingsService.getDefaultGatewayProfile.mockResolvedValue('missing-profile');
      proxyService.handleRequest.mockRejectedValue(
        new NotFoundException('Profile "missing-profile" not found')
      );

      const req = createMockRequest({ authorization: 'Bearer token-a' });
      (req as any).user = userA;
      const mcpRequest: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await expect(controller.handleGatewayRequest(req, mcpRequest)).rejects.toThrow(
        NotFoundException
      );
    });

    it('org-scoped profile info endpoint uses orgSlug', async () => {
      const req = createMockRequest({ authorization: 'Bearer token-a' });
      (req as any).user = userA;

      await controller.getOrgProfileInfo('my-org', 'my-profile', req);

      expect(proxyService.getProfileInfoByOrgSlug).toHaveBeenCalledWith(
        'my-profile',
        'my-org',
        'user-a'
      );
    });

    it('org-scoped profile endpoint reports tool count from user-scoped info lookup', async () => {
      proxyService.getProfileInfoByOrgSlug.mockResolvedValue({
        tools: [{ name: 'tool-a', description: 'A' }, { name: 'tool-b', description: 'B' }],
        serverStatus: { total: 1, connected: 1, servers: {} },
      });

      const req = createMockRequest({ authorization: 'Bearer token-a' });
      (req as any).user = userA;
      const res = createMockResponse();

      await controller.getOrgMcpEndpoint('my-org', 'my-profile', req, res);

      expect(proxyService.getProfileInfoByOrgSlug).toHaveBeenCalledWith(
        'my-profile',
        'my-org',
        'user-a'
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({
            name: 'my-profile',
            toolCount: 2,
            serverCount: 1,
            connectedServers: 1,
          }),
        })
      );
    });
  });
});
