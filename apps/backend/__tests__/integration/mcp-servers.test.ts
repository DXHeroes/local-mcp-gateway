/**
 * Integration tests for MCP server routes
 */

import { existsSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServerFactory, OAuthDiscoveryService } from '@local-mcp/core';
import {
  createDatabase,
  createRawDatabase,
  DebugLogRepository,
  McpServerRepository,
  OAuthTokenRepository,
  ProfileRepository,
  runMigrations,
} from '@local-mcp/database';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMcpServerRoutes } from '../../src/routes/mcp-servers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DB_PATH = join(__dirname, `../../../test-db-${basename(__filename, '.test.ts')}.sqlite`);

// Mock OAuthDiscoveryService
vi.mock('@local-mcp/core', async () => {
  const actual = await vi.importActual('@local-mcp/core');
  return {
    ...actual,
    OAuthDiscoveryService: class {
      discoverFromResourceMetadata = vi.fn().mockResolvedValue(null);
      discoverFromServerUrl = vi.fn().mockResolvedValue(null);
      registerClient = vi.fn().mockResolvedValue({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });
    },
  };
});

describe('MCP Server API Integration Tests', () => {
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

    const mcpServerRepository = new McpServerRepository(db);
    const oauthTokenRepository = new OAuthTokenRepository(db);
    const debugLogRepository = new DebugLogRepository(db);
    const profileRepository = new ProfileRepository(db);

    app.use(
      '/api/mcp-servers',
      createMcpServerRoutes(
        mcpServerRepository,
        oauthTokenRepository,
        debugLogRepository,
        profileRepository
      )
    );
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

  describe('POST /api/mcp-servers', () => {
    it('should create a remote_http server', async () => {
      const response = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'test-server',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('test-server');
      expect(response.body.type).toBe('remote_http');
      expect(response.body.config).toHaveProperty('url', 'https://example.com/mcp');
    });

    it('should create a remote_sse server', async () => {
      const response = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'sse-server',
          type: 'remote_sse',
          config: {
            url: 'https://example.com/sse',
          },
        })
        .expect(201);

      expect(response.body.type).toBe('remote_sse');
    });

    it('should create a server with API key config', async () => {
      const response = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'api-key-server',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
          apiKeyConfig: {
            apiKey: 'test-api-key',
            headerName: 'X-API-Key',
            headerValue: 'Bearer test-api-key',
          },
        })
        .expect(201);

      expect(response.body.apiKeyConfig).toHaveProperty('apiKey', 'test-api-key');
      expect(response.body.apiKeyConfig).toHaveProperty('headerName', 'X-API-Key');
    });

    it('should reject invalid server name', async () => {
      const response = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: '',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid server type', async () => {
      const response = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'test-server',
          type: 'invalid-type',
          config: {
            url: 'https://example.com/mcp',
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/mcp-servers', () => {
    it('should return empty array when no servers', async () => {
      const response = await request(app).get('/api/mcp-servers').expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all servers', async () => {
      await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'server-1',
          type: 'remote_http',
          config: { url: 'https://example.com/mcp' },
        })
        .expect(201);

      await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'server-2',
          type: 'remote_sse',
          config: { url: 'https://example.com/sse' },
        })
        .expect(201);

      const response = await request(app).get('/api/mcp-servers').expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/mcp-servers/:id', () => {
    it('should return server by ID', async () => {
      const createResponse = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'find-me',
          type: 'remote_http',
          config: { url: 'https://example.com/mcp' },
        })
        .expect(201);

      const response = await request(app)
        .get(`/api/mcp-servers/${createResponse.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(createResponse.body.id);
      expect(response.body.name).toBe('find-me');
    });

    it('should return 404 for non-existent server', async () => {
      await request(app).get('/api/mcp-servers/non-existent').expect(404);
    });
  });

  describe('PUT /api/mcp-servers/:id', () => {
    it('should update server name', async () => {
      const createResponse = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'initial-name',
          type: 'remote_http',
          config: { url: 'https://example.com/mcp' },
        })
        .expect(201);

      const response = await request(app)
        .put(`/api/mcp-servers/${createResponse.body.id}`)
        .send({
          name: 'updated-name',
        })
        .expect(200);

      expect(response.body.name).toBe('updated-name');
    });

    it('should update server type', async () => {
      const createResponse = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'type-change-server',
          type: 'remote_http',
          config: { url: 'https://example.com/mcp' },
        })
        .expect(201);

      const response = await request(app)
        .put(`/api/mcp-servers/${createResponse.body.id}`)
        .send({
          type: 'remote_sse',
        })
        .expect(200);

      expect(response.body.type).toBe('remote_sse');
    });

    it('should update API key config', async () => {
      const createResponse = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'api-key-server',
          type: 'remote_http',
          config: { url: 'https://example.com/mcp' },
        })
        .expect(201);

      const response = await request(app)
        .put(`/api/mcp-servers/${createResponse.body.id}`)
        .send({
          apiKeyConfig: {
            apiKey: 'new-api-key',
            headerName: 'X-API-Key',
            headerValue: 'Bearer new-api-key',
          },
        })
        .expect(200);

      expect(response.body.apiKeyConfig).toHaveProperty('apiKey', 'new-api-key');
    });
  });

  describe('DELETE /api/mcp-servers/:id', () => {
    it('should delete server', async () => {
      const createResponse = await request(app)
        .post('/api/mcp-servers')
        .send({
          name: 'to-delete',
          type: 'remote_http',
          config: { url: 'https://example.com/mcp' },
        })
        .expect(201);

      await request(app)
        .delete(`/api/mcp-servers/${createResponse.body.id}`)
        .expect(204);

      await request(app)
        .get(`/api/mcp-servers/${createResponse.body.id}`)
        .expect(404);
    });
  });
});

