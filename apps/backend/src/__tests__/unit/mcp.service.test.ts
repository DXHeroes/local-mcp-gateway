/**
 * Tests for McpService — multi-tenancy with org-scoped access
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import type { DebugService } from '../../modules/debug/debug.service.js';
import { McpService } from '../../modules/mcp/mcp.service.js';
import { McpRegistry } from '../../modules/mcp/mcp-registry.js';

describe('McpService', () => {
  let service: McpService;
  let prisma: Record<string, Record<string, ReturnType<typeof vi.fn>>>;
  let registry: McpRegistry;
  let debugService: Record<string, ReturnType<typeof vi.fn>>;

  const systemServer = {
    id: 'sys-1',
    name: 'System Server',
    type: 'builtin',
    config: '{}',
    apiKeyConfig: '{"apiKey":"secret123"}',
    oauthConfig: null,
    userId: null,
    organizationId: null,
    profiles: [],
  };

  const orgServer = {
    id: 'org-1',
    name: 'Org Server',
    type: 'external',
    config: '{"command":"node"}',
    apiKeyConfig: '{"apiKey":"my-key"}',
    oauthConfig: '{"secret":"oauth-secret"}',
    userId: 'owner-id',
    organizationId: 'org-a',
    profiles: [],
  };

  const otherOrgServer = {
    id: 'other-org-1',
    name: 'Other Org Server',
    type: 'external',
    config: '{"command":"node"}',
    apiKeyConfig: '{"apiKey":"other-key"}',
    oauthConfig: '{"secret":"other-oauth"}',
    userId: 'other-user',
    organizationId: 'org-b',
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
    service = new McpService(
      prisma as unknown as PrismaService,
      registry,
      debugService as unknown as DebugService
    );
  });

  describe('findAll', () => {
    it('should return all servers for unauthenticated user', async () => {
      prisma.mcpServer.findMany.mockResolvedValue([systemServer, orgServer]);

      const result = await service.findAll('__unauthenticated__');
      expect(result).toHaveLength(2);
      // Unauthenticated user should see full credentials (no stripping)
      expect(result[0].apiKeyConfig).toBe('{"apiKey":"secret123"}');
    });

    it('should scope servers to org + system', async () => {
      prisma.mcpServer.findMany.mockResolvedValue([systemServer, orgServer]);

      await service.findAll('owner-id', 'org-a');
      expect(prisma.mcpServer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ organizationId: 'org-a' }, { organizationId: null }],
          },
        })
      );
    });

    it('should return full credentials for org servers (no stripping)', async () => {
      prisma.mcpServer.findMany.mockResolvedValue([orgServer]);

      const result = await service.findAll('owner-id', 'org-a');
      expect(result[0].apiKeyConfig).toBe('{"apiKey":"my-key"}');
      expect(result[0].oauthConfig).toBe('{"secret":"oauth-secret"}');
    });
  });

  describe('findById', () => {
    it('should return server with full credentials for org member', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...orgServer }) // assertAccess call
        .mockResolvedValueOnce({
          ...orgServer,
          oauthToken: null,
          toolsCache: [],
        });

      const result = await service.findById('org-1', 'owner-id', 'org-a');
      expect(result.apiKeyConfig).toBe('{"apiKey":"my-key"}');
    });

    it('should throw NotFoundException for missing server', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertAccess', () => {
    it('should allow unauthenticated user to access any server', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        ...orgServer,
        oauthToken: null,
        toolsCache: [],
      });

      // Should not throw
      const result = await service.findById('org-1', '__unauthenticated__');
      expect(result).toBeDefined();
    });

    it('should allow access to system servers for any user', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...systemServer }) // assertAccess call
        .mockResolvedValueOnce({
          ...systemServer,
          oauthToken: null,
          toolsCache: [],
        });

      const result = await service.findById('sys-1', 'any-user', 'any-org');
      expect(result).toBeDefined();
    });

    it('should allow access when server belongs to user org', async () => {
      prisma.mcpServer.findUnique
        .mockResolvedValueOnce({ ...orgServer }) // assertAccess call
        .mockResolvedValueOnce({
          ...orgServer,
          oauthToken: null,
          toolsCache: [],
        });

      const result = await service.findById('org-1', 'owner-id', 'org-a');
      expect(result).toBeDefined();
    });

    it('should deny access to server in different org', async () => {
      prisma.mcpServer.findUnique.mockResolvedValue({
        id: 'other-org-1',
        userId: 'other-user',
        organizationId: 'org-b',
      });

      await expect(service.findById('other-org-1', 'viewer-id', 'org-a')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('create', () => {
    it('should set userId and organizationId for authenticated user', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-1' });

      await service.create(
        { name: 'Test', type: 'external', config: { command: 'node' } },
        'user-1',
        'org-a'
      );

      expect(prisma.mcpServer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', organizationId: 'org-a' }),
        })
      );
    });

    it('should set userId to null for unauthenticated user', async () => {
      prisma.mcpServer.create.mockResolvedValue({ id: 'new-1' });

      await service.create(
        { name: 'Test', type: 'external', config: { command: 'node' } },
        '__unauthenticated__'
      );

      expect(prisma.mcpServer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: null, organizationId: null }),
        })
      );
    });
  });
});
