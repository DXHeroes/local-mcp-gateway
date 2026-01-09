/**
 * Debug Service
 *
 * Manages debug logs for MCP traffic inspection.
 * The DebugLog model tracks MCP requests/responses, not general log levels.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

interface CreateLogDto {
  profileId: string;
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
  status?: 'pending' | 'success' | 'error';
  since?: Date;
  until?: Date;
}

@Injectable()
export class DebugService {
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
  async getLogs(filter?: LogFilter, limit = 100, offset = 0) {
    const where: Record<string, unknown> = {};

    if (filter?.profileId) {
      where.profileId = filter.profileId;
    }

    if (filter?.mcpServerId) {
      where.mcpServerId = filter.mcpServerId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.since || filter?.until) {
      where.createdAt = {};
      if (filter.since) {
        (where.createdAt as Record<string, Date>).gte = filter.since;
      }
      if (filter.until) {
        (where.createdAt as Record<string, Date>).lte = filter.until;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.debugLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
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
      limit,
      offset,
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
}
