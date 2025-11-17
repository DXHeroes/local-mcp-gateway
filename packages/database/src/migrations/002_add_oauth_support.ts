/**
 * OAuth support migration
 * Adds OAuth tables: oauth_tokens, oauth_client_registrations
 */

import type { Database as DatabaseType } from 'better-sqlite3';

export function up(db: DatabaseType): void {
  // OAuth tokens table
  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id TEXT PRIMARY KEY,
      mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_type TEXT NOT NULL DEFAULT 'Bearer',
      expires_at INTEGER,
      scope TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // OAuth client registrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_client_registrations (
      id TEXT PRIMARY KEY,
      mcp_server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
      authorization_server_url TEXT NOT NULL,
      client_id TEXT NOT NULL,
      client_secret TEXT,
      registration_access_token TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(mcp_server_id, authorization_server_url)
    )
  `);

  // Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_oauth_tokens_mcp_server ON oauth_tokens(mcp_server_id);
    CREATE INDEX IF NOT EXISTS idx_oauth_client_registrations_mcp_server ON oauth_client_registrations(mcp_server_id);
  `);
}

export function down(db: DatabaseType): void {
  db.exec(`
    DROP INDEX IF EXISTS idx_oauth_client_registrations_mcp_server;
    DROP INDEX IF EXISTS idx_oauth_tokens_mcp_server;
    DROP TABLE IF EXISTS oauth_client_registrations;
    DROP TABLE IF EXISTS oauth_tokens;
  `);
}
