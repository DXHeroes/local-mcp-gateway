/**
 * Seed runner
 * Executes seed data for onboarding
 */

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
