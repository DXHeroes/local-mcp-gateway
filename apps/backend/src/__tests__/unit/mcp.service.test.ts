/**
 * Tests for McpService — per-user ownership with sharing
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpService } from '../../modules/mcp/mcp.service.js';
import { MCP_PRESETS } from '../../modules/mcp/mcp-presets.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';
import type { SharingService } from '../../modules/sharing/sharing.service.js';

// ---- Mock @dxheroes/local-mcp-core server classes ----
const mockInitialize = vi.fn().mockResolvedValue(undefined);
const mockListTools = vi.fn().mockResolvedValue([{ name: 'tool1' }, { name: 'tool2' }]);
const mockShutdown = vi.fn().mockResolvedValue(undefined);
const mockValidate = vi.fn().mockResolvedValue({ valid: true });

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
      oauthToken: unknown;
      apiKeyConfig: unknown;
      constructor(config: unknown, oauthToken: unknown, apiKeyConfig: unknown) {
        this.config = config;
        this.oauthToken = oauthToken;
        this.apiKeyConfig = apiKeyConfig;
      }
      initialize = mockInitialize;
      listTools = mockListTools;
    },
    RemoteSseMcpServer: class MockRemoteSseMcpServer {
      config: unknown;
      oauthToken: unknown;
      apiKeyConfig: unknown;
      constructor(config: unknown, oauthToken: unknown, apiKeyConfig: unknown) {
        this.config = config;
        this.oauthToken = oauthToken;
        this.apiKeyConfig = apiKeyConfig;
      }
      initialize = mockInitialize;
      listTools = mockListTools;
    },
  };
});

describe('McpService', () => {
  let service: McpService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let registry: McpRegistry;
  let debugService: Record<string, ReturnType<typeof vi.fn>>;
  let sharingService: Record<string, ReturnType<typeof vi.fn>>;

  const userAServer = {
    id: 'srv-a',
    name: 'User A Server',
    type: 'external',
    config: '{"command":"node"}',
    apiKeyConfig: '{"apiKey":"key-a"}',
    oauthConfig: null,
    userId: 'user-a',
    profiles: [],
  };

  const userBServer = {
    id: 'srv-b',
    name: 'User B Server',
    type: 'external',
    config: '{"command":"node"}',
    apiKeyConfig: '{"apiKey":"key-b"}',
    oauthConfig: '{"secret":"oauth-b"}',
    userId: 'user-b',
    profiles: [],
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
      sharingService as unknown as SharingService,
      { emit: vi.fn() } as any
    );
  });

  describe('findAll', () => {
    it('should return empty list for unauthenticated user', async () => {
      const result = await service.findAll('__unauthenticated__');
      expect(result).toHaveLength(0);
    });

    it('should query own servers + shared servers', async () => {
      sharingService.getSharedResourceIds.mockResolvedValue(['srv-b']);
      prisma.mcpServer.findMany.mockResolvedValue([userAServer, userBServer]);

      await service.findAll('user-a', 'org-1');

      expect(prisma.mcpServer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ userId: 'user-a' }, { id: { in: ['srv-b'] } }],
          },
        })
      );
    });

    it('should query only own servers when nothing is shared', async () => {
      sharingService.getSharedResourceIds.mockResolvedValue([]);
      prisma.mcpServer.findMany.mockResolvedValue([userAServer]);

      await service.findAll('user-a', 'org-1');

      expect(prisma.mcpServer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ userId: 'user-a' }],
          },
        })
      );
    });

    it('should return full credentials for own servers', async () => {
      prisma.mcpServer.findMany.mockResolvedValue([userAServer]);

      const result = await service.findAll('user-a');
      expect(result[0].apiKeyConfig).toBe('{"apiKey":"key-a"}');
    });
  });

  describe('findById', () => {
    it('should return server for owner', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...userAServer }) // assertAccess call
        .mockResolvedValueOnce({
          ...userAServer,
          oauthToken: null,
          toolsCache: [],
        });

      const result = await service.findById('srv-a', 'user-a');
      expect(result.apiKeyConfig).toBe('{"apiKey":"key-a"}');
    });

    it('should throw NotFoundException for missing server', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertAccess', () => {
    it('should allow unauthenticated user to access any server', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        ...userAServer,
        oauthToken: null,
        toolsCache: [],
      });

      const result = await service.findById('srv-a', '__unauthenticated__');
      expect(result).toBeDefined();
    });

    it('should allow owner to access their server', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...userAServer }) // assertAccess
        .mockResolvedValueOnce({ ...userAServer, oauthToken: null, toolsCache: [] });

      const result = await service.findById('srv-a', 'user-a');
      expect(result).toBeDefined();
    });

    it('should allow shared user to access server', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...userAServer }) // assertAccess
        .mockResolvedValueOnce({ ...userAServer, oauthToken: null, toolsCache: [] });
      sharingService.isSharedWith.mockResolvedValue(true);

      const result = await service.findById('srv-a', 'user-b');
      expect(result).toBeDefined();
    });

    it('should deny access to non-owner without sharing', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        id: 'srv-a',
        userId: 'user-a',
      });
      sharingService.isSharedWith.mockResolvedValue(false);

      await expect(service.findById('srv-a', 'user-b')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should set userId for authenticated user (no organizationId)', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-1' });

      await service.create(
        { name: 'Test', type: 'external', config: { command: 'node' } },
        'user-a',
        'org-a'
      );

      expect(prisma.mcpServer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-a' }),
        })
      );
      // Should NOT have organizationId
      const callData = prisma.mcpServer.create.mock.calls[0][0].data;
      expect(callData.organizationId).toBeUndefined();
    });

    it('should throw ForbiddenException for unauthenticated user', async () => {
      await expect(
        service.create(
          { name: 'Test', type: 'external', config: { command: 'node' } },
          '__unauthenticated__'
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertOwnership', () => {
    it('should allow owner to delete', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ ...userAServer });

      await service.delete('srv-a', 'user-a');
      expect(prisma.mcpServer.delete).toHaveBeenCalledWith({ where: { id: 'srv-a' } });
    });

    it('should allow admin-shared user to update', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...userAServer }) // assertOwnership
        .mockResolvedValueOnce({ ...userAServer }); // update findUnique
      sharingService.getPermission.mockResolvedValue('admin');

      await service.update('srv-a', { name: 'Updated' }, 'user-b');
      expect(prisma.mcpServer.update).toHaveBeenCalled();
    });

    it('should deny use-only shared user from updating', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ ...userAServer });
      sharingService.getPermission.mockResolvedValue('use');

      await expect(service.update('srv-a', { name: 'Updated' }, 'user-b')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should deny non-owner non-shared from deleting', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ ...userAServer });
      sharingService.getPermission.mockResolvedValue(null);

      await expect(service.delete('srv-a', 'user-b')).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------
  // Additional tests to increase coverage to 80%+
  // ---------------------------------------------------------------

  describe('findAll — builtin enrichment', () => {
    it('should enrich builtin servers with registry metadata', async () => {
      const builtinServer = {
        id: 'srv-builtin',
        name: 'Built-in',
        type: 'builtin',
        config: '{"builtinId":"test-pkg"}',
        apiKeyConfig: null,
        oauthConfig: null,
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findMany.mockResolvedValue([builtinServer]);

      // Register a package in the registry
      const fakeMetadata = {
        id: 'test-pkg',
        name: 'Test Package',
        description: 'A test',
        version: '1.0.0',
        requiresApiKey: false,
      };
      registry.register({
        packageName: '@dxheroes/mcp-test-pkg',
        packagePath: '/fake',
        package: {
          metadata: fakeMetadata,
          createServer: vi.fn(),
        },
      });

      const result = await service.findAll('user-a');
      expect(result).toHaveLength(1);
      expect((result[0] as any).metadata).toBeDefined();
      expect((result[0] as any).metadata.id).toBe('test-pkg');
    });

    it('should not enrich non-builtin servers', async () => {
      const remoteServer = {
        id: 'srv-remote',
        name: 'Remote',
        type: 'remote_http',
        config: '{"url":"https://example.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findMany.mockResolvedValue([remoteServer]);

      const result = await service.findAll('user-a');
      expect(result).toHaveLength(1);
      expect((result[0] as any).metadata).toBeUndefined();
    });

    it('should look up org memberships when no orgId supplied', async () => {
      prisma.member.findMany.mockResolvedValue([{ organizationId: 'org-1' }]);
      prisma.mcpServer.findMany.mockResolvedValue([]);

      await service.findAll('user-a');

      expect(prisma.member.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-a' },
        select: { organizationId: true },
      });
    });
  });

  describe('findById — builtin enrichment', () => {
    it('should enrich builtin server in findById', async () => {
      const fakeMetadata = {
        id: 'pkg-1',
        name: 'Pkg 1',
        description: 'desc',
        version: '1.0.0',
        requiresApiKey: false,
      };
      registry.register({
        packageName: '@dxheroes/mcp-pkg-1',
        packagePath: '/fake',
        package: { metadata: fakeMetadata, createServer: vi.fn() },
      });

      const builtinServer = {
        id: 'srv-b1',
        name: 'Builtin One',
        type: 'builtin',
        config: '{"builtinId":"pkg-1"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(builtinServer);

      const result = await service.findById('srv-b1');
      expect((result as any).metadata).toBeDefined();
      expect((result as any).metadata.name).toBe('Pkg 1');
    });
  });

  describe('getUnifiedPresets', () => {
    it('should return external presets from MCP_PRESETS', () => {
      const presets = service.getUnifiedPresets();

      // All hardcoded presets should appear with source "preset"
      const presetIds = presets.filter((p) => p.source === 'preset').map((p) => p.id);
      for (const p of MCP_PRESETS) {
        expect(presetIds).toContain(p.id);
      }
    });

    it('should return builtin presets from registry', () => {
      registry.register({
        packageName: '@dxheroes/mcp-my-tool',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'my-tool',
            name: 'My Tool',
            description: 'Description of my tool',
            version: '2.0.0',
            requiresApiKey: true,
            icon: 'wrench',
            docsUrl: 'https://docs.example.com',
          },
          createServer: vi.fn(),
        },
      });

      const presets = service.getUnifiedPresets();

      const builtinPresets = presets.filter((p) => p.source === 'builtin');
      expect(builtinPresets).toHaveLength(1);
      expect(builtinPresets[0]).toMatchObject({
        id: 'my-tool',
        name: 'My Tool',
        type: 'builtin',
        config: { builtinId: 'my-tool' },
        source: 'builtin',
        requiresApiKey: true,
      });
    });

    it('should merge both external and builtin presets', () => {
      registry.register({
        packageName: '@dxheroes/mcp-extra',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'extra',
            name: 'Extra',
            description: 'Extra desc',
            version: '1.0.0',
            requiresApiKey: false,
          },
          createServer: vi.fn(),
        },
      });

      const presets = service.getUnifiedPresets();
      expect(presets.length).toBe(MCP_PRESETS.length + 1);
    });
  });

  describe('addPreset', () => {
    it('should throw ForbiddenException for unauthenticated user', async () => {
      await expect(service.addPreset('playwright', '__unauthenticated__')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException for unknown preset', async () => {
      await expect(service.addPreset('nonexistent-preset', 'user-a')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should add an external preset (from MCP_PRESETS)', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-preset-1' });

      const result = await service.addPreset('playwright', 'user-a');

      expect(prisma.mcpServer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Playwright MCP',
          type: 'external',
          userId: 'user-a',
          presetId: 'playwright',
        }),
      });
      expect(result).toEqual({ id: 'new-preset-1' });
    });

    it('should add a builtin preset from registry', async () => {
      registry.register({
        packageName: '@dxheroes/mcp-custom-tool',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'custom-tool',
            name: 'Custom Tool',
            description: 'A custom tool',
            version: '1.0.0',
            requiresApiKey: true,
          },
          createServer: vi.fn(),
        },
      });
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-builtin-1' });

      await service.addPreset('custom-tool', 'user-a');

      expect(prisma.mcpServer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Custom Tool',
          type: 'builtin',
          config: JSON.stringify({ builtinId: 'custom-tool' }),
          userId: 'user-a',
          presetId: 'custom-tool',
        }),
      });
    });

    it('should use custom name when provided in options', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-2' });

      await service.addPreset('playwright', 'user-a', undefined, {
        name: 'My Custom Playwright',
      });

      const callData = prisma.mcpServer.create.mock.calls[0][0].data;
      expect(callData.name).toBe('My Custom Playwright');
    });

    it('should serialize apiKeyConfig when provided in options', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-3' });

      await service.addPreset('playwright', 'user-a', undefined, {
        apiKeyConfig: {
          apiKey: 'my-secret-key',
          headerName: 'Authorization',
          headerValueTemplate: 'Bearer {apiKey}',
        },
      });

      const callData = prisma.mcpServer.create.mock.calls[0][0].data;
      expect(JSON.parse(callData.apiKeyConfig)).toEqual({
        apiKey: 'my-secret-key',
        headerName: 'Authorization',
        headerValueTemplate: 'Bearer {apiKey}',
      });
    });

    it('should set apiKeyConfig to null when not provided', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-4' });

      await service.addPreset('playwright', 'user-a');

      const callData = prisma.mcpServer.create.mock.calls[0][0].data;
      expect(callData.apiKeyConfig).toBeNull();
    });
  });

  describe('getTools', () => {
    const builtinServerRecord = {
      id: 'srv-builtin',
      name: 'Builtin Server',
      type: 'builtin',
      config: '{"builtinId":"test-pkg"}',
      apiKeyConfig: '{"apiKey":"key123"}',
      oauthConfig: null,
      oauthToken: null,
      toolsCache: [],
      userId: 'user-a',
      profiles: [],
    };

    beforeEach(() => {
      mockInitialize.mockReset().mockResolvedValue(undefined);
      mockListTools.mockReset().mockResolvedValue([{ name: 'tool1' }, { name: 'tool2' }]);
      mockShutdown.mockReset().mockResolvedValue(undefined);
    });

    it('should get tools from a builtin server via registry', async () => {
      const mockCreateServer = vi.fn().mockReturnValue({
        initialize: mockInitialize,
        listTools: mockListTools,
      });
      registry.register({
        packageName: '@dxheroes/mcp-test-pkg',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'test-pkg',
            name: 'Test',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: true,
          },
          createServer: mockCreateServer,
        },
      });
      prisma.mcpServer.findUnique.mockResolvedValue(builtinServerRecord);

      const result = await service.getTools('srv-builtin');

      expect(mockCreateServer).toHaveBeenCalledWith({ apiKey: 'key123' });
      expect(mockInitialize).toHaveBeenCalled();
      expect(mockListTools).toHaveBeenCalled();
      expect(result.tools).toHaveLength(2);
    });

    it('should get tools from remote_http server', async () => {
      const httpServer = {
        id: 'srv-http',
        name: 'HTTP Server',
        type: 'remote_http',
        config: '{"url":"https://example.com/mcp","headers":{"X-Custom":"val"}}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(httpServer);

      const result = await service.getTools('srv-http');

      expect(result.tools).toHaveLength(2);
      expect(mockInitialize).toHaveBeenCalled();
    });

    it('should get tools from remote_sse server', async () => {
      const sseServer = {
        id: 'srv-sse',
        name: 'SSE Server',
        type: 'remote_sse',
        config: '{"url":"https://example.com/sse"}',
        apiKeyConfig: '{"apiKey":"sse-key"}',
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(sseServer);

      const result = await service.getTools('srv-sse');

      expect(result.tools).toHaveLength(2);
    });

    it('should get tools from external server and shutdown after', async () => {
      const externalSrv = {
        id: 'srv-ext',
        name: 'External',
        type: 'external',
        config: '{"command":"npx","args":["some-tool"]}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(externalSrv);

      const result = await service.getTools('srv-ext');

      expect(result.tools).toHaveLength(2);
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should shutdown external server even if listTools throws', async () => {
      mockListTools.mockRejectedValueOnce(new Error('listTools failed'));
      const externalSrv = {
        id: 'srv-ext2',
        name: 'External Fail',
        type: 'external',
        config: '{"command":"npx"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(externalSrv);

      await expect(service.getTools('srv-ext2')).rejects.toThrow('listTools failed');
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should fall back to cached tools for unknown server type', async () => {
      const customServer = {
        id: 'srv-custom',
        name: 'Custom',
        type: 'custom',
        config: '{}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(customServer);
      prisma.mcpServerToolsCache.findMany.mockResolvedValue([
        { name: 'cached-tool', description: 'A cached tool' },
      ]);

      const result = await service.getTools('srv-custom');

      expect(result.tools).toHaveLength(1);
      expect((result.tools[0] as any).name).toBe('cached-tool');
    });

    it('should log error and rethrow when getToolsInternal fails', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(null); // triggers NotFoundException

      await expect(service.getTools('nonexistent')).rejects.toThrow(NotFoundException);
      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({ status: 'error' })
      );
    });

    it('should check access when userId is provided', async () => {
      const httpServer = {
        id: 'srv-access',
        name: 'HTTP',
        type: 'remote_http',
        config: '{"url":"https://example.com/mcp"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ id: 'srv-access', userId: 'user-a' }) // assertAccess
        .mockResolvedValueOnce(httpServer); // findById

      const result = await service.getTools('srv-access', 'user-a');
      expect(result.tools).toHaveLength(2);
    });
  });

  describe('getStatus', () => {
    beforeEach(() => {
      mockInitialize.mockReset().mockResolvedValue(undefined);
      mockListTools.mockReset().mockResolvedValue([{ name: 'tool1' }]);
      mockValidate.mockReset().mockResolvedValue({ valid: true });
      mockShutdown.mockReset().mockResolvedValue(undefined);
    });

    it('should return connected for builtin with valid API key', async () => {
      const mockCreateServer = vi.fn().mockReturnValue({
        initialize: mockInitialize,
        listTools: mockListTools,
        validate: mockValidate,
      });
      registry.register({
        packageName: '@dxheroes/mcp-validated',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'validated-pkg',
            name: 'Validated',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: true,
          },
          createServer: mockCreateServer,
        },
      });

      const server = {
        id: 'srv-validated',
        name: 'Validated',
        type: 'builtin',
        config: '{"builtinId":"validated-pkg"}',
        apiKeyConfig: '{"apiKey":"valid-key"}',
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      const result = await service.getStatus('srv-validated');

      expect(result.status).toBe('connected');
      expect(result.isReady).toBe(true);
      expect(result.toolsCount).toBe(1);
      expect(result.hasApiKey).toBe(true);
      expect(result.isBuiltin).toBeTruthy();
    });

    it('should return error for builtin with invalid API key', async () => {
      mockValidate.mockResolvedValue({ valid: false, error: 'Invalid API key' });
      const mockCreateServer = vi.fn().mockReturnValue({
        initialize: mockInitialize,
        listTools: mockListTools,
        validate: mockValidate,
      });
      registry.register({
        packageName: '@dxheroes/mcp-invalid',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'invalid-pkg',
            name: 'Invalid',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: true,
          },
          createServer: mockCreateServer,
        },
      });

      const server = {
        id: 'srv-invalid',
        name: 'Invalid',
        type: 'builtin',
        config: '{"builtinId":"invalid-pkg"}',
        apiKeyConfig: '{"apiKey":"bad-key"}',
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      const result = await service.getStatus('srv-invalid');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Invalid API key');
      expect(result.isReady).toBe(false);
    });

    it('should return error when builtin validation throws', async () => {
      const mockCreateServer = vi.fn().mockReturnValue({
        initialize: mockInitialize,
        listTools: mockListTools,
        validate: vi.fn().mockRejectedValue(new Error('Network error')),
      });
      registry.register({
        packageName: '@dxheroes/mcp-throw',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'throw-pkg',
            name: 'Throw',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: true,
          },
          createServer: mockCreateServer,
        },
      });

      const server = {
        id: 'srv-throw',
        name: 'Throw',
        type: 'builtin',
        config: '{"builtinId":"throw-pkg"}',
        apiKeyConfig: '{"apiKey":"key"}',
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      const result = await service.getStatus('srv-throw');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Network error');
    });

    it('should return error when API key required but not provided', async () => {
      registry.register({
        packageName: '@dxheroes/mcp-needs-key',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'needs-key-pkg',
            name: 'Needs Key',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: true,
          },
          createServer: vi.fn(),
        },
      });

      const server = {
        id: 'srv-nokey',
        name: 'No Key',
        type: 'builtin',
        config: '{"builtinId":"needs-key-pkg"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      const result = await service.getStatus('srv-nokey');

      expect(result.status).toBe('error');
      expect(result.error).toBe('API key required');
      expect(result.details).toBe('This server requires an API key to function');
    });

    it('should return connected for builtin that does not require API key', async () => {
      const mockCreateServer = vi.fn().mockReturnValue({
        initialize: mockInitialize,
        listTools: mockListTools,
      });
      registry.register({
        packageName: '@dxheroes/mcp-nokey',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'nokey-pkg',
            name: 'No Key Pkg',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: false,
          },
          createServer: mockCreateServer,
        },
      });

      const server = {
        id: 'srv-nokey2',
        name: 'No Key 2',
        type: 'builtin',
        config: '{"builtinId":"nokey-pkg"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      const result = await service.getStatus('srv-nokey2');

      expect(result.status).toBe('connected');
      expect(result.isReady).toBe(true);
      expect(result.toolsCount).toBe(1);
      expect(result.details).toBe('Server ready (no API key required)');
    });

    it('should handle builtin no-key server when tools listing fails', async () => {
      const mockCreateServer = vi.fn().mockReturnValue({
        initialize: vi.fn().mockRejectedValue(new Error('init fail')),
        listTools: mockListTools,
      });
      registry.register({
        packageName: '@dxheroes/mcp-nokey-fail',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'nokey-fail-pkg',
            name: 'No Key Fail',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: false,
          },
          createServer: mockCreateServer,
        },
      });

      const server = {
        id: 'srv-nokey-fail',
        name: 'No Key Fail',
        type: 'builtin',
        config: '{"builtinId":"nokey-fail-pkg"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);

      const result = await service.getStatus('srv-nokey-fail');

      // Still connected — the catch is silent
      expect(result.status).toBe('connected');
      expect(result.toolsCount).toBeUndefined();
    });

    it('should validate remote_http server by connecting', async () => {
      const httpServer = {
        id: 'srv-http-status',
        name: 'HTTP Status',
        type: 'remote_http',
        config: '{"url":"https://example.com/mcp"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(httpServer);

      const result = await service.getStatus('srv-http-status');

      expect(result.status).toBe('connected');
      expect(result.toolsCount).toBe(1);
      expect(result.details).toContain('Connected successfully');
    });

    it('should handle remote_http OAUTH_REQUIRED error', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('OAUTH_REQUIRED: need auth'));
      const httpServer = {
        id: 'srv-http-oauth',
        name: 'HTTP OAuth',
        type: 'remote_http',
        config: '{"url":"https://example.com/mcp"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(httpServer);

      const result = await service.getStatus('srv-http-oauth');

      expect(result.status).toBe('error');
      expect(result.oauthRequired).toBe(true);
      expect(result.details).toContain('OAuth authentication required');
    });

    it('should handle remote_http connection failure', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('Connection refused'));
      const httpServer = {
        id: 'srv-http-fail',
        name: 'HTTP Fail',
        type: 'remote_http',
        config: '{"url":"https://bad.example.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(httpServer);

      const result = await service.getStatus('srv-http-fail');

      expect(result.status).toBe('error');
      expect(result.oauthRequired).toBe(false);
      expect(result.details).toContain('Connection failed');
    });

    it('should validate remote_http with oauthToken', async () => {
      const now = new Date();
      const httpServer = {
        id: 'srv-http-oauth-token',
        name: 'HTTP OAuth Token',
        type: 'remote_http',
        config: '{"url":"https://example.com/mcp"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: {
          id: 'tok-1',
          mcpServerId: 'srv-http-oauth-token',
          accessToken: 'abc',
          tokenType: 'Bearer',
          refreshToken: 'refresh-1',
          scope: 'read',
          expiresAt: now,
          createdAt: now,
          updatedAt: now,
        },
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(httpServer);

      const result = await service.getStatus('srv-http-oauth-token');

      expect(result.status).toBe('connected');
    });

    it('should validate remote_sse server by connecting', async () => {
      const sseServer = {
        id: 'srv-sse-status',
        name: 'SSE Status',
        type: 'remote_sse',
        config: '{"url":"https://example.com/sse"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(sseServer);

      const result = await service.getStatus('srv-sse-status');

      expect(result.status).toBe('connected');
      expect(result.details).toContain('SSE');
    });

    it('should handle remote_sse OAUTH_REQUIRED error', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('OAUTH_REQUIRED: need SSE auth'));
      const sseServer = {
        id: 'srv-sse-oauth',
        name: 'SSE OAuth',
        type: 'remote_sse',
        config: '{"url":"https://example.com/sse"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(sseServer);

      const result = await service.getStatus('srv-sse-oauth');

      expect(result.status).toBe('error');
      expect(result.oauthRequired).toBe(true);
    });

    it('should handle remote_sse connection failure', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('SSE timeout'));
      const sseServer = {
        id: 'srv-sse-fail',
        name: 'SSE Fail',
        type: 'remote_sse',
        config: '{"url":"https://bad.example.com/sse"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(sseServer);

      const result = await service.getStatus('srv-sse-fail');

      expect(result.status).toBe('error');
      expect(result.details).toContain('Connection failed');
    });

    it('should validate remote_sse with oauthToken', async () => {
      const now = new Date();
      const sseServer = {
        id: 'srv-sse-oauth-token',
        name: 'SSE OAuth Token',
        type: 'remote_sse',
        config: '{"url":"https://example.com/sse"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: {
          id: 'tok-2',
          mcpServerId: 'srv-sse-oauth-token',
          accessToken: 'def',
          tokenType: 'Bearer',
          refreshToken: null,
          scope: null,
          expiresAt: null,
          createdAt: now,
          updatedAt: now,
        },
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(sseServer);

      const result = await service.getStatus('srv-sse-oauth-token');

      expect(result.status).toBe('connected');
    });

    it('should validate external server by spawning', async () => {
      const externalSrv = {
        id: 'srv-ext-status',
        name: 'External Status',
        type: 'external',
        config: '{"command":"npx","args":["some-tool"]}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(externalSrv);

      const result = await service.getStatus('srv-ext-status');

      expect(result.status).toBe('connected');
      expect(result.details).toContain('stdio');
      expect(mockShutdown).toHaveBeenCalled();
    });

    it('should return error for external server with no command', async () => {
      const externalSrv = {
        id: 'srv-ext-nocmd',
        name: 'External No Cmd',
        type: 'external',
        config: '{}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(externalSrv);

      const result = await service.getStatus('srv-ext-nocmd');

      expect(result.status).toBe('error');
      expect(result.error).toBe('Command is required for external MCP servers');
    });

    it('should return error when external server spawn fails', async () => {
      mockInitialize.mockRejectedValueOnce(new Error('spawn ENOENT'));
      const externalSrv = {
        id: 'srv-ext-fail',
        name: 'External Fail',
        type: 'external',
        config: '{"command":"nonexistent-bin"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(externalSrv);

      const result = await service.getStatus('srv-ext-fail');

      expect(result.status).toBe('error');
      expect(result.error).toBe('spawn ENOENT');
    });

    it('should return unknown status for unsupported server type', async () => {
      const customServer = {
        id: 'srv-unknown',
        name: 'Unknown Type',
        type: 'custom',
        config: '{}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(customServer);

      const result = await service.getStatus('srv-unknown');

      expect(result.status).toBe('unknown');
      expect(result.isReady).toBe(false);
    });

    it('should log error when getStatusInternal throws', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(null);

      await expect(service.getStatus('nonexistent')).rejects.toThrow(NotFoundException);
      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({ status: 'error' })
      );
    });

    it('should check access when userId is provided', async () => {
      const httpServer = {
        id: 'srv-http-access',
        name: 'HTTP Access',
        type: 'remote_http',
        config: '{"url":"https://example.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ id: 'srv-http-access', userId: 'user-a' }) // assertAccess
        .mockResolvedValueOnce(httpServer); // findById

      const result = await service.getStatus('srv-http-access', 'user-a');
      expect(result.status).toBe('connected');
    });

    it('should log status as error in debug log when status is error', async () => {
      const externalSrv = {
        id: 'srv-ext-err-log',
        name: 'Ext Err Log',
        type: 'external',
        config: '{}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(externalSrv);

      await service.getStatus('srv-ext-err-log');

      // The status is 'error' (missing command), so debug log should reflect that
      expect(debugService.updateLog).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({ status: 'error' })
      );
    });
  });

  describe('getBatchStatus', () => {
    beforeEach(() => {
      mockInitialize.mockReset().mockResolvedValue(undefined);
      mockListTools.mockReset().mockResolvedValue([{ name: 'tool1' }]);
      mockShutdown.mockReset().mockResolvedValue(undefined);
    });

    it('should return status for all servers', async () => {
      const httpServer = {
        id: 'srv-batch-1',
        name: 'Batch 1',
        type: 'remote_http',
        config: '{"url":"https://a.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      const httpServer2 = {
        id: 'srv-batch-2',
        name: 'Batch 2',
        type: 'remote_http',
        config: '{"url":"https://b.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };

      // findAll -> findMany returns 2 servers
      prisma.mcpServer.findMany.mockResolvedValue([httpServer, httpServer2]);
      // getStatusInternal calls findById -> findUnique for each server
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce(httpServer)
        .mockResolvedValueOnce(httpServer2);

      const result = await service.getBatchStatus('user-a');

      expect(Object.keys(result)).toHaveLength(2);
      expect(result['srv-batch-1']).toBeDefined();
      expect(result['srv-batch-1'].status).toBe('connected');
      expect(result['srv-batch-2']).toBeDefined();
    });

    it('should handle failures gracefully in batch', async () => {
      const goodServer = {
        id: 'srv-good',
        name: 'Good',
        type: 'remote_http',
        config: '{"url":"https://good.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      const badServer = {
        id: 'srv-bad',
        name: 'Bad',
        type: 'remote_http',
        config: '{"url":"https://bad.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };

      prisma.mcpServer.findMany.mockResolvedValue([goodServer, badServer]);
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce(goodServer) // getStatusInternal -> findById for good
        .mockResolvedValueOnce(null); // getStatusInternal -> findById for bad -> NotFoundException

      const result = await service.getBatchStatus('user-a');

      // Good server should be connected, bad server should be error (rejected)
      expect(result['srv-good'].status).toBe('connected');
      expect(result['srv-bad'].status).toBe('error');
      expect(result['srv-bad'].error).toBeDefined();
    });

    it('should return empty object for unauthenticated user', async () => {
      const result = await service.getBatchStatus('__unauthenticated__');
      expect(result).toEqual({});
    });
  });

  describe('getBuiltinId / parseConfig', () => {
    it('should extract builtinId from JSON config string', async () => {
      const server = {
        id: 'srv-bi',
        name: 'BI',
        type: 'builtin',
        config: '{"builtinId":"my-id"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServer.findMany.mockResolvedValue([server]);

      // findAll calls getBuiltinId internally
      const result = await service.findAll('user-a');
      // Not in registry, so no metadata enrichment
      expect((result[0] as any).metadata).toBeUndefined();
    });

    it('should return null for invalid JSON config', async () => {
      const server = {
        id: 'srv-invalid-json',
        name: 'Invalid JSON',
        type: 'builtin',
        config: '{invalid-json',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServer.findMany.mockResolvedValue([server]);

      const result = await service.findAll('user-a');
      expect((result[0] as any).metadata).toBeUndefined();
    });

    it('should handle object config (not string)', async () => {
      const server = {
        id: 'srv-obj-config',
        name: 'Object Config',
        type: 'builtin',
        config: { builtinId: 'my-pkg' },
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      registry.register({
        packageName: '@dxheroes/mcp-my-pkg',
        packagePath: '/fake',
        package: {
          metadata: {
            id: 'my-pkg',
            name: 'My Pkg',
            description: 'desc',
            version: '1.0.0',
            requiresApiKey: false,
          },
          createServer: vi.fn(),
        },
      });
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServer.findMany.mockResolvedValue([server]);

      const result = await service.findAll('user-a');
      expect((result[0] as any).metadata).toBeDefined();
      expect((result[0] as any).metadata.id).toBe('my-pkg');
    });

    it('should return null for config without builtinId', async () => {
      const server = {
        id: 'srv-no-builtin',
        name: 'No Builtin',
        type: 'remote_http',
        config: '{"url":"https://example.com"}',
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServer.findMany.mockResolvedValue([server]);

      const result = await service.findAll('user-a');
      expect((result[0] as any).metadata).toBeUndefined();
    });

    it('should return null for null config', async () => {
      const server = {
        id: 'srv-null-config',
        name: 'Null Config',
        type: 'custom',
        config: null,
        apiKeyConfig: null,
        oauthConfig: null,
        oauthToken: null,
        toolsCache: [],
        userId: 'user-a',
        profiles: [],
      };
      prisma.mcpServer.findUnique.mockResolvedValue(server);
      prisma.mcpServer.findMany.mockResolvedValue([server]);

      const result = await service.findAll('user-a');
      expect((result[0] as any).metadata).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should handle string config in update dto', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ ...userAServer });
      prisma.mcpServer.update.mockResolvedValue({ ...userAServer, name: 'Updated' });

      await service.update(
        'srv-a',
        {
          name: 'Updated',
          config: '{"command":"npx"}',
        },
        'user-a'
      );

      const callData = prisma.mcpServer.update.mock.calls[0][0].data;
      expect(callData.config).toBe('{"command":"npx"}');
    });

    it('should stringify object config in update dto', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({ ...userAServer });
      prisma.mcpServer.update.mockResolvedValue({ ...userAServer, name: 'Updated' });

      await service.update(
        'srv-a',
        {
          name: 'Updated',
          config: { command: 'node' },
        },
        'user-a'
      );

      const callData = prisma.mcpServer.update.mock.calls[0][0].data;
      expect(callData.config).toBe('{"command":"node"}');
    });

    it('should throw NotFoundException when server not found in update', async () => {
      // First call is for assertOwnership, second is for the findUnique in update
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...userAServer }) // assertOwnership
        .mockResolvedValueOnce(null); // findUnique in update

      await expect(service.update('srv-a', { name: 'Updated' }, 'user-a')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException when server not found in delete', async () => {
      // First call is for assertOwnership, second is for the findUnique in delete
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...userAServer }) // assertOwnership
        .mockResolvedValueOnce(null); // findUnique in delete

      await expect(service.delete('srv-a', 'user-a')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create — serialization', () => {
    it('should serialize apiKeyConfig and oauthConfig when provided', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-5' });

      await service.create(
        {
          name: 'Test',
          type: 'external',
          config: { command: 'node' },
          apiKeyConfig: { apiKey: 'key1' },
          oauthConfig: { secret: 'sec1' },
        } as any,
        'user-a'
      );

      const callData = prisma.mcpServer.create.mock.calls[0][0].data;
      expect(callData.apiKeyConfig).toBe('{"apiKey":"key1"}');
      expect(callData.oauthConfig).toBe('{"secret":"sec1"}');
    });

    it('should set apiKeyConfig and oauthConfig to null when not provided', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-6' });

      await service.create(
        { name: 'Test', type: 'external', config: { command: 'node' } },
        'user-a'
      );

      const callData = prisma.mcpServer.create.mock.calls[0][0].data;
      expect(callData.apiKeyConfig).toBeNull();
      expect(callData.oauthConfig).toBeNull();
    });
  });
});
