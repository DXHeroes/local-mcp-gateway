/**
 * License Key Repository
 *
 * Database operations for license keys using Drizzle ORM
 */

import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../schema.js';
import { licenseKeys } from '../schema.js';

export interface LicenseKeyCreateInput {
  userId?: string;
  organizationId?: string;
  keyPrefix: string;
  keyHash: string;
  tier: 'startup' | 'business' | 'enterprise';
  maxUsers?: number;
  maxProfiles?: number;
  maxServers?: number;
  maxActivations?: number;
  features?: string[];
  validFrom: number;
  validUntil?: number;
  status?: 'active' | 'revoked' | 'expired';
  notes?: string;
}

export interface LicenseKeyUpdateInput {
  status?: 'active' | 'revoked' | 'expired';
  maxActivations?: number;
  validUntil?: number;
  notes?: string;
}

export class LicenseKeyRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  /**
   * Create a new license key
   * @param input - License key creation input
   * @returns Created license key
   */
  async create(input: LicenseKeyCreateInput): Promise<schema.LicenseKey> {
    const result = await this.db
      .insert(licenseKeys)
      .values({
        userId: input.userId || null,
        organizationId: input.organizationId || null,
        keyPrefix: input.keyPrefix,
        keyHash: input.keyHash,
        tier: input.tier,
        maxUsers: input.maxUsers || null,
        maxProfiles: input.maxProfiles || null,
        maxServers: input.maxServers || null,
        maxActivations: input.maxActivations || 1,
        features: JSON.stringify(input.features || []),
        validFrom: new Date(input.validFrom),
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        status: input.status || 'active',
        notes: input.notes || null,
      })
      .returning();

    const licenseKey = result[0];
    if (!licenseKey) throw new Error('Failed to create license key');
    return licenseKey;
  }

  /**
   * Find license key by ID
   * @param id - License key ID
   * @returns License key or null if not found
   */
  async findById(id: string): Promise<schema.LicenseKey | null> {
    const result = await this.db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * Find license key by hash
   * @param keyHash - License key hash
   * @returns License key or null if not found
   */
  async findByHash(keyHash: string): Promise<schema.LicenseKey | null> {
    const result = await this.db
      .select()
      .from(licenseKeys)
      .where(eq(licenseKeys.keyHash, keyHash))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find license keys by prefix
   * @param keyPrefix - License key prefix (first 8 chars)
   * @returns Array of license keys
   */
  async findByPrefix(keyPrefix: string): Promise<schema.LicenseKey[]> {
    return this.db.select().from(licenseKeys).where(eq(licenseKeys.keyPrefix, keyPrefix));
  }

  /**
   * Find all license keys for user
   * @param userId - User ID
   * @returns Array of license keys
   */
  async findByUserId(userId: string): Promise<schema.LicenseKey[]> {
    return this.db.select().from(licenseKeys).where(eq(licenseKeys.userId, userId));
  }

  /**
   * Find all license keys for organization
   * @param organizationId - Organization ID
   * @returns Array of license keys
   */
  async findByOrganizationId(organizationId: string): Promise<schema.LicenseKey[]> {
    return this.db.select().from(licenseKeys).where(eq(licenseKeys.organizationId, organizationId));
  }

  /**
   * Find all license keys
   * @returns Array of all license keys
   */
  async findAll(): Promise<schema.LicenseKey[]> {
    return this.db.select().from(licenseKeys);
  }

  /**
   * Update license key
   * @param id - License key ID
   * @param input - License key update input
   * @returns Updated license key
   */
  async update(id: string, input: LicenseKeyUpdateInput): Promise<schema.LicenseKey> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`License key ${id} not found`);

    const updateData: Record<string, any> = {};

    if (input.status !== undefined) updateData.status = input.status;
    if (input.maxActivations !== undefined) updateData.maxActivations = input.maxActivations;
    if (input.validUntil !== undefined)
      updateData.validUntil = input.validUntil ? new Date(input.validUntil) : null;
    if (input.notes !== undefined) updateData.notes = input.notes || null;

    await this.db.update(licenseKeys).set(updateData).where(eq(licenseKeys.id, id));

    const updated = await this.findById(id);
    if (!updated) throw new Error('License key not found after update');
    return updated;
  }

  /**
   * Revoke license key
   * @param id - License key ID
   */
  async revoke(id: string): Promise<schema.LicenseKey> {
    return this.update(id, { status: 'revoked' });
  }

  /**
   * Delete license key
   * @param id - License key ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(licenseKeys).where(eq(licenseKeys.id, id));
  }
}
