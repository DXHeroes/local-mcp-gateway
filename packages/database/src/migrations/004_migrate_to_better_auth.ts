/**
 * Migration: Add Better Auth tables and rename password_hash to password
 *
 * This migration:
 * 1. Renames users.password_hash → users.password (better-auth expects 'password')
 * 2. Creates better-auth tables: session, account, verification, twoFactor, backupCode
 */

import type { Database } from 'better-sqlite3';

export function up(db: Database): void {
  console.log('Running migration: 004_migrate_to_better_auth');

  // 1. Rename password_hash to password in users table
  console.log('  - Renaming users.password_hash → users.password');
  db.exec(`
    ALTER TABLE users RENAME COLUMN password_hash TO password;
  `);

  // 2. Create session table
  console.log('  - Creating session table');
  db.exec(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_session_user ON session(user_id);
    CREATE INDEX IF NOT EXISTS idx_session_expires ON session(expires_at);
  `);

  // 3. Create account table (for OAuth)
  console.log('  - Creating account table');
  db.exec(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, account_id)
    );

    CREATE INDEX IF NOT EXISTS idx_account_user ON account(user_id);
    CREATE INDEX IF NOT EXISTS idx_account_provider ON account(provider);
  `);

  // 4. Create verification table (for email verification & password reset)
  console.log('  - Creating verification table');
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
    CREATE INDEX IF NOT EXISTS idx_verification_value ON verification(value);
  `);

  // 5. Create twoFactor table (for 2FA/TOTP)
  console.log('  - Creating twoFactor table');
  db.exec(`
    CREATE TABLE IF NOT EXISTS two_factor (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      secret TEXT NOT NULL,
      backup_codes TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_two_factor_user ON two_factor(user_id);
  `);

  // 6. Create backupCode table (alternative to twoFactor.backup_codes)
  // Better-auth uses either backup_codes column or separate table
  console.log('  - Creating backup_code table');
  db.exec(`
    CREATE TABLE IF NOT EXISTS backup_code (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_backup_code_user ON backup_code(user_id);
  `);

  console.log('Migration 004_migrate_to_better_auth completed successfully');
}

export function down(db: Database): void {
  console.log('Rolling back migration: 004_migrate_to_better_auth');

  // Rollback in reverse order
  console.log('  - Dropping backup_code table');
  db.exec(`DROP TABLE IF EXISTS backup_code;`);

  console.log('  - Dropping two_factor table');
  db.exec(`DROP TABLE IF EXISTS two_factor;`);

  console.log('  - Dropping verification table');
  db.exec(`DROP TABLE IF EXISTS verification;`);

  console.log('  - Dropping account table');
  db.exec(`DROP TABLE IF EXISTS account;`);

  console.log('  - Dropping session table');
  db.exec(`DROP TABLE IF EXISTS session;`);

  // Rename password back to password_hash
  console.log('  - Renaming users.password → users.password_hash');
  db.exec(`
    ALTER TABLE users RENAME COLUMN password TO password_hash;
  `);

  console.log('Rollback 004_migrate_to_better_auth completed successfully');
}
