/**
 * Database connection and utilities using Drizzle ORM
 */

import Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

/**
 * Create database connection using Drizzle ORM
 * @param path - Database file path
 * @returns Drizzle database instance
 */
export function createDatabase(path: string): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(path);

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Set WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL');

  // Create Drizzle instance
  const db = drizzle(sqlite, { schema });

  return db;
}

/**
 * Get raw SQLite database instance (for migrations)
 * @param path - Database file path
 * @returns Raw SQLite database instance
 */
export function createRawDatabase(path: string): Database.Database {
  const db = new Database(path);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Set WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  return db;
}

// Export schema for use in repositories
export { schema };
export type { Database as DatabaseType } from 'better-sqlite3';
