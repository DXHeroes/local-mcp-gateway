/**
 * Tests for ProxyService — MCP protocol proxying for profiles
 */

import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import { ProxyService } from '../../modules/proxy/proxy.service.js';
import type { McpRequest } from '../../modules/proxy/proxy.service.js';
import { SearchCompaniesSchema } from '../../../../../mcp-servers/merk/src/schemas.js';

// ---- Mock @dxheroes/local-mcp-core server classes ----
const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockListTools = vi.fn().mockResolvedValue([]);
const mockCallTool = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'result' }],
});
const mockListResources = vi.fn().mockResolvedValue([]);
const mockReadResource = vi.fn().mockResolvedValue({ contents: [] });
const mockShutdown = vi.fn().mockResolvedValue(undefined);

// Track constructor calls for assertions
const externalCtorArgs = vi.fn();
const remoteHttpCtorArgs = vi.fn();
const remoteSseCtorArgs = vi.fn();

vi.mock('@dxheroes/local-mcp-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dxheroes/local-mcp-core')>();
  return {
    ...actual,
    ExternalMcpServer: class MockExternalMcpServer {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
      shutdown = mockShutdown;
      constructor(...args: unknown[]) {
        externalCtorArgs(...args);
      }
    },
    RemoteHttpMcpServer: class MockRemoteHttpMcpServer {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
      constructor(...args: unknown[]) {
        remoteHttpCtorArgs(...args);
      }
    },
    RemoteSseMcpServer: class MockRemoteSseMcpServer {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
      constructor(...args: unknown[]) {
        remoteSseCtorArgs(...args);
      }
    },
  };
});

// ---- Helpers ----

function makeProfile(overrides?: Record<string, unknown>) {
  return {
    id: 'profile-1',
    name: 'default',
    organizationId: 'org-1',
    userId: 'user-1',
    mcpServers: [],
    ...overrides,
  };
}

function makeProfileServer(
  serverOverrides?: Record<string, unknown>,
  tools: unknown[] = [],
) {
  return {
    isActive: true,
    order: 0,
    mcpServer: {
      id: 'srv-1',
      name: 'Test Server',
      type: 'external',
      config: '{"command":"node","args":["server.js"]}',
      apiKeyConfig: null,
      ...serverOverrides,
    },
    tools,
  };
}

function makeRequest(overrides?: Partial<McpRequest>): McpRequest {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    ...overrides,
  };
}

describe('ProxyService', () => {
  let service: ProxyService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let registry: McpRegistry;
  let debugService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-set default resolved values after clearAllMocks
    mockInitialize.mockResolvedValue(undefined);
    mockListTools.mockResolvedValue([]);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: 'result' }],
    });
    mockListResources.mockResolvedValue([]);
    mockReadResource.mockResolvedValue({ contents: [] });
    mockShutdown.mockResolvedValue(undefined);

    prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
      },
      mcpServer: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      member: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([{ organizationId: 'org-1' }]),
      },
      oAuthToken: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      organization: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    registry = new McpRegistry();

    debugService = {
      createLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
      updateLog: vi.fn().mockResolvedValue({}),
    };

    service = new ProxyService(
      prisma as unknown as PrismaService,
      registry,
      debugService as unknown as DebugService,
    );
  });

  // =========================================================================
  // handleRequest
  // =========================================================================
  describe('handleRequest', () => {
    it('should throw NotFoundException when profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.handleRequest('nonexistent', makeRequest(), 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should route to handleInitialize for "initialize" method', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'initialize' }),
        'user-1',
      );

      expect(result.jsonrpc).toBe('2.0');
      expect(result.result).toHaveProperty('protocolVersion', '2024-11-05');
      expect(result.result).toHaveProperty('serverInfo');
    });

    it('should not create debug log for initialize method', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'initialize' }), 'user-1');

      expect(debugService.createLog).not.toHaveBeenCalled();
    });

    it('should create debug log for tools/list method', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(debugService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          profileId: 'profile-1',
          requestType: 'tools/list',
          status: 'pending',
        }),
      );
    });

    it('should update debug log with success after successful request', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should update debug log with error status when response has error', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'unknown/method' }),
        'user-1',
      );

      expect(result.error).toBeDefined();
      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          status: 'error',
          errorMessage: 'Method not found: unknown/method',
        }),
      );
    });

    it('should route to handleToolsList for "tools/list" method', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      expect(result.result).toHaveProperty('tools');
    });

    it('should route to handleToolsCall for "tools/call" method', async () => {
      const profileServer = makeProfileServer(
        { id: 'srv-1', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'myTool', isEnabled: true, customName: null }],
      );
      const profile = makeProfile({ mcpServers: [profileServer] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'myTool', description: 'A tool', inputSchema: {} },
      ]);
      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: 'done' }],
      });

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'myTool', arguments: { arg1: 'val' } },
        }),
        'user-1',
      );

      expect(result.result).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should route to handleResourcesList for "resources/list" method', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'resources/list' }),
        'user-1',
      );

      expect(result.result).toHaveProperty('resources');
    });

    it('should route to handleResourcesRead for "resources/read" method', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'resources/read',
          params: { uri: 'file:///test.txt' },
        }),
        'user-1',
      );

      // No servers, so resource not found
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Resource not found');
    });

    it('should return method not found for unknown methods', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'prompts/list' }),
        'user-1',
      );

      expect(result.error).toEqual({
        code: -32601,
        message: 'Method not found: prompts/list',
      });
    });

    it('should handle errors thrown during request handling', async () => {
      const profile = makeProfile({
        mcpServers: [
          makeProfileServer(
            { id: 'srv-err-1', type: 'external', config: '{"command":"node"}' },
            [],
          ),
        ],
      });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      expect(result.error).toEqual({
        code: -32603,
        message: 'Connection refused',
      });
    });

    it('should update debug log with error when handler throws', async () => {
      const profile = makeProfile({
        mcpServers: [
          makeProfileServer(
            { id: 'srv-err-2', type: 'external', config: '{"command":"node"}' },
            [],
          ),
        ],
      });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockRejectedValueOnce(new Error('Connection refused'));

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          status: 'error',
          errorMessage: 'Connection refused',
        }),
      );
    });

    it('should handle non-Error objects thrown during request handling', async () => {
      const profile = makeProfile({
        mcpServers: [
          makeProfileServer(
            { id: 'srv-err-3', type: 'external', config: '{"command":"node"}' },
            [],
          ),
        ],
      });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockRejectedValueOnce('string error');

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      expect(result.error?.message).toBe('Internal error');
    });

    it('should continue even if debug log creation fails', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);
      debugService.createLog.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      expect(result.jsonrpc).toBe('2.0');
      expect(result.result).toHaveProperty('tools');
    });

    it('should continue even if debug log update fails on success', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);
      debugService.updateLog.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      expect(result.jsonrpc).toBe('2.0');
      expect(result.result).toHaveProperty('tools');
    });

    it('should continue even if debug log update fails on error', async () => {
      const profile = makeProfile({
        mcpServers: [
          makeProfileServer(
            { id: 'srv-err-4', type: 'external', config: '{"command":"node"}' },
            [],
          ),
        ],
      });
      prisma.profile.findFirst.mockResolvedValue(profile);
      mockListTools.mockRejectedValueOnce(new Error('fail'));
      debugService.updateLog.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      expect(result.error).toBeDefined();
    });

    it('should preserve the request id in the response', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ id: 42, method: 'initialize' }),
        'user-1',
      );

      expect(result.id).toBe(42);
    });
  });

  // =========================================================================
  // handleInitialize
  // =========================================================================
  describe('handleInitialize', () => {
    it('should return protocol version, capabilities, and serverInfo', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'initialize' }),
        'user-1',
      );

      const res = result.result as Record<string, unknown>;
      expect(res.protocolVersion).toBe('2024-11-05');
      expect(res.capabilities).toEqual({ tools: {}, resources: {} });
      expect(res.serverInfo).toEqual({
        name: 'Local MCP Gateway',
        version: '0.1.0',
      });
    });
  });

  // =========================================================================
  // handleToolsList
  // =========================================================================
  describe('handleToolsList', () => {
    it('should aggregate tools from multiple servers', async () => {
      const ps1 = makeProfileServer(
        { id: 'srv-agg-1', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const ps2 = makeProfileServer(
        { id: 'srv-agg-2', type: 'external', config: '{"command":"python"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps1, ps2] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools
        .mockResolvedValueOnce([{ name: 'toolA', description: 'desc A', inputSchema: {} }])
        .mockResolvedValueOnce([{ name: 'toolB', description: 'desc B', inputSchema: {} }]);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(2);
      expect(tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'toolA' }),
          expect.objectContaining({ name: 'toolB' }),
        ]),
      );
    });

    it('should apply custom name from tool customization', async () => {
      const ps = makeProfileServer(
        { id: 'srv-cust-1', type: 'external', config: '{"command":"node"}' },
        [
          {
            toolName: 'originalTool',
            isEnabled: true,
            customName: 'renamedTool',
            customDescription: null,
          },
        ],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'originalTool', description: 'original desc', inputSchema: {} },
      ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(1);
      expect(tools[0]).toHaveProperty('name', 'renamedTool');
    });

    it('should apply custom description from tool customization', async () => {
      const ps = makeProfileServer(
        { id: 'srv-cust-2', type: 'external', config: '{"command":"node"}' },
        [
          {
            toolName: 'myTool',
            isEnabled: true,
            customName: null,
            customDescription: 'Custom description',
          },
        ],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'myTool', description: 'original desc', inputSchema: {} },
      ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools[0]).toHaveProperty('description', 'Custom description');
    });

    it('should exclude disabled tools', async () => {
      const ps = makeProfileServer(
        { id: 'srv-dis-1', type: 'external', config: '{"command":"node"}' },
        [
          { toolName: 'enabledTool', isEnabled: true, customName: null, customDescription: null },
          { toolName: 'disabledTool', isEnabled: false, customName: null, customDescription: null },
        ],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'enabledTool', description: 'desc', inputSchema: {} },
        { name: 'disabledTool', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(1);
      expect(tools[0]).toHaveProperty('name', 'enabledTool');
    });

    it('should include tools without customization', async () => {
      const ps = makeProfileServer(
        { id: 'srv-nocu-1', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'uncustomizedTool', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(1);
      expect(tools[0]).toHaveProperty('name', 'uncustomizedTool');
    });

    it('should skip servers that fail to get an instance', async () => {
      const ps = makeProfileServer(
        { id: 'srv-bad-type', type: 'unknown_type', config: '{}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(0);
    });
  });

  // =========================================================================
  // handleToolsCall
  // =========================================================================
  describe('handleToolsCall', () => {
    it('should call the correct tool on the correct server', async () => {
      const ps = makeProfileServer(
        { id: 'srv-call-1', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'myTool', isEnabled: true, customName: null }],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'myTool', description: 'desc', inputSchema: {} },
      ]);
      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: 'hello' }],
      });

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'myTool', arguments: { input: 'test' } },
        }),
        'user-1',
      );

      expect(mockCallTool).toHaveBeenCalledWith('myTool', { input: 'test' });
      expect(result.result).toEqual({
        content: [{ type: 'text', text: 'hello' }],
      });
    });

    it('should resolve custom name to original tool name', async () => {
      const ps = makeProfileServer(
        { id: 'srv-alias-1', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'originalName', isEnabled: true, customName: 'aliasName' }],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'originalName', description: 'desc', inputSchema: {} },
      ]);
      mockCallTool.mockResolvedValue({ content: [] });

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'aliasName', arguments: {} },
        }),
        'user-1',
      );

      expect(mockCallTool).toHaveBeenCalledWith('originalName', {});
      expect(result.error).toBeUndefined();
    });

    it('should skip disabled tools and return tool not found', async () => {
      const ps = makeProfileServer(
        { id: 'srv-dis-c1', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'disabledTool', isEnabled: false, customName: null }],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'disabledTool', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'disabledTool', arguments: {} },
        }),
        'user-1',
      );

      expect(result.error).toEqual({
        code: -32602,
        message: 'Tool not found: disabledTool',
      });
      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it('should return tool not found when no server has the tool', async () => {
      const ps = makeProfileServer(
        { id: 'srv-nf-1', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'otherTool', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'nonexistentTool', arguments: {} },
        }),
        'user-1',
      );

      expect(result.error).toEqual({
        code: -32602,
        message: 'Tool not found: nonexistentTool',
      });
    });

    it('should update debug log with mcpServerId when tool is found', async () => {
      const ps = makeProfileServer(
        { id: 'srv-42', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'myTool', isEnabled: true, customName: null }],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'myTool', description: 'desc', inputSchema: {} },
      ]);

      await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'myTool', arguments: {} },
        }),
        'user-1',
      );

      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({ mcpServerId: 'srv-42' }),
      );
    });

    it('should use empty object for arguments when not provided', async () => {
      const ps = makeProfileServer(
        { id: 'srv-noarg-1', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'myTool', isEnabled: true, customName: null }],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'myTool', description: 'desc', inputSchema: {} },
      ]);

      await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'myTool' },
        }),
        'user-1',
      );

      expect(mockCallTool).toHaveBeenCalledWith('myTool', {});
    });

    it('should coerce Merk search arrays and numbers from MCP strings', async () => {
      const ps = makeProfileServer(
        { id: 'srv-merk-1', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'merk_search_companies', isEnabled: true, customName: null }],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        {
          name: 'merk_search_companies',
          description: 'desc',
          inputSchema: SearchCompaniesSchema,
        },
      ]);
      mockCallTool.mockResolvedValue({ content: [] });

      await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: {
            name: 'merk_search_companies',
            arguments: {
              query: 'vyroba',
              limit: '10',
              ordering: '["name","-turnover_id"]',
              categories: '[1,2]',
              active_job_ads_count_from: '3',
            },
          },
        }),
        'user-1',
      );

      expect(mockCallTool).toHaveBeenCalledWith('merk_search_companies', {
        query: 'vyroba',
        limit: 10,
        ordering: ['name', '-turnover_id'],
        categories: [1, 2],
        active_job_ads_count_from: 3,
      });
    });

    it('should handle debug log update failure for mcpServerId gracefully', async () => {
      const ps = makeProfileServer(
        { id: 'srv-logfail-1', type: 'external', config: '{"command":"node"}' },
        [{ toolName: 'myTool', isEnabled: true, customName: null }],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'myTool', description: 'desc', inputSchema: {} },
      ]);

      debugService.updateLog.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'tools/call',
          params: { name: 'myTool', arguments: {} },
        }),
        'user-1',
      );

      expect(result.error).toBeUndefined();
    });
  });

  // =========================================================================
  // handleResourcesList
  // =========================================================================
  describe('handleResourcesList', () => {
    it('should aggregate resources from multiple servers', async () => {
      const ps1 = makeProfileServer(
        { id: 'srv-res-1', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const ps2 = makeProfileServer(
        { id: 'srv-res-2', type: 'external', config: '{"command":"python"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps1, ps2] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListResources
        .mockResolvedValueOnce([{ uri: 'file:///a.txt', name: 'File A' }])
        .mockResolvedValueOnce([
          { uri: 'file:///b.txt', name: 'File B', description: 'B file', mimeType: 'text/plain' },
        ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'resources/list' }),
        'user-1',
      );

      const resources = (result.result as { resources: unknown[] }).resources;
      expect(resources).toHaveLength(2);
    });

    it('should return empty resources when no servers have resources', async () => {
      const profile = makeProfile();
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'resources/list' }),
        'user-1',
      );

      const resources = (result.result as { resources: unknown[] }).resources;
      expect(resources).toHaveLength(0);
    });
  });

  // =========================================================================
  // handleResourcesRead
  // =========================================================================
  describe('handleResourcesRead', () => {
    it('should read resource from the first server that has it', async () => {
      const ps = makeProfileServer(
        { id: 'srv-rr-1', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockReadResource.mockResolvedValue({ contents: [{ text: 'file content' }] });

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'resources/read',
          params: { uri: 'file:///test.txt' },
        }),
        'user-1',
      );

      expect(result.result).toEqual({ contents: [{ text: 'file content' }] });
    });

    it('should try next server when first server throws on readResource', async () => {
      const ps1 = makeProfileServer(
        { id: 'srv-rr-2', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const ps2 = makeProfileServer(
        { id: 'srv-rr-3', type: 'external', config: '{"command":"python"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps1, ps2] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockReadResource
        .mockRejectedValueOnce(new Error('Not found'))
        .mockResolvedValueOnce({ contents: [{ text: 'found on second' }] });

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'resources/read',
          params: { uri: 'file:///test.txt' },
        }),
        'user-1',
      );

      expect(result.result).toEqual({ contents: [{ text: 'found on second' }] });
    });

    it('should return resource not found when no server has it', async () => {
      const ps = makeProfileServer(
        { id: 'srv-rr-4', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockReadResource.mockRejectedValue(new Error('Not found'));

      const result = await service.handleRequest(
        'default',
        makeRequest({
          method: 'resources/read',
          params: { uri: 'file:///nonexistent.txt' },
        }),
        'user-1',
      );

      expect(result.error).toEqual({
        code: -32602,
        message: 'Resource not found: file:///nonexistent.txt',
      });
    });
  });

  // =========================================================================
  // getToolsForServer
  // =========================================================================
  describe('getToolsForServer', () => {
    it('should throw NotFoundException when server not found', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(null);

      await expect(service.getToolsForServer('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when server instance cannot be created', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        id: 'srv-gts-1',
        type: 'unknown_type',
        config: '{}',
        apiKeyConfig: null,
      });

      const result = await service.getToolsForServer('srv-gts-1');
      expect(result).toEqual([]);
    });

    it('should return tools from the server instance', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        id: 'srv-gts-2',
        type: 'external',
        config: '{"command":"node"}',
        apiKeyConfig: null,
      });

      mockListTools.mockResolvedValue([
        { name: 'tool1', description: 'Tool 1', inputSchema: {} },
        { name: 'tool2', description: 'Tool 2', inputSchema: {} },
      ]);

      const result = await service.getToolsForServer('srv-gts-2');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('tool1');
    });
  });

  // =========================================================================
  // getServerInstance
  // =========================================================================
  describe('getServerInstance', () => {
    it('should return cached instance on second call', async () => {
      const ps = makeProfileServer(
        { id: 'srv-cache', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      // First call creates the instance
      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');
      const firstInitCount = mockInitialize.mock.calls.length;

      // Second call should use cache
      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');
      expect(mockInitialize.mock.calls.length).toBe(firstInitCount);
    });

    it('should create builtin server from registry', async () => {
      const builtinInstance = {
        initialize: mockInitialize,
        listTools: mockListTools,
        callTool: mockCallTool,
        listResources: mockListResources,
        readResource: mockReadResource,
      };
      const mockCreateServer = vi.fn().mockReturnValue(builtinInstance);
      registry.register({
        packageName: '@dxheroes/mcp-test',
        packagePath: '/mock/path/mcp-test',
        package: {
          metadata: {
            id: 'test-builtin',
            name: 'Test Builtin',
            description: 'Test',
            version: '1.0.0',
            requiresApiKey: false,
          },
          createServer: mockCreateServer,
        },
      });

      const ps = makeProfileServer(
        {
          id: 'srv-builtin',
          type: 'builtin',
          config: '{"builtinId":"test-builtin"}',
          apiKeyConfig: '{"apiKey":"key123"}',
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(mockCreateServer).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'key123' }),
      );
      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should create RemoteHttpMcpServer for remote_http type', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-http',
          type: 'remote_http',
          config: '{"url":"http://example.com/mcp","transport":"http"}',
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(remoteHttpCtorArgs).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'http://example.com/mcp', transport: 'http' }),
        null,
        null,
      );
    });

    it('should look up OAuth token for remote_http servers', async () => {
      const now = new Date();
      prisma.oAuthToken.findUnique.mockResolvedValue({
        id: 'token-1',
        mcpServerId: 'srv-http-oauth',
        accessToken: 'access-123',
        tokenType: 'Bearer',
        refreshToken: 'refresh-456',
        scope: 'read write',
        expiresAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const ps = makeProfileServer(
        {
          id: 'srv-http-oauth',
          type: 'remote_http',
          config: '{"url":"http://example.com/mcp","transport":"http"}',
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(remoteHttpCtorArgs).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          accessToken: 'access-123',
          tokenType: 'Bearer',
          refreshToken: 'refresh-456',
          scope: 'read write',
        }),
        null,
      );
    });

    it('should create RemoteSseMcpServer for remote_sse type', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-sse',
          type: 'remote_sse',
          config: '{"url":"http://example.com/sse","transport":"sse"}',
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(remoteSseCtorArgs).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'http://example.com/sse', transport: 'sse' }),
        null,
        null,
      );
    });

    it('should look up OAuth token for remote_sse servers', async () => {
      const now = new Date();
      prisma.oAuthToken.findUnique.mockResolvedValue({
        id: 'token-2',
        mcpServerId: 'srv-sse-oauth',
        accessToken: 'sse-access',
        tokenType: 'Bearer',
        refreshToken: null,
        scope: null,
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      });

      const ps = makeProfileServer(
        {
          id: 'srv-sse-oauth',
          type: 'remote_sse',
          config: '{"url":"http://example.com/sse","transport":"sse"}',
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(remoteSseCtorArgs).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          accessToken: 'sse-access',
          refreshToken: undefined,
          scope: undefined,
        }),
        null,
      );
    });

    it('should create ExternalMcpServer for external type', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-ext',
          type: 'external',
          config: JSON.stringify({
            command: 'npx',
            args: ['-y', 'some-server'],
            env: { FOO: 'bar' },
            workingDirectory: '/tmp',
            autoRestart: true,
            maxRestartAttempts: 3,
            startupTimeout: 5000,
            shutdownTimeout: 3000,
          }),
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(externalCtorArgs).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'npx',
          args: ['-y', 'some-server'],
          env: { FOO: 'bar' },
          workingDirectory: '/tmp',
          autoRestart: true,
          maxRestartAttempts: 3,
          startupTimeout: 5000,
          shutdownTimeout: 3000,
        }),
      );
    });

    it('should return null for unknown server type', async () => {
      const ps = makeProfileServer(
        { id: 'srv-unknown', type: 'custom', config: '{}', apiKeyConfig: null },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(0);
    });

    it('should handle config as object (not string)', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-obj-config',
          type: 'external',
          config: { command: 'node', args: ['server.js'] },
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'tool1', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(1);
    });
  });

  // =========================================================================
  // convertApiKeyConfig
  // =========================================================================
  describe('convertApiKeyConfig', () => {
    it('should return null when apiKeyConfig is null', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-no-key',
          type: 'remote_http',
          config: '{"url":"http://example.com","transport":"http"}',
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      // 3rd arg (apiKeyConfig) should be null since no apiKey was provided
      const callArgs = remoteHttpCtorArgs.mock.calls[0];
      expect(callArgs[2]).toBeNull();
    });

    it('should use default Authorization header with Bearer template', async () => {
      const builtinInstance = {
        initialize: mockInitialize,
        listTools: mockListTools,
        callTool: mockCallTool,
        listResources: mockListResources,
        readResource: mockReadResource,
      };
      const mockCreateServer = vi.fn().mockReturnValue(builtinInstance);
      registry.register({
        packageName: '@dxheroes/mcp-test-api',
        packagePath: '/mock/path/mcp-test-api',
        package: {
          metadata: {
            id: 'api-test',
            name: 'API Test',
            description: 'Test',
            version: '1.0.0',
            requiresApiKey: false,
          },
          createServer: mockCreateServer,
        },
      });

      const ps = makeProfileServer(
        {
          id: 'srv-api',
          type: 'builtin',
          config: '{"builtinId":"api-test"}',
          apiKeyConfig: '{"apiKey":"my-secret-key"}',
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(mockCreateServer).toHaveBeenCalledWith({
        apiKey: 'my-secret-key',
        headerName: 'Authorization',
        headerValue: 'Bearer my-secret-key',
      });
    });

    it('should use custom headerName and template', async () => {
      const builtinInstance = {
        initialize: mockInitialize,
        listTools: mockListTools,
        callTool: mockCallTool,
        listResources: mockListResources,
        readResource: mockReadResource,
      };
      const mockCreateServer = vi.fn().mockReturnValue(builtinInstance);
      registry.register({
        packageName: '@dxheroes/mcp-custom-api',
        packagePath: '/mock/path/mcp-custom-api',
        package: {
          metadata: {
            id: 'custom-api',
            name: 'Custom API',
            description: 'Test',
            version: '1.0.0',
            requiresApiKey: false,
          },
          createServer: mockCreateServer,
        },
      });

      const ps = makeProfileServer(
        {
          id: 'srv-custom-api',
          type: 'builtin',
          config: '{"builtinId":"custom-api"}',
          apiKeyConfig: JSON.stringify({
            apiKey: 'custom-key',
            headerName: 'X-API-Key',
            headerValueTemplate: '{apiKey}',
          }),
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(mockCreateServer).toHaveBeenCalledWith({
        apiKey: 'custom-key',
        headerName: 'X-API-Key',
        headerValue: 'custom-key',
      });
    });

    it('should return null when apiKey is empty string', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-empty-key',
          type: 'remote_http',
          config: '{"url":"http://example.com","transport":"http"}',
          apiKeyConfig: '{"apiKey":""}',
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      // 3rd arg (apiKeyConfig) should be null since apiKey is empty string
      const callArgs = remoteHttpCtorArgs.mock.calls[0];
      expect(callArgs[2]).toBeNull();
    });
  });

  // =========================================================================
  // parseJson
  // =========================================================================
  describe('parseJson', () => {
    it('should parse valid JSON string config', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-json',
          type: 'external',
          config: '{"command":"node","args":["app.js"]}',
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(externalCtorArgs).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'node', args: ['app.js'] }),
      );
    });

    it('should handle object config (not stringified)', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-obj',
          type: 'external',
          config: { command: 'python', args: ['server.py'] },
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      await service.handleRequest('default', makeRequest({ method: 'tools/list' }), 'user-1');

      expect(externalCtorArgs).toHaveBeenCalledWith(
        expect.objectContaining({ command: 'python', args: ['server.py'] }),
      );
    });

    it('should return null for invalid JSON string', async () => {
      const ps = makeProfileServer(
        {
          id: 'srv-bad-json',
          type: 'external',
          config: 'not valid json {{{',
          apiKeyConfig: null,
        },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'tools/list' }),
        'user-1',
      );

      const tools = (result.result as { tools: unknown[] }).tools;
      expect(tools).toHaveLength(0);
    });
  });

  // =========================================================================
  // findProfileByName
  // =========================================================================
  describe('findProfileByName', () => {
    it('should find profile by name for authenticated user', async () => {
      const profile = makeProfile({ name: 'my-profile' });
      prisma.member.findMany.mockResolvedValue([{ organizationId: 'org-1' }]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'my-profile',
        makeRequest({ method: 'initialize' }),
        'user-1',
      );

      expect(result.result).toBeDefined();
      expect(prisma.member.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { organizationId: true },
      });
    });

    it('should throw NotFoundException when profile not found', async () => {
      prisma.member.findMany.mockResolvedValue([{ organizationId: 'org-1' }]);
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.handleRequest('missing', makeRequest(), 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user has no org memberships', async () => {
      prisma.member.findMany.mockResolvedValue([]);

      await expect(
        service.handleRequest('default', makeRequest(), 'user-no-org'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should search across all user org memberships', async () => {
      const profile = makeProfile({ organizationId: 'org-2' });
      prisma.member.findMany.mockResolvedValue([
        { organizationId: 'org-1' },
        { organizationId: 'org-2' },
      ]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.handleRequest(
        'default',
        makeRequest({ method: 'initialize' }),
        'user-1',
      );

      expect(result.result).toBeDefined();
      expect(prisma.profile.findFirst).toHaveBeenCalledWith({
        where: { name: 'default', organizationId: { in: ['org-1', 'org-2'] } },
        include: expect.anything(),
      });
    });
  });

  // =========================================================================
  // handleRequestByOrgSlug
  // =========================================================================
  describe('handleRequestByOrgSlug', () => {
    it('should resolve org slug and find profile', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(
        makeProfile({ id: 'p-org', name: 'my-profile' }),
      );

      const result = await service.handleRequestByOrgSlug(
        'my-profile',
        'my-org',
        makeRequest({ method: 'initialize' }),
      );

      expect(result.result).toHaveProperty('protocolVersion');
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: 'my-org' },
        select: { id: true },
      });
    });

    it('should throw NotFoundException when org slug not found', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.handleRequestByOrgSlug(
          'my-profile',
          'nonexistent-org',
          makeRequest({ method: 'initialize' }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when profile not found in org', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.handleRequestByOrgSlug(
          'nonexistent',
          'my-org',
          makeRequest({ method: 'initialize' }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when org profile not found', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.handleRequestByOrgSlug(
          'missing-profile',
          'my-org',
          makeRequest({ method: 'initialize' }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create debug log for non-initialize methods', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(makeProfile());

      await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'tools/list' }),
      );

      expect(debugService.createLog).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending', requestType: 'tools/list' }),
      );
    });

    it('should skip debug log for initialize method', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(makeProfile());

      await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'initialize' }),
      );

      expect(debugService.createLog).not.toHaveBeenCalled();
    });

    it('should route to correct handler for all methods', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(makeProfile());

      const listResult = await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'tools/list' }),
      );
      expect(listResult.result).toHaveProperty('tools');

      const resResult = await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'resources/list' }),
      );
      expect(resResult.result).toHaveProperty('resources');

      const unknownResult = await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'unknown/method' }),
      );
      expect(unknownResult.error?.code).toBe(-32601);
    });

    it('should handle errors and update debug log', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });

      const ps = makeProfileServer(
        { id: 'srv-org-err', type: 'external', config: '{"command":"node"}' },
        [],
      );
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ mcpServers: [ps] }));

      mockListTools.mockRejectedValueOnce(new Error('Server crashed'));

      const result = await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'tools/list' }),
      );

      expect(result.error).toEqual({ code: -32603, message: 'Server crashed' });
      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({ status: 'error', errorMessage: 'Server crashed' }),
      );
    });

    it('should handle debug log creation failure gracefully', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      debugService.createLog.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'tools/list' }),
      );

      expect(result.result).toHaveProperty('tools');
    });

    it('should handle debug log update failure on error gracefully', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      const ps = makeProfileServer(
        { id: 'srv-org-logfail', type: 'external', config: '{"command":"node"}' },
        [],
      );
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ mcpServers: [ps] }));

      mockListTools.mockRejectedValueOnce(new Error('Fail'));
      debugService.updateLog.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'tools/list' }),
      );

      expect(result.error).toBeDefined();
    });

    it('should handle non-Error thrown in catch block', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      const ps = makeProfileServer(
        { id: 'srv-org-nonErr', type: 'external', config: '{"command":"node"}' },
        [],
      );
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ mcpServers: [ps] }));

      mockListTools.mockRejectedValueOnce(42);

      const result = await service.handleRequestByOrgSlug(
        'default',
        'my-org',
        makeRequest({ method: 'tools/list' }),
      );

      expect(result.error?.message).toBe('Internal error');
    });
  });

  // =========================================================================
  // getProfileInfo
  // =========================================================================
  describe('getProfileInfo', () => {
    it('should throw NotFoundException when profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.getProfileInfo('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should return aggregated tools and server status', async () => {
      const ps = makeProfileServer(
        { id: 'srv-info-1', type: 'external', config: '{"command":"node"}' },
        [
          {
            toolName: 'tool1',
            isEnabled: true,
            customName: 'renamedTool1',
            customDescription: 'Custom desc',
          },
        ],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'tool1', description: 'Original desc', inputSchema: {} },
      ]);

      const result = await service.getProfileInfo('default', 'user-1');

      expect(result.tools).toHaveLength(1);
      expect(result.tools[0]).toEqual({ name: 'renamedTool1', description: 'Custom desc' });
      expect(result.serverStatus.total).toBe(1);
      expect(result.serverStatus.connected).toBe(1);
      expect(result.serverStatus.servers['srv-info-1']).toEqual({
        connected: true,
        toolCount: 1,
      });
    });

    it('should exclude disabled tools from aggregated tools', async () => {
      const ps = makeProfileServer(
        { id: 'srv-info-2', type: 'external', config: '{"command":"node"}' },
        [
          { toolName: 'enabled', isEnabled: true, customName: null, customDescription: null },
          { toolName: 'disabled', isEnabled: false, customName: null, customDescription: null },
        ],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'enabled', description: 'desc', inputSchema: {} },
        { name: 'disabled', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.getProfileInfo('default', 'user-1');

      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('enabled');
    });

    it('should show connected: false for servers that cannot create instance', async () => {
      const ps = makeProfileServer(
        { id: 'srv-info-bad', type: 'unknown_type', config: '{}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.getProfileInfo('default', 'user-1');

      expect(result.serverStatus.connected).toBe(0);
      expect(result.serverStatus.servers['srv-info-bad']).toEqual({
        connected: false,
        toolCount: 0,
      });
    });
  });

  // =========================================================================
  // getProfileInfoByOrgSlug
  // =========================================================================
  describe('getProfileInfoByOrgSlug', () => {
    it('should resolve org and return aggregated profile info', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      const ps = makeProfileServer(
        { id: 'srv-orginfo-1', type: 'external', config: '{"command":"node"}' },
        [],
      );
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ mcpServers: [ps] }));

      mockListTools.mockResolvedValue([
        { name: 'tool1', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.getProfileInfoByOrgSlug('default', 'my-org');

      expect(result.tools).toHaveLength(1);
      expect(result.serverStatus.total).toBe(1);
    });

    it('should throw NotFoundException when org not found', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.getProfileInfoByOrgSlug('default', 'no-org')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when profile not found in org', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.getProfileInfoByOrgSlug('missing', 'my-org')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // aggregateProfileInfo
  // =========================================================================
  describe('aggregateProfileInfo', () => {
    it('should handle failed server connections gracefully', async () => {
      const ps1 = makeProfileServer(
        { id: 'srv-aggr-1', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const ps2 = makeProfileServer(
        { id: 'srv-aggr-2', type: 'external', config: '{"command":"failing"}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps1, ps2] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools
        .mockResolvedValueOnce([{ name: 'goodTool', description: 'desc', inputSchema: {} }])
        .mockRejectedValueOnce(new Error('Connection failed'));

      const result = await service.getProfileInfo('default', 'user-1');

      expect(result.serverStatus.total).toBe(2);
      expect(result.tools.length).toBeGreaterThanOrEqual(1);
    });

    it('should include tools from connected servers only', async () => {
      const ps1 = makeProfileServer(
        { id: 'srv-aggr-3', type: 'external', config: '{"command":"node"}' },
        [],
      );
      const ps2 = makeProfileServer(
        { id: 'srv-aggr-4', type: 'unknown_no_instance', config: '{}' },
        [],
      );
      const profile = makeProfile({ mcpServers: [ps1, ps2] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      mockListTools.mockResolvedValue([
        { name: 'connectedTool', description: 'desc', inputSchema: {} },
      ]);

      const result = await service.getProfileInfo('default', 'user-1');

      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].name).toBe('connectedTool');
      expect(result.serverStatus.servers['srv-aggr-3'].connected).toBe(true);
      expect(result.serverStatus.servers['srv-aggr-4'].connected).toBe(false);
    });

    it('should handle empty profile (no servers)', async () => {
      const profile = makeProfile({ mcpServers: [] });
      prisma.profile.findFirst.mockResolvedValue(profile);

      const result = await service.getProfileInfo('default', 'user-1');

      expect(result.tools).toHaveLength(0);
      expect(result.serverStatus.total).toBe(0);
      expect(result.serverStatus.connected).toBe(0);
    });
  });
});
