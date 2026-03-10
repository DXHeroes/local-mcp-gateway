/**
 * Integration Tests: Sharing and org-scoped access control
 *
 * Verifies that:
 * - SharingService share lifecycle works (share, remove, org membership)
 * - McpService uses org-based access control (no credential stripping)
 * - Owners and org members can access servers in their org
 * - Cross-org access is denied
 */

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpService } from '../../modules/mcp/mcp.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import { SharingService } from '../../modules/sharing/sharing.service.js';

// ────────────────────────────────────────────────
// Test fixtures
// ────────────────────────────────────────────────

const OWNER_ID = 'owner-user';
const VIEWER_ID = 'viewer-user';
const ORG_ID = 'org-1';
const OTHER_ORG_ID = 'org-2';

const ownedServer = {
  id: 'owned-srv',
  name: 'My Server',
  type: 'external',
  config: '{"command":"node"}',
  apiKeyConfig: '{"apiKey":"super-secret-key"}',
  oauthConfig: '{"clientSecret":"oauth-secret"}',
  userId: OWNER_ID,
  organizationId: ORG_ID,
  profiles: [],
  oauthToken: null,
  toolsCache: [],
};

const systemServer = {
  id: 'sys-srv',
  name: 'System Server',
  type: 'builtin',
  config: '{"builtinId":"fetch"}',
  apiKeyConfig: null,
  oauthConfig: null,
  userId: null,
  organizationId: null,
  profiles: [],
  oauthToken: null,
  toolsCache: [],
};

describe('Sharing and org-scoped access control', () => {
  // ────────────────────────────────────────────────
  // SharingService share lifecycle (unchanged)
  // ────────────────────────────────────────────────

  describe('SharingService share lifecycle', () => {
    let sharingService: SharingService;
    let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;

    beforeEach(() => {
      prisma = {
        profile: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'p-1',
            userId: OWNER_ID,
          }),
        },
        mcpServer: {
          findUnique: vi.fn().mockResolvedValue({
            ...ownedServer,
          }),
        },
        sharedResource: {
          findUnique: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([]),
          create: vi
            .fn()
            .mockImplementation(({ data }: Record<string, Record<string, unknown>>) =>
              Promise.resolve({ id: `share-${Date.now()}`, ...data })
            ),
          delete: vi.fn().mockResolvedValue(undefined),
          count: vi.fn().mockResolvedValue(0),
        },
      };
      sharingService = new SharingService(prisma as unknown as PrismaService);
    });

    it('owner can share a profile with another user', async () => {
      await sharingService.share(OWNER_ID, {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'user',
        sharedWithId: VIEWER_ID,
      });

      expect(prisma.sharedResource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resourceType: 'profile',
          resourceId: 'p-1',
          sharedWithType: 'user',
          sharedWithId: VIEWER_ID,
          sharedByUserId: OWNER_ID,
          permission: 'use',
        }),
      });
    });

    it('owner can share an MCP server with an organization', async () => {
      await sharingService.share(OWNER_ID, {
        resourceType: 'mcp_server',
        resourceId: 'owned-srv',
        sharedWithType: 'organization',
        sharedWithId: ORG_ID,
      });

      expect(prisma.sharedResource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sharedWithType: 'organization',
          sharedWithId: ORG_ID,
        }),
      });
    });

    it('non-owner cannot share a profile they do not own', async () => {
      await expect(
        sharingService.share(VIEWER_ID, {
          resourceType: 'profile',
          resourceId: 'p-1',
          sharedWithType: 'user',
          sharedWithId: 'someone-else',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('duplicate share throws ConflictException', async () => {
      prisma.sharedResource.findUnique.mockResolvedValue({ id: 'existing-share' });

      await expect(
        sharingService.share(OWNER_ID, {
          resourceType: 'profile',
          resourceId: 'p-1',
          sharedWithType: 'user',
          sharedWithId: VIEWER_ID,
        })
      ).rejects.toThrow(ConflictException);
    });

    it('isSharedWith checks organization membership', async () => {
      prisma.sharedResource.count.mockResolvedValue(1);

      const result = await sharingService.isSharedWith('profile', 'p-1', VIEWER_ID, [ORG_ID]);

      expect(result).toBe(true);
      expect(prisma.sharedResource.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          resourceType: 'profile',
          resourceId: 'p-1',
          OR: [
            { sharedWithType: 'user', sharedWithId: VIEWER_ID },
            { sharedWithType: 'organization', sharedWithId: { in: [ORG_ID] } },
          ],
        }),
      });
    });

    it('removing a share revokes access', async () => {
      prisma.sharedResource.findUnique.mockResolvedValue({
        id: 'share-1',
        sharedByUserId: OWNER_ID,
      });

      await sharingService.removeShare(OWNER_ID, 'share-1');

      expect(prisma.sharedResource.delete).toHaveBeenCalledWith({
        where: { id: 'share-1' },
      });
    });

    it('non-owner cannot remove a share', async () => {
      prisma.sharedResource.findUnique.mockResolvedValue({
        id: 'share-1',
        sharedByUserId: OWNER_ID,
      });

      await expect(sharingService.removeShare(VIEWER_ID, 'share-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ────────────────────────────────────────────────
  // McpService org-scoped access control
  // ────────────────────────────────────────────────

  describe('McpService org-scoped access control', () => {
    let mcpService: McpService;
    let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
    let registry: McpRegistry;
    let debugService: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
      prisma = {
        mcpServer: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 'new-1' }),
          update: vi.fn().mockResolvedValue({}),
          delete: vi.fn().mockResolvedValue(undefined),
        },
        member: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        mcpServerToolsCache: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      };
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

    it('org member sees full credentials on servers in their org', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...ownedServer }) // assertAccess
        .mockResolvedValueOnce({ ...ownedServer }); // findById

      const result = await mcpService.findById('owned-srv', OWNER_ID, ORG_ID);

      expect(result.apiKeyConfig).toBe('{"apiKey":"super-secret-key"}');
      expect(result.oauthConfig).toBe('{"clientSecret":"oauth-secret"}');
    });

    it('system server credentials are returned as-is for any user', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...systemServer }) // assertAccess
        .mockResolvedValueOnce({ ...systemServer }); // findById

      const result = await mcpService.findById('sys-srv', VIEWER_ID, ORG_ID);

      // System server has null credentials, not redacted
      expect(result.apiKeyConfig).toBeNull();
      expect(result.oauthConfig).toBeNull();
    });

    it('org member sees full credentials in findAll for org servers', async () => {
      prisma.mcpServer.findMany.mockResolvedValue([{ ...ownedServer }]);

      const result = await mcpService.findAll(OWNER_ID, ORG_ID);

      expect(result[0].apiKeyConfig).toBe('{"apiKey":"super-secret-key"}');
      expect(result[0].oauthConfig).toBe('{"clientSecret":"oauth-secret"}');
    });

    it('cross-org access is denied', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        id: 'owned-srv',
        userId: OWNER_ID,
        organizationId: ORG_ID,
      });

      await expect(
        mcpService.findById('owned-srv', VIEWER_ID, OTHER_ORG_ID)
      ).rejects.toThrow(ForbiddenException);
    });

    it('findAll scopes to org + system servers', async () => {
      prisma.mcpServer.findMany.mockResolvedValue([{ ...systemServer }, { ...ownedServer }]);

      await mcpService.findAll(OWNER_ID, ORG_ID);

      expect(prisma.mcpServer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ organizationId: ORG_ID }, { organizationId: null }],
          },
        })
      );
    });
  });
});
