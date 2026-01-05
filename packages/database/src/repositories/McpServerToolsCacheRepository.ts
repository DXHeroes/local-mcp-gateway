/**
 * MCP Server Tools Cache Repository
 *
 * Manages cached remote tool metadata for change detection
 */

import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { type McpServerToolsCache, mcpServerToolsCache } from '../schema.js';

export class McpServerToolsCacheRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Compute SHA256 hash of input schema for change detection
   */
  static computeSchemaHash(inputSchema: unknown): string {
    const normalized = JSON.stringify(inputSchema);
    return createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Find all cached tools for an MCP server
   */
  async findByServer(mcpServerId: string): Promise<McpServerToolsCache[]> {
    return this.db
      .select()
      .from(mcpServerToolsCache)
      .where(eq(mcpServerToolsCache.mcpServerId, mcpServerId));
  }

  /**
   * Find a specific cached tool
   */
  async findByServerAndTool(
    mcpServerId: string,
    toolName: string
  ): Promise<McpServerToolsCache | null> {
    const results = await this.db
      .select()
      .from(mcpServerToolsCache)
      .where(
        and(
          eq(mcpServerToolsCache.mcpServerId, mcpServerId),
          eq(mcpServerToolsCache.toolName, toolName)
        )
      );
    return results[0] || null;
  }

  /**
   * Upsert a cached tool (insert or update)
   */
  async upsert(data: {
    mcpServerId: string;
    toolName: string;
    description?: string;
    inputSchema?: unknown;
  }): Promise<void> {
    const schemaHash = McpServerToolsCacheRepository.computeSchemaHash(data.inputSchema);
    const existing = await this.findByServerAndTool(data.mcpServerId, data.toolName);

    if (existing) {
      await this.db
        .update(mcpServerToolsCache)
        .set({
          description: data.description,
          inputSchema: data.inputSchema as any,
          schemaHash,
          fetchedAt: Date.now(),
        })
        .where(eq(mcpServerToolsCache.id, existing.id));
    } else {
      await this.db.insert(mcpServerToolsCache).values({
        id: crypto.randomUUID(),
        mcpServerId: data.mcpServerId,
        toolName: data.toolName,
        description: data.description,
        inputSchema: data.inputSchema as any,
        schemaHash,
        fetchedAt: Date.now(),
        createdAt: Date.now(),
      });
    }
  }

  /**
   * Bulk upsert cached tools
   */
  async bulkUpsert(
    mcpServerId: string,
    tools: Array<{ name: string; description?: string; inputSchema?: unknown }>
  ): Promise<void> {
    for (const tool of tools) {
      await this.upsert({
        mcpServerId,
        toolName: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      });
    }
  }

  /**
   * Delete all cached tools for an MCP server
   */
  async deleteAllForServer(mcpServerId: string): Promise<void> {
    await this.db
      .delete(mcpServerToolsCache)
      .where(eq(mcpServerToolsCache.mcpServerId, mcpServerId));
  }

  /**
   * Delete a specific cached tool
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(mcpServerToolsCache).where(eq(mcpServerToolsCache.id, id));
  }
}
