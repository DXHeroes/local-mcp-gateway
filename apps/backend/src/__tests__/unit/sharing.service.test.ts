/**
 * Tests for SharingService
 */

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import { SharingService } from '../../modules/sharing/sharing.service.js';

describe('SharingService', () => {
  let service: SharingService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    prisma = {
      sharedResource: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'share-1' }),
        delete: vi.fn().mockResolvedValue(undefined),
        count: vi.fn().mockResolvedValue(0),
      },
      profile: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      mcpServer: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      organization: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      member: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    service = new SharingService(prisma as unknown as PrismaService);
  });

  describe('share', () => {
    it('should create a share for owned profile', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.sharedResource.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate share', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.share('user-1', {
          resourceType: 'profile',
          resourceId: 'p-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when not owner', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'other-user' });

      await expect(
        service.share('user-1', {
          resourceType: 'profile',
          resourceId: 'p-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a share for owned mcp_server', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ id: 'mcp-1', userId: 'user-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'mcp_server',
        resourceId: 'mcp-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.mcpServer.findUnique).toHaveBeenCalledWith({ where: { id: 'mcp-1' } });
      expect(prisma.sharedResource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resourceType: 'mcp_server',
          resourceId: 'mcp-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
          permission: 'use',
          sharedByUserId: 'user-1',
        }),
      });
    });

    it('should throw ForbiddenException when not owner of mcp_server', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ id: 'mcp-1', userId: 'other-user' });

      await expect(
        service.share('user-1', {
          resourceType: 'mcp_server',
          resourceId: 'mcp-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when mcp_server not found', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(null);

      await expect(
        service.share('user-1', {
          resourceType: 'mcp_server',
          resourceId: 'nonexistent',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should share with organization after validating org exists', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Test Org' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'organization',
        sharedWithId: 'org-1',
      });

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({ where: { id: 'org-1' } });
      expect(prisma.sharedResource.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when sharing with nonexistent organization', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.share('user-1', {
          resourceType: 'profile',
          resourceId: 'p-1',
          sharedWithType: 'organization',
          sharedWithId: 'nonexistent-org',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate org membership when profile has organizationId and target is user', async () => {
      prisma.profile.findUnique.mockResolvedValue({
        id: 'p-1',
        userId: 'user-1',
        organizationId: 'org-1',
      });
      prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.member.findFirst).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', userId: 'user-2' },
      });
      expect(prisma.sharedResource.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when target user is not org member', async () => {
      prisma.profile.findUnique.mockResolvedValue({
        id: 'p-1',
        userId: 'user-1',
        organizationId: 'org-1',
      });
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.share('user-1', {
          resourceType: 'profile',
          resourceId: 'p-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use provided permission instead of default', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
        permission: 'admin',
      });

      expect(prisma.sharedResource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          permission: 'admin',
        }),
      });
    });

    it('should default permission to use when not provided', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.sharedResource.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          permission: 'use',
        }),
      });
    });
  });

  describe('isSharedWith', () => {
    it('should return true when shared with user', async () => {
      prisma.sharedResource.count.mockResolvedValue(1);

      const result = await service.isSharedWith('profile', 'p-1', 'user-2', []);
      expect(result).toBe(true);
    });

    it('should return false when not shared', async () => {
      prisma.sharedResource.count.mockResolvedValue(0);

      const result = await service.isSharedWith('profile', 'p-1', 'user-2', []);
      expect(result).toBe(false);
    });

    it('should check organization sharing', async () => {
      prisma.sharedResource.count.mockResolvedValue(1);

      const result = await service.isSharedWith('profile', 'p-1', 'user-2', ['org-1']);
      expect(result).toBe(true);
      expect(prisma.sharedResource.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { sharedWithType: 'user', sharedWithId: 'user-2' },
              { sharedWithType: 'organization', sharedWithId: { in: ['org-1'] } },
            ]),
          }),
        })
      );
    });
  });

  describe('getSharedResourceIds', () => {
    it('should return resource IDs shared with user', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        { resourceId: 'p-1' },
        { resourceId: 'p-2' },
      ]);

      const result = await service.getSharedResourceIds('profile', 'user-1', []);
      expect(result).toEqual(['p-1', 'p-2']);
    });

    it('should include resources shared via organization', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        { resourceId: 'p-1' },
        { resourceId: 'p-3' },
      ]);

      const result = await service.getSharedResourceIds('profile', 'user-1', ['org-1']);
      expect(result).toEqual(['p-1', 'p-3']);
      expect(prisma.sharedResource.findMany).toHaveBeenCalledWith({
        where: {
          resourceType: 'profile',
          OR: [
            { sharedWithType: 'user', sharedWithId: 'user-1' },
            { sharedWithType: 'organization', sharedWithId: { in: ['org-1'] } },
          ],
        },
        select: { resourceId: true },
      });
    });

    it('should return empty array when nothing is shared', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([]);

      const result = await service.getSharedResourceIds('mcp_server', 'user-1', []);
      expect(result).toEqual([]);
    });
  });

  describe('removeShare', () => {
    it('should delete share when owned by sharer', async () => {
      prisma.sharedResource.findUnique.mockResolvedValue({
        id: 'share-1',
        sharedByUserId: 'user-1',
      });

      await service.removeShare('user-1', 'share-1');
      expect(prisma.sharedResource.delete).toHaveBeenCalledWith({ where: { id: 'share-1' } });
    });

    it('should throw ForbiddenException when not the sharer', async () => {
      prisma.sharedResource.findUnique.mockResolvedValue({
        id: 'share-1',
        sharedByUserId: 'other-user',
      });

      await expect(service.removeShare('user-1', 'share-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when share not found', async () => {
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await expect(service.removeShare('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listShares', () => {
    it('should return shares enriched with user names', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          id: 'share-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);
      prisma.user.findUnique.mockResolvedValue({ name: 'Bob', email: 'bob@test.com' });

      const result = await service.listShares('user-1', 'profile', 'p-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'share-1',
          sharedWithUser: { name: 'Bob', email: 'bob@test.com' },
        })
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        select: { name: true, email: true },
      });
    });

    it('should return shares enriched with organization names', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          id: 'share-2',
          sharedWithType: 'organization',
          sharedWithId: 'org-1',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);
      prisma.organization.findUnique.mockResolvedValue({ name: 'Acme Corp' });

      const result = await service.listShares('user-1', 'profile', 'p-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'share-2',
          sharedWithOrganization: { name: 'Acme Corp' },
        })
      );
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        select: { name: true },
      });
    });

    it('should set sharedWithUser to undefined when user is not found', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          id: 'share-1',
          sharedWithType: 'user',
          sharedWithId: 'deleted-user',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.listShares('user-1', 'profile', 'p-1');

      expect((result[0] as any).sharedWithUser).toBeUndefined();
    });

    it('should set sharedWithOrganization to undefined when org is not found', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          id: 'share-2',
          sharedWithType: 'organization',
          sharedWithId: 'deleted-org',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);
      prisma.organization.findUnique.mockResolvedValue(null);

      const result = await service.listShares('user-1', 'profile', 'p-1');

      expect((result[0] as any).sharedWithOrganization).toBeUndefined();
    });

    it('should verify ownership before listing', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'other-user' });

      await expect(service.listShares('user-1', 'profile', 'p-1')).rejects.toThrow(
        ForbiddenException
      );
      expect(prisma.sharedResource.findMany).not.toHaveBeenCalled();
    });

    it('should return share as-is for unknown sharedWithType', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          id: 'share-3',
          sharedWithType: 'other',
          sharedWithId: 'xyz',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);

      const result = await service.listShares('user-1', 'profile', 'p-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({ id: 'share-3', sharedWithType: 'other' })
      );
      expect(result[0]).not.toHaveProperty('sharedWithUser');
      expect(result[0]).not.toHaveProperty('sharedWithOrganization');
    });

    it('should handle multiple shares with mixed types', async () => {
      prisma.profile.findUnique.mockResolvedValue({ id: 'p-1', userId: 'user-1' });
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          id: 'share-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
        {
          id: 'share-2',
          sharedWithType: 'organization',
          sharedWithId: 'org-1',
          permission: 'admin',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);
      prisma.user.findUnique.mockResolvedValue({ name: 'Bob', email: 'bob@test.com' });
      prisma.organization.findUnique.mockResolvedValue({ name: 'Acme Corp' });

      const result = await service.listShares('user-1', 'profile', 'p-1');

      expect(result).toHaveLength(2);
      expect((result[0] as any).sharedWithUser).toEqual({ name: 'Bob', email: 'bob@test.com' });
      expect((result[1] as any).sharedWithOrganization).toEqual({ name: 'Acme Corp' });
    });
  });

  describe('getPermission', () => {
    it('should return admin when an admin share exists', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        { permission: 'use' },
        { permission: 'admin' },
      ]);

      const result = await service.getPermission('profile', 'p-1', 'user-2', []);
      expect(result).toBe('admin');
    });

    it('should return use for use-only shares', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([{ permission: 'use' }]);

      const result = await service.getPermission('profile', 'p-1', 'user-2', []);
      expect(result).toBe('use');
    });

    it('should return null when not shared', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([]);

      const result = await service.getPermission('profile', 'p-1', 'user-2', []);
      expect(result).toBeNull();
    });

    it('should check organization-level sharing', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([{ permission: 'admin' }]);

      const result = await service.getPermission('profile', 'p-1', 'user-2', ['org-1', 'org-2']);
      expect(result).toBe('admin');
      expect(prisma.sharedResource.findMany).toHaveBeenCalledWith({
        where: {
          resourceType: 'profile',
          resourceId: 'p-1',
          OR: [
            { sharedWithType: 'user', sharedWithId: 'user-2' },
            { sharedWithType: 'organization', sharedWithId: { in: ['org-1', 'org-2'] } },
          ],
        },
        select: { permission: true },
      });
    });

    it('should not include org condition when organizationIds is empty', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([{ permission: 'use' }]);

      await service.getPermission('mcp_server', 'mcp-1', 'user-2', []);

      expect(prisma.sharedResource.findMany).toHaveBeenCalledWith({
        where: {
          resourceType: 'mcp_server',
          resourceId: 'mcp-1',
          OR: [{ sharedWithType: 'user', sharedWithId: 'user-2' }],
        },
        select: { permission: true },
      });
    });

    it('should return first permission when no admin share exists', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        { permission: 'use' },
        { permission: 'use' },
      ]);

      const result = await service.getPermission('profile', 'p-1', 'user-2', []);
      expect(result).toBe('use');
    });
  });

  describe('getSharingSummary', () => {
    it('should build correct outbound summary for shares created by user', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-1',
          sharedWithId: 'user-2',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-1',
          sharedWithId: 'user-3',
          permission: 'admin',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);

      const result = await service.getSharingSummary('user-1', [], 'profile');

      expect(result['p-1']).toBeDefined();
      expect(result['p-1'].outbound).toEqual({
        total: 2,
        byPermission: { use: 1, admin: 1 },
      });
      expect(result['p-1'].inbound).toBeUndefined();
    });

    it('should build correct inbound summary for shares targeting user', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          resourceId: 'p-1',
          sharedByUserId: 'other-user',
          sharedWithId: 'user-1',
          sharedWithType: 'user',
          permission: 'admin',
          sharedBy: { id: 'other-user', name: 'Alice', email: 'alice@test.com' },
        },
      ]);

      const result = await service.getSharingSummary('user-1', [], 'profile');

      expect(result['p-1'].inbound).toEqual({
        permission: 'admin',
        sharedByUserName: 'Alice',
        sharedByUserEmail: 'alice@test.com',
      });
    });

    it('should build inbound summary for shares via organization', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          resourceId: 'mcp-1',
          sharedByUserId: 'other-user',
          sharedWithId: 'org-1',
          sharedWithType: 'organization',
          permission: 'use',
          sharedBy: { id: 'other-user', name: 'Bob', email: 'bob@test.com' },
        },
      ]);

      const result = await service.getSharingSummary('user-1', ['org-1'], 'mcp_server');

      expect(result['mcp-1'].inbound).toEqual({
        permission: 'use',
        sharedByUserName: 'Bob',
        sharedByUserEmail: 'bob@test.com',
      });
    });

    it('should handle mixed inbound and outbound for same resource', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-1',
          sharedWithId: 'user-2',
          sharedWithType: 'user',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-2',
          sharedWithId: 'user-1',
          sharedWithType: 'user',
          permission: 'admin',
          sharedBy: { id: 'user-2', name: 'Other', email: 'other@test.com' },
        },
      ]);

      const result = await service.getSharingSummary('user-1', [], 'profile');

      expect(result['p-1'].outbound).toEqual({
        total: 1,
        byPermission: { use: 1 },
      });
      expect(result['p-1'].inbound).toEqual({
        permission: 'admin',
        sharedByUserName: 'Other',
        sharedByUserEmail: 'other@test.com',
      });
    });

    it('should handle multiple resources in summary', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-1',
          sharedWithId: 'user-2',
          sharedWithType: 'user',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
        {
          resourceId: 'p-2',
          sharedByUserId: 'other-user',
          sharedWithId: 'user-1',
          sharedWithType: 'user',
          permission: 'admin',
          sharedBy: { id: 'other-user', name: 'Alice', email: 'alice@test.com' },
        },
      ]);

      const result = await service.getSharingSummary('user-1', [], 'profile');

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['p-1'].outbound).toBeDefined();
      expect(result['p-1'].inbound).toBeUndefined();
      expect(result['p-2'].inbound).toBeDefined();
      expect(result['p-2'].outbound).toBeUndefined();
    });

    it('should return empty object when no shares exist', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([]);

      const result = await service.getSharingSummary('user-1', [], 'profile');
      expect(result).toEqual({});
    });

    it('should handle empty sharedBy name and email as empty strings', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          resourceId: 'p-1',
          sharedByUserId: 'other-user',
          sharedWithId: 'user-1',
          sharedWithType: 'user',
          permission: 'use',
          sharedBy: { id: 'other-user', name: null, email: null },
        },
      ]);

      const result = await service.getSharingSummary('user-1', [], 'profile');

      expect(result['p-1'].inbound).toEqual({
        permission: 'use',
        sharedByUserName: '',
        sharedByUserEmail: '',
      });
    });

    it('should accumulate outbound byPermission correctly', async () => {
      prisma.sharedResource.findMany.mockResolvedValue([
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-1',
          sharedWithId: 'user-2',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-1',
          sharedWithId: 'user-3',
          permission: 'use',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
        {
          resourceId: 'p-1',
          sharedByUserId: 'user-1',
          sharedWithId: 'org-1',
          permission: 'admin',
          sharedBy: { id: 'user-1', name: 'Owner', email: 'owner@test.com' },
        },
      ]);

      const result = await service.getSharingSummary('user-1', [], 'profile');

      expect(result['p-1'].outbound).toEqual({
        total: 3,
        byPermission: { use: 2, admin: 1 },
      });
    });
  });

  describe('verifyOwnership (via share)', () => {
    it('should throw NotFoundException when profile not found', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.share('user-1', {
          resourceType: 'profile',
          resourceId: 'nonexistent',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow sharing profile with null userId (org-owned)', async () => {
      prisma.profile.findUnique.mockResolvedValue({
        id: 'p-1',
        userId: null,
        organizationId: 'org-1',
      });
      prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.sharedResource.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when mcp_server not found', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(null);

      await expect(
        service.share('user-1', {
          resourceType: 'mcp_server',
          resourceId: 'nonexistent',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when mcp_server userId does not match', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        id: 'mcp-1',
        userId: 'other-user',
      });

      await expect(
        service.share('user-1', {
          resourceType: 'mcp_server',
          resourceId: 'mcp-1',
          sharedWithType: 'user',
          sharedWithId: 'user-2',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return null orgId for mcp_server ownership', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ id: 'mcp-1', userId: 'user-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      // If orgId were returned, member check would happen; it should not for mcp_server
      await service.share('user-1', {
        resourceType: 'mcp_server',
        resourceId: 'mcp-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.member.findFirst).not.toHaveBeenCalled();
    });

    it('should return organizationId from profile for org membership check', async () => {
      prisma.profile.findUnique.mockResolvedValue({
        id: 'p-1',
        userId: 'user-1',
        organizationId: 'org-1',
      });
      prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      await service.share('user-1', {
        resourceType: 'profile',
        resourceId: 'p-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.member.findFirst).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', userId: 'user-2' },
      });
    });

    it('should handle unknown resource type gracefully (returns null)', async () => {
      prisma.sharedResource.findUnique.mockResolvedValue(null);

      // Unknown resource type bypasses ownership checks, returns null orgId
      // This means no member check and proceeds to duplicate check
      await service.share('user-1', {
        resourceType: 'unknown' as 'profile',
        resourceId: 'x-1',
        sharedWithType: 'user',
        sharedWithId: 'user-2',
      });

      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
      expect(prisma.mcpServer.findUnique).not.toHaveBeenCalled();
      expect(prisma.sharedResource.create).toHaveBeenCalled();
    });
  });
});
