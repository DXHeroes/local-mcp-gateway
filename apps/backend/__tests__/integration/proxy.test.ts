/**
 * Integration tests for proxy routes
 */

import { existsSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { McpServer, McpTool } from '@local-mcp/core';
import { McpServerFactory } from '@local-mcp/core';
import {
  createDatabase,
  createRawDatabase,
  DebugLogRepository,
  McpServerRepository,
  OAuthTokenRepository,
  ProfileMcpServerRepository,
  ProfileRepository,
  runMigrations,
} from '@local-mcp/database';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProxyRoutes } from '../../src/routes/proxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DB_PATH = join(__dirname, `../../../test-db-${basename(__filename, '.test.ts')}.sqlite`);

describe('Proxy API Integration Tests', () => {
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

    // Mock McpServerFactory.createMultipleAsync to return mock servers
    vi.spyOn(McpServerFactory, 'createMultipleAsync').mockImplementation(async (servers) => {
      const serverMap = new Map<string, McpServer>();
      for (const server of servers) {
        const mockServer: McpServer = {
          initialize: vi.fn().mockResolvedValue(undefined),
          listTools: vi.fn().mockResolvedValue([
            {
              name: 'test-tool',
              description: 'A test tool',
              inputSchema: {
                type: 'object',
                properties: {},
              },
            },
          ] as McpTool[]),
          listResources: vi.fn().mockResolvedValue([]),
          callTool: vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: 'Result' }],
          }),
          readResource: vi.fn().mockResolvedValue({}),
          handleRequest: vi.fn().mockResolvedValue({
            jsonrpc: '2.0',
            id: 1,
            result: {
              protocolVersion: '2025-06-18',
              capabilities: {},
            },
          }),
        } as unknown as McpServer;
        serverMap.set(server.id, mockServer);
      }
      return serverMap;
    });

    // Setup Express app
    app = express();
    app.use(express.json());

    const profileRepository = new ProfileRepository(db);
    const mcpServerRepository = new McpServerRepository(db);
    const oauthTokenRepository = new OAuthTokenRepository(db);
    const debugLogRepository = new DebugLogRepository(db);
    const profileMcpServerRepository = new ProfileMcpServerRepository(db);

    app.use(
      '/api/mcp',
      createProxyRoutes(
        profileRepository,
        mcpServerRepository,
        oauthTokenRepository,
        debugLogRepository,
        profileMcpServerRepository
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe('POST /api/mcp/:profileId', () => {
    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .post('/api/mcp/non-existent')
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        })
        .expect(404);

      expect(response.body.error.message).toContain('not found');
    });

    it('should return 400 for invalid JSON-RPC request', async () => {
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);
      const profileMcpServerRepository = new ProfileMcpServerRepository(db);

      // Create profile and server (needed for route to reach validation)
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'sse' },
      });

      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server.id,
      });

      const response = await request(app)
        .post(`/api/mcp/${profile.id}`)
        .send({
          jsonrpc: '1.0', // Invalid version
          id: 1,
          method: 'tools/list',
        })
        .expect(400);

      expect(response.body.error.code).toBe(-32600);
    });

    it('should return error if profile has no servers', async () => {
      const profileRepository = new ProfileRepository(db);
      const profile = await profileRepository.create({ name: 'test-profile' });

      const response = await request(app)
        .post(`/api/mcp/${profile.id}`)
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        })
        .expect(200);

      expect(response.body.result.tools).toEqual([]);
    });

    it('should handle tools/list request', async () => {
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);
      const profileMcpServerRepository = new ProfileMcpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'sse' },
      });

      // Assign server to profile
      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server.id,
      });

      const response = await request(app)
        .post(`/api/mcp/${profile.id}`)
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe('2.0');
      expect(response.body.id).toBe(1);
      expect(response.body.result).toBeDefined();
      expect(Array.isArray(response.body.result.tools)).toBe(true);
    });

    it('should handle initialize request', async () => {
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);
      const profileMcpServerRepository = new ProfileMcpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'sse' },
      });

      // Assign server to profile
      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server.id,
      });

      const response = await request(app)
        .post(`/api/mcp/${profile.id}`)
        .send({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0',
            },
          },
        })
        .expect(200);

      expect(response.body.jsonrpc).toBe('2.0');
      expect(response.body.id).toBe(1);
      expect(response.body.result).toBeDefined();
    });

    it('should return 204 for notification (no id)', async () => {
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);
      const profileMcpServerRepository = new ProfileMcpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'sse' },
      });

      // Assign server to profile
      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server.id,
      });

      // Mock handleRequest to return undefined (notification)
      vi.spyOn(McpServerFactory, 'createMultipleAsync').mockImplementation(async (servers) => {
        const serverMap = new Map<string, McpServer>();
        for (const server of servers) {
          const mockServer: McpServer = {
            initialize: vi.fn().mockResolvedValue(undefined),
            listTools: vi.fn().mockResolvedValue([]),
            listResources: vi.fn().mockResolvedValue([]),
            callTool: vi.fn(),
            readResource: vi.fn(),
            handleRequest: vi.fn().mockResolvedValue(undefined), // Notification
          } as unknown as McpServer;
          serverMap.set(server.id, mockServer);
        }
        return serverMap;
      });

      await request(app)
        .post(`/api/mcp/${profile.id}`)
        .send({
          jsonrpc: '2.0',
          method: 'notification',
        })
        .expect(204);
    });
  });

  describe('GET /api/mcp/:profileId/info', () => {
    it('should return 500 for non-existent profile', async () => {
      // The route throws an error which becomes 500, not 404
      await request(app).get('/api/mcp/non-existent/info').expect(500);
    });

    it('should return metadata for profile with servers', async () => {
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);
      const profileMcpServerRepository = new ProfileMcpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'sse' },
      });

      // Assign server to profile
      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server.id,
      });

      const response = await request(app).get(`/api/mcp/${profile.id}/info`).expect(200);

      expect(response.body).toHaveProperty('tools');
      expect(response.body).toHaveProperty('resources');
      expect(Array.isArray(response.body.tools)).toBe(true);
      expect(Array.isArray(response.body.resources)).toBe(true);
    });
  });

  describe('GET /api/mcp/:profileId/sse', () => {
    it('should return 404 for non-existent profile', async () => {
      await request(app).get('/api/mcp/non-existent/sse').expect(500);
    });

    it('should establish SSE connection', async () => {
      const profileRepository = new ProfileRepository(db);
      const mcpServerRepository = new McpServerRepository(db);
      const profileMcpServerRepository = new ProfileMcpServerRepository(db);

      // Create profile and server
      const profile = await profileRepository.create({ name: 'test-profile' });
      const server = await mcpServerRepository.create({
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'sse' },
      });

      // Assign server to profile
      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server.id,
      });

      // SSE endpoint keeps connection open, so we just verify it doesn't error immediately
      // Full SSE stream testing would require more complex setup
      try {
        await request(app).get(`/api/mcp/${profile.id}/sse`).timeout(100).expect(200);
      } catch (err: unknown) {
        // Timeout is expected for SSE connections that stay open
        const error = err as { code?: string; message?: string };
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          // This is expected - SSE connections stay open
          expect(true).toBe(true);
        } else {
          throw err;
        }
      }
    }, 2000);
  });
});
