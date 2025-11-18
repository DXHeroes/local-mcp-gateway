/**
 * Unit tests for OAuthTokenRepository
 */

import { randomUUID } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { createDatabase, createRawDatabase, runMigrations } from '../../src/index.js';
import { OAuthTokenRepository } from '../../src/repositories/OAuthTokenRepository.js';
import { McpServerRepository } from '../../src/repositories/McpServerRepository.js';
import type { OAuthToken } from '@local-mcp/core';

describe('OAuthTokenRepository', () => {
  let db: ReturnType<typeof createDatabase>;
  let rawDb: ReturnType<typeof createRawDatabase>;
  let repository: OAuthTokenRepository;
  let mcpServerRepository: McpServerRepository;
  let dbPath: string;
  let serverId: string;

  beforeEach(async () => {
    dbPath = `/tmp/test-${randomUUID()}.db`;
    await runMigrations(dbPath);
    db = createDatabase(dbPath);
    rawDb = createRawDatabase(dbPath);
    repository = new OAuthTokenRepository(db);
    mcpServerRepository = new McpServerRepository(db);

    // Create a test MCP server
    const server = await mcpServerRepository.create({
      name: 'test-oauth-server',
      type: 'remote_http',
      config: {
        url: 'https://example.com/mcp',
        transport: 'http',
      },
    });
    serverId = server.id;
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

  describe('store', () => {
    it('should store OAuth token', async () => {
      const token: OAuthToken = {
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000, // 1 hour from now
        refreshToken: 'test-refresh-token',
        scope: 'read write',
      };

      await repository.store(serverId, token);

      const stored = await repository.get(serverId);
      expect(stored).toBeDefined();
      expect(stored?.accessToken).toBe(token.accessToken);
      expect(stored?.tokenType).toBe(token.tokenType);
      expect(stored?.refreshToken).toBe(token.refreshToken);
      expect(stored?.scope).toBe(token.scope);
    });

    it('should update existing token', async () => {
      const token1: OAuthToken = {
        accessToken: 'old-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        refreshToken: 'old-refresh',
        scope: 'read',
      };

      await repository.store(serverId, token1);

      const token2: OAuthToken = {
        accessToken: 'new-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 7200000,
        refreshToken: 'new-refresh',
        scope: 'read write',
      };

      await repository.store(serverId, token2);

      const stored = await repository.get(serverId);
      expect(stored?.accessToken).toBe('new-token');
      expect(stored?.refreshToken).toBe('new-refresh');
      expect(stored?.scope).toBe('read write');
    });

    it('should store token without refresh token', async () => {
      const token: OAuthToken = {
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        scope: 'read',
      };

      await repository.store(serverId, token);

      const stored = await repository.get(serverId);
      expect(stored).toBeDefined();
      expect(stored?.refreshToken).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should get stored token', async () => {
      const token: OAuthToken = {
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        refreshToken: 'test-refresh',
        scopes: ['read'],
      };

      await repository.store(serverId, token);

      const retrieved = await repository.get(serverId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.accessToken).toBe(token.accessToken);
    });

    it('should return null for non-existent server', async () => {
      const retrieved = await repository.get('non-existent-server-id');
      expect(retrieved).toBeNull();
    });

    it('should return null for server without token', async () => {
      // Create another server without token
      const server2 = await mcpServerRepository.create({
        name: 'test-server-2',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
      });

      const retrieved = await repository.get(server2.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete stored token', async () => {
      const token: OAuthToken = {
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        scope: 'read',
      };

      await repository.store(serverId, token);
      await repository.delete(serverId);

      const retrieved = await repository.get(serverId);
      expect(retrieved).toBeNull();
    });

    it('should not throw error when deleting non-existent token', async () => {
      await expect(repository.delete('non-existent-server-id')).resolves.not.toThrow();
    });
  });

  // Note: getAll() method doesn't exist in OAuthTokenRepository
  // This test is removed as it's not part of the actual implementation

  describe('edge cases', () => {
    it('should handle expired token', async () => {
      const expiredToken: OAuthToken = {
        accessToken: 'expired-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        scope: 'read',
      };

      await repository.store(serverId, expiredToken);

      const stored = await repository.get(serverId);
      expect(stored).toBeDefined();
      expect(stored?.accessToken).toBe('expired-token');
      // Repository doesn't check expiration - that's handled by OAuthManager
    });

    it('should handle token with very long access token', async () => {
      const longToken: OAuthToken = {
        accessToken: 'a'.repeat(10000), // Very long token
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        scope: 'read',
      };

      await repository.store(serverId, longToken);

      const stored = await repository.get(serverId);
      expect(stored?.accessToken).toBe(longToken.accessToken);
    });
  });
});

