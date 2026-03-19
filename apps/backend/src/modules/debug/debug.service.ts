/**
 * Debug Service
 *
 * Manages debug logs for MCP traffic inspection.
 * The DebugLog model tracks MCP requests/responses, not general log levels.
 */

import { Prisma } from '@dxheroes/local-mcp-database/generated/prisma';
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

export interface SummaryOverview {
  totalLogs: number;
  successCount: number;
  errorCount: number;
  pendingCount: number;
  errorRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  uniqueProfiles: number;
  uniqueServers: number;
}

export interface SummaryTimeseriesPoint {
  timestamp: string;
  total: number;
  success: number;
  error: number;
  pending: number;
}

export interface SummaryStatusBreakdown {
  status: 'pending' | 'success' | 'error';
  count: number;
}

export interface SummaryRequestTypeBreakdown {
  requestType: string;
  count: number;
  errorRate: number;
  avgDurationMs: number;
}

export interface SummaryServerBreakdown {
  mcpServerId: string | null;
  name: string;
  count: number;
  errorRate: number;
  avgDurationMs: number;
}

export interface SummaryLatencyBucket {
  label: string;
  count: number;
}

interface TimeseriesRow {
  bucket: Date | string;
  total: number | string | bigint;
  success: number | string | bigint;
  error: number | string | bigint;
  pending: number | string | bigint;
}

interface P95Row {
  p95_duration_ms: number | string | null;
}

@Injectable()
export class DebugService {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 100;
  private static readonly MAX_LIMIT = 200;
  private static readonly LATENCY_BUCKETS = [
    { label: '0-100ms', min: 0, max: 100 },
    { label: '100-500ms', min: 100, max: 500 },
    { label: '500ms-1s', min: 500, max: 1000 },
    { label: '1s+', min: 1000, max: Number.POSITIVE_INFINITY },
  ] as const;

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

  async getSummary(filter?: LogFilter) {
    const where = this.buildWhereClause(filter);
    const timeBucket = this.resolveTimeBucket(filter);

    const [totalLogs, durationAggregate, statusGroups, requestTypeGroups, requestTypeErrorGroups, serverGroups, serverErrorGroups, uniqueProfiles, uniqueServers, latencyRows, timeseriesRows, p95Rows] =
      await Promise.all([
        this.prisma.debugLog.count({ where }),
        this.prisma.debugLog.aggregate({
          where,
          _avg: { durationMs: true },
        }),
        this.prisma.debugLog.groupBy({
          where,
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.debugLog.groupBy({
          where,
          by: ['requestType'],
          _count: { _all: true },
          _avg: { durationMs: true },
        }),
        this.prisma.debugLog.groupBy({
          where: { ...where, status: 'error' },
          by: ['requestType'],
          _count: { _all: true },
        }),
        this.prisma.debugLog.groupBy({
          where,
          by: ['mcpServerId'],
          _count: { _all: true },
          _avg: { durationMs: true },
        }),
        this.prisma.debugLog.groupBy({
          where: { ...where, status: 'error' },
          by: ['mcpServerId'],
          _count: { _all: true },
        }),
        this.prisma.debugLog.findMany({
          where: this.buildDistinctWhere(where, 'profileId'),
          select: { profileId: true },
          distinct: ['profileId'],
        }),
        this.prisma.debugLog.findMany({
          where: this.buildDistinctWhere(where, 'mcpServerId'),
          select: { mcpServerId: true },
          distinct: ['mcpServerId'],
        }),
        this.prisma.debugLog.findMany({
          where: {
            ...where,
            durationMs: { not: null },
          },
          select: { durationMs: true },
        }),
        this.getTimeseries(timeBucket, filter),
        this.getP95Duration(filter),
      ]);

    const successCount = this.getGroupCount(statusGroups, 'status', 'success');
    const errorCount = this.getGroupCount(statusGroups, 'status', 'error');
    const pendingCount = this.getGroupCount(statusGroups, 'status', 'pending');

    const requestTypeErrorMap = new Map(
      requestTypeErrorGroups.map((group) => [group.requestType, this.getAllCount(group._count)])
    );
    const serverErrorMap = new Map(
      serverErrorGroups.map((group) => [group.mcpServerId ?? '__null__', this.getAllCount(group._count)])
    );

    const serverIds = serverGroups
      .map((group) => group.mcpServerId)
      .filter((value): value is string => typeof value === 'string');
    const serverNames = new Map<string, string>();
    if (serverIds.length > 0) {
      const servers = await this.prisma.mcpServer.findMany({
        where: { id: { in: serverIds } },
        select: { id: true, name: true },
      });
      for (const server of servers) {
        serverNames.set(server.id, server.name);
      }
    }

    const overview: SummaryOverview = {
      totalLogs,
      successCount,
      errorCount,
      pendingCount,
      errorRate: this.computeErrorRate(errorCount, totalLogs),
      avgDurationMs: this.roundDuration(durationAggregate._avg.durationMs),
      p95DurationMs: this.roundDuration(p95Rows[0]?.p95_duration_ms ?? null),
      uniqueProfiles: uniqueProfiles.length,
      uniqueServers: uniqueServers.length,
    };

    const statusBreakdown: SummaryStatusBreakdown[] = statusGroups
      .map((group) => ({
        status: group.status as SummaryStatusBreakdown['status'],
        count: this.getAllCount(group._count),
      }))
      .sort((a, b) => b.count - a.count);

    const requestTypeBreakdown: SummaryRequestTypeBreakdown[] = requestTypeGroups
      .map((group) => {
        const count = this.getAllCount(group._count);
        const errorGroupCount = requestTypeErrorMap.get(group.requestType) ?? 0;

        return {
          requestType: group.requestType,
          count,
          errorRate: this.computeErrorRate(errorGroupCount, count),
          avgDurationMs: this.roundDuration(group._avg.durationMs),
        };
      })
      .sort((a, b) => b.count - a.count || a.requestType.localeCompare(b.requestType));

    const serverBreakdown: SummaryServerBreakdown[] = serverGroups
      .map((group) => {
        const count = this.getAllCount(group._count);
        const errorGroupCount = serverErrorMap.get(group.mcpServerId ?? '__null__') ?? 0;

        return {
          mcpServerId: group.mcpServerId,
          name: this.resolveServerName(group.mcpServerId, serverNames),
          count,
          errorRate: this.computeErrorRate(errorGroupCount, count),
          avgDurationMs: this.roundDuration(group._avg.durationMs),
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const latencyBuckets = this.buildLatencyBuckets(latencyRows);

    return {
      overview,
      timeBucket,
      timeseries: timeseriesRows.map((row) => ({
        timestamp: new Date(row.bucket).toISOString(),
        total: this.toNumber(row.total),
        success: this.toNumber(row.success),
        error: this.toNumber(row.error),
        pending: this.toNumber(row.pending),
      })),
      statusBreakdown,
      requestTypeBreakdown,
      serverBreakdown,
      latencyBuckets,
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

  private buildDistinctWhere(where: Record<string, unknown>, field: 'profileId' | 'mcpServerId') {
    const distinctWhere = { ...where };
    const existingField = distinctWhere[field];

    if (typeof existingField === 'string') {
      return distinctWhere;
    }

    distinctWhere[field] = { not: null };
    return distinctWhere;
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

  private resolveTimeBucket(filter?: LogFilter) {
    const since = this.normalizeDate(filter?.since);
    const until = this.normalizeDate(filter?.until);

    if (!since && !until) {
      return 'day' as const;
    }

    if (since) {
      const end = until ?? new Date();
      if (end.getTime() - since.getTime() <= 72 * 60 * 60 * 1000) {
        return 'hour' as const;
      }
    }

    return 'day' as const;
  }

  private async getTimeseries(timeBucket: 'hour' | 'day', filter?: LogFilter) {
    const whereSql = this.buildSummarySqlWhere(filter);

    return this.prisma.$queryRaw<TimeseriesRow[]>(Prisma.sql`
      SELECT
        date_trunc(${timeBucket}, created_at) AS bucket,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'success')::int AS success,
        COUNT(*) FILTER (WHERE status = 'error')::int AS error,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
      FROM "debug_logs"
      ${whereSql}
      GROUP BY bucket
      ORDER BY bucket ASC
    `);
  }

  private async getP95Duration(filter?: LogFilter) {
    const whereSql = this.buildSummarySqlWhere(filter, [Prisma.sql`duration_ms IS NOT NULL`]);

    return this.prisma.$queryRaw<P95Row[]>(Prisma.sql`
      SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms
      FROM "debug_logs"
      ${whereSql}
    `);
  }

  private buildSummarySqlWhere(filter?: LogFilter, extraConditions: Prisma.Sql[] = []) {
    const conditions: Prisma.Sql[] = [...extraConditions];
    const since = this.normalizeDate(filter?.since);
    const until = this.normalizeDate(filter?.until);

    if (filter?.profileId) {
      conditions.push(Prisma.sql`profile_id = ${filter.profileId}`);
    }

    if (filter?.mcpServerId) {
      conditions.push(Prisma.sql`mcp_server_id = ${filter.mcpServerId}`);
    }

    if (filter?.requestType) {
      conditions.push(Prisma.sql`request_type = ${filter.requestType}`);
    }

    if (filter?.status) {
      conditions.push(Prisma.sql`status = ${filter.status}`);
    }

    if (since) {
      conditions.push(Prisma.sql`created_at >= ${since}`);
    }

    if (until) {
      conditions.push(Prisma.sql`created_at <= ${until}`);
    }

    if (conditions.length === 0) {
      return Prisma.empty;
    }

    return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
  }

  private getAllCount(count: { _all?: number | null }) {
    return this.toNumber(count._all ?? 0);
  }

  private getGroupCount<T extends string>(
    groups: Array<{ [key: string]: unknown; _count: { _all?: number | null } }>,
    key: string,
    value: T
  ) {
    const match = groups.find((group) => group[key] === value);
    return match ? this.getAllCount(match._count) : 0;
  }

  private computeErrorRate(errors: number, total: number) {
    if (total <= 0) {
      return 0;
    }

    return Number(((errors / total) * 100).toFixed(1));
  }

  private roundDuration(value: number | string | null | undefined) {
    if (value === null || value === undefined) {
      return 0;
    }

    return Math.round(this.toNumber(value));
  }

  private toNumber(value: number | string | bigint | null | undefined) {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private resolveServerName(serverId: string | null, serverNames: Map<string, string>) {
    if (!serverId) {
      return 'Aggregated profile request';
    }

    return serverNames.get(serverId) ?? serverId;
  }

  private buildLatencyBuckets(rows: Array<{ durationMs: number | null }>): SummaryLatencyBucket[] {
    const buckets = DebugService.LATENCY_BUCKETS.map((bucket) => ({
      label: bucket.label,
      count: 0,
    }));

    for (const row of rows) {
      const duration = row.durationMs;
      if (duration === null || duration === undefined) {
        continue;
      }

      const bucketIndex = DebugService.LATENCY_BUCKETS.findIndex((bucket) => {
        if (bucket.max === Number.POSITIVE_INFINITY) {
          return duration >= bucket.min;
        }

        return duration >= bucket.min && duration < bucket.max;
      });

      if (bucketIndex >= 0) {
        buckets[bucketIndex].count += 1;
      }
    }

    return buckets;
  }
}
