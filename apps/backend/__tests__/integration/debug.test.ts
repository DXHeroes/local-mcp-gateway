/**
 * Integration tests for debug routes
 */

import { existsSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDatabase,
  createRawDatabase,
  DebugLogRepository,
  McpServerRepository,
  ProfileRepository,
  runMigrations,
} from '@dxheroes/local-mcp-database';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebugRoutes } from '../../src/routes/debug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DB_PATH = join(__dirname, `../../../test-db-${basename(__filename, '.test.ts')}.sqlite`);

describe('Debug API Integration Tests', () => {
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

    const debugLogRepository = new DebugLogRepository(db);

    app.use('/api/debug', createDebugRoutes(debugLogRepository));
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

  describe('GET /api/debug/logs', () => {
    it('should return empty array when no logs', async () => {
      const response = await request(app).get('/api/debug/logs').expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all logs', async () => {
      const debugLogRepository = new DebugLogRepository(db);
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({
        name: 'test-profile',
      });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      });

      // Create debug logs
      await debugLogRepository.create({
        profileId: profile.id,
        mcpServerId: server.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({ method: 'tools/list' }),
        status: 'success',
      });

      await debugLogRepository.create({
        profileId: profile.id,
        mcpServerId: server.id,
        requestType: 'tools/call',
        requestPayload: JSON.stringify({ method: 'tools/call', params: { name: 'test' } }),
        status: 'error',
        errorMessage: 'Tool not found',
      });

      const response = await request(app).get('/api/debug/logs').expect(200);

      expect(response.body).toHaveLength(2);
      const requestTypes = response.body.map((log: { requestType: string }) => log.requestType);
      expect(requestTypes).toContain('tools/list');
      expect(requestTypes).toContain('tools/call');
    });

    it('should filter logs by profileId', async () => {
      const debugLogRepository = new DebugLogRepository(db);
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);

      // Create profiles and server
      const profile1 = await profileRepository.create({ name: 'profile-1' });
      const profile2 = await profileRepository.create({ name: 'profile-2' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      });

      // Create debug logs for both profiles
      await debugLogRepository.create({
        profileId: profile1.id,
        mcpServerId: server.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'success',
      });

      await debugLogRepository.create({
        profileId: profile2.id,
        mcpServerId: server.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'success',
      });

      const response = await request(app)
        .get(`/api/debug/logs?profileId=${profile1.id}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].profileId).toBe(profile1.id);
    });

    it('should filter logs by mcpServerId', async () => {
      const debugLogRepository = new DebugLogRepository(db);
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);

      // Create profile and servers
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server1 = await mcpServerRepository.create({
        name: 'server-1',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      });
      const server2 = await mcpServerRepository.create({
        name: 'server-2',
        type: 'remote_sse',
        config: { url: 'https://example.com/sse' },
      });

      // Create debug logs for both servers
      await debugLogRepository.create({
        profileId: profile.id,
        mcpServerId: server1.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'success',
      });

      await debugLogRepository.create({
        profileId: profile.id,
        mcpServerId: server2.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'success',
      });

      const response = await request(app)
        .get(`/api/debug/logs?mcpServerId=${server1.id}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].mcpServerId).toBe(server1.id);
    });

    it('should filter logs by status', async () => {
      const debugLogRepository = new DebugLogRepository(db);
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      });

      // Create debug logs with different statuses
      await debugLogRepository.create({
        profileId: profile.id,
        mcpServerId: server.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'success',
      });

      await debugLogRepository.create({
        profileId: profile.id,
        mcpServerId: server.id,
        requestType: 'tools/call',
        requestPayload: JSON.stringify({}),
        status: 'error',
        errorMessage: 'Error',
      });

      const response = await request(app).get('/api/debug/logs?status=error').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('error');
    });
  });

  describe('GET /api/debug/logs/:id', () => {
    it('should return log by ID', async () => {
      const debugLogRepository = new DebugLogRepository(db);
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      });

      // Create debug log
      const log = await debugLogRepository.create({
        profileId: profile.id,
        mcpServerId: server.id,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({ method: 'tools/list' }),
        status: 'success',
      });

      const response = await request(app).get(`/api/debug/logs/${log.id}`).expect(200);

      expect(response.body.id).toBe(log.id);
      expect(response.body.requestType).toBe('tools/list');
      expect(response.body.status).toBe('success');
    });

    it('should return 404 for non-existent log', async () => {
      await request(app).get('/api/debug/logs/non-existent').expect(404);
    });
  });
});
