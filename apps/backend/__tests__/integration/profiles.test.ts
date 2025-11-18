/**
 * Integration tests for profile routes
 */

import { existsSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProfileManager } from '@local-mcp/core';
import {
  createDatabase,
  createRawDatabase,
  ProfileRepository,
  runMigrations,
} from '@local-mcp/database';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProfileRoutes } from '../../src/routes/profiles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DB_PATH = join(__dirname, `../../../test-db-${basename(__filename, '.test.ts')}.sqlite`);

describe('Profile API Integration Tests', () => {
  let app: express.Application;
  let db: ReturnType<typeof createDatabase>;
  let rawDb: ReturnType<typeof createRawDatabase>;

  beforeEach(async () => {
    // Set environment variables for tests
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('LOG_LEVEL', 'error');

    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      try {
        rmSync(TEST_DB_PATH, { force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    // Run migrations
    await runMigrations(TEST_DB_PATH);

    // Create database connection
    db = createDatabase(TEST_DB_PATH);
    rawDb = createRawDatabase(TEST_DB_PATH);

    // Setup Express app
    app = express();
    app.use(express.json());

    const profileRepository = new ProfileRepository(db);
    const profileManager = new ProfileManager(profileRepository);
    app.use('/api/profiles', createProfileRoutes(profileManager));
  });

  afterEach(() => {
    try {
      if (rawDb) {
        rawDb.close();
      }
    } catch {
      // Ignore cleanup errors
    }
    try {
      if (existsSync(TEST_DB_PATH)) {
        rmSync(TEST_DB_PATH, { force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
    vi.unstubAllEnvs();
  });

  describe('POST /api/profiles', () => {
    it('should create a profile', async () => {
      const response = await request(app)
        .post('/api/profiles')
        .send({
          name: 'test-profile',
          description: 'A test profile',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('test-profile');
      expect(response.body.description).toBe('A test profile');
    });

    it('should reject invalid profile name', async () => {
      const response = await request(app)
        .post('/api/profiles')
        .send({
          name: 'invalid name!',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate profile name', async () => {
      await request(app).post('/api/profiles').send({ name: 'duplicate' }).expect(201);

      const response = await request(app)
        .post('/api/profiles')
        .send({ name: 'duplicate' })
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/profiles', () => {
    it('should return empty array when no profiles', async () => {
      const response = await request(app).get('/api/profiles').expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all profiles', async () => {
      await request(app).post('/api/profiles').send({ name: 'profile-1' }).expect(201);

      await request(app).post('/api/profiles').send({ name: 'profile-2' }).expect(201);

      const response = await request(app).get('/api/profiles').expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/profiles/:id', () => {
    it('should return profile by ID', async () => {
      const createResponse = await request(app)
        .post('/api/profiles')
        .send({ name: 'find-me' })
        .expect(201);

      const response = await request(app)
        .get(`/api/profiles/${createResponse.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(createResponse.body.id);
      expect(response.body.name).toBe('find-me');
    });

    it('should return 404 for non-existent profile', async () => {
      await request(app).get('/api/profiles/non-existent').expect(404);
    });
  });

  describe('PUT /api/profiles/:id', () => {
    it('should update profile', async () => {
      const createResponse = await request(app)
        .post('/api/profiles')
        .send({ name: 'initial-name' })
        .expect(201);

      const response = await request(app)
        .put(`/api/profiles/${createResponse.body.id}`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/profiles/:id', () => {
    it('should delete profile', async () => {
      const createResponse = await request(app)
        .post('/api/profiles')
        .send({ name: 'to-delete' })
        .expect(201);

      await request(app).delete(`/api/profiles/${createResponse.body.id}`).expect(204);

      await request(app).get(`/api/profiles/${createResponse.body.id}`).expect(404);
    });
  });
});
