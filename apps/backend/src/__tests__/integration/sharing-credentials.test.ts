/**
 * Integration Tests: Sharing and per-user access control
 *
 * Verifies that:
 * - SharingService share lifecycle works (share, remove, org membership)
 * - McpService uses per-user ownership with sharing-based access
 * - Owners can access their servers
 * - Shared users can access servers
 * - Non-shared users are denied
 */

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpService } from '../../modules/mcp/mcp.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import type { SharingService as SharingServiceType } from '../../modules/sharing/sharing.service.js';
import { SharingService } from '../../modules/sharing/sharing.service.js';

// ────────────────────────────────────────────────
// Test fixtures
// ────────────────────────────────────────────────

const OWNER_ID = 'owner-user';
const VIEWER_ID = 'viewer-user';

const ownedServer = {
  id: 'owned-srv',
  name: 'My Server',
  type: 'external',
  config: '{"command":"node"}',
  apiKeyConfig: '{"apiKey":"super-secret-key"}',
  oauthConfig: '{"clientSecret":"oauth-secret"}',
  userId: OWNER_ID,
  profiles: [],
  oauthToken: null,
  toolsCache: [],
};

describe('Sharing and per-user access control', () => {
  // ────────────────────────────────────────────────
  // SharingService share lifecycle
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
        organization: {
          findUnique: vi.fn().mockResolvedValue({ id: 'org-1', name: 'Test Org' }),
        },
        member: {
          findFirst: vi.fn().mockResolvedValue({ id: 'member-1' }),
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
        sharedWithId: 'org-1',
      });

      expect(prisma.sharedResource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sharedWithType: 'organization',
          sharedWithId: 'org-1',
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

      const result = await sharingService.isSharedWith('profile', 'p-1', VIEWER_ID, ['org-1']);

      expect(result).toBe(true);
      expect(prisma.sharedResource.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          resourceType: 'profile',
          resourceId: 'p-1',
          OR: [
            { sharedWithType: 'user', sharedWithId: VIEWER_ID },
            { sharedWithType: 'organization', sharedWithId: { in: ['org-1'] } },
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

    it('getPermission returns highest permission level', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        { permission: 'use' },
        { permission: 'admin' },
      ]);

      const result = await sharingService.getPermission('mcp_server', 'owned-srv', VIEWER_ID, []);
      expect(result).toBe('admin');
    });

    it('getPermission returns null when not shared', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([]);

      const result = await sharingService.getPermission('mcp_server', 'owned-srv', VIEWER_ID, []);
      expect(result).toBeNull();
    });
  });

  // ────────────────────────────────────────────────
  // McpService per-user access control
  // ────────────────────────────────────────────────

  describe('McpService per-user access control', () => {
    let mcpService: McpService;
    let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
    let registry: McpRegistry;
    let debugService: Record<string, ReturnType<typeof vi.fn>>;
    let sharingServiceMock: Record<string, ReturnType<typeof vi.fn>>;

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
      sharingServiceMock = {
        getSharedResourceIds: vi.fn().mockResolvedValue([]),
        isSharedWith: vi.fn().mockResolvedValue(false),
        getPermission: vi.fn().mockResolvedValue(null),
      };

      mcpService = new McpService(
        prisma as unknown as PrismaService,
        registry,
        debugService as unknown as DebugService,
        sharingServiceMock as unknown as SharingServiceType,
        { emit: vi.fn() } as any
      );
    });

    it('owner sees full credentials on their own server', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...ownedServer }) // assertAccess
        .mockResolvedValueOnce({ ...ownedServer }); // findById

      const result = await mcpService.findById('owned-srv', OWNER_ID);

      expect(result.apiKeyConfig).toBe('{"apiKey":"super-secret-key"}');
      expect(result.oauthConfig).toBe('{"clientSecret":"oauth-secret"}');
    });

    it('owner sees full credentials in findAll', async () => {
      prisma.mcpServer.findMany.mockResolvedValue([{ ...ownedServer }]);

      const result = await mcpService.findAll(OWNER_ID);

      expect(result[0].apiKeyConfig).toBe('{"apiKey":"super-secret-key"}');
      expect(result[0].oauthConfig).toBe('{"clientSecret":"oauth-secret"}');
    });

    it('non-owner without sharing is denied access', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        id: 'owned-srv',
        userId: OWNER_ID,
      });
      sharingServiceMock.isSharedWith.mockResolvedValue(false);

      await expect(mcpService.findById('owned-srv', VIEWER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('shared user can access the server', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...ownedServer }) // assertAccess
        .mockResolvedValueOnce({ ...ownedServer }); // findById
      sharingServiceMock.isSharedWith.mockResolvedValue(true);

      const result = await mcpService.findById('owned-srv', VIEWER_ID);
      expect(result).toBeDefined();
      expect(result.id).toBe('owned-srv');
    });

    it('findAll scopes to user-owned + shared servers', async () => {
      sharingServiceMock.getSharedResourceIds.mockResolvedValue(['shared-srv']);
      prisma.mcpServer.findMany.mockResolvedValue([{ ...ownedServer }]);

      await mcpService.findAll(OWNER_ID, 'org-1');

      expect(prisma.mcpServer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ userId: OWNER_ID }, { id: { in: ['shared-srv'] } }],
          },
        })
      );
    });
  });
});
