/**
 * Profile Manager
 *
 * Manages profile CRUD operations and validation
 */

import { z } from 'zod';
import type { Profile } from '../types/profile.js';

/**
 * Profile creation input schema
 */
const profileCreateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Name must contain only alphanumeric characters, dashes, and underscores'
    ),
  description: z.string().max(500).optional(),
});

/**
 * Profile update input schema
 */
const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Name must contain only alphanumeric characters, dashes, and underscores'
    )
    .optional(),
  description: z.string().max(500).optional(),
});

/**
 * Profile creation input
 */
export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;

/**
 * Profile update input
 */
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Profile repository interface
 * Implemented by database layer
 */
export interface ProfileRepository {
  create(input: ProfileCreateInput): Promise<Profile>;
  findById(id: string): Promise<Profile | null>;
  findAll(): Promise<Profile[]>;
  update(id: string, input: ProfileUpdateInput): Promise<Profile>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<Profile | null>;
}

/**
 * Profile Manager
 *
 * Provides high-level profile management with validation
 */
export class ProfileManager {
  constructor(private repository: ProfileRepository) {}

  /**
   * Create a new profile
   * @param input - Profile creation input
   * @returns Created profile
   * @throws {ValidationError} If input is invalid
   * @throws {Error} If profile name already exists
   */
  async create(input: ProfileCreateInput): Promise<Profile> {
    // Validate input
    const validated = profileCreateSchema.parse(input);

    // Check if name already exists
    const existing = await this.repository.findByName(validated.name);
    if (existing) {
      throw new Error(`Profile with name "${validated.name}" already exists`);
    }

    // Create profile
    return await this.repository.create(validated);
  }

  /**
   * Get profile by ID
   * @param id - Profile ID
   * @returns Profile or null if not found
   */
  async getById(id: string): Promise<Profile | null> {
    return await this.repository.findById(id);
  }

  /**
   * List all profiles
   * @returns Array of profiles
   */
  async listAll(): Promise<Profile[]> {
    return await this.repository.findAll();
  }

  /**
   * Update profile
   * @param id - Profile ID
   * @param input - Profile update input
   * @returns Updated profile
   * @throws {ValidationError} If input is invalid
   * @throws {Error} If profile not found
   */
  async update(id: string, input: ProfileUpdateInput): Promise<Profile> {
    // Validate input
    const validated = profileUpdateSchema.parse(input);

    // Check if profile exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Profile with id "${id}" not found`);
    }

    // Check if new name conflicts with existing profile (excluding current profile)
    if (validated.name && validated.name !== existing.name) {
      const nameConflict = await this.repository.findByName(validated.name);
      if (nameConflict && nameConflict.id !== id) {
        throw new Error(`Profile with name "${validated.name}" already exists`);
      }
    }

    // Update profile
    return await this.repository.update(id, validated);
  }

  /**
   * Delete profile
   * @param id - Profile ID
   * @throws {Error} If profile not found
   */
  async delete(id: string): Promise<void> {
    // Check if profile exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Profile with id "${id}" not found`);
    }

    // Delete profile
    await this.repository.delete(id);
  }

  /**
   * Generate MCP endpoint URL for a profile
   * @param profileName - Profile name
   * @param transport - Transport type ('http' or 'sse')
   * @returns MCP endpoint URL
   */
  generateMcpEndpointUrl(profileName: string, transport: 'http' | 'sse' = 'http'): string {
    if (transport === 'sse') {
      return `/api/mcp/${profileName}/sse`;
    }
    return `/api/mcp/${profileName}`;
  }
}
