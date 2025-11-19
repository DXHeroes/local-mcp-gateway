/**
 * Unit tests for ProfileMcpServerRepository
 */

import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, createRawDatabase, runMigrations } from '../../src/index.js';
import { McpServerRepository } from '../../src/repositories/McpServerRepository.js';
import { ProfileMcpServerRepository } from '../../src/repositories/ProfileMcpServerRepository.js';
import { ProfileRepository } from '../../src/repositories/ProfileRepository.js';

describe('ProfileMcpServerRepository', () => {
  let db: ReturnType<typeof createDatabase>;
  let rawDb: ReturnType<typeof createRawDatabase>;
  let repository: ProfileMcpServerRepository;
  let profileRepository: ProfileRepository;
  let mcpServerRepository: McpServerRepository;
  let dbPath: string;
  let profileId: string;
  let serverId1: string;
  let serverId2: string;

  beforeEach(async () => {
    dbPath = `/tmp/test-${randomUUID()}.db`;
    await runMigrations(dbPath);
    db = createDatabase(dbPath);
    rawDb = createRawDatabase(dbPath);
    repository = new ProfileMcpServerRepository(db);
    profileRepository = new ProfileRepository(db);
    mcpServerRepository = new McpServerRepository(db);

    // Create test profile
    const profile = await profileRepository.create({
      name: 'test-profile',
      description: 'Test profile',
    });
    profileId = profile.id;

    // Create test servers
    const server1 = await mcpServerRepository.create({
      name: 'test-server-1',
      type: 'remote_http',
      config: {
        url: 'https://example.com/mcp',
        transport: 'http',
      },
    });
    serverId1 = server1.id;

    const server2 = await mcpServerRepository.create({
      name: 'test-server-2',
      type: 'remote_http',
      config: {
        url: 'https://example.com/mcp',
        transport: 'http',
      },
    });
    serverId2 = server2.id;
  });

  afterEach(() => {
    if (rawDb) {
      rawDb.close();
    }
    try {
      if (dbPath) {
        unlinkSync(dbPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('addServerToProfile', () => {
    it('should add server to profile', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds).toContain(serverId1);
      expect(serverIds.length).toBe(1);
    });

    it('should add server with default order 0', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
      });

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds).toContain(serverId1);
    });

    it('should add multiple servers to profile', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId2,
        order: 1,
      });

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds.length).toBe(2);
      expect(serverIds).toContain(serverId1);
      expect(serverIds).toContain(serverId2);
    });

    it('should maintain order of servers', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId2,
        order: 1,
      });

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds[0]).toBe(serverId1);
      expect(serverIds[1]).toBe(serverId2);
    });
  });

  describe('removeServerFromProfile', () => {
    it('should remove server from profile', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.removeServerFromProfile(profileId, serverId1);

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds).not.toContain(serverId1);
      expect(serverIds.length).toBe(0);
    });

    it('should not affect other servers when removing one', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId2,
        order: 1,
      });

      await repository.removeServerFromProfile(profileId, serverId1);

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds).not.toContain(serverId1);
      expect(serverIds).toContain(serverId2);
      expect(serverIds.length).toBe(1);
    });

    it('should not throw error when removing non-existent server', async () => {
      await expect(
        repository.removeServerFromProfile(profileId, 'non-existent-server-id')
      ).resolves.not.toThrow();
    });
  });

  describe('getServerIdsForProfile', () => {
    it('should return server IDs in order', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId2,
        order: 1,
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds[0]).toBe(serverId1); // Order 0 comes first
      expect(serverIds[1]).toBe(serverId2); // Order 1 comes second
    });

    it('should return empty array for profile with no servers', async () => {
      const profile2 = await profileRepository.create({
        name: 'test-profile-2',
        description: 'Test profile 2',
      });

      const serverIds = await repository.getServerIdsForProfile(profile2.id);
      expect(serverIds).toEqual([]);
    });
  });

  describe('updateServerOrder', () => {
    it('should update server order', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId2,
        order: 1,
      });

      // Change order
      await repository.updateServerOrder(profileId, serverId1, 2);

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds[0]).toBe(serverId2); // Order 1 comes first
      expect(serverIds[1]).toBe(serverId1); // Order 2 comes second
    });

    it('should maintain order after update', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId2,
        order: 1,
      });

      // Swap orders
      await repository.updateServerOrder(profileId, serverId1, 1);
      await repository.updateServerOrder(profileId, serverId2, 0);

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds[0]).toBe(serverId2);
      expect(serverIds[1]).toBe(serverId1);
    });
  });

  describe('removeAllServersFromProfile', () => {
    it('should remove all servers from profile', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId2,
        order: 1,
      });

      await repository.removeAllServersFromProfile(profileId);

      const serverIds = await repository.getServerIdsForProfile(profileId);
      expect(serverIds).toEqual([]);
    });

    it('should not affect other profiles', async () => {
      const profile2 = await profileRepository.create({
        name: 'test-profile-2',
        description: 'Test profile 2',
      });

      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      await repository.addServerToProfile({
        profileId: profile2.id,
        mcpServerId: serverId2,
        order: 0,
      });

      await repository.removeAllServersFromProfile(profileId);

      const profile1Servers = await repository.getServerIdsForProfile(profileId);
      const profile2Servers = await repository.getServerIdsForProfile(profile2.id);

      expect(profile1Servers).toEqual([]);
      expect(profile2Servers).toContain(serverId2);
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate server addition', async () => {
      await repository.addServerToProfile({
        profileId,
        mcpServerId: serverId1,
        order: 0,
      });

      // Try to add same server again - should throw error due to unique constraint
      await expect(
        repository.addServerToProfile({
          profileId,
          mcpServerId: serverId1,
          order: 1,
        })
      ).rejects.toThrow();
    });

    it('should handle non-existent profile', async () => {
      const serverIds = await repository.getServerIdsForProfile('non-existent-profile-id');
      expect(serverIds).toEqual([]);
    });

    it('should handle non-existent server', async () => {
      await expect(
        repository.addServerToProfile({
          profileId,
          mcpServerId: 'non-existent-server-id',
          order: 0,
        })
      ).rejects.toThrow(); // Foreign key constraint violation
    });
  });
});
