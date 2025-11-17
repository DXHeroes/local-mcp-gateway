/**
 * Initial database schema migration
 * Creates all base tables: profiles, mcp_servers, profile_mcp_servers, debug_logs, migrations
 */

import type { Database as DatabaseType } from 'better-sqlite3';

export function up(db: DatabaseType): void {
  // Profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // MCP servers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT NOT NULL,
      oauth_config TEXT,
      api_key_config TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Profile-MCP server relationships
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile_mcp_servers (
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
      "order" INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (profile_id, mcp_server_id)
    )
  `);

  // Debug logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS debug_logs (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      mcp_server_id TEXT REFERENCES mcp_servers(id) ON DELETE SET NULL,
      request_type TEXT NOT NULL,
      request_payload TEXT NOT NULL,
      response_payload TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      duration_ms INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  // Migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      executed_at INTEGER NOT NULL
    )
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
    CREATE INDEX IF NOT EXISTS idx_mcp_servers_type ON mcp_servers(type);
    CREATE INDEX IF NOT EXISTS idx_profile_mcp_servers_profile ON profile_mcp_servers(profile_id);
    CREATE INDEX IF NOT EXISTS idx_profile_mcp_servers_mcp ON profile_mcp_servers(mcp_server_id);
    CREATE INDEX IF NOT EXISTS idx_debug_logs_profile ON debug_logs(profile_id);
    CREATE INDEX IF NOT EXISTS idx_debug_logs_mcp_server ON debug_logs(mcp_server_id);
    CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON debug_logs(created_at);
  `);
}

export function down(db: DatabaseType): void {
  db.exec(`
    DROP INDEX IF EXISTS idx_debug_logs_created_at;
    DROP INDEX IF EXISTS idx_debug_logs_mcp_server;
    DROP INDEX IF EXISTS idx_debug_logs_profile;
    DROP INDEX IF EXISTS idx_profile_mcp_servers_mcp;
    DROP INDEX IF EXISTS idx_profile_mcp_servers_profile;
    DROP INDEX IF EXISTS idx_mcp_servers_type;
    DROP INDEX IF EXISTS idx_profiles_name;
    DROP TABLE IF EXISTS migrations;
    DROP TABLE IF EXISTS debug_logs;
    DROP TABLE IF EXISTS profile_mcp_servers;
    DROP TABLE IF EXISTS mcp_servers;
    DROP TABLE IF EXISTS profiles;
  `);
}
