/**
 * Integration Tests: Per-user MCP isolation with sharing
 *
 * Verifies that:
 * - McpService returns only servers owned by the user + shared servers
 * - ProfilesService org-scopes profiles (per-user, no system profiles)
 * - Cross-user access is denied unless shared
 */

import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpService } from '../../modules/mcp/mcp.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import { ProfilesService } from '../../modules/profiles/profiles.service.js';
import type { ProxyService } from '../../modules/proxy/proxy.service.js';
import type { SharingService } from '../../modules/sharing/sharing.service.js';

// ────────────────────────────────────────────────
// In-memory data store simulating Prisma
// ────────────────────────────────────────────────

interface InMemoryProfile {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  organizationId: string;
  mcpServers: unknown[];
}

interface InMemoryMcpServer {
  id: string;
  name: string;
  type: string;
  config: string;
  apiKeyConfig: string | null;
  oauthConfig: string | null;
  userId: string;
  profiles: unknown[];
  oauthToken: null;
  toolsCache: unknown[];
}

const PROFILES: InMemoryProfile[] = [];
const SERVERS: InMemoryMcpServer[] = [];

function buildMockPrisma() {
  return {
    profile: {
      findMany: vi.fn().mockImplementation(({ where }: Record<string, unknown> = {}) => {
        let result = [...PROFILES];
        const whereObj = where as Record<string, unknown> | undefined;
        if (whereObj?.OR) {
          const orConds = whereObj.OR as Record<string, unknown>[];
          result = result.filter((p) =>
            orConds.some((cond: Record<string, unknown>) => {
              // Handle combined conditions like { userId, organizationId }
              if ('userId' in cond && 'organizationId' in cond) {
                return p.userId === cond.userId && p.organizationId === cond.organizationId;
              }
              if ('organizationId' in cond) {
                return p.organizationId === cond.organizationId;
              }
              if ('userId' in cond) {
                return p.userId === cond.userId;
              }
              if ('id' in cond && (cond.id as Record<string, unknown>)?.in) {
                return ((cond.id as Record<string, unknown>).in as string[]).includes(p.id);
              }
              return false;
            })
          );
        }
        return Promise.resolve(result);
      }),
      findUnique: vi
        .fn()
        .mockImplementation(({ where }: Record<string, Record<string, unknown>>) => {
          const found = PROFILES.find(
            (p) => (where.id && p.id === where.id) || (where.name && p.name === where.name)
          );
          return Promise.resolve(found ?? null);
        }),
      create: vi.fn().mockImplementation(({ data }: Record<string, Record<string, unknown>>) => {
        const profile: InMemoryProfile = {
          id: `profile-${Date.now()}`,
          name: data.name as string,
          description: (data.description as string) ?? null,
          userId: data.userId as string,
          organizationId: data.organizationId as string,
          mcpServers: [],
        };
        PROFILES.push(profile);
        return Promise.resolve(profile);
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({}),
    },
    mcpServer: {
      findMany: vi.fn().mockImplementation(({ where }: Record<string, unknown> = {}) => {
        let result = [...SERVERS];
        const whereObj = where as Record<string, unknown> | undefined;
        if (whereObj?.OR) {
          const orConds = whereObj.OR as Record<string, unknown>[];
          result = result.filter((s) =>
            orConds.some((cond: Record<string, unknown>) => {
              if ('userId' in cond) {
                return s.userId === cond.userId;
              }
              if ('id' in cond && (cond.id as Record<string, unknown>)?.in) {
                return ((cond.id as Record<string, unknown>).in as string[]).includes(s.id);
              }
              return false;
            })
          );
        }
        return Promise.resolve(result);
      }),
      findUnique: vi
        .fn()
        .mockImplementation(({ where }: Record<string, Record<string, unknown>>) => {
          const found = SERVERS.find((s) => s.id === where.id);
          return Promise.resolve(found ?? null);
        }),
      create: vi.fn().mockImplementation(({ data }: Record<string, Record<string, unknown>>) => {
        const server: InMemoryMcpServer = {
          id: `server-${Date.now()}`,
          name: data.name as string,
          type: data.type as string,
          config: data.config as string,
          apiKeyConfig: (data.apiKeyConfig as string) ?? null,
          oauthConfig: (data.oauthConfig as string) ?? null,
          userId: data.userId as string,
          profiles: [],
          oauthToken: null,
          toolsCache: [],
        };
        SERVERS.push(server);
        return Promise.resolve(server);
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue({}),
    },
    member: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    mcpServerToolsCache: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
}

// ────────────────────────────────────────────────
// Tests: ProfilesService data isolation (org-scoped, per-user)
// ────────────────────────────────────────────────

describe('Multi-tenant data isolation', () => {
  describe('ProfilesService', () => {
    let profilesService: ProfilesService;
    let prisma: ReturnType<typeof buildMockPrisma>;
    let proxyService: Record<string, ReturnType<typeof vi.fn>>;
    let sharingService: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
      PROFILES.length = 0;
      PROFILES.push(
        {
          id: 'org-a-profile',
          name: 'org-a-dev',
          description: 'Org A dev profile',
          userId: 'user-a',
          organizationId: 'org-a',
          mcpServers: [],
        },
        {
          id: 'org-b-profile',
          name: 'org-b-prod',
          description: 'Org B prod profile',
          userId: 'user-b',
          organizationId: 'org-b',
          mcpServers: [],
        }
      );

      prisma = buildMockPrisma();
      proxyService = {
        getToolsForServer: vi.fn().mockResolvedValue([]),
      };
      sharingService = {
        getSharedResourceIds: vi.fn().mockResolvedValue([]),
        isSharedWith: vi.fn().mockResolvedValue(false),
        getPermission: vi.fn().mockResolvedValue(null),
      };

      profilesService = new ProfilesService(
        prisma as unknown as PrismaService,
        proxyService as unknown as ProxyService,
        sharingService as unknown as SharingService
      );
    });

    it('Org A sees org A profiles, not Org B profiles', async () => {
      const result = await profilesService.findAll('user-a', 'org-a');
      const ids = result.map((p: { id: string }) => p.id);
      expect(ids).toContain('org-a-profile');
      expect(ids).not.toContain('org-b-profile');
    });

    it('Org B sees org B profiles, not Org A profiles', async () => {
      const result = await profilesService.findAll('user-b', 'org-b');
      const ids = result.map((p: { id: string }) => p.id);
      expect(ids).toContain('org-b-profile');
      expect(ids).not.toContain('org-a-profile');
    });

    it('creating a profile sets userId and organizationId', async () => {
      const created = await profilesService.create({ name: 'a-new' }, 'user-a', 'org-a');
      expect(created.userId).toBe('user-a');
      expect(created.organizationId).toBe('org-a');
    });

    it('Org A cannot access Org B profile by ID', async () => {
      await expect(profilesService.findById('org-b-profile', 'user-a', 'org-a')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ────────────────────────────────────────────────
  // Tests: McpService per-user isolation
  // ────────────────────────────────────────────────

  describe('McpService — per-user isolation', () => {
    let mcpService: McpService;
    let prisma: ReturnType<typeof buildMockPrisma>;
    let registry: McpRegistry;
    let debugService: Record<string, ReturnType<typeof vi.fn>>;
    let sharingService: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
      SERVERS.length = 0;
      SERVERS.push(
        {
          id: 'user-a-server',
          name: 'A Custom',
          type: 'external',
          config: '{"command":"node"}',
          apiKeyConfig: '{"apiKey":"a-key"}',
          oauthConfig: null,
          userId: 'user-a',
          profiles: [],
          oauthToken: null,
          toolsCache: [],
        },
        {
          id: 'user-b-server',
          name: 'B Custom',
          type: 'external',
          config: '{"command":"node"}',
          apiKeyConfig: '{"apiKey":"b-key"}',
          oauthConfig: null,
          userId: 'user-b',
          profiles: [],
          oauthToken: null,
          toolsCache: [],
        }
      );

      prisma = buildMockPrisma();
      registry = new McpRegistry();
      debugService = {
        createLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
        updateLog: vi.fn().mockResolvedValue({}),
      };
      sharingService = {
        getSharedResourceIds: vi.fn().mockResolvedValue([]),
        isSharedWith: vi.fn().mockResolvedValue(false),
        getPermission: vi.fn().mockResolvedValue(null),
      };

      mcpService = new McpService(
        prisma as unknown as PrismaService,
        registry,
        debugService as unknown as DebugService,
        sharingService as unknown as SharingService,
        { emit: vi.fn() } as any
      );
    });

    it('User A sees only own servers (no shared)', async () => {
      const result = await mcpService.findAll('user-a', 'org-a');
      const ids = result.map((s: { id: string }) => s.id);
      expect(ids).toContain('user-a-server');
      expect(ids).not.toContain('user-b-server');
    });

    it('User A sees own + shared servers', async () => {
      sharingService.getSharedResourceIds.mockResolvedValue(['user-b-server']);
      const result = await mcpService.findAll('user-a', 'org-a');
      const ids = result.map((s: { id: string }) => s.id);
      expect(ids).toContain('user-a-server');
      expect(ids).toContain('user-b-server');
    });

    it('User A cannot access User B server by ID without sharing', async () => {
      sharingService.isSharedWith.mockResolvedValue(false);
      await expect(mcpService.findById('user-b-server', 'user-a')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('User A can access User B server when shared', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ id: 'user-b-server', userId: 'user-b' }) // assertAccess
        .mockResolvedValueOnce({ ...SERVERS[1], oauthToken: null, toolsCache: [] }); // findById
      sharingService.isSharedWith.mockResolvedValue(true);

      const result = await mcpService.findById('user-b-server', 'user-a');
      expect(result).toBeDefined();
    });

    it('Creating a server sets userId only (no organizationId)', async () => {
      await mcpService.create(
        { name: 'New', type: 'external', config: { command: 'node' } },
        'user-a',
        'org-a'
      );

      expect(prisma.mcpServer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-a' }),
        })
      );
      const callData = prisma.mcpServer.create.mock.calls[0][0].data;
      expect(callData.organizationId).toBeUndefined();
    });

    it('User A cannot delete User B server', async () => {
      sharingService.getPermission.mockResolvedValue(null);
      await expect(mcpService.delete('user-b-server', 'user-a')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('User A can delete own server', async () => {
      await mcpService.delete('user-a-server', 'user-a');
      expect(prisma.mcpServer.delete).toHaveBeenCalledWith({ where: { id: 'user-a-server' } });
    });
  });
});
