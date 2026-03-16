/**
 * Tests for ProfilesService — profile CRUD, server linking, tool customizations
 */

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import { ProfilesService } from '../../modules/profiles/profiles.service.js';
import type { ProxyService } from '../../modules/proxy/proxy.service.js';
import type { SharingService } from '../../modules/sharing/sharing.service.js';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let proxyService: Record<string, ReturnType<typeof vi.fn>>;
  let sharingService: Record<string, ReturnType<typeof vi.fn>>;

  const orgId = 'org-1';
  const userId = 'user-1';
  const profileId = 'profile-1';
  const serverId = 'srv-1';

  const sampleProfile = {
    id: profileId,
    name: 'my-profile',
    description: 'Test profile',
    userId,
    organizationId: orgId,
  };

  const sampleServer = {
    id: serverId,
    name: 'Test Server',
    type: 'external',
    config: '{"command":"node"}',
    userId,
  };

  const sampleLink = {
    id: 'link-1',
    profileId,
    mcpServerId: serverId,
    order: 0,
    isActive: true,
    tools: [],
  };

  beforeEach(() => {
    prisma = {
      profile: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'new-profile' }),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      profileMcpServer: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      profileMcpServerTool: {
        deleteMany: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({}),
      },
      mcpServer: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      member: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn().mockImplementation((cb) => cb(prisma)) as any,
    };

    proxyService = {
      getToolsForServer: vi.fn().mockResolvedValue([]),
    };

    sharingService = {
      getSharedResourceIds: vi.fn().mockResolvedValue([]),
      isSharedWith: vi.fn().mockResolvedValue(false),
      getPermission: vi.fn().mockResolvedValue(null),
    };

    service = new ProfilesService(
      prisma as unknown as PrismaService,
      proxyService as unknown as ProxyService,
      sharingService as unknown as SharingService
    );
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return own + shared profiles for authenticated user', async () => {
      prisma.profile.findMany.mockResolvedValue([sampleProfile]);

      const result = await service.findAll(userId, orgId);

      expect(sharingService.getSharedResourceIds).toHaveBeenCalledWith('profile', userId, []);
      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ userId, organizationId: orgId }],
          },
        })
      );
      expect(result).toHaveLength(1);
    });

    it('should include mcpServers ordered by order asc', async () => {
      prisma.profile.findMany.mockResolvedValue([]);

      await service.findAll(userId, orgId);

      const call = prisma.profile.findMany.mock.calls[0][0];
      expect(call.include.mcpServers).toEqual(
        expect.objectContaining({
          include: { mcpServer: true },
          orderBy: { order: 'asc' },
        })
      );
    });

    it('should include shared profiles when sharing service returns IDs', async () => {
      sharingService.getSharedResourceIds.mockResolvedValue(['shared-profile-1']);
      prisma.profile.findMany.mockResolvedValue([]);

      await service.findAll(userId, orgId);

      const call = prisma.profile.findMany.mock.calls[0][0];
      expect(call.where.OR).toEqual([
        { userId, organizationId: orgId },
        { id: { in: ['shared-profile-1'] } },
      ]);
    });

    it('should not see other users unshared profiles', async () => {
      sharingService.getSharedResourceIds.mockResolvedValue([]);
      prisma.profile.findMany.mockResolvedValue([]);

      await service.findAll(userId, orgId);

      const call = prisma.profile.findMany.mock.calls[0][0];
      // Only own profiles — no org-wide query
      expect(call.where.OR).toEqual([{ userId, organizationId: orgId }]);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should return profile when found', async () => {
      // assertAccess lookup
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({
          ...sampleProfile,
          mcpServers: [],
        });

      const result = await service.findById(profileId, userId, orgId);

      expect(result).toEqual(expect.objectContaining({ id: profileId }));
    });

    it('should throw NotFoundException when profile not found', async () => {
      // assertAccess will find profile
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce(null);

      await expect(service.findById(profileId, userId, orgId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when assertAccess cannot find profile', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent', userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when profile belongs to different user and not shared', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: orgId,
      });
      sharingService.isSharedWith.mockResolvedValue(false);

      await expect(service.findById(profileId, userId, orgId)).rejects.toThrow(ForbiddenException);
    });

    it('should skip access check when orgId is not provided', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        ...sampleProfile,
        mcpServers: [],
      });

      const result = await service.findById(profileId, userId);

      // Only one call (the actual lookup), no assertAccess call
      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // findByName
  // ---------------------------------------------------------------------------
  describe('findByName', () => {
    const profileWithServers = {
      ...sampleProfile,
      mcpServers: [],
    };

    it('should return profile by userId_organizationId_name unique constraint', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(profileWithServers);

      const result = await service.findByName('my-profile', userId, orgId);

      expect(prisma.profile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_organizationId_name: {
              userId,
              organizationId: orgId,
              name: 'my-profile',
            },
          },
        })
      );
      expect(result).toEqual(profileWithServers);
    });

    it('should throw NotFoundException when profile not found', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null);

      await expect(service.findByName('nonexistent', userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should create a profile with org and user', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null); // uniqueness check
      prisma.profile.create.mockResolvedValue({ ...sampleProfile, id: 'new-id' });

      const result = await service.create(
        { name: 'my-profile', description: 'desc' },
        userId,
        orgId
      );

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          name: 'my-profile',
          description: 'desc',
          userId,
          organizationId: orgId,
        },
      });
      expect(result.id).toBe('new-id');
    });

    it('should throw ConflictException for reserved name "gateway"', async () => {
      await expect(service.create({ name: 'gateway' }, userId, orgId)).rejects.toThrow(
        ConflictException
      );

      expect(prisma.profile.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for reserved name case-insensitive', async () => {
      await expect(service.create({ name: 'Gateway' }, userId, orgId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw ConflictException for duplicate name in same org', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ id: 'existing-1' });

      await expect(service.create({ name: 'my-profile' }, userId, orgId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should check uniqueness using userId_organizationId_name constraint', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null);
      prisma.profile.create.mockResolvedValue({ id: 'new-id' });

      await service.create({ name: 'test-profile' }, userId, orgId);

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: {
          userId_organizationId_name: {
            userId,
            organizationId: orgId,
            name: 'test-profile',
          },
        },
      });
    });

    it('should allow null description', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null); // uniqueness check
      prisma.profile.create.mockResolvedValue({ id: 'new-null-desc' });

      await service.create({ name: 'test', description: null }, userId, orgId);

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: null }),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update profile name and description', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile }) // findUnique for existing check
        .mockResolvedValueOnce(null); // uniqueness check for new name

      prisma.profile.update.mockResolvedValue({
        ...sampleProfile,
        name: 'updated-name',
      });

      const result = await service.update(
        profileId,
        { name: 'updated-name', description: 'new desc' },
        userId,
        orgId
      );

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: profileId },
        data: { name: 'updated-name', description: 'new desc' },
      });
      expect(result.name).toBe('updated-name');
    });

    it('should throw NotFoundException when profile not found', async () => {
      // assertOwnership finds it
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce(null); // profile not found

      await expect(service.update(profileId, { name: 'new' }, userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException for reserved name "gateway"', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile });

      await expect(service.update(profileId, { name: 'gateway' }, userId, orgId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw ConflictException for duplicate name', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile }) // existing profile
        .mockResolvedValueOnce({ id: 'other-profile' }); // uniqueness conflict

      await expect(
        service.update(profileId, { name: 'taken-name' }, userId, orgId)
      ).rejects.toThrow(ConflictException);
    });

    it('should skip uniqueness check when name is unchanged', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile });

      prisma.profile.update.mockResolvedValue(sampleProfile);

      await service.update(
        profileId,
        { name: 'my-profile' }, // same name
        userId,
        orgId
      );

      // findUnique called 2x (assertOwnership + profile lookup), NOT 3x (no uniqueness)
      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should use userId_organizationId_name for uniqueness check', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile }) // existing profile
        .mockResolvedValueOnce(null); // uniqueness check passes

      prisma.profile.update.mockResolvedValue({ ...sampleProfile, name: 'new-name' });

      await service.update(profileId, { name: 'new-name' }, userId, orgId);

      // Third call should use the userId_organizationId_name constraint
      expect(prisma.profile.findUnique).toHaveBeenNthCalledWith(3, {
        where: {
          userId_organizationId_name: {
            userId,
            organizationId: orgId,
            name: 'new-name',
          },
        },
      });
    });

    it('should skip ownership check when orgId is not provided', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });
      prisma.profile.update.mockResolvedValue(sampleProfile);

      await service.update(profileId, { description: 'updated' }, userId);

      // Only one findUnique (the profile lookup), no assertOwnership
      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should skip name validation when dto.name is not provided', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });
      prisma.profile.update.mockResolvedValue({
        ...sampleProfile,
        description: 'only-desc-change',
      });

      const result = await service.update(profileId, { description: 'only-desc-change' }, userId);

      expect(result.description).toBe('only-desc-change');
      expect(prisma.profile.update).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should delete an existing profile', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertOwnership
        .mockResolvedValueOnce({ ...sampleProfile });

      await service.delete(profileId, userId, orgId);

      expect(prisma.profile.delete).toHaveBeenCalledWith({ where: { id: profileId } });
    });

    it('should throw NotFoundException when profile not found', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertOwnership
        .mockResolvedValueOnce(null);

      await expect(service.delete(profileId, userId, orgId)).rejects.toThrow(NotFoundException);
    });

    it('should skip ownership check when orgId is not provided', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });

      await service.delete(profileId, userId);

      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.profile.delete).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getServers
  // ---------------------------------------------------------------------------
  describe('getServers', () => {
    it('should return servers for accessible profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findMany.mockResolvedValue([
        { ...sampleLink, mcpServer: sampleServer },
      ]);

      const result = await service.getServers(profileId, userId, orgId);

      expect(result).toHaveLength(1);
      expect(prisma.profileMcpServer.findMany).toHaveBeenCalledWith({
        where: { profileId },
        include: { mcpServer: true, tools: true },
        orderBy: { order: 'asc' },
      });
    });

    it('should skip access check when orgId is not provided', async () => {
      prisma.profileMcpServer.findMany.mockResolvedValue([]);

      await service.getServers(profileId, userId);

      // No assertAccess call
      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when accessing other user unshared profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: orgId,
      });
      sharingService.isSharedWith.mockResolvedValue(false);

      await expect(service.getServers(profileId, userId, orgId)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // addServer
  // ---------------------------------------------------------------------------
  describe('addServer', () => {
    const dto = { mcpServerId: serverId, order: 1, isActive: true };

    it('should add a server to a profile', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile }); // profile exists check
      prisma.mcpServer.findUnique.mockResolvedValueOnce(sampleServer);
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null); // not already linked
      prisma.profileMcpServer.create.mockResolvedValue({
        ...sampleLink,
        mcpServer: sampleServer,
      });

      const result = await service.addServer(profileId, dto, userId, orgId);

      expect(prisma.profileMcpServer.create).toHaveBeenCalledWith({
        data: {
          profileId,
          mcpServerId: serverId,
          order: 1,
          isActive: true,
        },
        include: { mcpServer: true },
      });
      expect(result).toBeDefined();
    });

    it('should use default order=0 and isActive=true when not specified', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });
      prisma.mcpServer.findUnique.mockResolvedValueOnce(sampleServer);
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null);
      prisma.profileMcpServer.create.mockResolvedValue({});

      await service.addServer(profileId, { mcpServerId: serverId }, userId);

      expect(prisma.profileMcpServer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ order: 0, isActive: true }),
        include: { mcpServer: true },
      });
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce(null); // profile not found

      await expect(service.addServer(profileId, dto, userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when server does not exist', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile });
      prisma.mcpServer.findUnique.mockResolvedValueOnce(null);

      await expect(service.addServer(profileId, dto, userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException when server is already linked', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile });
      prisma.mcpServer.findUnique.mockResolvedValueOnce(sampleServer);
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await expect(service.addServer(profileId, dto, userId, orgId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw ForbiddenException when non-owner tries to add unshared server', async () => {
      const otherUserServer = { ...sampleServer, userId: 'user-other' };

      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile });
      prisma.mcpServer.findUnique.mockResolvedValueOnce(otherUserServer);
      sharingService.getSharedResourceIds.mockResolvedValueOnce([]);

      await expect(service.addServer(profileId, dto, userId, orgId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow adding a shared server owned by another user', async () => {
      const sharedServer = { ...sampleServer, userId: 'user-other' };

      // assertOwnership for profile
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile });
      prisma.mcpServer.findUnique.mockResolvedValueOnce(sharedServer);
      // Server is shared with the user via org
      sharingService.getSharedResourceIds.mockResolvedValueOnce([sharedServer.id]);
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null);
      prisma.profileMcpServer.create.mockResolvedValue({
        ...sampleLink,
        mcpServer: sharedServer,
      });

      await expect(service.addServer(profileId, dto, userId, orgId)).resolves.toBeDefined();
      expect(prisma.profileMcpServer.create).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updateServer
  // ---------------------------------------------------------------------------
  describe('updateServer', () => {
    it('should update server link in profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);
      prisma.profileMcpServer.update.mockResolvedValue({
        ...sampleLink,
        order: 5,
        mcpServer: sampleServer,
      });

      const result = await service.updateServer(profileId, serverId, { order: 5 }, userId, orgId);

      expect(prisma.profileMcpServer.update).toHaveBeenCalledWith({
        where: { id: sampleLink.id },
        data: { order: 5 },
        include: { mcpServer: true },
      });
      expect(result.order).toBe(5);
    });

    it('should throw NotFoundException when server is not in profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateServer(profileId, serverId, { order: 1 }, userId, orgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should skip ownership check when orgId is not provided', async () => {
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);
      prisma.profileMcpServer.update.mockResolvedValue({
        ...sampleLink,
        mcpServer: sampleServer,
      });

      await service.updateServer(profileId, serverId, { isActive: false }, userId);

      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // removeServer
  // ---------------------------------------------------------------------------
  describe('removeServer', () => {
    it('should remove a linked server from profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await service.removeServer(profileId, serverId, userId, orgId);

      expect(prisma.profileMcpServer.delete).toHaveBeenCalledWith({
        where: { id: sampleLink.id },
      });
    });

    it('should throw NotFoundException when server is not in profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null);

      await expect(service.removeServer(profileId, serverId, userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should skip ownership check when orgId is not provided', async () => {
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await service.removeServer(profileId, serverId, userId);

      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
      expect(prisma.profileMcpServer.delete).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getServerTools
  // ---------------------------------------------------------------------------
  describe('getServerTools', () => {
    const serverTools = [
      { name: 'read_file', description: 'Read a file', inputSchema: { type: 'object' } },
      { name: 'write_file', description: 'Write a file', inputSchema: { type: 'object' } },
    ];

    it('should return tools with customizations applied', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertAccess
        .mockResolvedValueOnce({ ...sampleProfile }); // profile exists
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce({
        ...sampleLink,
        tools: [
          {
            toolName: 'read_file',
            isEnabled: false,
            customName: 'custom_read',
            customDescription: 'Custom description',
          },
        ],
      });
      proxyService.getToolsForServer.mockResolvedValue(serverTools);

      const result = await service.getServerTools(profileId, serverId, false, userId, orgId);

      expect(result.tools).toHaveLength(2);

      // read_file has customization
      const readTool = result.tools.find((t) => t.name === 'read_file');
      expect(readTool).toEqual({
        name: 'read_file',
        original: {
          name: 'read_file',
          description: 'Read a file',
          inputSchema: { type: 'object' },
        },
        customized: {
          name: 'custom_read',
          description: 'Custom description',
          inputSchema: { type: 'object' },
        },
        isEnabled: false,
        hasChanges: true,
        changeType: 'modified',
      });

      // write_file has no customization
      const writeTool = result.tools.find((t) => t.name === 'write_file');
      expect(writeTool).toEqual({
        name: 'write_file',
        original: {
          name: 'write_file',
          description: 'Write a file',
          inputSchema: { type: 'object' },
        },
        customized: null,
        isEnabled: true,
        hasChanges: false,
        changeType: 'unchanged',
      });
    });

    it('should throw NotFoundException when profile not found', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertAccess
        .mockResolvedValueOnce(null); // profile not found

      await expect(
        service.getServerTools(profileId, serverId, false, userId, orgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when server is not linked to profile', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertAccess
        .mockResolvedValueOnce({ ...sampleProfile }); // profile found
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.getServerTools(profileId, serverId, false, userId, orgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle tools with no customizations (empty tools array)', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce({
        ...sampleLink,
        tools: [],
      });
      proxyService.getToolsForServer.mockResolvedValue(serverTools);

      const result = await service.getServerTools(profileId, serverId, false, userId);

      expect(result.tools).toHaveLength(2);
      for (const tool of result.tools) {
        expect(tool.customized).toBeNull();
        expect(tool.isEnabled).toBe(true);
        expect(tool.hasChanges).toBe(false);
        expect(tool.changeType).toBe('unchanged');
      }
    });

    it('should use original name/desc when custom name/desc is empty string', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce({
        ...sampleLink,
        tools: [
          {
            toolName: 'read_file',
            isEnabled: true,
            customName: '',
            customDescription: '',
          },
        ],
      });
      proxyService.getToolsForServer.mockResolvedValue(serverTools);

      const result = await service.getServerTools(profileId, serverId, false, userId);

      const readTool = result.tools.find((t) => t.name === 'read_file');
      // Empty string is falsy, so it falls back to the original values
      expect(readTool?.customized?.name).toBe('read_file');
      expect(readTool?.customized?.description).toBe('Read a file');
    });

    it('should return empty tools when proxy returns empty array', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce({
        ...sampleLink,
        tools: [],
      });
      proxyService.getToolsForServer.mockResolvedValue([]);

      const result = await service.getServerTools(profileId, serverId, false, userId);

      expect(result.tools).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // updateServerTools
  // ---------------------------------------------------------------------------
  describe('updateServerTools', () => {
    const toolUpdates = [
      {
        toolName: 'read_file',
        isEnabled: false,
        customName: 'custom_read',
        customDescription: 'Custom desc',
      },
      {
        toolName: 'write_file',
        isEnabled: true,
      },
    ];

    it('should delete old customizations and create new ones in transaction', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile }) // profile exists
        // getServerTools calls inside updateServerTools (the return call)
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertAccess
        .mockResolvedValueOnce({ ...sampleProfile }); // profile exists in getServerTools

      prisma.profileMcpServer.findUnique
        .mockResolvedValueOnce(sampleLink) // link exists check
        .mockResolvedValueOnce({ ...sampleLink, tools: [] }); // getServerTools

      proxyService.getToolsForServer.mockResolvedValue([
        { name: 'read_file', description: 'Read a file', inputSchema: {} },
        { name: 'write_file', description: 'Write a file', inputSchema: {} },
      ]);

      await service.updateServerTools(profileId, serverId, toolUpdates, userId, orgId);

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // Verify deleteMany was called to clear old customizations
      expect(prisma.profileMcpServerTool.deleteMany).toHaveBeenCalledWith({
        where: { profileMcpServerId: sampleLink.id },
      });

      // Only read_file has changes (isEnabled=false or customName/customDescription set)
      // write_file has isEnabled=true AND no custom*, so it's filtered out
      expect(prisma.profileMcpServerTool.createMany).toHaveBeenCalledWith({
        data: [
          {
            profileMcpServerId: sampleLink.id,
            toolName: 'read_file',
            isEnabled: false,
            customName: 'custom_read',
            customDescription: 'Custom desc',
            customInputSchema: null,
          },
        ],
      });
    });

    it('should throw NotFoundException when profile not found', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertOwnership
        .mockResolvedValueOnce(null); // profile not found

      await expect(
        service.updateServerTools(profileId, serverId, toolUpdates, userId, orgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when server link not found', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertOwnership
        .mockResolvedValueOnce({ ...sampleProfile });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateServerTools(profileId, serverId, toolUpdates, userId, orgId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should skip createMany when no tools have changes', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ ...sampleProfile }) // profile exists
        .mockResolvedValueOnce({ ...sampleProfile }); // getServerTools profile
      prisma.profileMcpServer.findUnique
        .mockResolvedValueOnce(sampleLink)
        .mockResolvedValueOnce({ ...sampleLink, tools: [] });
      proxyService.getToolsForServer.mockResolvedValue([]);

      // All tools have isEnabled=true and no customizations
      const noChangesTools = [
        { toolName: 'read_file', isEnabled: true },
        { toolName: 'write_file', isEnabled: true },
      ];

      await service.updateServerTools(profileId, serverId, noChangesTools, userId);

      expect(prisma.profileMcpServerTool.deleteMany).toHaveBeenCalled();
      expect(prisma.profileMcpServerTool.createMany).not.toHaveBeenCalled();
    });

    it('should serialize customInputSchema to JSON string', async () => {
      const toolsWithSchema = [
        {
          toolName: 'read_file',
          isEnabled: true,
          customInputSchema: { type: 'object', properties: { path: { type: 'string' } } },
        },
      ];

      prisma.profile.findUnique
        .mockResolvedValueOnce({ ...sampleProfile })
        .mockResolvedValueOnce({ ...sampleProfile });
      prisma.profileMcpServer.findUnique
        .mockResolvedValueOnce(sampleLink)
        .mockResolvedValueOnce({ ...sampleLink, tools: [] });
      proxyService.getToolsForServer.mockResolvedValue([]);

      await service.updateServerTools(profileId, serverId, toolsWithSchema, userId);

      expect(prisma.profileMcpServerTool.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            customInputSchema: JSON.stringify({
              type: 'object',
              properties: { path: { type: 'string' } },
            }),
          }),
        ],
      });
    });

    it('should call getServerTools after updating to return fresh data', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ ...sampleProfile }) // profile exists
        .mockResolvedValueOnce({ ...sampleProfile }); // getServerTools profile
      prisma.profileMcpServer.findUnique
        .mockResolvedValueOnce(sampleLink) // link check
        .mockResolvedValueOnce({ ...sampleLink, tools: [] }); // getServerTools link
      proxyService.getToolsForServer.mockResolvedValue([
        { name: 'read_file', description: 'Read', inputSchema: {} },
      ]);

      const result = await service.updateServerTools(
        profileId,
        serverId,
        [{ toolName: 'read_file', isEnabled: true }],
        userId
      );

      // Should return the result of getServerTools
      expect(result).toHaveProperty('tools');
      expect(proxyService.getToolsForServer).toHaveBeenCalledWith(serverId);
    });
  });

  // ---------------------------------------------------------------------------
  // assertAccess (tested indirectly through public methods)
  // ---------------------------------------------------------------------------
  describe('assertAccess', () => {
    it('should allow access when profile belongs to the same user', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findMany.mockResolvedValue([]);

      await service.getServers(profileId, userId, orgId);

      expect(prisma.profileMcpServer.findMany).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when profile belongs to different user and not shared', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: orgId,
      });
      sharingService.isSharedWith.mockResolvedValue(false);

      await expect(service.getServers(profileId, userId, orgId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow access when profile is shared with user', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: orgId,
      });
      sharingService.isSharedWith.mockResolvedValue(true);
      prisma.profileMcpServer.findMany.mockResolvedValue([]);

      await service.getServers(profileId, userId, orgId);

      expect(prisma.profileMcpServer.findMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null);

      await expect(service.getServers(profileId, userId, orgId)).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // assertOwnership (tested indirectly through public methods)
  // ---------------------------------------------------------------------------
  describe('assertOwnership', () => {
    it('should allow mutation when user owns the profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await service.removeServer(profileId, serverId, userId, orgId);

      expect(prisma.profileMcpServer.delete).toHaveBeenCalled();
    });

    it('should allow mutation when user has admin share permission', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: orgId,
      });
      sharingService.getPermission.mockResolvedValue('admin');
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await service.removeServer(profileId, serverId, userId, orgId);

      expect(prisma.profileMcpServer.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user has use-only share permission', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: orgId,
      });
      sharingService.getPermission.mockResolvedValue('use');

      await expect(service.removeServer(profileId, serverId, userId, orgId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw ForbiddenException when profile belongs to different user and not shared', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: orgId,
      });
      sharingService.getPermission.mockResolvedValue(null);

      await expect(service.removeServer(profileId, serverId, userId, orgId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null);

      await expect(service.removeServer(profileId, serverId, userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ---------------------------------------------------------------------------
  // validateProfileName (tested indirectly through create/update)
  // ---------------------------------------------------------------------------
  describe('validateProfileName', () => {
    it('should reject "GATEWAY" (case-insensitive)', async () => {
      await expect(service.create({ name: 'GATEWAY' }, userId, orgId)).rejects.toThrow(
        ConflictException
      );
    });

    it('should allow non-reserved names', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null); // uniqueness
      prisma.profile.create.mockResolvedValue({ id: 'ok' });

      await expect(
        service.create({ name: 'my-custom-profile' }, userId, orgId)
      ).resolves.toBeDefined();
    });
  });
});
