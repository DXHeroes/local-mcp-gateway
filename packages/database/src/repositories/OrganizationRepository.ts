/**
 * Organization Repository
 *
 * Database operations for organizations and their members using Drizzle ORM
 */

import { and, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../schema.js';
import { organizationMembers, organizations } from '../schema.js';

export interface OrganizationCreateInput {
  name: string;
  slug: string;
  ownerId: string;
  plan?: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface OrganizationUpdateInput {
  name?: string;
  slug?: string;
  plan?: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface OrganizationMemberCreateInput {
  userId: string;
  organizationId: string;
  role?: 'owner' | 'admin' | 'member';
}

export class OrganizationRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  /**
   * Create a new organization
   * @param input - Organization creation input
   * @returns Created organization
   */
  async create(input: OrganizationCreateInput): Promise<schema.Organization> {
    const result = await this.db
      .insert(organizations)
      .values({
        name: input.name,
        slug: input.slug,
        ownerId: input.ownerId,
        plan: input.plan || 'free',
      })
      .returning();

    const org = result[0];
    if (!org) throw new Error('Failed to create organization');
    return org;
  }

  /**
   * Find organization by ID
   * @param id - Organization ID
   * @returns Organization or null if not found
   */
  async findById(id: string): Promise<schema.Organization | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find organization by slug
   * @param slug - Organization slug
   * @returns Organization or null if not found
   */
  async findBySlug(slug: string): Promise<schema.Organization | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find all organizations owned by a user
   * @param userId - User ID
   * @returns Array of organizations
   */
  async findByOwnerId(userId: string): Promise<schema.Organization[]> {
    return this.db.select().from(organizations).where(eq(organizations.ownerId, userId));
  }

  /**
   * Find all organizations
   * @returns Array of all organizations
   */
  async findAll(): Promise<schema.Organization[]> {
    return this.db.select().from(organizations);
  }

  /**
   * Update organization
   * @param id - Organization ID
   * @param input - Organization update input
   * @returns Updated organization
   */
  async update(id: string, input: OrganizationUpdateInput): Promise<schema.Organization> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Organization ${id} not found`);

    const updateData: Record<string, any> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.plan !== undefined) updateData.plan = input.plan;

    await this.db.update(organizations).set(updateData).where(eq(organizations.id, id));

    const updated = await this.findById(id);
    if (!updated) throw new Error('Organization not found after update');
    return updated;
  }

  /**
   * Delete organization
   * @param id - Organization ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(organizations).where(eq(organizations.id, id));
  }

  /**
   * Add member to organization
   * @param input - Organization member creation input
   */
  async addMember(input: OrganizationMemberCreateInput): Promise<schema.OrganizationMember> {
    const result = await this.db
      .insert(organizationMembers)
      .values({
        userId: input.userId,
        organizationId: input.organizationId,
        role: input.role || 'member',
      })
      .returning();

    const member = result[0];
    if (!member) throw new Error('Failed to add organization member');
    return member;
  }

  /**
   * Find organization member
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Organization member or null if not found
   */
  async findMember(
    userId: string,
    organizationId: string
  ): Promise<schema.OrganizationMember | null> {
    const result = await this.db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find all members of an organization
   * @param organizationId - Organization ID
   * @returns Array of organization members
   */
  async findMembers(organizationId: string): Promise<schema.OrganizationMember[]> {
    return this.db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
  }

  /**
   * Find all organizations a user is a member of
   * @param userId - User ID
   * @returns Array of organization members
   */
  async findUserMemberships(userId: string): Promise<schema.OrganizationMember[]> {
    return this.db.select().from(organizationMembers).where(eq(organizationMembers.userId, userId));
  }

  /**
   * Update member role
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @param role - New role
   */
  async updateMemberRole(
    userId: string,
    organizationId: string,
    role: 'owner' | 'admin' | 'member'
  ): Promise<schema.OrganizationMember> {
    const existing = await this.findMember(userId, organizationId);
    if (!existing) throw new Error('Member not found');

    await this.db
      .update(organizationMembers)
      .set({ role })
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );

    const updated = await this.findMember(userId, organizationId);
    if (!updated) throw new Error('Member not found after update');
    return updated;
  }

  /**
   * Remove member from organization
   * @param userId - User ID
   * @param organizationId - Organization ID
   */
  async removeMember(userId: string, organizationId: string): Promise<void> {
    await this.db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
  }
}
