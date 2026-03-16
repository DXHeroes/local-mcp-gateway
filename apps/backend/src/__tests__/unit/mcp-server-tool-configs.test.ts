/**
 * Tests for McpService — server-level tool configurations (allowlist)
 */

import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpService } from '../../modules/mcp/mcp.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import type { SharingService } from '../../modules/sharing/sharing.service.js';

// Mock @dxheroes/local-mcp-core
const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockListTools = vi.fn().mockResolvedValue([
  { name: 'read_file', description: 'Read a file' },
  { name: 'write_file', description: 'Write a file' },
  { name: 'delete_file', description: 'Delete a file' },
]);
const mockShutdown = vi.fn().mockResolvedValue(undefined);

vi.mock('@dxheroes/local-mcp-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dxheroes/local-mcp-core')>();
  return {
    ...actual,
    ExternalMcpServer: class MockExternalMcpServer {
      config: unknown;
      constructor(config: unknown) {
        this.config = config;
      }
      initialize = mockInitialize;
      listTools = mockListTools;
      shutdown = mockShutdown;
    },
    RemoteHttpMcpServer: class MockRemoteHttpMcpServer {
      config: unknown;
      constructor(config: unknown) {
        this.config = config;
      }
      initialize = mockInitialize;
      listTools = mockListTools;
    },
    RemoteSseMcpServer: class MockRemoteSseMcpServer {
      config: unknown;
      constructor(config: unknown) {
        this.config = config;
      }
      initialize = mockInitialize;
      listTools = mockListTools;
    },
  };
});

describe('McpService — Tool Configs', () => {
  let service: McpService;
  // biome-ignore lint: test mock
  let prisma: any;
  let registry: McpRegistry;
  let debugService: Record<string, ReturnType<typeof vi.fn>>;
  let sharingService: Record<string, ReturnType<typeof vi.fn>>;

  const server = {
    id: 'srv-1',
    name: 'Test Server',
    type: 'remote_http',
    config: '{"url":"https://example.com/mcp"}',
    apiKeyConfig: null,
    oauthConfig: null,
    userId: 'user-a',
    profiles: [],
    oauthToken: null,
    toolsCache: [],
  };

  beforeEach(() => {
    prisma = {
      mcpServer: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'new-1' }),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue(undefined),
      },
      member: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      mcpServerToolsCache: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      mcpServerToolConfig: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn(prisma);
      }),
    };
    registry = new McpRegistry();
    debugService = {
      createLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
      updateLog: vi.fn().mockResolvedValue({}),
    };
    sharingService = {
      getSharedResourceIds: vi.fn().mockResolvedValue([]),
      isSharedWith: vi.fn().mockResolvedValue(false),
      getPermission: vi.fn().mockResolvedValue(null),
    };
    service = new McpService(
      prisma as unknown as PrismaService,
      registry,
      debugService as unknown as DebugService,
      sharingService as unknown as SharingService
    );
  });

  describe('getServerToolConfigs', () => {
    it('returns all tools as enabled when no configs exist (unconfigured server)', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServerToolConfig.findMany.mockResolvedValue([]);

      const result = await service.getServerToolConfigs('srv-1', 'user-a');

      expect(result.hasConfigs).toBe(false);
      expect(result.tools).toHaveLength(3);
      expect(result.tools.every((t: { isEnabled: boolean }) => t.isEnabled)).toBe(true);
    });

    it('returns tools with config records using their isEnabled value', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServerToolConfig.findMany.mockResolvedValue([
        { id: 'tc-1', mcpServerId: 'srv-1', toolName: 'read_file', isEnabled: true },
        { id: 'tc-2', mcpServerId: 'srv-1', toolName: 'write_file', isEnabled: false },
        { id: 'tc-3', mcpServerId: 'srv-1', toolName: 'delete_file', isEnabled: false },
      ]);

      const result = await service.getServerToolConfigs('srv-1', 'user-a');

      expect(result.hasConfigs).toBe(true);
      expect(result.tools).toHaveLength(3);

      const readFile = result.tools.find((t: { name: string }) => t.name === 'read_file');
      const writeFile = result.tools.find((t: { name: string }) => t.name === 'write_file');
      const deleteFile = result.tools.find((t: { name: string }) => t.name === 'delete_file');

      expect(readFile?.isEnabled).toBe(true);
      expect(writeFile?.isEnabled).toBe(false);
      expect(deleteFile?.isEnabled).toBe(false);
    });

    it('treats new tools (no config record) as disabled when configs exist', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      // Only read_file has a config — write_file and delete_file are "new"
      prisma.mcpServerToolConfig.findMany.mockResolvedValue([
        { id: 'tc-1', mcpServerId: 'srv-1', toolName: 'read_file', isEnabled: true },
      ]);

      const result = await service.getServerToolConfigs('srv-1', 'user-a');

      expect(result.hasConfigs).toBe(true);

      const readFile = result.tools.find((t: { name: string }) => t.name === 'read_file');
      const writeFile = result.tools.find((t: { name: string }) => t.name === 'write_file');
      const deleteFile = result.tools.find((t: { name: string }) => t.name === 'delete_file');

      expect(readFile?.isEnabled).toBe(true);
      expect(readFile?.hasConfig).toBe(true);
      expect(writeFile?.isEnabled).toBe(false);
      expect(writeFile?.hasConfig).toBe(false);
      expect(deleteFile?.isEnabled).toBe(false);
      expect(deleteFile?.hasConfig).toBe(false);
    });

    it('throws ForbiddenException for non-owner without sharing', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      await expect(service.getServerToolConfigs('srv-1', 'user-b')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('allows non-owner with sharing to view configs', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      sharingService.isSharedWith.mockResolvedValue(true);
      prisma.mcpServerToolConfig.findMany.mockResolvedValue([]);

      const result = await service.getServerToolConfigs('srv-1', 'user-b');

      expect(result.tools).toHaveLength(3);
    });
  });

  describe('updateServerToolConfigs', () => {
    it('creates config records for all tools in a transaction', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServerToolConfig.findMany.mockResolvedValue([
        { id: 'tc-1', mcpServerId: 'srv-1', toolName: 'read_file', isEnabled: true },
        { id: 'tc-2', mcpServerId: 'srv-1', toolName: 'write_file', isEnabled: false },
        { id: 'tc-3', mcpServerId: 'srv-1', toolName: 'delete_file', isEnabled: false },
      ]);

      await service.updateServerToolConfigs(
        'srv-1',
        [
          { toolName: 'read_file', isEnabled: true },
          { toolName: 'write_file', isEnabled: false },
          { toolName: 'delete_file', isEnabled: false },
        ],
        'user-a'
      );

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.mcpServerToolConfig.deleteMany).toHaveBeenCalledWith({
        where: { mcpServerId: 'srv-1' },
      });
      expect(prisma.mcpServerToolConfig.createMany).toHaveBeenCalledWith({
        data: [
          { mcpServerId: 'srv-1', toolName: 'read_file', isEnabled: true },
          { mcpServerId: 'srv-1', toolName: 'write_file', isEnabled: false },
          { mcpServerId: 'srv-1', toolName: 'delete_file', isEnabled: false },
        ],
      });
    });

    it('throws ForbiddenException for non-owner', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      await expect(
        service.updateServerToolConfigs(
          'srv-1',
          [{ toolName: 'read_file', isEnabled: true }],
          'user-b'
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin shared user to update configs', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      sharingService.getPermission.mockResolvedValue('admin');
      sharingService.isSharedWith.mockResolvedValue(true);
      prisma.mcpServerToolConfig.findMany.mockResolvedValue([
        { id: 'tc-1', mcpServerId: 'srv-1', toolName: 'read_file', isEnabled: true },
      ]);

      const result = await service.updateServerToolConfigs(
        'srv-1',
        [{ toolName: 'read_file', isEnabled: true }],
        'user-b'
      );

      expect(result.tools).toBeDefined();
    });
  });
});
