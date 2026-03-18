/**
 * Debug Service
 *
 * Manages debug logs for MCP traffic inspection.
 * The DebugLog model tracks MCP requests/responses, not general log levels.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

interface CreateLogDto {
  profileId?: string | null;
  mcpServerId?: string | null;
  requestType: string;
  requestPayload: string;
  responsePayload?: string | null;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string | null;
  durationMs?: number | null;
}

interface LogFilter {
  profileId?: string;
  mcpServerId?: string;
  requestType?: string;
  status?: 'pending' | 'success' | 'error';
  since?: Date | string;
  until?: Date | string;
  page?: number | string;
  limit?: number | string;
  offset?: number | string;
}

@Injectable()
export class DebugService {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 100;
  private static readonly MAX_LIMIT = 200;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a debug log entry for an MCP request
   */
  async createLog(dto: CreateLogDto) {
    return this.prisma.debugLog.create({
      data: {
        profileId: dto.profileId,
        mcpServerId: dto.mcpServerId,
        requestType: dto.requestType,
        requestPayload: dto.requestPayload,
        responsePayload: dto.responsePayload,
        status: dto.status,
        errorMessage: dto.errorMessage,
        durationMs: dto.durationMs,
      },
    });
  }

  /**
   * Update a debug log entry with response data
   */
  async updateLog(
    id: string,
    data: {
      responsePayload?: string;
      status?: 'pending' | 'success' | 'error';
      errorMessage?: string;
      durationMs?: number;
      mcpServerId?: string;
    }
  ) {
    return this.prisma.debugLog.update({
      where: { id },
      data,
    });
  }

  /**
   * Get debug logs with optional filters
   */
  async getLogs(filter?: LogFilter) {
    const where = this.buildWhereClause(filter);
    const limit = this.normalizeLimit(filter?.limit);
    const page = this.normalizePage(filter?.page);
    const skip = this.resolveSkip({
      page,
      limit,
      offset: filter?.offset,
    });

    const [logs, total] = await Promise.all([
      this.prisma.debugLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          profile: {
            select: { id: true, name: true },
          },
          mcpServer: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.debugLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page:
        filter?.page === undefined && filter?.offset !== undefined
          ? Math.floor(skip / limit) + 1
          : page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      offset: skip,
    };
  }

  /**
   * Clear debug logs
   */
  async clearLogs(options?: { profileId?: string; mcpServerId?: string }) {
    const where: Record<string, string> = {};

    if (options?.profileId) {
      where.profileId = options.profileId;
    }

    if (options?.mcpServerId) {
      where.mcpServerId = options.mcpServerId;
    }

    await this.prisma.debugLog.deleteMany({
      where: Object.keys(where).length > 0 ? where : undefined,
    });
  }

  private buildWhereClause(filter?: LogFilter) {
    const where: Record<string, unknown> = {};

    if (filter?.profileId) {
      where.profileId = filter.profileId;
    }

    if (filter?.mcpServerId) {
      where.mcpServerId = filter.mcpServerId;
    }

    if (filter?.requestType) {
      where.requestType = filter.requestType;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    const since = this.normalizeDate(filter?.since);
    const until = this.normalizeDate(filter?.until);

    if (since || until) {
      where.createdAt = {};

      if (since) {
        (where.createdAt as Record<string, Date>).gte = since;
      }

      if (until) {
        (where.createdAt as Record<string, Date>).lte = until;
      }
    }

    return where;
  }

  private normalizeDate(value?: Date | string) {
    if (!value) {
      return undefined;
    }

    const parsed = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed;
  }

  private normalizePage(value?: number | string) {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return DebugService.DEFAULT_PAGE;
  }

  private normalizeLimit(value?: number | string) {
    if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
      return Math.min(value, DebugService.MAX_LIMIT);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        return Math.min(parsed, DebugService.MAX_LIMIT);
      }
    }

    return DebugService.DEFAULT_LIMIT;
  }

  private normalizeOffset(value?: number | string) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      if (Number.isInteger(parsed) && parsed >= 0) {
        return parsed;
      }
    }

    return 0;
  }

  private resolveSkip(options: { page: number; limit: number; offset?: number | string }) {
    if (options.offset !== undefined) {
      return this.normalizeOffset(options.offset);
    }

    return (options.page - 1) * options.limit;
  }
}
