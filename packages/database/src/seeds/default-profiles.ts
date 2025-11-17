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

  console.log('Seeded default profiles');
}
