/**
 * Profile Repository
 *
 * Database operations for profiles using Drizzle ORM
 */

import type { Profile, ProfileCreateInput, ProfileUpdateInput } from '@dxheroes/local-mcp-core';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { profiles } from '../schema.js';

export class ProfileRepository {
  constructor(private db: BetterSQLite3Database<typeof import('../schema.js')>) {}

  /**
   * Create a new profile
   * @param input - Profile creation input
   * @returns Created profile
   */
  async create(input: ProfileCreateInput): Promise<Profile> {
    const id = crypto.randomUUID();
    const now = new Date();

    await this.db.insert(profiles).values({
      id,
      name: input.name,
      description: input.description || null,
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
    });

    const found = await this.findById(id);
    if (!found) {
      throw new Error(`Profile with id "${id}" not found`);
    }
    return found;
  }

  /**
   * Find profile by ID
   * @param id - Profile ID
   * @returns Profile or null if not found
   */
  async findById(id: string): Promise<Profile | null> {
    const result = await this.db.select().from(profiles).where(eq(profiles.id, id)).limit(1);

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Find all profiles
   * @returns Array of all profiles
   */
  async findAll(): Promise<Profile[]> {
    const rows = await this.db.select().from(profiles).orderBy(profiles.createdAt);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Update profile
   * @param id - Profile ID
   * @param input - Profile update input
   * @returns Updated profile
   */
  async update(id: string, input: ProfileUpdateInput): Promise<Profile> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Profile with id "${id}" not found`);
    }

    const updateData: Partial<typeof profiles.$inferInsert> = {
      updatedAt: Date.now(),
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description || null;
    }

    await this.db.update(profiles).set(updateData).where(eq(profiles.id, id));

    const found = await this.findById(id);
    if (!found) {
      throw new Error(`Profile with id "${id}" not found`);
    }
    return found;
  }

  /**
   * Delete profile
   * @param id - Profile ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(profiles).where(eq(profiles.id, id));
  }

  /**
   * Find profile by name
   * @param name - Profile name
   * @returns Profile or null if not found
   */
  async findByName(name: string): Promise<Profile | null> {
    const result = await this.db.select().from(profiles).where(eq(profiles.name, name)).limit(1);

    const row = result[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
