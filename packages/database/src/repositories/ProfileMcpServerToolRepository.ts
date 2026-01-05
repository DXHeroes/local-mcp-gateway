/**
 * Profile-MCP Server Tool Repository
 *
 * Manages tool customizations per profile and MCP server
 */

import { and, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import {
  type NewProfileMcpServerTool,
  type ProfileMcpServerTool,
  profileMcpServerTools,
} from '../schema.js';

export class ProfileMcpServerToolRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Find all tool customizations for a profile and MCP server
   */
  async findByProfileAndServer(
    profileId: string,
    mcpServerId: string
  ): Promise<ProfileMcpServerTool[]> {
    return this.db
      .select()
      .from(profileMcpServerTools)
      .where(
        and(
          eq(profileMcpServerTools.profileId, profileId),
          eq(profileMcpServerTools.mcpServerId, mcpServerId)
        )
      );
  }

  /**
   * Find a specific tool customization
   */
  async findByProfileServerAndTool(
    profileId: string,
    mcpServerId: string,
    toolName: string
  ): Promise<ProfileMcpServerTool | null> {
    const results = await this.db
      .select()
      .from(profileMcpServerTools)
      .where(
        and(
          eq(profileMcpServerTools.profileId, profileId),
          eq(profileMcpServerTools.mcpServerId, mcpServerId),
          eq(profileMcpServerTools.toolName, toolName)
        )
      );
    return results[0] || null;
  }

  /**
   * Upsert a tool customization (insert or update)
   */
  async upsert(data: NewProfileMcpServerTool): Promise<ProfileMcpServerTool> {
    const existing = await this.findByProfileServerAndTool(
      data.profileId,
      data.mcpServerId,
      data.toolName
    );

    if (existing) {
      const updated = await this.db
        .update(profileMcpServerTools)
        .set({ ...data, updatedAt: Date.now() })
        .where(eq(profileMcpServerTools.id, existing.id))
        .returning();

      if (!updated[0]) {
        throw new Error('Failed to update tool customization');
      }
      return updated[0];
    }

    const inserted = await this.db
      .insert(profileMcpServerTools)
      .values({
        ...data,
        id: data.id || crypto.randomUUID(),
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      })
      .returning();

    if (!inserted[0]) {
      throw new Error('Failed to insert tool customization');
    }
    return inserted[0];
  }

  /**
   * Bulk upsert tool customizations
   */
  async bulkUpsert(tools: NewProfileMcpServerTool[]): Promise<void> {
    for (const tool of tools) {
      await this.upsert(tool);
    }
  }

  /**
   * Delete all tool customizations for a profile and MCP server
   */
  async deleteAllForProfileAndServer(profileId: string, mcpServerId: string): Promise<void> {
    await this.db
      .delete(profileMcpServerTools)
      .where(
        and(
          eq(profileMcpServerTools.profileId, profileId),
          eq(profileMcpServerTools.mcpServerId, mcpServerId)
        )
      );
  }

  /**
   * Delete a specific tool customization
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(profileMcpServerTools).where(eq(profileMcpServerTools.id, id));
  }
}
