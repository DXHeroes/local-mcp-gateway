import { beforeEach, describe, expect, it } from 'vitest';
import { ProfileManager, type ProfileRepository } from '../../src/abstractions/ProfileManager.js';
import type { Profile } from '../../src/types/profile.js';

describe('ProfileManager', () => {
  let repository: ProfileRepository;
  let manager: ProfileManager;
  const profiles = new Map<string, Profile>();

  beforeEach(() => {
    // Clear profiles before each test
    profiles.clear();

    repository = {
      async create(input) {
        const profile: Profile = {
          id: `profile-${Date.now()}-${Math.random()}`,
          name: input.name,
          description: input.description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        profiles.set(profile.id, profile);
        return profile;
      },
      async findById(id) {
        return profiles.get(id) || null;
      },
      async findAll() {
        return Array.from(profiles.values());
      },
      async update(id, input) {
        const profile = profiles.get(id);
        if (!profile) {
          throw new Error('Profile not found');
        }
        const updated: Profile = {
          ...profile,
          ...input,
          updatedAt: Date.now(),
        };
        profiles.set(id, updated);
        return updated;
      },
      async delete(id) {
        profiles.delete(id);
      },
      async findByName(name) {
        return Array.from(profiles.values()).find((p) => p.name === name) || null;
      },
    };

    manager = new ProfileManager(repository);
  });

  describe('create', () => {
    it('should create profile with valid name', async () => {
      const profile = await manager.create({
        name: 'test-profile',
        description: 'Test description',
      });

      expect(profile.name).toBe('test-profile');
      expect(profile.description).toBe('Test description');
      expect(profile.id).toBeDefined();
    });

    it('should reject profile with invalid name', async () => {
      await expect(
        manager.create({
          name: 'invalid name with spaces',
        })
      ).rejects.toThrow();
    });

    it('should reject profile with name that already exists', async () => {
      await manager.create({ name: 'existing-profile' });

      await expect(manager.create({ name: 'existing-profile' })).rejects.toThrow('already exists');
    });

    it('should reject profile with name longer than 50 characters', async () => {
      await expect(
        manager.create({
          name: 'a'.repeat(51),
        })
      ).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should return profile by ID', async () => {
      const created = await manager.create({ name: 'test-profile' });
      const found = await manager.getById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent profile', async () => {
      const found = await manager.getById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('listAll', () => {
    it('should return all profiles', async () => {
      const profile1 = await manager.create({ name: 'profile-1' });
      const profile2 = await manager.create({ name: 'profile-2' });

      const profiles = await manager.listAll();
      expect(profiles.length).toBe(2);
      expect(profiles.some((p) => p.id === profile1.id)).toBe(true);
      expect(profiles.some((p) => p.id === profile2.id)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update profile', async () => {
      const created = await manager.create({ name: 'test-profile' });
      const updated = await manager.update(created.id, { description: 'Updated description' });

      expect(updated.description).toBe('Updated description');
    });

    it('should reject update for non-existent profile', async () => {
      await expect(manager.update('non-existent', { name: 'new-name' })).rejects.toThrow(
        'not found'
      );
    });

    it('should reject update with conflicting name', async () => {
      await manager.create({ name: 'profile-1' });
      const profile2 = await manager.create({ name: 'profile-2' });

      await expect(manager.update(profile2.id, { name: 'profile-1' })).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('delete', () => {
    it('should delete profile', async () => {
      const created = await manager.create({ name: 'test-profile' });
      await manager.delete(created.id);

      const found = await manager.getById(created.id);
      expect(found).toBeNull();
    });

    it('should reject delete for non-existent profile', async () => {
      await expect(manager.delete('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('generateMcpEndpointUrl', () => {
    it('should generate HTTP endpoint URL', () => {
      const url = manager.generateMcpEndpointUrl('test-profile');
      expect(url).toBe('/api/mcp/test-profile');
    });

    it('should generate SSE endpoint URL', () => {
      const url = manager.generateMcpEndpointUrl('test-profile', 'sse');
      expect(url).toBe('/api/mcp/test-profile/sse');
    });
  });
});
