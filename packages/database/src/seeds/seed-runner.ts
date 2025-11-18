/**
 * Seed runner
 * Executes seed data for onboarding
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { seedDefaultProfiles } from './default-profiles.js';

/**
 * Run all seeds
 * @param dbPath - Path to SQLite database file
 */
export async function runSeeds(dbPath: string): Promise<void> {
  const db = new Database(dbPath);

  try {
    // Check if database is empty (no profiles)
    // We need to ensure the table exists first, which migrations should handle
    // But if this is run standalone, we assume migrations might have run or we might need to check table existence

    // Simple check if profiles table exists
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='profiles'")
      .get();

    if (!tableExists) {
      console.error('Profiles table does not exist. Run migrations first.');
      return;
    }

    const profileCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get() as {
      count: number;
    };

    if (profileCount.count === 0) {
      console.log('Database is empty, running seeds...');
      seedDefaultProfiles(db);
      console.log('Seeds completed');
    } else {
      console.log('Database already has data, skipping seeds');
    }
  } catch (error) {
    console.error('Error running seeds:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Check if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const defaultDbPath = join(homedir(), '.local-mcp-data', 'local-mcp.db');
  const dbPath = process.argv[2] || process.env.DATABASE_PATH || defaultDbPath;

  console.log(`Running seeds on database: ${dbPath}`);
  runSeeds(dbPath)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed execution failed:', error);
      process.exit(1);
    });
}
