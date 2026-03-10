/**
 * Integration Tests: Proxy controller auth
 *
 * Verifies that:
 * - Proxy routes are @Public() (no session cookie required)
 * - Bearer token validation via resolveUser flow
 * - Org-scoped profile lookup through the proxy service
 * - Unauthenticated access uses __unauthenticated__ sentinel
 * - Gateway endpoint still works with handleGatewayRequest
 */

import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AuthService, type AuthUser } from '../../modules/auth/auth.service.js';
import type { McpRequest, McpResponse, ProxyService } from '../../modules/proxy/proxy.service.js';
import type { SettingsService } from '../../modules/settings/settings.service.js';

// Dynamic import to handle ESM
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

function createMockRequest(headers: Record<string, string> = {}) {
  return {
    headers,
    on: vi.fn(),
  } as unknown as import('express').Request;
}

describe('Proxy controller auth', () => {
  let controller: InstanceType<typeof ProxyController>;
  let authService: ReturnType<typeof createMockAuthService>;
  let proxyService: ReturnType<typeof createMockProxyService>;
  let settingsService: ReturnType<typeof createMockSettingsService>;
  let eventEmitter: ReturnType<typeof createMockEventEmitter>;

  // ────────────────────────────────────────────────
  // Unauthenticated access (no Bearer token)
  // ────────────────────────────────────────────────

  describe('unauthenticated access (no Bearer token)', () => {
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

  // ────────────────────────────────────────────────
  // Authenticated access with Bearer tokens
  // ────────────────────────────────────────────────

  describe('authenticated access with Bearer tokens', () => {
    const validUser: AuthUser = {
      id: 'user-1',
      name: 'Token User',
      email: 'token@example.com',
    };

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

  // ────────────────────────────────────────────────
  // Org-scoped profile lookup through proxy
  // ────────────────────────────────────────────────

  describe('org-scoped profile lookup', () => {
    const userA: AuthUser = { id: 'user-a', name: 'User A', email: 'a@test.com' };
    const userB: AuthUser = { id: 'user-b', name: 'User B', email: 'b@test.com' };

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
      // First request from User A
      authService.validateMcpToken.mockResolvedValue(userA);
      const reqA = createMockRequest({ authorization: 'Bearer token-a' });
      const mcpReq: McpRequest = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

      await controller.handleOrgMcpRequest(reqA, 'shared-org', 'shared-profile', mcpReq);

      // Second request from User B
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
