/**
 * Tests for ProxyService — server-level tool filtering (allowlist)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import type { McpRequest, McpResponse } from '../../modules/proxy/proxy.service.js';
import { ProxyService } from '../../modules/proxy/proxy.service.js';

// Helper to access result.tools safely
const getTools = (response: McpResponse) =>
  (response.result as { tools: Array<{ name: string }> })?.tools ?? [];

// ---- Mock @dxheroes/local-mcp-core ----
const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockListTools = vi.fn().mockResolvedValue([]);
const mockCallTool = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'result' }],
});
const mockListResources = vi.fn().mockResolvedValue([]);
const mockReadResource = vi.fn().mockResolvedValue({ contents: [] });
const mockShutdown = vi.fn().mockResolvedValue(undefined);

vi.mock('@dxheroes/local-mcp-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dxheroes/local-mcp-core')>();
  return {
    ...actual,
    ExternalMcpServer: class {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
      shutdown = mockShutdown;
    },
    RemoteHttpMcpServer: class {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
    },
    RemoteSseMcpServer: class {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
    },
  };
});

function makeProfile(mcpServers: unknown[]) {
  return {
    id: 'profile-1',
    name: 'default',
    organizationId: 'org-1',
    userId: 'user-1',
    mcpServers,
  };
}

function makeProfileServer(
  toolConfigs?: Array<{ toolName: string; isEnabled: boolean }>,
  profileTools: unknown[] = []
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
      toolConfigs: toolConfigs ?? [],
    },
    tools: profileTools,
  };
}

describe('ProxyService — Server Tool Filtering', () => {
  let service: ProxyService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let registry: McpRegistry;
  let debugService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitialize.mockResolvedValue(undefined);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: 'result' }],
    });

    prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      member: {
        findMany: vi.fn().mockResolvedValue([{ organizationId: 'org-1' }]),
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
      debugService as unknown as DebugService
    );
  });

  describe('tools/list — server-level filtering', () => {
    it('returns all tools when server has no tool configs (backwards compat)', async () => {
      mockListTools.mockResolvedValue([
        { name: 'read_file', description: 'Read', inputSchema: {} },
        { name: 'write_file', description: 'Write', inputSchema: {} },
      ]);

      const profile = makeProfile([makeProfileServer([], [])]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const response = await service.handleRequest(
        'default',
        { jsonrpc: '2.0', id: 1, method: 'tools/list' } as McpRequest,
        'user-1'
      );

      expect(getTools(response)).toHaveLength(2);
    });

    it('filters out disabled tools based on server tool configs', async () => {
      mockListTools.mockResolvedValue([
        { name: 'read_file', description: 'Read', inputSchema: {} },
        { name: 'write_file', description: 'Write', inputSchema: {} },
        { name: 'delete_file', description: 'Delete', inputSchema: {} },
      ]);

      const toolConfigs = [
        { toolName: 'read_file', isEnabled: true },
        { toolName: 'write_file', isEnabled: false },
        { toolName: 'delete_file', isEnabled: false },
      ];

      const profile = makeProfile([makeProfileServer(toolConfigs, [])]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const response = await service.handleRequest(
        'default',
        { jsonrpc: '2.0', id: 1, method: 'tools/list' } as McpRequest,
        'user-1'
      );

      expect(getTools(response)).toHaveLength(1);
      expect(getTools(response)[0].name).toBe('read_file');
    });

    it('blocks new tools (not in configs) when configs exist', async () => {
      mockListTools.mockResolvedValue([
        { name: 'read_file', description: 'Read', inputSchema: {} },
        { name: 'brand_new_tool', description: 'New', inputSchema: {} },
      ]);

      // Only read_file is configured — brand_new_tool has no record
      const toolConfigs = [{ toolName: 'read_file', isEnabled: true }];

      const profile = makeProfile([makeProfileServer(toolConfigs, [])]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const response = await service.handleRequest(
        'default',
        { jsonrpc: '2.0', id: 1, method: 'tools/list' } as McpRequest,
        'user-1'
      );

      expect(getTools(response)).toHaveLength(1);
      expect(getTools(response)[0].name).toBe('read_file');
    });

    it('server filter + profile filter stack correctly', async () => {
      mockListTools.mockResolvedValue([
        { name: 'read_file', description: 'Read', inputSchema: {} },
        { name: 'write_file', description: 'Write', inputSchema: {} },
        { name: 'delete_file', description: 'Delete', inputSchema: {} },
      ]);

      // Server allows read_file and write_file
      const toolConfigs = [
        { toolName: 'read_file', isEnabled: true },
        { toolName: 'write_file', isEnabled: true },
        { toolName: 'delete_file', isEnabled: false },
      ];

      // Profile additionally disables write_file
      const profileTools = [
        { toolName: 'write_file', isEnabled: false, customName: null, customDescription: null },
      ];

      const profile = makeProfile([makeProfileServer(toolConfigs, profileTools)]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const response = await service.handleRequest(
        'default',
        { jsonrpc: '2.0', id: 1, method: 'tools/list' } as McpRequest,
        'user-1'
      );

      // Only read_file passes both filters
      expect(getTools(response)).toHaveLength(1);
      expect(getTools(response)[0].name).toBe('read_file');
    });
  });

  describe('tools/call — server-level filtering', () => {
    it('blocks execution of disabled tools', async () => {
      mockListTools.mockResolvedValue([
        { name: 'read_file', description: 'Read', inputSchema: {} },
        { name: 'write_file', description: 'Write', inputSchema: {} },
      ]);

      const toolConfigs = [
        { toolName: 'read_file', isEnabled: true },
        { toolName: 'write_file', isEnabled: false },
      ];

      const profile = makeProfile([makeProfileServer(toolConfigs, [])]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const response = await service.handleRequest(
        'default',
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'write_file', arguments: {} },
        } as McpRequest,
        'user-1'
      );

      // Should return error (tool not found because it's filtered)
      expect(response.error || (response.result as { isError?: boolean })?.isError).toBeTruthy();
      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it('allows execution of enabled tools', async () => {
      mockListTools.mockResolvedValue([
        { name: 'read_file', description: 'Read', inputSchema: {} },
      ]);

      const toolConfigs = [{ toolName: 'read_file', isEnabled: true }];

      const profile = makeProfile([makeProfileServer(toolConfigs, [])]);
      prisma.profile.findFirst.mockResolvedValue(profile);

      const response = await service.handleRequest(
        'default',
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'read_file', arguments: {} },
        } as McpRequest,
        'user-1'
      );

      expect(mockCallTool).toHaveBeenCalledWith('read_file', {});
      expect(response.result).toBeDefined();
      expect(response.error).toBeUndefined();
    });
  });
});
