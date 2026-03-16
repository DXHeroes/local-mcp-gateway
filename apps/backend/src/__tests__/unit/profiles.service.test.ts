/**
 * Tests for ProfilesService — profile CRUD, server linking, tool customizations
 */

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import { ProfilesService } from '../../modules/profiles/profiles.service.js';
import type { ProxyService } from '../../modules/proxy/proxy.service.js';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let proxyService: Record<string, ReturnType<typeof vi.fn>>;

  const orgId = 'org-1';
  const userId = 'user-1';
  const profileId = 'profile-1';
  const serverId = 'srv-1';
  const UNAUTHENTICATED = '__unauthenticated__';

  const sampleProfile = {
    id: profileId,
    name: 'my-profile',
    description: 'Test profile',
    userId,
    organizationId: orgId,
  };

  const systemProfile = {
    id: 'profile-sys',
    name: 'default',
    description: 'Default profile',
    userId: null,
    organizationId: null,
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
      gatewaySetting: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn().mockImplementation((cb) => cb(prisma)) as any,
    };

    proxyService = {
      getToolsForServer: vi.fn().mockResolvedValue([]),
    };

    service = new ProfilesService(
      prisma as unknown as PrismaService,
      proxyService as unknown as ProxyService
    );
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return org-scoped + system profiles for authenticated user', async () => {
      prisma.profile.findMany.mockResolvedValue([sampleProfile, systemProfile]);

      const result = await service.findAll(userId, orgId);

      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ organizationId: orgId }, { organizationId: null }],
          },
        })
      );
      expect(result).toHaveLength(2);
    });

    it('should return all profiles for anonymous user (no org filter)', async () => {
      prisma.profile.findMany.mockResolvedValue([sampleProfile, systemProfile]);

      const result = await service.findAll(UNAUTHENTICATED);

      expect(prisma.profile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
      // anonymous call should NOT have a where clause with OR
      const call = prisma.profile.findMany.mock.calls[0][0];
      expect(call.where).toBeUndefined();
      expect(result).toHaveLength(2);
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

    it('should work when orgId is undefined for authenticated user', async () => {
      prisma.profile.findMany.mockResolvedValue([]);

      await service.findAll(userId);

      const call = prisma.profile.findMany.mock.calls[0][0];
      expect(call.where).toEqual({
        OR: [{ organizationId: undefined }, { organizationId: null }],
      });
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

    it('should throw ForbiddenException when profile belongs to different org', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: 'other-org',
      });

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

    it('should allow access to system profile (null organizationId)', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId: null, organizationId: null }) // assertAccess
        .mockResolvedValueOnce({ ...systemProfile, mcpServers: [] });

      const result = await service.findById('profile-sys', userId, orgId);
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

    it('should return org-scoped profile first when orgId provided', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(profileWithServers);

      const result = await service.findByName('my-profile', userId, orgId);

      expect(prisma.profile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId_name: { organizationId: orgId, name: 'my-profile' } },
        })
      );
      expect(result).toEqual(profileWithServers);
    });

    it('should fall back to system profile when org profile not found', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null); // org lookup
      prisma.profile.findFirst.mockResolvedValueOnce({
        ...systemProfile,
        mcpServers: [],
      });

      const result = await service.findByName('default', userId, orgId);

      expect(prisma.profile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: 'default', organizationId: null },
        })
      );
      expect(result.name).toBe('default');
    });

    it('should search system profile directly when no orgId', async () => {
      prisma.profile.findFirst.mockResolvedValueOnce({
        ...systemProfile,
        mcpServers: [],
      });

      const result = await service.findByName('default', userId);

      // findUnique should NOT be called (orgId is falsy)
      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
      expect(prisma.profile.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: 'default', organizationId: null },
        })
      );
      expect(result.name).toBe('default');
    });

    it('should throw NotFoundException when profile not found anywhere', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce(null);
      prisma.profile.findFirst.mockResolvedValueOnce(null);

      await expect(service.findByName('nonexistent', userId, orgId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw NotFoundException when no orgId and system profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValueOnce(null);

      await expect(service.findByName('nonexistent', userId)).rejects.toThrow(NotFoundException);
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

    it('should set userId to null for anonymous user', async () => {
      prisma.profile.create.mockResolvedValue({ id: 'new-anon' });

      await service.create({ name: 'anon-profile' }, UNAUTHENTICATED);

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          organizationId: null,
        }),
      });
    });

    it('should skip uniqueness check when orgId is not provided', async () => {
      prisma.profile.create.mockResolvedValue({ id: 'new-no-org' });

      await service.create({ name: 'no-org-profile' }, userId);

      // findUnique should not be called for uniqueness check
      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: null,
        }),
      });
    });

    it('should allow null description', async () => {
      prisma.profile.create.mockResolvedValue({ id: 'new-null-desc' });

      await service.create({ name: 'test', description: null }, userId);

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

    it('should skip uniqueness check when profile has no organizationId', async () => {
      // assertOwnership
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId: null, organizationId: null })
        .mockResolvedValueOnce({ ...systemProfile });

      prisma.profile.update.mockResolvedValue({ ...systemProfile, name: 'renamed' });

      await service.update('profile-sys', { name: 'renamed' }, userId, orgId);

      // no uniqueness check because profile.organizationId is null
      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.profile.update).toHaveBeenCalled();
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

    it('should set gateway setting when deleting "default" profile', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId: null, organizationId: null }) // assertOwnership
        .mockResolvedValueOnce({ ...systemProfile, name: 'default' });

      await service.delete('profile-sys', userId, orgId);

      expect(prisma.gatewaySetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'default_profile_deleted' },
          update: { value: 'true' },
          create: expect.objectContaining({
            key: 'default_profile_deleted',
            value: 'true',
          }),
        })
      );
      expect(prisma.profile.delete).toHaveBeenCalled();
    });

    it('should NOT set gateway setting when deleting non-default profile', async () => {
      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId }) // assertOwnership
        .mockResolvedValueOnce({ ...sampleProfile });

      await service.delete(profileId, userId, orgId);

      expect(prisma.gatewaySetting.upsert).not.toHaveBeenCalled();
      expect(prisma.profile.delete).toHaveBeenCalled();
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

    it('should throw ForbiddenException when accessing other org profile', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: 'other-org',
      });

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

      await service.addServer(profileId, { mcpServerId: serverId }, UNAUTHENTICATED);

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

    it('should throw ForbiddenException when non-owner tries to add server', async () => {
      const otherUserServer = { ...sampleServer, userId: 'user-other' };

      prisma.profile.findUnique
        .mockResolvedValueOnce({ userId, organizationId: orgId })
        .mockResolvedValueOnce({ ...sampleProfile });
      prisma.mcpServer.findUnique.mockResolvedValueOnce(otherUserServer);

      await expect(service.addServer(profileId, dto, userId, orgId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow anonymous user to add any server', async () => {
      const otherUserServer = { ...sampleServer, userId: 'user-other' };

      prisma.profile.findUnique.mockResolvedValueOnce({ ...sampleProfile });
      prisma.mcpServer.findUnique.mockResolvedValueOnce(otherUserServer);
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(null);
      prisma.profileMcpServer.create.mockResolvedValue({});

      // Anonymous user can add any server (no ownership check on the MCP server)
      await expect(service.addServer(profileId, dto, UNAUTHENTICATED)).resolves.toBeDefined();
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
    it('should allow access for anonymous user without DB lookup', async () => {
      // getServers triggers assertAccess
      prisma.profileMcpServer.findMany.mockResolvedValue([]);

      // This would normally call assertAccess with the anonymous sentinel
      // but anonymous skips the check entirely
      await service.getServers(profileId, UNAUTHENTICATED, orgId);

      // profile.findUnique should NOT have been called (anonymous bypass)
      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    });

    it('should allow access when profile has no organization (system profile)', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: null,
        organizationId: null,
      });
      prisma.profileMcpServer.findMany.mockResolvedValue([]);

      await service.getServers(profileId, userId, orgId);

      // Should not throw
      expect(prisma.profileMcpServer.findMany).toHaveBeenCalled();
    });

    it('should allow access when profile belongs to the same org', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findMany.mockResolvedValue([]);

      await service.getServers(profileId, userId, orgId);

      expect(prisma.profileMcpServer.findMany).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when profile belongs to different org', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: 'other-org',
      });

      await expect(service.getServers(profileId, userId, orgId)).rejects.toThrow(
        ForbiddenException
      );
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
    it('should allow mutation for anonymous user without DB lookup', async () => {
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await service.removeServer(profileId, serverId, UNAUTHENTICATED, orgId);

      // profile.findUnique should NOT have been called (anonymous bypass)
      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
      expect(prisma.profileMcpServer.delete).toHaveBeenCalled();
    });

    it('should allow mutation when profile has no organization (system profile)', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: null,
        organizationId: null,
      });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await service.removeServer(profileId, serverId, userId, orgId);

      expect(prisma.profileMcpServer.delete).toHaveBeenCalled();
    });

    it('should allow mutation when profile belongs to the same org', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId,
        organizationId: orgId,
      });
      prisma.profileMcpServer.findUnique.mockResolvedValueOnce(sampleLink);

      await service.removeServer(profileId, serverId, userId, orgId);

      expect(prisma.profileMcpServer.delete).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when profile belongs to different org', async () => {
      prisma.profile.findUnique.mockResolvedValueOnce({
        userId: 'other-user',
        organizationId: 'other-org',
      });

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
