/**
 * Unit tests for McpServerRepository
 */

import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createDatabase, createRawDatabase, runMigrations } from '../../src/index.js';
import { McpServerRepository } from '../../src/repositories/McpServerRepository.js';
import type { OAuthConfig, ApiKeyConfig } from '@local-mcp/core';
import { ProfileRepository } from '../../src/repositories/ProfileRepository.js';
import { ProfileMcpServerRepository } from '../../src/repositories/ProfileMcpServerRepository.js';

describe('McpServerRepository', () => {
  let db: ReturnType<typeof createDatabase>;
  let rawDb: ReturnType<typeof createRawDatabase>;
  let repository: McpServerRepository;
  let profileRepository: ProfileRepository;
  let profileMcpServerRepository: ProfileMcpServerRepository;
  let dbPath: string;

  beforeEach(async () => {
    dbPath = `/tmp/test-${randomUUID()}.db`;
    await runMigrations(dbPath);
    db = createDatabase(dbPath);
    rawDb = createRawDatabase(dbPath);
    repository = new McpServerRepository(db);
    profileRepository = new ProfileRepository(db);
    profileMcpServerRepository = new ProfileMcpServerRepository(db);
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
    it('should create remote_http server without auth', async () => {
      const server = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      expect(server.id).toBeDefined();
      expect(server.name).toBe('test-server');
      expect(server.type).toBe('remote_http');
      expect(server.config.url).toBe('https://example.com/mcp');
      // oauthConfig and apiKeyConfig can be null or undefined when not set
      expect(server.oauthConfig ?? undefined).toBeUndefined();
      expect(server.apiKeyConfig ?? undefined).toBeUndefined();
    });

    it('should create remote_sse server', async () => {
      const server = await repository.create({
        name: 'test-sse-server',
        type: 'remote_sse',
        config: {
          url: 'https://example.com/mcp/sse',
          transport: 'sse',
        },
      });

      expect(server.id).toBeDefined();
      expect(server.name).toBe('test-sse-server');
      expect(server.type).toBe('remote_sse');
      expect(server.config.url).toBe('https://example.com/mcp/sse');
    });

    it('should create server with OAuth config', async () => {
      const oauthConfig: OAuthConfig = {
        authorizationServerUrl: 'https://oauth.example.com/authorize',
        tokenEndpoint: 'https://oauth.example.com/token',
        resource: 'https://api.example.com',
        scopes: ['read', 'write'],
        requiresOAuth: true,
        callbackUrl: 'http://localhost:3001/api/oauth/callback',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      };

      const server = await repository.create({
        name: 'test-oauth-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        oauthConfig,
      });

      expect(server.oauthConfig).toBeDefined();
      expect(server.oauthConfig?.authorizationServerUrl).toBe(oauthConfig.authorizationServerUrl);
      expect(server.oauthConfig?.clientId).toBe(oauthConfig.clientId);
      expect(server.oauthConfig?.clientSecret).toBe(oauthConfig.clientSecret);
    });

    it('should create server with API key config', async () => {
      const apiKeyConfig: ApiKeyConfig = {
        apiKey: 'test-api-key-12345',
        headerName: 'X-API-Key',
        headerValue: 'Bearer test-api-key-12345',
      };

      const server = await repository.create({
        name: 'test-api-key-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        apiKeyConfig,
      });

      expect(server.apiKeyConfig).toBeDefined();
      expect(server.apiKeyConfig?.apiKey).toBe(apiKeyConfig.apiKey);
      expect(server.apiKeyConfig?.headerName).toBe(apiKeyConfig.headerName);
    });

    it('should not store undefined values in oauthConfig', async () => {
      const server = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          clientId: undefined,
          clientSecret: undefined,
        },
      });

      // clientId and clientSecret should not be stored if undefined
      expect(server.oauthConfig).toBeDefined();
      expect(server.oauthConfig?.clientId).toBeUndefined();
      expect(server.oauthConfig?.clientSecret).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find server by ID', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      const found = await repository.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('test-server');
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all servers', async () => {
      await repository.create({
        name: 'server-1',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'http' },
      });
      await repository.create({
        name: 'server-2',
        type: 'remote_sse',
        config: { url: 'https://example.com/mcp/sse', transport: 'sse' },
      });

      const all = await repository.findAll();
      expect(all.length).toBe(2);
      expect(all.map((s) => s.name)).toContain('server-1');
      expect(all.map((s) => s.name)).toContain('server-2');
    });

    it('should return empty array when no servers exist', async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update server name', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      const updated = await repository.update(created.id, {
        name: 'updated-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      expect(updated.name).toBe('updated-server');
      expect(updated.id).toBe(created.id);
    });

    it('should update server URL', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      const updated = await repository.update(created.id, {
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://new-url.com/mcp',
          transport: 'http',
        },
      });

      expect(updated.config.url).toBe('https://new-url.com/mcp');
    });

    it('should update server type', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      const updated = await repository.update(created.id, {
        name: 'test-server',
        type: 'remote_sse',
        config: {
          url: 'https://example.com/mcp/sse',
          transport: 'sse',
        },
      });

      expect(updated.type).toBe('remote_sse');
    });

    it('should update OAuth config', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      const oauthConfig: OAuthConfig = {
        authorizationServerUrl: 'https://oauth.example.com/authorize',
        scopes: ['read'],
        requiresOAuth: true,
        clientId: 'new-client-id',
        clientSecret: 'new-client-secret',
      };

      const updated = await repository.update(created.id, {
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        oauthConfig,
      });

      expect(updated.oauthConfig).toBeDefined();
      expect(updated.oauthConfig?.clientId).toBe('new-client-id');
      expect(updated.oauthConfig?.clientSecret).toBe('new-client-secret');
    });

    it('should update OAuth config replacing entire config', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read'],
          requiresOAuth: true,
          clientId: 'existing-client-id',
          clientSecret: 'existing-client-secret',
        },
      });

      // Update with new OAuth config (repository doesn't merge, it replaces)
      const updated = await repository.update(created.id, {
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        oauthConfig: {
          authorizationServerUrl: 'https://oauth.example.com/authorize',
          scopes: ['read', 'write'], // Changed scopes
          requiresOAuth: true,
          clientId: 'new-client-id', // Must provide clientId if updating
          clientSecret: 'new-client-secret',
        },
      });

      // OAuth config is replaced, not merged
      expect(updated.oauthConfig?.clientId).toBe('new-client-id');
      expect(updated.oauthConfig?.clientSecret).toBe('new-client-secret');
      expect(updated.oauthConfig?.scopes).toEqual(['read', 'write']);
    });

    it('should update API key config', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      const apiKeyConfig: ApiKeyConfig = {
        apiKey: 'new-api-key',
        headerName: 'X-API-Key',
        headerValue: 'Bearer new-api-key',
      };

      const updated = await repository.update(created.id, {
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        apiKeyConfig,
      });

      expect(updated.apiKeyConfig).toBeDefined();
      expect(updated.apiKeyConfig?.apiKey).toBe('new-api-key');
    });

    it('should throw error for non-existent ID', async () => {
      await expect(
        repository.update('non-existent-id', {
          name: 'test',
          type: 'remote_http',
          config: { url: 'https://example.com/mcp', transport: 'http' },
        })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete server', async () => {
      const created = await repository.create({
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should not throw error when deleting non-existent ID', async () => {
      // Delete doesn't throw error for non-existent ID - it just does nothing
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('findByProfileId', () => {
    it('should find servers for profile', async () => {
      // Create profile
      const profile = await profileRepository.create({
        name: 'test-profile',
        description: 'Test profile',
      });

      // Create servers
      const server1 = await repository.create({
        name: 'server-1',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'http' },
      });
      const server2 = await repository.create({
        name: 'server-2',
        type: 'remote_http',
        config: { url: 'https://example.com/mcp', transport: 'http' },
      });

      // Add servers to profile
      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server1.id,
        order: 0,
      });
      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: server2.id,
        order: 1,
      });

      // Find servers for profile
      const profileServers = await repository.findByProfileId(profile.id);
      expect(profileServers.length).toBe(2);
      expect(profileServers.map((s) => s.id)).toContain(server1.id);
      expect(profileServers.map((s) => s.id)).toContain(server2.id);
      // Verify order
      expect(profileServers[0].id).toBe(server1.id);
      expect(profileServers[1].id).toBe(server2.id);
    });

    it('should return empty array for profile with no servers', async () => {
      const profile = await profileRepository.create({
        name: 'test-profile',
        description: 'Test profile',
      });

      const profileServers = await repository.findByProfileId(profile.id);
      expect(profileServers).toEqual([]);
    });
  });
});

