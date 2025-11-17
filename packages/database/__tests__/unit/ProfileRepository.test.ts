import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, createRawDatabase, runMigrations } from '../../src/index.js';
import { ProfileRepository } from '../../src/repositories/ProfileRepository.js';

describe('ProfileRepository', () => {
  let db: ReturnType<typeof createDatabase>;
  let rawDb: ReturnType<typeof createRawDatabase>;
  let repository: ProfileRepository;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = `/tmp/test-${randomUUID()}.db`;
    await runMigrations(dbPath);
    db = createDatabase(dbPath);
    rawDb = createRawDatabase(dbPath);
    repository = new ProfileRepository(db);
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

  describe('create', () => {
    it('should create a profile', async () => {
      const profile = await repository.create({
        name: 'test-profile',
        description: 'Test description',
      });

      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('test-profile');
      expect(profile.description).toBe('Test description');
      expect(profile.createdAt).toBeDefined();
      expect(profile.updatedAt).toBeDefined();
    });

    it('should create profile without description', async () => {
      const profile = await repository.create({
        name: 'test-profile',
      });

      expect(profile.description).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find profile by ID', async () => {
      const created = await repository.create({
        name: 'find-me',
      });
      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('find-me');
    });

    it('should return null for non-existent profile', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all profiles', async () => {
      await repository.create({ name: 'profile-1' });
      await repository.create({ name: 'profile-2' });

      const profiles = await repository.findAll();
      expect(profiles.length).toBe(2);
      expect(profiles.some((p) => p.name === 'profile-1')).toBe(true);
      expect(profiles.some((p) => p.name === 'profile-2')).toBe(true);
    });

    it('should return empty array when no profiles', async () => {
      const profiles = await repository.findAll();
      expect(profiles.length).toBe(0);
    });
  });

  describe('update', () => {
    it('should update profile', async () => {
      const created = await repository.create({ name: 'test-profile' });
      const updated = await repository.update(created.id, {
        description: 'Updated description',
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.updatedAt).toBeGreaterThanOrEqual(created.updatedAt);

      const fetched = await repository.findById(created.id);
      expect(fetched?.description).toBe('Updated description');
    });

    it('should update profile name', async () => {
      const created = await repository.create({ name: 'old-name' });
      const updated = await repository.update(created.id, {
        name: 'new-name',
      });

      expect(updated.name).toBe('new-name');
    });

    it('should throw error for non-existent profile', async () => {
      await expect(repository.update('non-existent-id', { name: 'new-name' })).rejects.toThrow(
        'not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete profile', async () => {
      const created = await repository.create({ name: 'to-delete' });
      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find profile by name', async () => {
      const created = await repository.create({ name: 'unique-name' });
      const found = await repository.findByName('unique-name');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('unique-name');
    });

    it('should return null for non-existent name', async () => {
      const found = await repository.findByName('non-existent-name');
      expect(found).toBeNull();
    });
  });
});
