/**
 * Tests for DebugService filtering behavior
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../modules/database/prisma.service.js';
import { DebugService } from '../../modules/debug/debug.service.js';

describe('DebugService', () => {
  let service: DebugService;
  let prisma: {
    debugLog: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      debugLog: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    };

    service = new DebugService(prisma as unknown as PrismaService);
  });

  it('applies combined filters to the Prisma where clause', async () => {
    const since = '2026-03-18T08:00:00.000Z';
    const until = '2026-03-18T12:00:00.000Z';

    await service.getLogs({
      profileId: 'profile-1',
      mcpServerId: 'server-1',
      requestType: 'tools/call',
      status: 'success',
      since,
      until,
      page: '2',
      limit: '25',
    });

    expect(prisma.debugLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          profileId: 'profile-1',
          mcpServerId: 'server-1',
          requestType: 'tools/call',
          status: 'success',
          createdAt: {
            gte: new Date(since),
            lte: new Date(until),
          },
        },
        take: 25,
        skip: 25,
      })
    );
    expect(prisma.debugLog.count).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-1',
        mcpServerId: 'server-1',
        requestType: 'tools/call',
        status: 'success',
        createdAt: {
          gte: new Date(since),
          lte: new Date(until),
        },
      },
    });
  });

  it('returns stable pagination metadata for page-based queries', async () => {
    prisma.debugLog.count.mockResolvedValueOnce(55);

    const result = await service.getLogs({
      page: '3',
      limit: '20',
    });

    expect(result).toEqual(
      expect.objectContaining({
        logs: [],
        total: 55,
        page: 3,
        limit: 20,
        totalPages: 3,
      })
    );
  });

  it('supports offset as a compatibility shim when page is omitted', async () => {
    await service.getLogs({
      offset: '40',
      limit: '20',
    });

    expect(prisma.debugLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        skip: 40,
      })
    );
  });
});
