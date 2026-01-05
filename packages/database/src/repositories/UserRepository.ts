/**
 * User Repository
 *
 * Database operations for users using Drizzle ORM
 */

import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../schema.js';
import { users } from '../schema.js';

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  image?: string;
}

export interface UserUpdateInput {
  name?: string;
  image?: string;
  emailVerified?: boolean;
  status?: 'active' | 'suspended';
}

export class UserRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  /**
   * Create a new user
   * @param input - User creation input
   * @returns Created user
   */
  async create(input: UserCreateInput): Promise<schema.User> {
    const result = await this.db
      .insert(users)
      .values({
        email: input.email,
        password: input.password,
        name: input.name,
        image: input.image || null,
      })
      .returning();

    const user = result[0];
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User or null if not found
   */
  async findById(id: string): Promise<schema.User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<schema.User | null> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  /**
   * Find all users
   * @returns Array of all users
   */
  async findAll(): Promise<schema.User[]> {
    return this.db.select().from(users);
  }

  /**
   * Update user
   * @param id - User ID
   * @param input - User update input
   * @returns Updated user
   */
  async update(id: string, input: UserUpdateInput): Promise<schema.User> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`User ${id} not found`);

    const updateData: Record<string, any> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.image !== undefined) updateData.image = input.image || null;
    if (input.emailVerified !== undefined) updateData.emailVerified = input.emailVerified;
    if (input.status !== undefined) updateData.status = input.status;

    await this.db.update(users).set(updateData).where(eq(users.id, id));

    const updated = await this.findById(id);
    if (!updated) throw new Error('User not found after update');
    return updated;
  }

  /**
   * Delete user
   * @param id - User ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
