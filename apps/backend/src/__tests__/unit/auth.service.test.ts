/**
 * Tests for AuthService
 */

import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../modules/auth/auth.service.js';
import type { PrismaService } from '../../modules/database/prisma.service.js';

// Mock the auth config module
vi.mock('../../modules/auth/auth.config.js', () => ({
  createAuth: () => ({
    handler: vi.fn(),
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  }),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, unknown>;
  let configService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      member: { findMany: vi.fn().mockResolvedValue([]) },
      oauthAccessToken: { findFirst: vi.fn().mockResolvedValue(null) },
      user: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    configService = {
      get: vi.fn().mockReturnValue(undefined),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      configService as unknown as ConfigService
    );
  });

  describe('onModuleInit', () => {
    it('should auto-generate BETTER_AUTH_SECRET when not set', () => {
      configService.get.mockReturnValue(undefined);
      service.onModuleInit();

      // Should have set the env var
      expect(process.env.BETTER_AUTH_SECRET).toBeDefined();
      expect(process.env.BETTER_AUTH_SECRET?.length).toBeGreaterThan(30);
    });

    it('should use provided BETTER_AUTH_SECRET when set', () => {
      const secret = 'my-test-secret-value';
      process.env.BETTER_AUTH_SECRET = secret;
      configService.get.mockImplementation((key: string) => {
        if (key === 'BETTER_AUTH_SECRET') return secret;
        return undefined;
      });

      service.onModuleInit();

      // Should not have changed the secret
      expect(process.env.BETTER_AUTH_SECRET).toBe(secret);
    });

    it('should always initialize auth', () => {
      service.onModuleInit();
      const auth = service.getAuth();
      expect(auth).toBeDefined();
      expect(auth.api).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should return null when no session exists', async () => {
      service.onModuleInit();
      const result = await service.getSession(new Headers());
      expect(result).toBeNull();
    });
  });

  describe('validateMcpToken', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should return null for unknown token', async () => {
      const result = await service.validateMcpToken('unknown-token');
      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      (
        prisma.oauthAccessToken as { findFirst: ReturnType<typeof vi.fn> }
      ).findFirst.mockResolvedValue({
        token: 'expired-token',
        userId: 'user-1',
        expiresAt: new Date('2020-01-01'),
      });

      const result = await service.validateMcpToken('expired-token');
      expect(result).toBeNull();
    });

    it('should return user for valid token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      (
        prisma.oauthAccessToken as { findFirst: ReturnType<typeof vi.fn> }
      ).findFirst.mockResolvedValue({
        token: 'valid-token',
        userId: 'user-1',
        expiresAt: futureDate,
      });
      (prisma.user as { findUnique: ReturnType<typeof vi.fn> }).findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      });

      const result = await service.validateMcpToken('valid-token');
      expect(result).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      });
    });

    it('should return null when token has no userId', async () => {
      (
        prisma.oauthAccessToken as { findFirst: ReturnType<typeof vi.fn> }
      ).findFirst.mockResolvedValue({
        token: 'no-user-token',
        userId: null,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await service.validateMcpToken('no-user-token');
      expect(result).toBeNull();
    });
  });

  describe('getUserOrganizations', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('should query member table with userId', async () => {
      (prisma.member as { findMany: ReturnType<typeof vi.fn> }).findMany.mockResolvedValue([
        { userId: 'user-1', organizationId: 'org-1', organization: { id: 'org-1', name: 'Org' } },
      ]);

      const result = await service.getUserOrganizations('user-1');
      expect(result).toHaveLength(1);
      expect(
        (prisma.member as { findMany: ReturnType<typeof vi.fn> }).findMany
      ).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { organization: true },
      });
    });
  });
});
