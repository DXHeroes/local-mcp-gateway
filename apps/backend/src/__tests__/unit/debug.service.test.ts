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

  it('includes requestType in the Prisma where filter', async () => {
    await service.getLogs(
      {
        profileId: 'profile-1',
        mcpServerId: 'server-1',
        requestType: 'tools/call',
        status: 'success',
      },
      25,
      10
    );

    expect(prisma.debugLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          profileId: 'profile-1',
          mcpServerId: 'server-1',
          requestType: 'tools/call',
          status: 'success',
        },
        take: 25,
        skip: 10,
      })
    );
    expect(prisma.debugLog.count).toHaveBeenCalledWith({
      where: {
        profileId: 'profile-1',
        mcpServerId: 'server-1',
        requestType: 'tools/call',
        status: 'success',
      },
    });
  });
});
