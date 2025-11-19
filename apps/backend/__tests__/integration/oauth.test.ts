/**
 * Integration tests for OAuth routes
 */

import { existsSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OAuthManager } from '@dxheroes/local-mcp-core';
import {
  createDatabase,
  createRawDatabase,
  McpServerRepository,
  runMigrations,
} from '@dxheroes/local-mcp-database';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createOAuthRoutes } from '../../src/routes/oauth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DB_PATH = join(__dirname, `../../../test-db-${basename(__filename, '.test.ts')}.sqlite`);

describe('OAuth API Integration Tests', () => {
  let app: express.Application;
  let db: ReturnType<typeof createDatabase>;
  let rawDb: ReturnType<typeof createRawDatabase>;
  let mockOAuthManager: OAuthManager;

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

    // Mock OAuthManager
    mockOAuthManager = {
      generatePKCE: vi.fn().mockReturnValue({
        codeVerifier: 'test-code-verifier',
        codeChallenge: 'test-code-challenge',
      }),
      generateState: vi.fn().mockReturnValue('test-random-state'),
      buildAuthorizationUrl: vi
        .fn()
        .mockReturnValue(
          'https://oauth.example.com/authorize?client_id=test&redirect_uri=callback&state=test&code_challenge=test'
        ),
      exchangeAuthorizationCode: vi.fn().mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
      }),
      getToken: vi.fn().mockResolvedValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
      }),
      refreshToken: vi.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      }),
    } as unknown as OAuthManager;

    // Setup Express app
    app = express();
    app.use(express.json());

    const mcpServerRepository = new McpServerRepository(db);

    app.use('/api/oauth', createOAuthRoutes(mockOAuthManager, mcpServerRepository));
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

  describe('GET /api/oauth/authorize/:mcpServerId', () => {
    it('should return 404 for non-existent server', async () => {
      await request(app).get('/api/oauth/authorize/non-existent').expect(404);
    });

    it('should return 400 for server without OAuth config', async () => {
      const mcpServerRepository = new McpServerRepository(db);
      const server = await mcpServerRepository.create({
        name: 'no-oauth-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      });

      const response = await request(app).get(`/api/oauth/authorize/${server.id}`).expect(400);

      expect(response.body.error).toContain('OAuth configuration');
    });

    it('should return 400 for server without clientId', async () => {
      const mcpServerRepository = new McpServerRepository(db);
      const server = await mcpServerRepository.create({
        name: 'no-client-id-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com',
          scopes: ['read'],
          requiresOAuth: true,
          // clientId is missing
        },
      });

      const response = await request(app).get(`/api/oauth/authorize/${server.id}`).expect(400);

      expect(response.body.error).toContain('client ID');
    });

    it('should redirect to authorization URL', async () => {
      const mcpServerRepository = new McpServerRepository(db);
      const server = await mcpServerRepository.create({
        name: 'oauth-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com',
          scopes: ['read'],
          requiresOAuth: true,
          clientId: 'test-client-id',
        },
      });

      const response = await request(app).get(`/api/oauth/authorize/${server.id}`).expect(302);

      expect(response.headers.location).toContain('oauth.example.com');
      expect(mockOAuthManager.generatePKCE).toHaveBeenCalled();
      expect(mockOAuthManager.buildAuthorizationUrl).toHaveBeenCalled();
    });
  });

  describe('GET /api/oauth/callback', () => {
    it('should return 400 if code is missing', async () => {
      const response = await request(app).get('/api/oauth/callback').expect(400);

      expect(response.body.error).toContain('Missing required OAuth parameters');
    });

    it('should return 400 if state is missing', async () => {
      const response = await request(app).get('/api/oauth/callback?code=test-code').expect(400);

      expect(response.body.error).toContain('Missing required OAuth parameters');
    });

    it('should return 400 for invalid state parameter', async () => {
      const response = await request(app)
        .get('/api/oauth/callback?code=test-code&state=invalid-state')
        .expect(400);

      expect(response.body.error).toContain('Invalid state parameter');
    });

    it('should return 404 if server not found', async () => {
      const stateData = {
        mcpServerId: 'non-existent',
        codeVerifier: 'test-verifier',
        randomState: 'test-state',
      };
      const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

      const response = await request(app)
        .get(`/api/oauth/callback?code=test-code&state=${state}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should handle OAuth error parameter', async () => {
      const response = await request(app)
        .get('/api/oauth/callback?error=access_denied')
        .expect(400);

      expect(response.body.error).toContain('OAuth authorization failed');
    });
  });

  describe('POST /api/oauth/refresh/:mcpServerId', () => {
    it('should return 404 for non-existent server', async () => {
      await request(app).post('/api/oauth/refresh/non-existent').expect(404);
    });

    it('should return 404 for server without OAuth config', async () => {
      const mcpServerRepository = new McpServerRepository(db);
      const server = await mcpServerRepository.create({
        name: 'no-oauth-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
      });

      await request(app).post(`/api/oauth/refresh/${server.id}`).expect(404);
    });

    it('should return 400 if no refresh token exists', async () => {
      const mcpServerRepository = new McpServerRepository(db);
      const server = await mcpServerRepository.create({
        name: 'no-token-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com',
          scopes: ['read'],
          requiresOAuth: true,
          clientId: 'test-client-id',
        },
      });

      // Mock getToken to return null for this test
      vi.mocked(mockOAuthManager.getToken).mockResolvedValueOnce(null);

      const response = await request(app).post(`/api/oauth/refresh/${server.id}`).expect(400);

      expect(response.body.error).toContain('No refresh token');
    });

    it('should return 400 if clientId is missing', async () => {
      const mcpServerRepository = new McpServerRepository(db);
      const server = await mcpServerRepository.create({
        name: 'no-client-id-server',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp' },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com',
          scopes: ['read'],
          requiresOAuth: true,
          // clientId is missing
        },
      });

      const response = await request(app).post(`/api/oauth/refresh/${server.id}`).expect(400);

      expect(response.body.error).toContain('Client ID');
    });
  });
});
