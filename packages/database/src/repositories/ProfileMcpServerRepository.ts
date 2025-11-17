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
}

export class ProfileMcpServerRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Add MCP server to profile
   * @param input - Profile ID, MCP server ID, and optional order
   */
  async addServerToProfile(input: AddServerToProfileInput): Promise<void> {
    const order = input.order ?? 0;

    await this.db.insert(profileMcpServers).values({
      profileId: input.profileId,
      mcpServerId: input.mcpServerId,
      order,
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
}
