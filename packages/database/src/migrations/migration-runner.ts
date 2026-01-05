/**
 * Migration runner
 * Executes database migrations in order
 */

import { randomUUID } from 'node:crypto';
import type { Database as DatabaseType } from 'better-sqlite3';
import Database from 'better-sqlite3';
import * as migration001 from './001_initial_schema.js';
import * as migration002 from './002_add_oauth_support.js';
import * as migration003 from './003_add_monetization.js';
import * as migration004 from './004_migrate_to_better_auth.js';
import * as migration005 from './005_add_tool_customizations.js';

interface Migration {
  name: string;
  up: (db: DatabaseType) => void;
  down: (db: DatabaseType) => void;
}

const migrations: Migration[] = [
  {
    name: '001_initial_schema',
    up: migration001.up,
    down: migration001.down,
  },
  {
    name: '002_add_oauth_support',
    up: migration002.up,
    down: migration002.down,
  },
  {
    name: '003_add_monetization',
    up: migration003.up,
    down: migration003.down,
  },
  {
    name: '004_migrate_to_better_auth',
    up: migration004.up,
    down: migration004.down,
  },
  {
    name: '005_add_tool_customizations',
    up: migration005.up,
    down: migration005.down,
  },
];

/**
 * Run all pending migrations
 * @param dbPath - Path to SQLite database file
 */
export async function runMigrations(dbPath: string): Promise<void> {
  const db = new Database(dbPath);

  try {
    // Ensure migrations table exists (created by first migration)
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at INTEGER NOT NULL
      )
    `);

    // Get executed migrations
    const executedMigrations = db
      .prepare('SELECT name FROM migrations ORDER BY name')
      .all() as Array<{ name: string }>;
    const executedNames = new Set(executedMigrations.map((m) => m.name));

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedNames.has(migration.name)) {
        console.log(`Running migration: ${migration.name}`);
        const transaction = db.transaction(() => {
          migration.up(db);
          db.prepare('INSERT INTO migrations (id, name, executed_at) VALUES (?, ?, ?)').run(
            randomUUID(),
            migration.name,
            Date.now()
          );
        });
        transaction();
        console.log(`Migration ${migration.name} completed`);
      }
    }
  } finally {
    db.close();
  }
}

/**
 * Rollback last migration
 * @param dbPath - Path to SQLite database file
 */
export async function rollbackLastMigration(dbPath: string): Promise<void> {
  const db = new Database(dbPath);

  try {
    const executedMigrations = db
      .prepare('SELECT name FROM migrations ORDER BY name DESC LIMIT 1')
      .get() as { name: string } | undefined;

    if (!executedMigrations) {
      console.log('No migrations to rollback');
      return;
    }

    const migration = migrations.find((m) => m.name === executedMigrations.name);
    if (!migration) {
      throw new Error(`Migration ${executedMigrations.name} not found`);
    }

    console.log(`Rolling back migration: ${migration.name}`);
    const transaction = db.transaction(() => {
      migration.down(db);
      db.prepare('DELETE FROM migrations WHERE name = ?').run(migration.name);
    });
    transaction();
    console.log(`Migration ${migration.name} rolled back`);
  } finally {
    db.close();
  }
}
