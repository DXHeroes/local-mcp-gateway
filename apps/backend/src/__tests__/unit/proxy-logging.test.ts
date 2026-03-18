/**
 * Tests for ProxyService structured MCP logging
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';

const { mockStructuredLogger } = vi.hoisted(() => ({
  mockStructuredLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../common/logging/app-logger.js', () => ({
  appLogger: mockStructuredLogger,
}));

const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockListTools = vi.fn().mockResolvedValue([]);
const mockCallTool = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: 'result' }],
});
const mockListResources = vi.fn().mockResolvedValue([]);
const mockReadResource = vi.fn().mockResolvedValue({ contents: [] });

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
    },
    RemoteHttpMcpServer: class MockRemoteHttpMcpServer {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
    },
    RemoteSseMcpServer: class MockRemoteSseMcpServer {
      initialize = mockInitialize;
      listTools = mockListTools;
      callTool = mockCallTool;
      listResources = mockListResources;
      readResource = mockReadResource;
    },
  };
});

import type { McpRequest } from '../../modules/proxy/proxy.service.js';
import { ProxyService } from '../../modules/proxy/proxy.service.js';

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

function makeProfileServer(tools: unknown[] = []) {
  return {
    isActive: true,
    order: 0,
    mcpServer: {
      id: 'srv-1',
      name: 'Test Server',
      type: 'external',
      config: '{"command":"node","args":["server.js"]}',
      apiKeyConfig: null,
      toolConfigs: [],
    },
    tools,
  };
}

describe('ProxyService MCP structured logging', () => {
  let service: ProxyService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let debugService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      member: {
        findMany: vi.fn().mockResolvedValue([{ organizationId: 'org-1' }]),
      },
      oAuthToken: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    debugService = {
      createLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
      updateLog: vi.fn().mockResolvedValue({}),
    };

    service = new ProxyService(
      prisma as unknown as PrismaService,
      new McpRegistry(),
      debugService as unknown as DebugService
    );
  });

  it('emits structured start and completion events for tools/call', async () => {
    prisma.profile.findFirst.mockResolvedValue(
      makeProfile({
        mcpServers: [
          makeProfileServer([{ toolName: 'search', isEnabled: true, customName: null }]),
        ],
      })
    );
    mockListTools.mockResolvedValue([{ name: 'search', description: 'Search', inputSchema: {} }]);

    await service.handleRequest(
      'default',
      {
        jsonrpc: '2.0',
        id: 'req-1',
        method: 'tools/call',
        params: { name: 'search', arguments: { q: 'hello' } },
      } as McpRequest,
      'user-1'
    );

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mcp.request.started',
        mcpRequestId: 'req-1',
        method: 'tools/call',
        profileId: 'profile-1',
      }),
      'MCP request started'
    );
    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mcp.tool.call.completed',
        mcpRequestId: 'req-1',
        profileId: 'profile-1',
        mcpServerId: 'srv-1',
        toolName: 'search',
        status: 'success',
      }),
      'MCP tool call completed'
    );
  });

  it('emits a structured tools/list completion event with aggregated counts', async () => {
    prisma.profile.findFirst.mockResolvedValue(
      makeProfile({
        mcpServers: [makeProfileServer()],
      })
    );
    mockListTools.mockResolvedValue([
      { name: 'tool-a', description: 'A', inputSchema: {} },
      { name: 'tool-b', description: 'B', inputSchema: {} },
    ]);

    await service.handleRequest(
      'default',
      { jsonrpc: '2.0', id: 'req-2', method: 'tools/list' } as McpRequest,
      'user-1'
    );

    expect(mockStructuredLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mcp.tools.list.completed',
        mcpRequestId: 'req-2',
        profileId: 'profile-1',
        toolCount: 2,
        serverCount: 1,
        status: 'success',
      }),
      'MCP tools list completed'
    );
  });
});
