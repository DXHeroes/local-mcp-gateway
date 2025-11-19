/**
 * Unit tests for MCP server routes
 */

import type {
  DebugLogRepository,
  McpServerRepository,
  OAuthTokenRepository,
  ProfileRepository,
} from '@dxheroes/local-mcp-database';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMcpServerRoutes } from '../../../src/routes/mcp-servers.js';

// Mock McpServerFactory and OAuthDiscoveryService
const mockDiscoverFromResourceMetadata = vi.fn();
const mockDiscoverFromServerUrl = vi.fn();
const mockRegisterClient = vi.fn();

vi.mock('@dxheroes/local-mcp-core', async () => {
  const actual = await vi.importActual('@dxheroes/local-mcp-core');
  return {
    ...actual,
    McpServerFactory: {
      createAsync: vi.fn(),
    },
    OAuthDiscoveryService: class {
      discoverFromResourceMetadata = mockDiscoverFromResourceMetadata;
      discoverFromServerUrl = mockDiscoverFromServerUrl;
      registerClient = mockRegisterClient;
    },
  };
});

describe('MCP Server Routes Unit Tests', () => {
  let mockMcpServerRepository: McpServerRepository;
  let mockOAuthTokenRepository: OAuthTokenRepository;
  let mockDebugLogRepository: DebugLogRepository;
  let mockProfileRepository: ProfileRepository;
  let router: ReturnType<typeof createMcpServerRoutes>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Reset OAuth discovery mocks
    mockDiscoverFromResourceMetadata.mockReset();
    mockDiscoverFromServerUrl.mockReset();
    mockRegisterClient.mockReset();

    // Mock repositories
    mockMcpServerRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as McpServerRepository;

    mockOAuthTokenRepository = {
      get: vi.fn(),
      store: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as OAuthTokenRepository;

    mockDebugLogRepository = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
    } as unknown as DebugLogRepository;

    mockProfileRepository = {
      findByName: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
    } as unknown as ProfileRepository;

    // Create router
    router = createMcpServerRoutes(
      mockMcpServerRepository,
      mockOAuthTokenRepository,
      mockDebugLogRepository,
      mockProfileRepository
    );

    // Mock Express request/response
    mockReq = {
      body: {},
      params: {},
      query: {},
      protocol: 'http',
      get: vi.fn().mockReturnValue('localhost:3001'),
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('GET /', () => {
    it('should return all MCP servers', async () => {
      const servers = [
        {
          id: '1',
          name: 'server1',
          type: 'remote_http',
          config: { url: 'https://example.com' },
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'server2',
          type: 'remote_sse',
          config: { url: 'https://example.com/sse' },
          createdAt: Date.now(),
        },
      ];

      vi.mocked(mockMcpServerRepository.findAll).mockResolvedValue(servers as never);

      // Find GET / handler
      const handler = router.stack.find(
        (layer) => layer.route?.path === '/' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockMcpServerRepository.findAll).toHaveBeenCalledOnce();
        expect(mockRes.json).toHaveBeenCalledWith(servers);
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 500 on error', async () => {
      vi.mocked(mockMcpServerRepository.findAll).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch MCP servers' });
      } else {
        throw new Error('Handler not found');
      }
    });
  });

  describe('POST /', () => {
    it('should create MCP server successfully', async () => {
      const serverData = {
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
      };
      const createdServer = {
        id: '1',
        ...serverData,
        createdAt: Date.now(),
      };

      mockReq.body = serverData;
      vi.mocked(mockMcpServerRepository.create).mockResolvedValue(createdServer as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdServer);
    });

    it('should return 400 on validation error', async () => {
      mockReq.body = { name: '' }; // Invalid: empty name

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.create).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation error' })
      );
    });

    it('should return 400 on repository error', async () => {
      mockReq.body = {
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
      };
      vi.mocked(mockMcpServerRepository.create).mockRejectedValue(
        new Error('Server name already exists')
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Server name already exists',
      });
    });
  });

  describe('GET /:id', () => {
    it('should return MCP server by ID', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.findById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(server);
    });

    it('should return 404 when server not found', async () => {
      mockReq.params = { id: 'non-existent' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'MCP server not found' });
    });

    it('should return 500 on error', async () => {
      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to fetch MCP server' });
    });
  });

  describe('PUT /:id', () => {
    it('should update MCP server successfully', async () => {
      const updateData = { name: 'updated-server' };
      const existingServer = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };
      const updatedServer = {
        ...existingServer,
        ...updateData,
      };

      mockReq.params = { id: '1' };
      mockReq.body = updateData;
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(existingServer as never);
      vi.mocked(mockMcpServerRepository.update).mockResolvedValue(updatedServer as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.put
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.findById).toHaveBeenCalledWith('1');
      expect(mockMcpServerRepository.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(updatedServer);
    });

    it('should return 404 when server not found', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = { name: 'updated-server' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.put
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'MCP server not found' });
    });

    it('should return 400 on validation error', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = { name: '' }; // Invalid: empty name

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.put
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation error' })
      );
    });

    it('should update MCP server type', async () => {
      const existingServer = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };
      const updatedServer = {
        ...existingServer,
        type: 'remote_sse',
      };

      mockReq.params = { id: '1' };
      mockReq.body = { type: 'remote_sse' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(existingServer as never);
      vi.mocked(mockMcpServerRepository.update).mockResolvedValue(updatedServer as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.put
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(updatedServer);
    });

    it('should update MCP server with OAuth config', async () => {
      const existingServer = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };
      const oauthConfig = {
        authorizationServerUrl: 'https://auth.example.com',
        tokenEndpoint: 'https://auth.example.com/token',
        scopes: ['read'],
        requiresOAuth: true,
        clientId: 'client-id',
        clientSecret: 'client-secret',
      };
      const updatedServer = {
        ...existingServer,
        oauthConfig,
      };

      mockReq.params = { id: '1' };
      mockReq.body = { oauthConfig };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(existingServer as never);
      vi.mocked(mockMcpServerRepository.update).mockResolvedValue(updatedServer as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.put
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.update).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(updatedServer);
    });

    it('should return 400 on update error', async () => {
      const existingServer = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      mockReq.body = { name: 'updated-server' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(existingServer as never);
      vi.mocked(mockMcpServerRepository.update).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.put
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('DELETE /:id', () => {
    it('should delete MCP server successfully', async () => {
      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.delete).mockResolvedValue(undefined);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.delete
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.delete).toHaveBeenCalledWith('1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.delete).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id' && layer.route?.methods?.delete
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to delete MCP server' });
    });
  });

  describe('POST /:id/api-key', () => {
    it('should set API key successfully', async () => {
      const apiKeyData = {
        apiKey: 'test-api-key',
        headerName: 'X-API-Key',
        headerValue: 'Bearer test-api-key',
      };
      const updatedServer = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        apiKeyConfig: apiKeyData,
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      mockReq.body = apiKeyData;
      vi.mocked(mockMcpServerRepository.update).mockResolvedValue(updatedServer as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id/api-key' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockMcpServerRepository.update).toHaveBeenCalledWith('1', {
        apiKeyConfig: apiKeyData,
      });
      expect(mockRes.json).toHaveBeenCalledWith(updatedServer);
    });

    it('should return 400 on validation error', async () => {
      mockReq.params = { id: '1' };
      mockReq.body = {}; // Missing required fields

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:id/api-key' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);
      } else {
        throw new Error('Handler not found');
      }

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Validation error' })
      );
    });
  });

  describe('GET /:id/tools', () => {
    it('should return 404 when server not found', async () => {
      mockReq.params = { id: 'non-existent' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(null);

      // Find the tools endpoint handler (it's after api-key endpoint)
      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'MCP server not found' });
      }
    });

    it('should return tools successfully', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      const mockServerInstance = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi
          .fn()
          .mockResolvedValue([
            { name: 'test-tool', description: 'A test tool', inputSchema: { type: 'object' } },
          ]),
      };
      vi.mocked(McpServerFactory.createAsync).mockResolvedValue(mockServerInstance as never);

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith({
          tools: expect.arrayContaining([
            expect.objectContaining({
              name: 'test-tool',
            }),
          ]),
        });
      }
    });

    it('should handle server initialization error', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to throw error
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      vi.mocked(McpServerFactory.createAsync).mockRejectedValue(new Error('Connection failed'));

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith({
          tools: [],
          error: 'Connection failed',
        });
      }
    });

    it('should handle OAUTH_REQUIRED error and discover OAuth from resource metadata', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to throw OAUTH_REQUIRED error
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      vi.mocked(McpServerFactory.createAsync).mockRejectedValue(
        new Error('OAUTH_REQUIRED:https://example.com/.well-known/oauth-resource-metadata')
      );

      // Mock OAuth discovery
      mockDiscoverFromResourceMetadata.mockResolvedValue({
        authorizationServerUrl: 'https://auth.example.com',
        tokenEndpoint: 'https://auth.example.com/token',
        scopes: ['read', 'write'],
        resource: 'https://api.example.com',
        registrationEndpoint: 'https://auth.example.com/register',
      });

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      // Mock DCR
      mockRegisterClient.mockResolvedValue({
        clientId: 'discovered-client-id',
        clientSecret: 'discovered-client-secret',
      });

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        // Should return 401 with oauthUrl
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'OAuth authentication required',
            oauthUrl: expect.stringContaining('/api/oauth/authorize/1'),
          })
        );
      }
    });

    it('should handle OAUTH_REQUIRED error and discover OAuth from server URL', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to throw OAUTH_REQUIRED error (without resource metadata URL)
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      vi.mocked(McpServerFactory.createAsync).mockRejectedValue(
        new Error('OAUTH_REQUIRED: Server requires OAuth authentication')
      );

      // Mock OAuth discovery from server URL
      mockDiscoverFromServerUrl.mockResolvedValue({
        authorizationServerUrl: 'https://auth.example.com',
        tokenEndpoint: 'https://auth.example.com/token',
        scopes: ['read'],
        resource: 'https://api.example.com',
      });

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        // Should return 401 with oauthUrl
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'OAuth authentication required',
            oauthUrl: expect.stringContaining('/api/oauth/authorize/1'),
          })
        );
      }
    });
  });

  describe('GET /:id/status', () => {
    it('should return 404 when server not found', async () => {
      mockReq.params = { id: 'non-existent' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(null);

      // Find the status endpoint handler
      const statusHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/status' && layer.route?.methods?.get
      );

      if (statusHandler?.route?.stack?.[0]?.handle) {
        await statusHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'MCP server not found' });
      }
    });

    it('should return status successfully', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      const mockServerInstance = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi
          .fn()
          .mockResolvedValue([
            { name: 'test-tool', description: 'A test tool', inputSchema: { type: 'object' } },
          ]),
        listResources: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(McpServerFactory.createAsync).mockResolvedValue(mockServerInstance as never);

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'status',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const statusHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/status' && layer.route?.methods?.get
      );

      if (statusHandler?.route?.stack?.[0]?.handle) {
        await statusHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'connected',
          error: null,
        });
      }
    });

    it('should handle server initialization error', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to throw error
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      vi.mocked(McpServerFactory.createAsync).mockRejectedValue(new Error('Connection failed'));

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'status',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const statusHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/status' && layer.route?.methods?.get
      );

      if (statusHandler?.route?.stack?.[0]?.handle) {
        await statusHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith({
          status: 'error',
          error: 'Connection failed',
        });
      }
    });

    it('should handle OAUTH_REQUIRED error and discover OAuth from resource metadata in status', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to throw OAUTH_REQUIRED error
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      vi.mocked(McpServerFactory.createAsync).mockRejectedValue(
        new Error('OAUTH_REQUIRED:https://example.com/.well-known/oauth-resource-metadata')
      );

      // Mock OAuth discovery
      mockDiscoverFromResourceMetadata.mockResolvedValue({
        authorizationServerUrl: 'https://auth.example.com',
        tokenEndpoint: 'https://auth.example.com/token',
        scopes: ['read', 'write'],
        resource: 'https://api.example.com',
        registrationEndpoint: 'https://auth.example.com/register',
      });

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'status/check',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      // Mock DCR
      mockRegisterClient.mockResolvedValue({
        clientId: 'discovered-client-id',
        clientSecret: 'discovered-client-secret',
      });

      const statusHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/status' && layer.route?.methods?.get
      );

      if (statusHandler?.route?.stack?.[0]?.handle) {
        await statusHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        // Should return 401 with oauthUrl
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'error',
            error: 'OAuth authentication required',
            oauthUrl: expect.stringContaining('/api/oauth/authorize/1'),
          })
        );
      }
    });

    it('should handle OAUTH_REQUIRED error and discover OAuth from server URL in status', async () => {
      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      mockReq.protocol = 'http';
      mockReq.get = vi.fn().mockReturnValue('localhost:3001');
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to throw OAUTH_REQUIRED error (without resource metadata URL)
      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      vi.mocked(McpServerFactory.createAsync).mockRejectedValue(
        new Error('OAUTH_REQUIRED: Server requires OAuth authentication')
      );

      // Mock OAuth discovery from server URL
      mockDiscoverFromServerUrl.mockResolvedValue({
        authorizationServerUrl: 'https://auth.example.com',
        tokenEndpoint: 'https://auth.example.com/token',
        scopes: ['read'],
        resource: 'https://api.example.com',
      });

      // Mock debug log
      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: '1',
        requestType: 'status/check',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const statusHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/status' && layer.route?.methods?.get
      );

      if (statusHandler?.route?.stack?.[0]?.handle) {
        await statusHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        // Should return 401 with oauthUrl
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'error',
            error: 'OAuth authentication required',
            oauthUrl: expect.stringContaining('/api/oauth/authorize/1'),
          })
        );
      }
    });
  });

  describe('getSystemProfileId helper', () => {
    it('should return system profile ID if exists', async () => {
      const systemProfile = {
        id: 'system-profile-id',
        name: '__system__',
        description: 'System profile',
        createdAt: Date.now(),
      };

      vi.mocked(mockProfileRepository.findByName).mockResolvedValue(systemProfile as never);

      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      const mockServerInstance = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createAsync).mockResolvedValue(mockServerInstance as never);

      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'system-profile-id',
        mcpServerId: '1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockProfileRepository.findByName).toHaveBeenCalledWith('__system__');
        expect(mockDebugLogRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            profileId: 'system-profile-id',
          })
        );
      }
    });

    it('should return first existing profile ID as fallback', async () => {
      const existingProfile = {
        id: 'existing-profile-id',
        name: 'existing-profile',
        description: 'Existing profile',
        createdAt: Date.now(),
      };

      vi.mocked(mockProfileRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockProfileRepository.findAll).mockResolvedValue([existingProfile as never]);

      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      const mockServerInstance = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createAsync).mockResolvedValue(mockServerInstance as never);

      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'existing-profile-id',
        mcpServerId: '1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockProfileRepository.findByName).toHaveBeenCalledWith('__system__');
        expect(mockProfileRepository.findAll).toHaveBeenCalled();
        expect(mockDebugLogRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            profileId: 'existing-profile-id',
          })
        );
      }
    });

    it('should create system profile if no profiles exist', async () => {
      const newSystemProfile = {
        id: 'new-system-profile-id',
        name: '__system__',
        description: 'System profile for debug logging',
        createdAt: Date.now(),
      };

      vi.mocked(mockProfileRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockProfileRepository.findAll).mockResolvedValue([]);
      vi.mocked(mockProfileRepository.create).mockResolvedValue(newSystemProfile as never);

      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      const mockServerInstance = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createAsync).mockResolvedValue(mockServerInstance as never);

      vi.mocked(mockDebugLogRepository.create).mockResolvedValue({
        id: 'log-1',
        profileId: 'new-system-profile-id',
        mcpServerId: '1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      } as never);

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        expect(mockProfileRepository.findByName).toHaveBeenCalledWith('__system__');
        expect(mockProfileRepository.findAll).toHaveBeenCalled();
        expect(mockProfileRepository.create).toHaveBeenCalledWith({
          name: '__system__',
          description: 'System profile for debug logging',
        });
        expect(mockDebugLogRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            profileId: 'new-system-profile-id',
          })
        );
      }
    });

    it('should return null if getSystemProfileId fails', async () => {
      vi.mocked(mockProfileRepository.findByName).mockRejectedValue(new Error('Database error'));
      vi.mocked(mockProfileRepository.findAll).mockRejectedValue(new Error('Database error'));
      vi.mocked(mockProfileRepository.create).mockRejectedValue(new Error('Database error'));

      const server = {
        id: '1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { id: '1' };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(server as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@dxheroes/local-mcp-core');
      const mockServerInstance = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createAsync).mockResolvedValue(mockServerInstance as never);

      const toolsHandler = router.stack.find(
        (layer) => layer.route?.path === '/:id/tools' && layer.route?.methods?.get
      );

      if (toolsHandler?.route?.stack?.[0]?.handle) {
        await toolsHandler.route.stack[0].handle(mockReq as Request, mockRes as Response);

        // Should still work, just without debug logging
        expect(mockRes.json).toHaveBeenCalled();
      }
    });
  });
});
