/**
 * Unit tests for profile routes
 */

import type { ProfileManager } from '@dxheroes/local-mcp-core';
import type { ProfileMcpServerRepository } from '@dxheroes/local-mcp-database';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProfileRoutes } from '../../../src/routes/profiles.js';

describe('Profile Routes Unit Tests', () => {
  let mockProfileManager: ProfileManager;
  let mockProfileMcpServerRepository: ProfileMcpServerRepository;
  let router: ReturnType<typeof createProfileRoutes>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Mock ProfileManager
    mockProfileManager = {
      listAll: vi.fn(),
      create: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ProfileManager;

    // Mock ProfileMcpServerRepository
    mockProfileMcpServerRepository = {
      addServerToProfile: vi.fn(),
      removeServerFromProfile: vi.fn(),
      getServerIdsForProfile: vi.fn(),
      updateServerOrder: vi.fn(),
    } as unknown as ProfileMcpServerRepository;

    // Create router
    router = createProfileRoutes(mockProfileManager, mockProfileMcpServerRepository);

    // Mock Express request/response
    mockReq = {
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('GET /', () => {
    it('should return all profiles', async () => {
      const profiles = [
        { id: '1', name: 'profile1', description: 'Description 1', createdAt: Date.now() },
        { id: '2', name: 'profile2', description: 'Description 2', createdAt: Date.now() },
      ];

      vi.mocked(mockProfileManager.listAll).mockResolvedValue(profiles as never);

      await router.stack[0].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.listAll).toHaveBeenCalledOnce();
      expect(mockRes.json).toHaveBeenCalledWith(profiles);
    });

    it('should return 500 on error', async () => {
      vi.mocked(mockProfileManager.listAll).mockRejectedValue(new Error('Database error'));

      await router.stack[0].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch profiles' });
    });
  });

  describe('POST /', () => {
    it('should create profile successfully', async () => {
      const profileData = { name: 'test-profile', description: 'Test description' };
      const createdProfile = {
        id: '1',
        ...profileData,
        createdAt: Date.now(),
      };

      mockReq.body = profileData;
      vi.mocked(mockProfileManager.create).mockResolvedValue(createdProfile as never);

      await router.stack[1].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.create).toHaveBeenCalledWith(profileData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdProfile);
    });

    it('should return 400 on validation error', async () => {
      mockReq.body = { name: 'invalid name!' }; // Invalid name (contains space)

      await router.stack[1].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.create).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation error' })
      );
    });

    it('should return 400 on ProfileManager error', async () => {
      mockReq.body = { name: 'test-profile' };
      vi.mocked(mockProfileManager.create).mockRejectedValue(
        new Error('Profile name already exists')
      );

      await router.stack[1].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Profile name already exists',
      });
    });
  });

  describe('GET /:id', () => {
    it('should return profile by ID', async () => {
      const profile = {
        id: '1',
        name: 'test-profile',
        description: 'Test description',
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockProfileManager.getById).mockResolvedValue(profile as never);

      await router.stack[2].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.getById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(profile);
    });

    it('should return 404 when profile not found', async () => {
      mockReq.params = { id: 'non-existent' };
      vi.mocked(mockProfileManager.getById).mockResolvedValue(null);

      await router.stack[2].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Profile not found' });
    });

    it('should return 500 on error', async () => {
      mockReq.params = { id: '1' };
      vi.mocked(mockProfileManager.getById).mockRejectedValue(new Error('Database error'));

      await router.stack[2].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch profile' });
    });
  });

  describe('PUT /:id', () => {
    it('should update profile successfully', async () => {
      const updateData = { name: 'updated-profile', description: 'Updated description' };
      const updatedProfile = {
        id: '1',
        ...updateData,
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      mockReq.body = updateData;
      vi.mocked(mockProfileManager.update).mockResolvedValue(updatedProfile as never);

      await router.stack[3].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.update).toHaveBeenCalledWith('1', updateData);
      expect(mockRes.json).toHaveBeenCalledWith(updatedProfile);
    });

    it('should return 400 on validation error', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'invalid name!' }; // Invalid name

      await router.stack[3].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.update).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation error' })
      );
    });

    it('should return 400 on ProfileManager error', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: 'updated-profile' };
      vi.mocked(mockProfileManager.update).mockRejectedValue(
        new Error('Profile name already exists')
      );

      await router.stack[3].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Profile name already exists',
      });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete profile successfully', async () => {
      mockReq.params = { id: '1' };
      vi.mocked(mockProfileManager.delete).mockResolvedValue(undefined);

      await router.stack[4].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.delete).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 400 on ProfileManager error', async () => {
      mockReq.params = { id: '1' };
      vi.mocked(mockProfileManager.delete).mockRejectedValue(new Error('Profile not found'));

      await router.stack[4].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Profile not found' });
    });
  });

  describe('POST /:id/servers', () => {
    it('should add server to profile successfully', async () => {
      const profile = { id: '1', name: 'test-profile', createdAt: Date.now() };
      const serverData = { mcpServerId: 'server-1', order: 0 };

      mockReq.params = { id: '1' };
      mockReq.body = serverData;
      vi.mocked(mockProfileManager.getById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.addServerToProfile).mockResolvedValue(undefined);

      await router.stack[5].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.getById).toHaveBeenCalledWith('1');
      expect(mockProfileMcpServerRepository.addServerToProfile).toHaveBeenCalledWith({
        profileId: '1',
        mcpServerId: 'server-1',
        order: 0,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should return 404 when profile not found', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = { mcpServerId: 'server-1' };
      vi.mocked(mockProfileManager.getById).mockResolvedValue(null);

      await router.stack[5].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Profile not found' });
    });

    it('should return 400 on validation error', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = {}; // Missing mcpServerId

      await router.stack[5].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation error' })
      );
    });
  });

  describe('GET /:id/servers', () => {
    it('should return server IDs for profile', async () => {
      const profile = { id: '1', name: 'test-profile', createdAt: Date.now() };
      const serverIds = ['server-1', 'server-2'];

      mockReq.params = { id: '1' };
      vi.mocked(mockProfileManager.getById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue(serverIds);

      await router.stack[6].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.getById).toHaveBeenCalledWith('1');
      expect(mockProfileMcpServerRepository.getServerIdsForProfile).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith({ serverIds });
    });

    it('should return 404 when profile not found', async () => {
      mockReq.params = { id: 'non-existent' };
      vi.mocked(mockProfileManager.getById).mockResolvedValue(null);

      await router.stack[6].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Profile not found' });
    });
  });

  describe('DELETE /:id/servers/:serverId', () => {
    it('should remove server from profile successfully', async () => {
      const profile = { id: '1', name: 'test-profile', createdAt: Date.now() };

      mockReq.params = { id: '1', serverId: 'server-1' };
      vi.mocked(mockProfileManager.getById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.removeServerFromProfile).mockResolvedValue(
        undefined
      );

      await router.stack[7].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockProfileManager.getById).toHaveBeenCalledWith('1');
      expect(mockProfileMcpServerRepository.removeServerFromProfile).toHaveBeenCalledWith(
        '1',
        'server-1'
      );
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 404 when profile not found', async () => {
      mockReq.params = { id: 'non-existent', serverId: 'server-1' };
      vi.mocked(mockProfileManager.getById).mockResolvedValue(null);

      await router.stack[7].route.stack[0].handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Profile not found' });
    });
  });
});
