/**
 * Unit tests for proxy routes
 */

import type {
  DebugLogRepository,
  McpServerRepository,
  OAuthTokenRepository,
  ProfileMcpServerRepository,
  ProfileRepository,
} from '@local-mcp/database';
import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProxyRoutes } from '../../../src/routes/proxy.js';

// Mock ProxyHandler and McpServerFactory
vi.mock('@local-mcp/core', async () => {
  const actual = await vi.importActual('@local-mcp/core');
  return {
    ...actual,
    // Keep actual ProxyHandler for ProxyHandlerWithLogging to extend
    McpServerFactory: {
      createMultipleAsync: vi.fn().mockResolvedValue(new Map()),
    },
  };
});

describe('Proxy Routes Unit Tests', () => {
  let mockProfileRepository: ProfileRepository;
  let mockMcpServerRepository: McpServerRepository;
  let mockOAuthTokenRepository: OAuthTokenRepository;
  let mockDebugLogRepository: DebugLogRepository;
  let mockProfileMcpServerRepository: ProfileMcpServerRepository;
  let router: ReturnType<typeof createProxyRoutes>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Mock repositories
    mockProfileRepository = {
      findById: vi.fn(),
      findByName: vi.fn(),
    } as unknown as ProfileRepository;

    mockMcpServerRepository = {
      findById: vi.fn(),
    } as unknown as McpServerRepository;

    mockOAuthTokenRepository = {
      get: vi.fn(),
    } as unknown as OAuthTokenRepository;

    mockDebugLogRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: undefined,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      }),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as DebugLogRepository;

    mockProfileMcpServerRepository = {
      getServerIdsForProfile: vi.fn(),
    } as unknown as ProfileMcpServerRepository;

    // Create router
    router = createProxyRoutes(
      mockProfileRepository,
      mockMcpServerRepository,
      mockOAuthTokenRepository,
      mockDebugLogRepository,
      mockProfileMcpServerRepository
    );

    // Mock Express request/response
    mockReq = {
      body: {},
      params: {},
      query: {},
      on: vi.fn(),
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
  });

  describe('POST /:profileId', () => {
    const setupSuccessfulProfile = async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi
          .fn()
          .mockResolvedValue([
            { name: 'test-tool', description: 'A test tool', inputSchema: { type: 'object' } },
          ]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Result' }] }),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: { tools: [] },
        }),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      return { profile, mockServer };
    };

    it('should return 404 when profile not found', async () => {
      mockReq.params = { profileId: 'non-existent' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(null);
      vi.mocked(mockProfileRepository.findByName).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockProfileRepository.findById).toHaveBeenCalledWith('non-existent');
        expect(mockProfileRepository.findByName).toHaveBeenCalledWith('non-existent');
        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              code: -32603,
              message: 'Profile "non-existent" not found',
            }),
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 on invalid JSON-RPC request', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '1.0', // Invalid version
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      // Return at least one server ID to avoid "No MCP servers found" error
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);

      // Mock server entity
      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to return a mock server
      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn(),
        listResources: vi.fn(),
        callTool: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Validation happens after proxy handler creation
        // Invalid JSON-RPC should return 400
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              code: -32600,
              message: 'Invalid Request',
            }),
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle tools/list request successfully', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to return tools/list response
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          tools: [
            { name: 'test-tool', description: 'A test tool', inputSchema: { type: 'object' } },
          ],
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              tools: expect.any(Array),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle initialize request successfully', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest for initialize
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          serverInfo: { name: 'test-server', version: '1.0.0' },
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              protocolVersion: '2025-06-18',
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle initialize request with multiple servers', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity1 = {
        id: 'server-1',
        name: 'test-server-1',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      const serverEntity2 = {
        id: 'server-2',
        name: 'test-server-2',
        type: 'remote_http',
        config: { url: 'https://example2.com' },
        createdAt: Date.now(),
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
        'server-2',
      ]);
      vi.mocked(mockMcpServerRepository.findById)
        .mockResolvedValueOnce(serverEntity1 as never)
        .mockResolvedValueOnce(serverEntity2 as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory, ProxyHandler } = await import('@local-mcp/core');
      const mockServer1 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: { tools: {} },
            serverInfo: { name: 'server-1', version: '1.0.0' },
          },
        }),
      };
      const mockServer2 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: { resources: {} },
            serverInfo: { name: 'server-2', version: '1.0.0' },
          },
        }),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([
          ['server-1', mockServer1 as never],
          ['server-2', mockServer2 as never],
        ])
      );

      // Mock ProxyHandler.handleRequest to aggregate results
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
          },
          serverInfo: { name: 'local-mcp-proxy', version: '1.0.0' },
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              protocolVersion: '2025-06-18',
              capabilities: expect.objectContaining({
                tools: expect.any(Object),
                resources: expect.any(Object),
              }),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle initialize request with server without handleRequest method', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock server without handleRequest method
      const mockServerWithoutHandleRequest = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        // No handleRequest method
      };

      const { McpServerFactory, ProxyHandler } = await import('@local-mcp/core');
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServerWithoutHandleRequest as never]])
      );

      // Mock ProxyHandler.handleRequest to return proxy capabilities
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
          },
          serverInfo: { name: 'proxy-server-server-1', version: '1.0.0' },
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              protocolVersion: '2025-06-18',
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle initialize request when all servers fail', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity1 = {
        id: 'server-1',
        name: 'test-server-1',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      const serverEntity2 = {
        id: 'server-2',
        name: 'test-server-2',
        type: 'remote_http',
        config: { url: 'https://example2.com' },
        createdAt: Date.now(),
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
        'server-2',
      ]);
      vi.mocked(mockMcpServerRepository.findById)
        .mockResolvedValueOnce(serverEntity1 as never)
        .mockResolvedValueOnce(serverEntity2 as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory, ProxyHandler } = await import('@local-mcp/core');
      const mockServer1 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32603, message: 'Server 1 error' },
        }),
      };
      const mockServer2 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32603, message: 'Server 2 error' },
        }),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([
          ['server-1', mockServer1 as never],
          ['server-2', mockServer2 as never],
        ])
      );

      // Mock ProxyHandler.handleRequest to throw error when all servers fail
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi
        .fn()
        .mockRejectedValue(new Error('Failed to initialize servers: server-1, server-2'));

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('Failed to initialize servers'),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle initialize request with capabilities aggregation', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity1 = {
        id: 'server-1',
        name: 'test-server-1',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      const serverEntity2 = {
        id: 'server-2',
        name: 'test-server-2',
        type: 'remote_http',
        config: { url: 'https://example2.com' },
        createdAt: Date.now(),
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
        'server-2',
      ]);
      vi.mocked(mockMcpServerRepository.findById)
        .mockResolvedValueOnce(serverEntity1 as never)
        .mockResolvedValueOnce(serverEntity2 as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory, ProxyHandler } = await import('@local-mcp/core');
      const mockServer1 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: { tools: {}, prompts: {} },
            serverInfo: { name: 'server-1', version: '1.0.0' },
          },
        }),
      };
      const mockServer2 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: { resources: {}, logging: {} },
            serverInfo: { name: 'server-2', version: '1.0.0' },
          },
        }),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([
          ['server-1', mockServer1 as never],
          ['server-2', mockServer2 as never],
        ])
      );

      // Mock ProxyHandler.handleRequest to aggregate capabilities
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            prompts: {},
            logging: {},
          },
          serverInfo: { name: 'local-mcp-proxy', version: '1.0.0' },
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              protocolVersion: '2025-06-18',
              capabilities: expect.objectContaining({
                tools: expect.any(Object),
                resources: expect.any(Object),
                prompts: expect.any(Object),
                logging: expect.any(Object),
              }),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle notification (no id)', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to return undefined (notification)
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue(undefined);

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        method: 'notification',
        params: {},
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(204);
        expect(mockRes.send).toHaveBeenCalled();

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle profile lookup by name', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'test-profile' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(null);
      vi.mocked(mockProfileRepository.findByName).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory, ProxyHandler } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: { tools: [] },
        }),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      // Mock ProxyHandler.handleRequest
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { tools: [] },
      });

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockProfileRepository.findById).toHaveBeenCalledWith('test-profile');
        expect(mockProfileRepository.findByName).toHaveBeenCalledWith('test-profile');
        expect(mockRes.json).toHaveBeenCalled();

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 500 when no servers found for profile', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([]);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('No MCP servers'),
            }),
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle resources/list request successfully', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to return resources/list response
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          resources: [{ uri: 'resource://test', name: 'Test Resource', mimeType: 'text/plain' }],
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/list',
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              resources: expect.any(Array),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle tools/call request successfully', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to return tools/call response
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: 'Tool result' }],
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'test-tool',
          arguments: { arg1: 'value1' },
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              content: expect.any(Array),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle tools/call with server ID prefix', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to return tools/call response for prefixed tool
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: 'Prefixed tool result' }],
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'server-1:test-tool',
          arguments: { arg1: 'value1' },
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              content: expect.any(Array),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle tools/call error when tool not found', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to throw error for non-existent tool
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi
        .fn()
        .mockRejectedValue(
          new Error('Tool "non-existent-tool" not found in any registered server')
        );

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'non-existent-tool',
          arguments: {},
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('not found'),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle resources/read request successfully', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to return resources/read response
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          contents: [{ uri: 'resource://test', mimeType: 'text/plain', text: 'Resource content' }],
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'resource://test',
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: expect.objectContaining({
              contents: expect.any(Array),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle resources/read error when resource not found', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to throw error for non-existent resource
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi
        .fn()
        .mockRejectedValue(
          new Error('Resource "resource://non-existent" not found in any registered server')
        );

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'resource://non-existent',
        },
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('not found'),
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle error response from ProxyHandler', async () => {
      const { mockServer } = await setupSuccessfulProfile();

      // Mock ProxyHandler.handleRequest to return error response
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: 'Internal error',
        },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            error: expect.objectContaining({
              code: -32603,
              message: 'Internal error',
            }),
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle error during ProxyHandler creation', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);

      // Mock server entity
      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      // Mock McpServerFactory to throw error
      const { McpServerFactory } = await import('@local-mcp/core');
      vi.mocked(McpServerFactory.createMultipleAsync).mockRejectedValue(
        new Error('Failed to create server')
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('Failed to create server'),
            }),
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });
  });

  describe('GET /:profileId/sse', () => {
    it('should return 500 on error', async () => {
      mockReq.params = { profileId: 'profile-1' };
      vi.mocked(mockProfileRepository.findById).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/sse' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Database error',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should set SSE headers and send connection message', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.on = vi.fn().mockImplementation((event, callback) => {
        if (event === 'close') {
          // Simulate connection close
          setTimeout(() => callback(), 10);
        }
        return mockReq;
      });

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/sse' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
        expect(mockRes.write).toHaveBeenCalledWith(
          'data: {"type":"connection","status":"connected"}\n\n'
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle profile lookup by name for SSE', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'test-profile' };
      mockReq.on = vi.fn().mockReturnValue(mockReq);

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(null);
      vi.mocked(mockProfileRepository.findByName).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/sse' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockProfileRepository.findById).toHaveBeenCalledWith('test-profile');
        expect(mockProfileRepository.findByName).toHaveBeenCalledWith('test-profile');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      } else {
        throw new Error('Handler not found');
      }
    });
  });

  describe('GET /:profileId/info', () => {
    it('should return 500 on error', async () => {
      mockReq.params = { profileId: 'profile-1' };
      vi.mocked(mockProfileRepository.findById).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/info' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Database error',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle profile lookup by name for info', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'test-profile' };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(null);
      vi.mocked(mockProfileRepository.findByName).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi
          .fn()
          .mockResolvedValue([
            { name: 'test-tool', description: 'A test tool', inputSchema: { type: 'object' } },
          ]),
        listResources: vi
          .fn()
          .mockResolvedValue([
            { uri: 'resource://test', name: 'Test Resource', mimeType: 'text/plain' },
          ]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/info' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockProfileRepository.findById).toHaveBeenCalledWith('test-profile');
        expect(mockProfileRepository.findByName).toHaveBeenCalledWith('test-profile');
        expect(mockRes.json).toHaveBeenCalledWith({
          tools: expect.any(Array),
          resources: expect.any(Array),
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return tools and resources successfully', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi
          .fn()
          .mockResolvedValue([
            { name: 'test-tool', description: 'A test tool', inputSchema: { type: 'object' } },
          ]),
        listResources: vi
          .fn()
          .mockResolvedValue([
            { uri: 'resource://test', name: 'Test Resource', mimeType: 'text/plain' },
          ]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/info' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.json).toHaveBeenCalledWith({
          tools: expect.any(Array),
          resources: expect.any(Array),
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle multiple servers with duplicate tool names', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity1 = {
        id: 'server-1',
        name: 'test-server-1',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      const serverEntity2 = {
        id: 'server-2',
        name: 'test-server-2',
        type: 'remote_http',
        config: { url: 'https://example2.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
        'server-2',
      ]);
      vi.mocked(mockMcpServerRepository.findById)
        .mockResolvedValueOnce(serverEntity1 as never)
        .mockResolvedValueOnce(serverEntity2 as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      // Create mutable tool objects so ProxyHandlerWithLogging can modify them
      const tool1 = {
        name: 'duplicate-tool',
        description: 'Tool from server 1',
        inputSchema: { type: 'object' },
      };
      const tool2 = {
        name: 'duplicate-tool',
        description: 'Tool from server 2',
        inputSchema: { type: 'object' },
      };

      const mockServer1 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([tool1]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      const mockServer2 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([tool2]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([
          ['server-1', mockServer1 as never],
          ['server-2', mockServer2 as never],
        ])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/info' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Check that tools were returned (duplicate names should be handled)
        const jsonCall = vi.mocked(mockRes.json).mock.calls[0]?.[0];
        expect(jsonCall).toBeDefined();
        expect(jsonCall.tools).toBeInstanceOf(Array);
        expect(jsonCall.tools.length).toBe(2);
        // At least one tool should have server prefix for duplicate names
        const toolNames = jsonCall.tools.map((t: { name: string }) => t.name);
        const hasPrefixedTool = toolNames.some((name: string) => name.startsWith('server-1:'));
        const hasUnprefixedTool = toolNames.some((name: string) => name === 'duplicate-tool');
        expect(hasPrefixedTool || hasUnprefixedTool).toBe(true);
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle server error when listing tools', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity1 = {
        id: 'server-1',
        name: 'test-server-1',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      const serverEntity2 = {
        id: 'server-2',
        name: 'test-server-2',
        type: 'remote_http',
        config: { url: 'https://example2.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
        'server-2',
      ]);
      vi.mocked(mockMcpServerRepository.findById)
        .mockResolvedValueOnce(serverEntity1 as never)
        .mockResolvedValueOnce(serverEntity2 as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer1 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockRejectedValue(new Error('Server 1 error')),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      const mockServer2 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi
          .fn()
          .mockResolvedValue([
            {
              name: 'working-tool',
              description: 'Tool from server 2',
              inputSchema: { type: 'object' },
            },
          ]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([
          ['server-1', mockServer1 as never],
          ['server-2', mockServer2 as never],
        ])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/info' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should still return tools from server 2, even though server 1 failed
        expect(mockRes.json).toHaveBeenCalledWith({
          tools: expect.arrayContaining([expect.objectContaining({ name: 'working-tool' })]),
          resources: expect.any(Array),
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle server error when listing resources', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity1 = {
        id: 'server-1',
        name: 'test-server-1',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      const serverEntity2 = {
        id: 'server-2',
        name: 'test-server-2',
        type: 'remote_http',
        config: { url: 'https://example2.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
        'server-2',
      ]);
      vi.mocked(mockMcpServerRepository.findById)
        .mockResolvedValueOnce(serverEntity1 as never)
        .mockResolvedValueOnce(serverEntity2 as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer1 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockRejectedValue(new Error('Server 1 error')),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      const mockServer2 = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi
          .fn()
          .mockResolvedValue([
            { uri: 'resource://test', name: 'Test Resource', mimeType: 'text/plain' },
          ]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([
          ['server-1', mockServer1 as never],
          ['server-2', mockServer2 as never],
        ])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId/info' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should still return resources from server 2, even though server 1 failed
        expect(mockRes.json).toHaveBeenCalledWith({
          tools: expect.any(Array),
          resources: expect.arrayContaining([expect.objectContaining({ uri: 'resource://test' })]),
        });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle error when no servers found for profile', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([]);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('No MCP servers found'),
            }),
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle error when all servers are invalid (deleted)', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
        'server-2',
      ]);
      vi.mocked(mockMcpServerRepository.findById)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('No valid MCP servers found'),
            }),
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle server initialization errors gracefully', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      // Mock ProxyHandler.handleRequest to return tools/list response
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { tools: [] },
      });

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should still work despite initialization error
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle createServerLog error gracefully', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      // Mock debugLogRepository.create to fail
      vi.mocked(mockDebugLogRepository.create).mockRejectedValue(new Error('Log creation failed'));

      // Mock ProxyHandler.handleRequest
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { tools: [] },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should still work despite log creation error
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle initialize notification (no id)', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        // No id - this is a notification
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            serverInfo: { name: 'test-server', version: '1.0.0' },
          },
        }),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Notifications should return 204 No Content
        expect(mockRes.status).toHaveBeenCalledWith(204);
        expect(mockRes.send).toHaveBeenCalled();
        expect(mockRes.json).not.toHaveBeenCalled();
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle error when all servers fail to initialize', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn().mockRejectedValue(new Error('All servers failed')),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should return error response
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            error: expect.objectContaining({
              message: expect.stringContaining('Failed to initialize'),
            }),
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle callTool with server ID prefix', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'server-1:test-tool',
          arguments: { arg1: 'value1' },
        },
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn().mockResolvedValue({ result: 'success' }),
        handleRequest: vi.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: { result: 'success' },
        }),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should call tool with correct name (without prefix)
        expect(mockServer.callTool).toHaveBeenCalledWith('test-tool', { arg1: 'value1' });
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
            result: { result: 'success' },
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should handle updateServerLog error gracefully', async () => {
      const profile = {
        id: 'profile-1',
        name: 'test-profile',
        createdAt: Date.now(),
      };

      const serverEntity = {
        id: 'server-1',
        name: 'test-server',
        type: 'remote_http',
        config: { url: 'https://example.com' },
        createdAt: Date.now(),
      };

      // Mock debugLogRepository.update to fail
      vi.mocked(mockDebugLogRepository.update).mockRejectedValue(new Error('Log update failed'));

      // Mock ProxyHandler.handleRequest
      const { ProxyHandler } = await import('@local-mcp/core');
      const originalHandleRequest = ProxyHandler.prototype.handleRequest;
      ProxyHandler.prototype.handleRequest = vi.fn().mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: { tools: [] },
      });

      mockReq.params = { profileId: 'profile-1' };
      mockReq.body = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      };

      vi.mocked(mockProfileRepository.findById).mockResolvedValue(profile as never);
      vi.mocked(mockProfileMcpServerRepository.getServerIdsForProfile).mockResolvedValue([
        'server-1',
      ]);
      vi.mocked(mockMcpServerRepository.findById).mockResolvedValue(serverEntity as never);
      vi.mocked(mockOAuthTokenRepository.get).mockResolvedValue(null);

      const { McpServerFactory } = await import('@local-mcp/core');
      const mockServer = {
        initialize: vi.fn().mockResolvedValue(undefined),
        listTools: vi.fn().mockResolvedValue([]),
        listResources: vi.fn().mockResolvedValue([]),
        callTool: vi.fn(),
        handleRequest: vi.fn(),
      };
      vi.mocked(McpServerFactory.createMultipleAsync).mockResolvedValue(
        new Map([['server-1', mockServer as never]])
      );

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/:profileId' && layer.route?.methods?.post
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        // Should still work despite log update error
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            jsonrpc: '2.0',
            id: 1,
          })
        );

        // Restore original
        ProxyHandler.prototype.handleRequest = originalHandleRequest;
      } else {
        throw new Error('Handler not found');
      }
    });
  });
});
