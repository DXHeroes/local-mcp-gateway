/**
 * Profile-MCP Server Repository
 *
 * Manages relationships between profiles and MCP servers
 */

import { and, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { profileMcpServers } from '../schema.js';

export interface AddServerToProfileInput {
  profileId: string;
  mcpServerId: string;
  order?: number;
  isActive?: boolean;
}

export class ProfileMcpServerRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Add MCP server to profile
   * @param input - Profile ID, MCP server ID, optional order, and optional isActive
   */
  async addServerToProfile(input: AddServerToProfileInput): Promise<void> {
    const order = input.order ?? 0;
    const isActive = input.isActive ?? true;

    await this.db.insert(profileMcpServers).values({
      profileId: input.profileId,
      mcpServerId: input.mcpServerId,
      order,
      isActive,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /**
   * Remove MCP server from profile
   * @param profileId - Profile ID
   * @param mcpServerId - MCP server ID
   */
  async removeServerFromProfile(profileId: string, mcpServerId: string): Promise<void> {
    await this.db
      .delete(profileMcpServers)
      .where(
        and(
          eq(profileMcpServers.profileId, profileId),
          eq(profileMcpServers.mcpServerId, mcpServerId)
        )
      );
  }

  /**
   * Get all MCP server IDs for a profile
   * @param profileId - Profile ID
   * @returns Array of MCP server IDs ordered by their order index
   */
  async getServerIdsForProfile(profileId: string): Promise<string[]> {
    const rows = await this.db
      .select({ mcpServerId: profileMcpServers.mcpServerId })
      .from(profileMcpServers)
      .where(eq(profileMcpServers.profileId, profileId))
      .orderBy(profileMcpServers.order);

    return rows.map((row) => row.mcpServerId);
  }

  /**
   * Update order of MCP server in profile
   * @param profileId - Profile ID
   * @param mcpServerId - MCP server ID
   * @param order - New order index
   */
  async updateServerOrder(profileId: string, mcpServerId: string, order: number): Promise<void> {
    await this.db
      .update(profileMcpServers)
      .set({ order })
      .where(
        and(
          eq(profileMcpServers.profileId, profileId),
          eq(profileMcpServers.mcpServerId, mcpServerId)
        )
      );
  }

  /**
   * Remove all servers from profile
   * @param profileId - Profile ID
   */
  async removeAllServersFromProfile(profileId: string): Promise<void> {
    await this.db.delete(profileMcpServers).where(eq(profileMcpServers.profileId, profileId));
  }

  /**
   * Update server configuration in profile (isActive, order, etc.)
   * @param profileId - Profile ID
   * @param mcpServerId - MCP server ID
   * @param updates - Fields to update
   */
  async updateServerInProfile(
    profileId: string,
    mcpServerId: string,
    updates: { isActive?: boolean; order?: number }
  ): Promise<void> {
    const updateData: any = { updatedAt: Date.now() };
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.order !== undefined) updateData.order = updates.order;

    await this.db
      .update(profileMcpServers)
      .set(updateData)
      .where(
        and(
          eq(profileMcpServers.profileId, profileId),
          eq(profileMcpServers.mcpServerId, mcpServerId)
        )
      );
  }

  /**
   * Get all servers for a profile with their order and isActive status
   * @param profileId - Profile ID
   * @returns Array of servers with metadata
   */
  async getServersForProfile(
    profileId: string
  ): Promise<Array<{ mcpServerId: string; order: number; isActive: boolean }>> {
    const rows = await this.db
      .select()
      .from(profileMcpServers)
      .where(eq(profileMcpServers.profileId, profileId))
      .orderBy(profileMcpServers.order);

    return rows.map((row) => ({
      mcpServerId: row.mcpServerId,
      order: row.order,
      isActive: !!row.isActive,
    }));
  }
}
