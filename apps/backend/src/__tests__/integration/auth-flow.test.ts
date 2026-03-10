/**
 * Integration Tests: Auth guard flow
 *
 * Verifies the AuthGuard + AuthService interaction for:
 * - Unauthenticated requests are rejected
 * - Authenticated requests attach user and session
 * - @Public() routes bypass auth
 * - Session data attached to request
 */

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../../modules/auth/auth.guard.js';
import { AuthService, type AuthUser } from '../../modules/auth/auth.service.js';

// ────────────────────────────────────────────────
// Helper: create mock ExecutionContext from Express-like request
// ────────────────────────────────────────────────

function createMockContext(
  headers: Record<string, string> = {},
  overrides: Record<string, unknown> = {}
): { ctx: ExecutionContext; getRequest: () => Record<string, unknown> } {
  const request: Record<string, unknown> = {
    headers,
    user: undefined,
    sessionData: undefined,
    ...overrides,
  };

  const ctx = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  return { ctx, getRequest: () => request };
}

// ────────────────────────────────────────────────
// Helper: create an AuthService mock
// ────────────────────────────────────────────────

function createAuthServiceMock() {
  return {
    getSession: vi.fn().mockResolvedValue(null),
    validateMcpToken: vi.fn().mockResolvedValue(null),
    getUserOrganizations: vi.fn().mockResolvedValue([]),
  };
}

describe('Auth guard flow', () => {
  // ────────────────────────────────────────────────
  // Auth always enabled
  // ────────────────────────────────────────────────

  describe('auth validation', () => {
    let guard: AuthGuard;
    let authService: ReturnType<typeof createAuthServiceMock>;
    let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      authService = createAuthServiceMock();
      reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
      guard = new AuthGuard(
        authService as unknown as AuthService,
        reflector as unknown as Reflector
      );
    });

    it('rejects unauthenticated requests with UnauthorizedException', async () => {
      authService.getSession.mockResolvedValue(null);
      const { ctx } = createMockContext();

      await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    });

    it('authenticated request attaches user and session to req', async () => {
      const mockUser: AuthUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      };
      const mockSession = {
        id: 'sess-1',
        userId: 'user-1',
        activeOrganizationId: 'org-1',
      };
      authService.getSession.mockResolvedValue({ user: mockUser, session: mockSession });

      const { ctx, getRequest } = createMockContext({
        cookie: 'better-auth.session_token=valid-token',
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(getRequest().user).toEqual(mockUser);
      expect(getRequest().sessionData).toEqual(mockSession);
    });

    it('converts Express headers to Web API Headers for Better Auth', async () => {
      authService.getSession.mockResolvedValue(null);

      const { ctx } = createMockContext({
        cookie: 'better-auth.session_token=abc123',
        'user-agent': 'test-agent',
      });

      try {
        await guard.canActivate(ctx);
      } catch {
        // Expected UnauthorizedException
      }

      // Verify getSession was called with a Headers object
      expect(authService.getSession).toHaveBeenCalledTimes(1);
      const passedHeaders = authService.getSession.mock.calls[0][0];
      expect(passedHeaders).toBeInstanceOf(Headers);
      expect(passedHeaders.get('cookie')).toBe('better-auth.session_token=abc123');
    });

    it('session with activeOrganizationId is preserved on request', async () => {
      const mockUser: AuthUser = {
        id: 'user-1',
        name: 'Org User',
        email: 'org@example.com',
      };
      const mockSession = {
        id: 'sess-2',
        userId: 'user-1',
        activeOrganizationId: 'org-abc',
      };
      authService.getSession.mockResolvedValue({ user: mockUser, session: mockSession });

      const { ctx, getRequest } = createMockContext({ cookie: 'session=valid' });

      await guard.canActivate(ctx);

      const sessionData = getRequest().sessionData as typeof mockSession;
      expect(sessionData.activeOrganizationId).toBe('org-abc');
    });
  });

  // ────────────────────────────────────────────────
  // @Public() decorator
  // ────────────────────────────────────────────────

  describe('@Public() routes', () => {
    let guard: AuthGuard;
    let authService: ReturnType<typeof createAuthServiceMock>;
    let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      authService = createAuthServiceMock();
      reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) }; // @Public() returns true
      guard = new AuthGuard(
        authService as unknown as AuthService,
        reflector as unknown as Reflector
      );
    });

    it('@Public() route bypasses auth entirely', async () => {
      const { ctx } = createMockContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(authService.getSession).not.toHaveBeenCalled();
    });

    it('@Public() route does not attach user to request', async () => {
      const { ctx, getRequest } = createMockContext();

      await guard.canActivate(ctx);

      // User is not set by guard on public routes
      expect(getRequest().user).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────
  // AuthService.validateMcpToken
  // ────────────────────────────────────────────────

  describe('AuthService.validateMcpToken (mock)', () => {
    let authService: ReturnType<typeof createAuthServiceMock>;

    beforeEach(() => {
      authService = createAuthServiceMock();
    });

    it('returns user when token is valid', async () => {
      const mockUser: AuthUser = {
        id: 'user-1',
        name: 'Token User',
        email: 'token@example.com',
      };
      authService.validateMcpToken.mockResolvedValue(mockUser);

      const result = await authService.validateMcpToken('valid-bearer-token');
      expect(result).toEqual(mockUser);
    });

    it('returns null for expired or invalid token', async () => {
      authService.validateMcpToken.mockResolvedValue(null);

      const result = await authService.validateMcpToken('expired-token');
      expect(result).toBeNull();
    });
  });
});
