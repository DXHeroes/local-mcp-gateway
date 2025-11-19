/**
 * MCP Server Repository
 *
 * Database operations for MCP servers using Drizzle ORM
 */

import type {
  ApiKeyConfig,
  McpServerConfig,
  McpServerEntity,
  McpServerType,
  OAuthConfig,
} from '@dxheroes/local-mcp-core';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { mcpServers, profileMcpServers } from '../schema.js';

export class McpServerRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Create MCP server
   * @param input - MCP server data
   * @returns Created MCP server
   */
  async create(input: {
    name: string;
    type: McpServerType;
    config: McpServerConfig;
    oauthConfig?: OAuthConfig;
    apiKeyConfig?: ApiKeyConfig;
  }): Promise<McpServerEntity> {
    const id = crypto.randomUUID();
    const now = Date.now();

    // Remove undefined values from oauthConfig to avoid storing them in JSON
    // This ensures that clientId and clientSecret are only stored if they have values
    const oauthConfigToStore = input.oauthConfig
      ? Object.fromEntries(
          Object.entries(input.oauthConfig).filter(([_, value]) => value !== undefined)
        )
      : null;

    await this.db.insert(mcpServers).values({
      id,
      name: input.name,
      type: input.type,
      config: input.config as unknown as Record<string, unknown>,
      oauthConfig: oauthConfigToStore
        ? (oauthConfigToStore as unknown as Record<string, unknown>)
        : null,
      apiKeyConfig: input.apiKeyConfig as unknown as Record<string, unknown> | null,
      createdAt: now,
      updatedAt: now,
    });

    const found = await this.findById(id);
    if (!found) {
      throw new Error(`MCP server with id "${id}" not found`);
    }
    return found;
  }

  /**
   * Find MCP server by ID
   * @param id - MCP server ID
   * @returns MCP server or null if not found
   */
  async findById(id: string): Promise<McpServerEntity | null> {
    const result = await this.db.select().from(mcpServers).where(eq(mcpServers.id, id)).limit(1);

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      type: row.type as McpServerType,
      config: row.config as unknown as McpServerConfig,
      oauthConfig: row.oauthConfig as unknown as OAuthConfig | undefined,
      apiKeyConfig: row.apiKeyConfig as unknown as ApiKeyConfig | undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Find all MCP servers
   * @returns Array of all MCP servers
   */
  async findAll(): Promise<McpServerEntity[]> {
    const rows = await this.db.select().from(mcpServers).orderBy(mcpServers.createdAt);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as McpServerType,
      config: row.config as unknown as McpServerConfig,
      oauthConfig: row.oauthConfig as unknown as OAuthConfig | undefined,
      apiKeyConfig: row.apiKeyConfig as unknown as ApiKeyConfig | undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Update MCP server
   * @param id - MCP server ID
   * @param updates - Updates
   * @returns Updated MCP server
   */
  async update(
    id: string,
    updates: {
      name?: string;
      type?: McpServerType;
      config?: McpServerConfig;
      oauthConfig?: OAuthConfig | null;
      apiKeyConfig?: ApiKeyConfig | null;
    }
  ): Promise<McpServerEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`MCP server with id "${id}" not found`);
    }

    const updateData: Partial<typeof mcpServers.$inferInsert> = {
      updatedAt: Date.now(),
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.type !== undefined) {
      updateData.type = updates.type;
    }
    if (updates.config !== undefined) {
      updateData.config = updates.config as unknown as Record<string, unknown>;
    }
    if (updates.oauthConfig !== undefined) {
      // Remove undefined values to avoid storing them in JSON
      // This ensures that clientId and clientSecret are only stored if they have values
      const oauthConfigToStore = updates.oauthConfig
        ? Object.fromEntries(
            Object.entries(updates.oauthConfig).filter(([_, value]) => value !== undefined)
          )
        : null;
      updateData.oauthConfig = oauthConfigToStore
        ? (oauthConfigToStore as unknown as Record<string, unknown>)
        : null;
    }
    if (updates.apiKeyConfig !== undefined) {
      updateData.apiKeyConfig = updates.apiKeyConfig
        ? (updates.apiKeyConfig as unknown as Record<string, unknown>)
        : null;
    }

    await this.db.update(mcpServers).set(updateData).where(eq(mcpServers.id, id));

    const found = await this.findById(id);
    if (!found) {
      throw new Error(`MCP server with id "${id}" not found`);
    }
    return found;
  }

  /**
   * Delete MCP server
   * @param id - MCP server ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(mcpServers).where(eq(mcpServers.id, id));
  }

  /**
   * Find MCP servers for a profile
   * @param profileId - Profile ID
   * @returns Array of MCP servers ordered by their order index
   */
  async findByProfileId(profileId: string): Promise<McpServerEntity[]> {
    const rows = await this.db
      .select()
      .from(mcpServers)
      .innerJoin(profileMcpServers, eq(mcpServers.id, profileMcpServers.mcpServerId))
      .where(eq(profileMcpServers.profileId, profileId))
      .orderBy(profileMcpServers.order);

    return rows.map((row) => ({
      id: row.mcp_servers.id,
      name: row.mcp_servers.name,
      type: row.mcp_servers.type as McpServerType,
      config: row.mcp_servers.config as unknown as McpServerConfig,
      oauthConfig: row.mcp_servers.oauthConfig as unknown as OAuthConfig | undefined,
      apiKeyConfig: row.mcp_servers.apiKeyConfig as unknown as ApiKeyConfig | undefined,
      createdAt: row.mcp_servers.createdAt,
      updatedAt: row.mcp_servers.updatedAt,
    }));
  }
}
