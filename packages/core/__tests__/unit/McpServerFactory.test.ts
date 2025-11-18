/**
 * Unit tests for McpServerFactory
 */

import { describe, expect, it } from 'vitest';
import { McpServerFactory } from '../../src/abstractions/McpServerFactory.js';
import { RemoteHttpMcpServer } from '../../src/abstractions/RemoteHttpMcpServer.js';
import { RemoteSseMcpServer } from '../../src/abstractions/RemoteSseMcpServer.js';
import type { ApiKeyConfig, OAuthToken } from '../../src/types/database.js';
import type { McpServerEntity } from '../../src/types/profile.js';

describe('McpServerFactory', () => {
  describe('create', () => {
    it('should create remote_http server', () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const server = McpServerFactory.create(entity);
      expect(server).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should create remote_sse server', () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'remote_sse',
        config: {
          url: 'https://example.com/mcp/sse',
          transport: 'sse',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const server = McpServerFactory.create(entity);
      expect(server).toBeInstanceOf(RemoteSseMcpServer);
    });

    it('should create remote_http server with OAuth token', () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const oauthToken: OAuthToken = {
        id: 'token-id',
        mcpServerId: 'test-id',
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const server = McpServerFactory.create(entity, oauthToken);
      expect(server).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should create remote_http server with API key config', () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const apiKeyConfig: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'X-API-Key',
        headerValue: 'Bearer test-api-key',
      };

      const server = McpServerFactory.create(entity, null, apiKeyConfig);
      expect(server).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should throw error for custom server type (requires async)', () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'custom',
        config: {
          modulePath: '/path/to/module',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(() => McpServerFactory.create(entity)).toThrow(
        'Custom MCP server loading requires async initialization'
      );
    });

    it('should throw error for external server type', () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'external',
        config: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(() => McpServerFactory.create(entity)).toThrow(
        'External MCP server loading not yet implemented'
      );
    });

    it('should throw error for unknown server type', () => {
      const entity = {
        id: 'test-id',
        name: 'test-server',
        type: 'unknown' as any,
        config: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(() => McpServerFactory.create(entity)).toThrow('Unknown MCP server type: unknown');
    });
  });

  describe('createMultiple', () => {
    it('should create multiple servers', () => {
      const entities: McpServerEntity[] = [
        {
          id: 'server-1',
          name: 'server-1',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'server-2',
          name: 'server-2',
          type: 'remote_sse',
          config: {
            url: 'https://example.com/mcp/sse',
            transport: 'sse',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const servers = McpServerFactory.createMultiple(entities);
      expect(servers.size).toBe(2);
      expect(servers.get('server-1')).toBeInstanceOf(RemoteHttpMcpServer);
      expect(servers.get('server-2')).toBeInstanceOf(RemoteSseMcpServer);
    });

    it('should create multiple servers with OAuth tokens', () => {
      const entities: McpServerEntity[] = [
        {
          id: 'server-1',
          name: 'server-1',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const oauthTokens = new Map<string, OAuthToken>();
      oauthTokens.set('server-1', {
        id: 'token-id',
        mcpServerId: 'server-1',
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const servers = McpServerFactory.createMultiple(entities, oauthTokens);
      expect(servers.size).toBe(1);
      expect(servers.get('server-1')).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should create multiple servers with API key configs', () => {
      const entities: McpServerEntity[] = [
        {
          id: 'server-1',
          name: 'server-1',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const apiKeyConfigs = new Map<string, ApiKeyConfig>();
      apiKeyConfigs.set('server-1', {
        apiKey: 'test-api-key',
        headerName: 'X-API-Key',
        headerValue: 'Bearer test-api-key',
      });

      const servers = McpServerFactory.createMultiple(entities, new Map(), apiKeyConfigs);
      expect(servers.size).toBe(1);
      expect(servers.get('server-1')).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should skip servers that fail to create', () => {
      const entities: McpServerEntity[] = [
        {
          id: 'server-1',
          name: 'server-1',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'server-2',
          name: 'server-2',
          type: 'custom',
          config: {
            modulePath: '/path/to/module',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const servers = McpServerFactory.createMultiple(entities);
      expect(servers.size).toBe(1);
      expect(servers.get('server-1')).toBeInstanceOf(RemoteHttpMcpServer);
      expect(servers.get('server-2')).toBeUndefined();
    });
  });

  describe('createAsync', () => {
    it('should create remote_http server asynchronously', async () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'remote_http',
        config: {
          url: 'https://example.com/mcp',
          transport: 'http',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const server = await McpServerFactory.createAsync(entity);
      expect(server).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should create remote_sse server asynchronously', async () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'remote_sse',
        config: {
          url: 'https://example.com/mcp/sse',
          transport: 'sse',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const server = await McpServerFactory.createAsync(entity);
      expect(server).toBeInstanceOf(RemoteSseMcpServer);
    });

    it('should throw error for custom server without modulePath', async () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'custom',
        config: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await expect(McpServerFactory.createAsync(entity)).rejects.toThrow(
        'Custom MCP server config must contain modulePath'
      );
    });

    it('should throw error for external server type', async () => {
      const entity: McpServerEntity = {
        id: 'test-id',
        name: 'test-server',
        type: 'external',
        config: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await expect(McpServerFactory.createAsync(entity)).rejects.toThrow(
        'External MCP server loading not yet implemented'
      );
    });
  });

  describe('createMultipleAsync', () => {
    it('should create multiple servers asynchronously', async () => {
      const entities: McpServerEntity[] = [
        {
          id: 'server-1',
          name: 'server-1',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'server-2',
          name: 'server-2',
          type: 'remote_sse',
          config: {
            url: 'https://example.com/mcp/sse',
            transport: 'sse',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const servers = await McpServerFactory.createMultipleAsync(entities);
      expect(servers.size).toBe(2);
      expect(servers.get('server-1')).toBeInstanceOf(RemoteHttpMcpServer);
      expect(servers.get('server-2')).toBeInstanceOf(RemoteSseMcpServer);
    });

    it('should skip servers that fail to create', async () => {
      const entities: McpServerEntity[] = [
        {
          id: 'server-1',
          name: 'server-1',
          type: 'remote_http',
          config: {
            url: 'https://example.com/mcp',
            transport: 'http',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'server-2',
          name: 'server-2',
          type: 'external',
          config: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const servers = await McpServerFactory.createMultipleAsync(entities);
      expect(servers.size).toBe(1);
      expect(servers.get('server-1')).toBeInstanceOf(RemoteHttpMcpServer);
      expect(servers.get('server-2')).toBeUndefined();
    });
  });
});
