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
});
