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
      aggregate: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    mcpServer: {
      findMany: ReturnType<typeof vi.fn>;
    };
    $queryRaw: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      debugLog: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _avg: { durationMs: null } }),
        groupBy: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      mcpServer: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
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

  it('builds summary queries from the same combined filters and ignores pagination params', async () => {
    const since = '2026-03-18T08:00:00.000Z';
    const until = '2026-03-18T12:00:00.000Z';

    prisma.debugLog.count.mockResolvedValueOnce(8);
    prisma.debugLog.aggregate.mockResolvedValueOnce({ _avg: { durationMs: 120 } });
    prisma.debugLog.groupBy
      .mockResolvedValueOnce([
        { status: 'success', _count: { _all: 6 } },
        { status: 'error', _count: { _all: 2 } },
      ])
      .mockResolvedValueOnce([
        {
          requestType: 'tools/list',
          _count: { _all: 5 },
          _avg: { durationMs: 80 },
        },
        {
          requestType: 'tools/call',
          _count: { _all: 3 },
          _avg: { durationMs: 180 },
        },
      ])
      .mockResolvedValueOnce([{ requestType: 'tools/call', _count: { _all: 2 } }])
      .mockResolvedValueOnce([
        {
          mcpServerId: null,
          _count: { _all: 3 },
          _avg: { durationMs: 90 },
        },
        {
          mcpServerId: 'server-1',
          _count: { _all: 5 },
          _avg: { durationMs: 140 },
        },
      ])
      .mockResolvedValueOnce([{ mcpServerId: 'server-1', _count: { _all: 2 } }]);
    prisma.debugLog.findMany
      .mockResolvedValueOnce([{ profileId: 'profile-1' }, { profileId: 'profile-2' }])
      .mockResolvedValueOnce([{ mcpServerId: 'server-1' }])
      .mockResolvedValueOnce([{ durationMs: 50 }, { durationMs: 220 }, { durationMs: 1500 }]);
    prisma.mcpServer.findMany.mockResolvedValueOnce([{ id: 'server-1', name: 'Server One' }]);
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { bucket: new Date('2026-03-18T08:00:00.000Z'), total: 4, success: 3, error: 1, pending: 0 },
      ])
      .mockResolvedValueOnce([{ p95_duration_ms: 210 }]);

    const result = await service.getSummary({
      profileId: 'profile-1',
      mcpServerId: 'server-1',
      requestType: 'tools/call',
      status: 'success',
      since,
      until,
      page: '3',
      limit: '25',
      offset: '50',
    });

    const expectedWhere = {
      profileId: 'profile-1',
      mcpServerId: 'server-1',
      requestType: 'tools/call',
      status: 'success',
      createdAt: {
        gte: new Date(since),
        lte: new Date(until),
      },
    };

    expect(prisma.debugLog.count).toHaveBeenCalledWith({ where: expectedWhere });
    expect(prisma.debugLog.aggregate).toHaveBeenCalledWith({
      where: expectedWhere,
      _avg: { durationMs: true },
    });
    expect(prisma.debugLog.groupBy).toHaveBeenCalled();
    for (const [args] of prisma.debugLog.groupBy.mock.calls) {
      expect(args.where).toEqual(
        expect.objectContaining({
          profileId: 'profile-1',
          mcpServerId: 'server-1',
          requestType: 'tools/call',
          createdAt: expectedWhere.createdAt,
        })
      );
      expect(args).not.toHaveProperty('skip');
      expect(args).not.toHaveProperty('take');
    }

    expect(result.timeBucket).toBe('hour');
    expect(result.overview).toEqual(
      expect.objectContaining({
        totalLogs: 8,
        successCount: 6,
        errorCount: 2,
        pendingCount: 0,
        errorRate: 25,
        avgDurationMs: 120,
        p95DurationMs: 210,
        uniqueProfiles: 2,
        uniqueServers: 1,
      })
    );
    expect(result.requestTypeBreakdown[0]).toEqual(
      expect.objectContaining({
        requestType: 'tools/list',
        count: 5,
        avgDurationMs: 80,
      })
    );
    expect(result.serverBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          mcpServerId: null,
          name: 'Aggregated profile request',
          count: 3,
        }),
        expect.objectContaining({
          mcpServerId: 'server-1',
          name: 'Server One',
          count: 5,
        }),
      ])
    );
  });

  it('returns a zeroed summary shape when the filtered dataset is empty', async () => {
    prisma.debugLog.count.mockResolvedValueOnce(0);
    prisma.debugLog.aggregate.mockResolvedValueOnce({ _avg: { durationMs: null } });
    prisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ p95_duration_ms: null }]);

    const result = await service.getSummary();

    expect(result).toEqual({
      overview: {
        totalLogs: 0,
        successCount: 0,
        errorCount: 0,
        pendingCount: 0,
        errorRate: 0,
        avgDurationMs: 0,
        p95DurationMs: 0,
        uniqueProfiles: 0,
        uniqueServers: 0,
      },
      timeBucket: 'day',
      timeseries: [],
      statusBreakdown: [],
      requestTypeBreakdown: [],
      serverBreakdown: [],
      latencyBuckets: [
        { label: '0-100ms', count: 0 },
        { label: '100-500ms', count: 0 },
        { label: '500ms-1s', count: 0 },
        { label: '1s+', count: 0 },
      ],
    });
  });

  it('uses day buckets for wider ranges and normalizes missing related server rows', async () => {
    prisma.debugLog.count.mockResolvedValueOnce(3);
    prisma.debugLog.aggregate.mockResolvedValueOnce({ _avg: { durationMs: 360 } });
    prisma.debugLog.groupBy
      .mockResolvedValueOnce([{ status: 'success', _count: { _all: 3 } }])
      .mockResolvedValueOnce([
        {
          requestType: 'status/check',
          _count: { _all: 3 },
          _avg: { durationMs: 360 },
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          mcpServerId: 'server-missing',
          _count: { _all: 2 },
          _avg: { durationMs: 410 },
        },
      ])
      .mockResolvedValueOnce([]);
    prisma.debugLog.findMany
      .mockResolvedValueOnce([{ profileId: 'profile-1' }])
      .mockResolvedValueOnce([{ mcpServerId: 'server-missing' }])
      .mockResolvedValueOnce([{ durationMs: 150 }, { durationMs: 600 }, { durationMs: 1200 }]);
    prisma.mcpServer.findMany.mockResolvedValueOnce([]);
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { bucket: new Date('2026-03-01T00:00:00.000Z'), total: 3, success: 3, error: 0, pending: 0 },
      ])
      .mockResolvedValueOnce([{ p95_duration_ms: 1100 }]);

    const result = await service.getSummary({
      since: '2026-03-01T00:00:00.000Z',
      until: '2026-03-10T00:00:00.000Z',
    });

    expect(result.timeBucket).toBe('day');
    expect(result.serverBreakdown).toEqual([
      {
        mcpServerId: 'server-missing',
        name: 'server-missing',
        count: 2,
        errorRate: 0,
        avgDurationMs: 410,
      },
    ]);
  });
});
