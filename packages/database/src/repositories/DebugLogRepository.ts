/**
 * Debug Log Repository
 *
 * Database operations for debug logs using Drizzle ORM
 */

import type { DebugLog } from '@dxheroes/local-mcp-core';
import { and, desc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { debugLogs } from '../schema.js';

export interface DebugLogFilter {
  profileId?: string;
  mcpServerId?: string;
  requestType?: string;
  status?: 'pending' | 'success' | 'error';
  limit?: number;
  offset?: number;
}

export class DebugLogRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Create debug log entry
   * @param logData - Debug log data
   * @returns Created debug log
   */
  async create(logData: Omit<DebugLog, 'id' | 'createdAt'>): Promise<DebugLog> {
    const id = crypto.randomUUID();
    const now = Date.now();

    await this.db.insert(debugLogs).values({
      id,
      profileId: logData.profileId,
      mcpServerId: logData.mcpServerId || null,
      requestType: logData.requestType,
      requestPayload: logData.requestPayload,
      responsePayload: logData.responsePayload || null,
      status: logData.status,
      errorMessage: logData.errorMessage || null,
      durationMs: logData.durationMs || null,
      createdAt: now,
    });

    const found = await this.findById(id);
    if (!found) {
      throw new Error(`Debug log with id "${id}" not found`);
    }
    return found;
  }

  /**
   * Find debug log by ID
   * @param id - Debug log ID
   * @returns Debug log or null if not found
   */
  async findById(id: string): Promise<DebugLog | null> {
    const result = await this.db.select().from(debugLogs).where(eq(debugLogs.id, id)).limit(1);

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      profileId: row.profileId,
      mcpServerId: row.mcpServerId || undefined,
      requestType: row.requestType,
      requestPayload: row.requestPayload,
      responsePayload: row.responsePayload || undefined,
      status: row.status as 'pending' | 'success' | 'error',
      errorMessage: row.errorMessage || undefined,
      durationMs: row.durationMs || undefined,
      createdAt: row.createdAt,
    };
  }

  /**
   * Find debug logs with filtering
   * @param filter - Filter options
   * @returns Array of debug logs
   */
  async findMany(filter: DebugLogFilter = {}): Promise<DebugLog[]> {
    const conditions = [];

    if (filter.profileId) {
      conditions.push(eq(debugLogs.profileId, filter.profileId));
    }
    if (filter.mcpServerId) {
      conditions.push(eq(debugLogs.mcpServerId, filter.mcpServerId));
    }
    if (filter.requestType) {
      conditions.push(eq(debugLogs.requestType, filter.requestType));
    }
    if (filter.status) {
      conditions.push(eq(debugLogs.status, filter.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filter.limit || 100;
    const offset = filter.offset || 0;

    const rows = await this.db
      .select()
      .from(debugLogs)
      .where(whereClause)
      .orderBy(desc(debugLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      id: row.id,
      profileId: row.profileId,
      mcpServerId: row.mcpServerId || undefined,
      requestType: row.requestType,
      requestPayload: row.requestPayload,
      responsePayload: row.responsePayload || undefined,
      status: row.status as 'pending' | 'success' | 'error',
      errorMessage: row.errorMessage || undefined,
      durationMs: row.durationMs || undefined,
      createdAt: row.createdAt,
    }));
  }

  /**
   * Update debug log (for updating response payload, status, etc.)
   * @param id - Debug log ID
   * @param updates - Updates
   * @returns Updated debug log
   */
  async update(
    id: string,
    updates: {
      responsePayload?: string;
      status?: 'pending' | 'success' | 'error';
      errorMessage?: string | null;
      durationMs?: number;
    }
  ): Promise<DebugLog> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Debug log with id "${id}" not found`);
    }

    const updateData: Partial<typeof debugLogs.$inferInsert> = {};

    if (updates.responsePayload !== undefined) {
      updateData.responsePayload = updates.responsePayload || null;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.errorMessage !== undefined) {
      updateData.errorMessage = updates.errorMessage || null;
    }
    if (updates.durationMs !== undefined) {
      updateData.durationMs = updates.durationMs || null;
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    await this.db.update(debugLogs).set(updateData).where(eq(debugLogs.id, id));

    const found = await this.findById(id);
    if (!found) {
      throw new Error(`Debug log with id "${id}" not found`);
    }
    return found;
  }

  /**
   * Delete debug log
   * @param id - Debug log ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(debugLogs).where(eq(debugLogs.id, id));
  }

  /**
   * Delete debug logs by profile ID
   * @param profileId - Profile ID
   */
  async clearByProfileId(profileId: string): Promise<void> {
    await this.db.delete(debugLogs).where(eq(debugLogs.profileId, profileId));
  }
}
