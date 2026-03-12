/**
 * Tests for AuthGuard
 */

import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../../modules/auth/auth.guard.js';
import { AuthService } from '../../modules/auth/auth.service.js';

function createMockExecutionContext(headers: Record<string, string> = {}): ExecutionContext {
  const request = { headers, user: undefined, sessionData: undefined };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: { getSession: ReturnType<typeof vi.fn> };
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      getSession: vi.fn(),
    };
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    };
    guard = new AuthGuard(authService as unknown as AuthService, reflector as unknown as Reflector);
  });

  it('should allow @Public() routes without auth', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = createMockExecutionContext();
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(authService.getSession).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when no session', async () => {
    authService.getSession.mockResolvedValue(null);
    const ctx = createMockExecutionContext({ cookie: 'session=abc' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should attach user and session when valid session exists', async () => {
    const mockUser = { id: 'user-1', name: 'Test', email: 'test@example.com', image: null };
    const mockSession = { id: 'sess-1', userId: 'user-1', activeOrganizationId: 'org-1' };
    authService.getSession.mockResolvedValue({ user: mockUser, session: mockSession });

    const ctx = createMockExecutionContext({ cookie: 'session=abc' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const request = ctx.switchToHttp().getRequest();
    expect(request.user).toEqual(mockUser);
    expect(request.sessionData).toEqual(mockSession);
  });

  it('should throw ForbiddenException when session has no active organization', async () => {
    const mockUser = { id: 'user-1', name: 'Test', email: 'test@example.com', image: null };
    const mockSession = { id: 'sess-1', userId: 'user-1', activeOrganizationId: null };
    authService.getSession.mockResolvedValue({ user: mockUser, session: mockSession });

    const ctx = createMockExecutionContext({ cookie: 'session=abc' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
