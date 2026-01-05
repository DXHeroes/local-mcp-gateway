/**
 * Migration: Add tool customizations per profile
 *
 * Adds support for:
 * - Per-profile tool customizations (names, descriptions, input schemas)
 * - Tool enable/disable flags
 * - Remote tools cache for change detection
 * - MCP server active/inactive state in profiles
 */

import type Database from 'better-sqlite3';

export async function up(db: Database.Database): Promise<void> {
  // 1. Create profile_mcp_server_tools table
  db.exec(`
    CREATE TABLE profile_mcp_server_tools (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
      tool_name TEXT NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      custom_name TEXT,
      custom_description TEXT,
      custom_input_schema TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX idx_profile_mcp_server_tool_unique
      ON profile_mcp_server_tools(profile_id, mcp_server_id, tool_name);
    CREATE INDEX idx_profile_mcp_server_tools_profile
      ON profile_mcp_server_tools(profile_id);
    CREATE INDEX idx_profile_mcp_server_tools_server
      ON profile_mcp_server_tools(mcp_server_id);
  `);

  // 2. Add columns to profile_mcp_servers
  db.exec(`
    ALTER TABLE profile_mcp_servers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE profile_mcp_servers ADD COLUMN created_at INTEGER NOT NULL DEFAULT ${Date.now()};
    ALTER TABLE profile_mcp_servers ADD COLUMN updated_at INTEGER NOT NULL DEFAULT ${Date.now()};
  `);

  // 3. Create mcp_server_tools_cache table
  db.exec(`
    CREATE TABLE mcp_server_tools_cache (
      id TEXT PRIMARY KEY,
      mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
      tool_name TEXT NOT NULL,
      description TEXT,
      input_schema TEXT,
      schema_hash TEXT NOT NULL,
      fetched_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX idx_mcp_server_tools_cache_unique
      ON mcp_server_tools_cache(mcp_server_id, tool_name);
    CREATE INDEX idx_mcp_server_tools_cache_server
      ON mcp_server_tools_cache(mcp_server_id);
  `);
}

export async function down(db: Database.Database): Promise<void> {
  // Drop new tables
  db.exec(`
    DROP TABLE IF EXISTS profile_mcp_server_tools;
    DROP TABLE IF EXISTS mcp_server_tools_cache;
  `);

  // Note: SQLite doesn't support DROP COLUMN easily, would need table recreation
  // For now, we just leave the columns in profile_mcp_servers
  // In a production environment, you would need to recreate the table without these columns
}
