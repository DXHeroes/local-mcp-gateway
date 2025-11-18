/**
 * Default profiles seed data
 * Creates default profiles for onboarding
 */

import { randomUUID } from 'node:crypto';
import type { Database as DatabaseType } from 'better-sqlite3';

export function seedDefaultProfiles(db: DatabaseType): void {
  const now = Date.now();

  // Default profile
  const defaultProfileId = randomUUID();
  db.prepare(
    'INSERT OR IGNORE INTO profiles (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(defaultProfileId, 'default', 'Default profile with example MCP servers', now, now);

  // Context7 MCP Server
  const context7ServerId = randomUUID();
  db.prepare(
    'INSERT OR IGNORE INTO mcp_servers (id, name, type, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    context7ServerId,
    'Context7',
    'remote_http',
    JSON.stringify({ url: 'https://mcp.context7.com/mcp' }),
    now,
    now
  );

  // Link Context7 to Default Profile
  db.prepare(
    'INSERT OR IGNORE INTO profile_mcp_servers (profile_id, mcp_server_id, "order") VALUES (?, ?, ?)'
  ).run(defaultProfileId, context7ServerId, 0);

  console.log('Seeded default profiles with Context7 MCP');
}
