/**
 * OAuth Token Repository
 *
 * Database operations for OAuth tokens using Drizzle ORM
 */

import type { OAuthToken } from '@local-mcp/core';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { oauthTokens } from '../schema.js';

export class OAuthTokenRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Store OAuth token
   * @param mcpServerId - MCP server ID
   * @param tokenData - Token data
   * @returns Stored token
   */
  async store(
    mcpServerId: string,
    tokenData: Omit<OAuthToken, 'id' | 'mcpServerId' | 'createdAt' | 'updatedAt'>
  ): Promise<OAuthToken> {
    // Debug: Log which server we're storing token for
    console.log('[OAuthTokenRepository] Storing token for mcpServerId:', mcpServerId);

    // Check if token already exists
    const existing = await this.get(mcpServerId);
    if (existing) {
      console.log(
        '[OAuthTokenRepository] Token already exists, updating for mcpServerId:',
        mcpServerId
      );
      // Update existing token
      return this.update(mcpServerId, tokenData);
    }

    console.log('[OAuthTokenRepository] Creating new token for mcpServerId:', mcpServerId);

    const id = crypto.randomUUID();
    const now = Date.now();

    await this.db.insert(oauthTokens).values({
      id,
      mcpServerId,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken || null,
      tokenType: tokenData.tokenType,
      expiresAt: tokenData.expiresAt || null,
      scope: tokenData.scope || null,
      createdAt: now,
      updatedAt: now,
    });

    const found = await this.get(mcpServerId);
    if (!found) {
      throw new Error(`Token for MCP server ${mcpServerId} not found`);
    }
    return found;
  }

  /**
   * Get OAuth token for MCP server
   * @param mcpServerId - MCP server ID
   * @returns OAuth token or null if not found
   */
  async get(mcpServerId: string): Promise<OAuthToken | null> {
    const result = await this.db
      .select()
      .from(oauthTokens)
      .where(eq(oauthTokens.mcpServerId, mcpServerId))
      .limit(1);

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      mcpServerId: row.mcpServerId,
      accessToken: row.accessToken,
      refreshToken: row.refreshToken || undefined,
      tokenType: row.tokenType,
      expiresAt: row.expiresAt || undefined,
      scope: row.scope || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Update OAuth token
   * @param mcpServerId - MCP server ID
   * @param updates - Token updates
   * @returns Updated token
   */
  async update(
    mcpServerId: string,
    updates: Partial<Omit<OAuthToken, 'id' | 'mcpServerId' | 'createdAt'>>
  ): Promise<OAuthToken> {
    const existing = await this.get(mcpServerId);
    if (!existing) {
      throw new Error(`Token for MCP server ${mcpServerId} not found`);
    }

    const updateData: Partial<typeof oauthTokens.$inferInsert> = {
      updatedAt: Date.now(),
    };

    if (updates.accessToken !== undefined) {
      updateData.accessToken = updates.accessToken;
    }
    if (updates.refreshToken !== undefined) {
      updateData.refreshToken = updates.refreshToken || null;
    }
    if (updates.tokenType !== undefined) {
      updateData.tokenType = updates.tokenType;
    }
    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt || null;
    }
    if (updates.scope !== undefined) {
      updateData.scope = updates.scope || null;
    }

    await this.db
      .update(oauthTokens)
      .set(updateData)
      .where(eq(oauthTokens.mcpServerId, mcpServerId));

    const found = await this.get(mcpServerId);
    if (!found) {
      throw new Error(`Token for MCP server ${mcpServerId} not found`);
    }
    return found;
  }

  /**
   * Delete OAuth token
   * @param mcpServerId - MCP server ID
   */
  async delete(mcpServerId: string): Promise<void> {
    await this.db.delete(oauthTokens).where(eq(oauthTokens.mcpServerId, mcpServerId));
  }
}
