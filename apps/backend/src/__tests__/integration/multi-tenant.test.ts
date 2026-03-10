/**
 * Integration Tests: Multi-tenant data isolation
 *
 * Verifies that ProfilesService and McpService correctly isolate data
 * between organizations while allowing access to system records.
 */

import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Sentinel value for unauthenticated MCP access */
const UNAUTHENTICATED_ID = '__unauthenticated__';

import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpService } from '../../modules/mcp/mcp.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import { ProfilesService } from '../../modules/profiles/profiles.service.js';
import type { ProxyService } from '../../modules/proxy/proxy.service.js';

// ────────────────────────────────────────────────
// In-memory data store simulating Prisma
// ────────────────────────────────────────────────

interface InMemoryProfile {
  id: string;
  name: string;
  description: string | null;
  userId: string | null;
  organizationId: string | null;
  mcpServers: unknown[];
}

interface InMemoryMcpServer {
  id: string;
  name: string;
  type: string;
  config: string;
  apiKeyConfig: string | null;
  oauthConfig: string | null;
  userId: string | null;
  organizationId: string | null;
  profiles: unknown[];
  oauthToken: null;
  toolsCache: unknown[];
}

const PROFILES: InMemoryProfile[] = [];

const SERVERS: InMemoryMcpServer[] = [];

// ────────────────────────────────────────────────
// Helper: build a mock PrismaService over in-memory data
// ────────────────────────────────────────────────

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
              if ('organizationId' in cond) {
                return cond.organizationId === null
                  ? p.organizationId === null
                  : p.organizationId === cond.organizationId;
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
          userId: (data.userId as string) ?? null,
          organizationId: (data.organizationId as string) ?? null,
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
              if ('organizationId' in cond) {
                return cond.organizationId === null
                  ? s.organizationId === null
                  : s.organizationId === cond.organizationId;
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
          userId: (data.userId as string) ?? null,
          organizationId: (data.organizationId as string) ?? null,
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
    gatewaySetting: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  };
}

// ────────────────────────────────────────────────
// Tests: ProfilesService data isolation
// ────────────────────────────────────────────────

describe('Multi-tenant data isolation', () => {
  describe('ProfilesService', () => {
    let profilesService: ProfilesService;
    let prisma: ReturnType<typeof buildMockPrisma>;
    let proxyService: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
      // Reset in-memory data
      PROFILES.length = 0;
      PROFILES.push(
        {
          id: 'sys-profile',
          name: 'default',
          description: 'System default profile',
          userId: null,
          organizationId: null,
          mcpServers: [],
        },
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

      profilesService = new ProfilesService(
        prisma as unknown as PrismaService,
        proxyService as unknown as ProxyService
      );
    });

    it('Org A sees org A profiles + system profiles, not Org B profiles', async () => {
      const result = await profilesService.findAll('user-a', 'org-a');

      const ids = result.map((p: { id: string }) => p.id);
      expect(ids).toContain('sys-profile');
      expect(ids).toContain('org-a-profile');
      expect(ids).not.toContain('org-b-profile');
    });

    it('Org B sees org B profiles + system profiles, not Org A profiles', async () => {
      const result = await profilesService.findAll('user-b', 'org-b');

      const ids = result.map((p: { id: string }) => p.id);
      expect(ids).toContain('sys-profile');
      expect(ids).toContain('org-b-profile');
      expect(ids).not.toContain('org-a-profile');
    });

    it('system profiles (organizationId=null) are visible to all orgs', async () => {
      const resultA = await profilesService.findAll('user-a', 'org-a');
      const resultB = await profilesService.findAll('user-b', 'org-b');

      expect(resultA.some((p: { id: string }) => p.id === 'sys-profile')).toBe(true);
      expect(resultB.some((p: { id: string }) => p.id === 'sys-profile')).toBe(true);
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

    it('Org A can access system profile by ID', async () => {
      const profile = await profilesService.findById('sys-profile', 'user-a', 'org-a');
      expect(profile).toBeDefined();
      expect(profile.id).toBe('sys-profile');
    });

    it('unauthenticated user sees all profiles', async () => {
      const result = await profilesService.findAll(UNAUTHENTICATED_ID);

      // Unauthenticated findAll queries without WHERE filter
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
      // The mock returns all profiles for filterless queries
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ────────────────────────────────────────────────
  // Tests: McpService data isolation
  // ────────────────────────────────────────────────

  describe('McpService', () => {
    let mcpService: McpService;
    let prisma: ReturnType<typeof buildMockPrisma>;
    let registry: McpRegistry;
    let debugService: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
      // Reset in-memory data
      SERVERS.length = 0;
      SERVERS.push(
        {
          id: 'sys-server',
          name: 'System Builtin',
          type: 'builtin',
          config: '{"builtinId":"fetch"}',
          apiKeyConfig: null,
          oauthConfig: null,
          userId: null,
          organizationId: null,
          profiles: [],
          oauthToken: null,
          toolsCache: [],
        },
        {
          id: 'org-a-server',
          name: 'A Custom',
          type: 'external',
          config: '{"command":"node"}',
          apiKeyConfig: '{"apiKey":"a-key"}',
          oauthConfig: null,
          userId: 'user-a',
          organizationId: 'org-a',
          profiles: [],
          oauthToken: null,
          toolsCache: [],
        },
        {
          id: 'org-b-server',
          name: 'B Custom',
          type: 'external',
          config: '{"command":"node"}',
          apiKeyConfig: '{"apiKey":"b-key"}',
          oauthConfig: null,
          userId: 'user-b',
          organizationId: 'org-b',
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

      mcpService = new McpService(
        prisma as unknown as PrismaService,
        registry,
        debugService as unknown as DebugService
      );
    });

    it('Org A sees org A servers + system servers, not Org B servers', async () => {
      const result = await mcpService.findAll('user-a', 'org-a');

      const ids = result.map((s: { id: string }) => s.id);
      expect(ids).toContain('sys-server');
      expect(ids).toContain('org-a-server');
      expect(ids).not.toContain('org-b-server');
    });

    it('Org B sees org B servers + system servers, not Org A servers', async () => {
      const result = await mcpService.findAll('user-b', 'org-b');

      const ids = result.map((s: { id: string }) => s.id);
      expect(ids).toContain('sys-server');
      expect(ids).toContain('org-b-server');
      expect(ids).not.toContain('org-a-server');
    });

    it('builtin/system servers (organizationId=null) are visible to all orgs', async () => {
      const resultA = await mcpService.findAll('user-a', 'org-a');
      const resultB = await mcpService.findAll('user-b', 'org-b');

      expect(resultA.some((s: { id: string }) => s.id === 'sys-server')).toBe(true);
      expect(resultB.some((s: { id: string }) => s.id === 'sys-server')).toBe(true);
    });

    it('Org A cannot access Org B server by ID', async () => {
      await expect(mcpService.findById('org-b-server', 'user-a', 'org-a')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('Org A can access system server by ID', async () => {
      const server = await mcpService.findById('sys-server', 'user-a', 'org-a');
      expect(server).toBeDefined();
      expect(server.id).toBe('sys-server');
    });

    it('Creating a server in Org A sets organizationId to org-a', async () => {
      await mcpService.create(
        { name: 'New', type: 'external', config: { command: 'node' } },
        'user-a',
        'org-a'
      );

      expect(prisma.mcpServer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-a', organizationId: 'org-a' }),
        })
      );
    });

    it('unauthenticated user sees all servers without filtering', async () => {
      await mcpService.findAll(UNAUTHENTICATED_ID);

      // Anonymous uses the unfiltered findMany path
      expect(prisma.mcpServer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('Org A cannot delete Org B server', async () => {
      await expect(mcpService.delete('org-b-server', 'user-a', 'org-a')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('Org A can delete own org server', async () => {
      await mcpService.delete('org-a-server', 'user-a', 'org-a');
      expect(prisma.mcpServer.delete).toHaveBeenCalledWith({ where: { id: 'org-a-server' } });
    });
  });
});
