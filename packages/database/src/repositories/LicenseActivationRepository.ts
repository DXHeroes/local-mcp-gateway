/**
 * License Activation Repository
 *
 * Database operations for license activations using Drizzle ORM
 */

import { and, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../schema.js';
import { licenseActivations } from '../schema.js';

export interface LicenseActivationCreateInput {
  licenseKeyId: string;
  instanceId: string;
  instanceName?: string;
  hostname?: string;
  osType?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface LicenseActivationUpdateInput {
  instanceName?: string;
  hostname?: string;
  osType?: string;
  osVersion?: string;
  appVersion?: string;
  isActive?: boolean;
  lastSeen?: Date;
}

export class LicenseActivationRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  /**
   * Create a new license activation
   * @param input - License activation creation input
   * @returns Created license activation
   */
  async create(input: LicenseActivationCreateInput): Promise<schema.LicenseActivation> {
    const result = await this.db
      .insert(licenseActivations)
      .values({
        licenseKeyId: input.licenseKeyId,
        instanceId: input.instanceId,
        instanceName: input.instanceName || null,
        hostname: input.hostname || null,
        osType: input.osType || null,
        osVersion: input.osVersion || null,
        appVersion: input.appVersion || null,
      })
      .returning();

    const activation = result[0];
    if (!activation) throw new Error('Failed to create license activation');
    return activation;
  }

  /**
   * Find license activation by ID
   * @param id - License activation ID
   * @returns License activation or null if not found
   */
  async findById(id: string): Promise<schema.LicenseActivation | null> {
    const result = await this.db
      .select()
      .from(licenseActivations)
      .where(eq(licenseActivations.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find license activation by instance ID
   * @param instanceId - Instance ID
   * @returns License activation or null if not found
   */
  async findByInstanceId(instanceId: string): Promise<schema.LicenseActivation | null> {
    const result = await this.db
      .select()
      .from(licenseActivations)
      .where(eq(licenseActivations.instanceId, instanceId))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find license activation by license key and instance
   * @param licenseKeyId - License key ID
   * @param instanceId - Instance ID
   * @returns License activation or null if not found
   */
  async findByLicenseAndInstance(
    licenseKeyId: string,
    instanceId: string
  ): Promise<schema.LicenseActivation | null> {
    const result = await this.db
      .select()
      .from(licenseActivations)
      .where(
        and(
          eq(licenseActivations.licenseKeyId, licenseKeyId),
          eq(licenseActivations.instanceId, instanceId)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find all activations for a license key
   * @param licenseKeyId - License key ID
   * @returns Array of license activations
   */
  async findByLicenseKeyId(licenseKeyId: string): Promise<schema.LicenseActivation[]> {
    return this.db
      .select()
      .from(licenseActivations)
      .where(eq(licenseActivations.licenseKeyId, licenseKeyId));
  }

  /**
   * Find active activations for a license key
   * @param licenseKeyId - License key ID
   * @returns Array of active license activations
   */
  async findActiveByLicenseKeyId(licenseKeyId: string): Promise<schema.LicenseActivation[]> {
    return this.db
      .select()
      .from(licenseActivations)
      .where(
        and(
          eq(licenseActivations.licenseKeyId, licenseKeyId),
          eq(licenseActivations.isActive, true)
        )
      );
  }

  /**
   * Count active activations for a license key
   * @param licenseKeyId - License key ID
   * @returns Number of active activations
   */
  async countActiveByLicenseKeyId(licenseKeyId: string): Promise<number> {
    const activations = await this.findActiveByLicenseKeyId(licenseKeyId);
    return activations.length;
  }

  /**
   * Update license activation
   * @param id - License activation ID
   * @param input - License activation update input
   * @returns Updated license activation
   */
  async update(id: string, input: LicenseActivationUpdateInput): Promise<schema.LicenseActivation> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`License activation ${id} not found`);

    const updateData: Partial<schema.NewLicenseActivation> = {};

    if (input.instanceName !== undefined) updateData.instanceName = input.instanceName || null;
    if (input.hostname !== undefined) updateData.hostname = input.hostname || null;
    if (input.osType !== undefined) updateData.osType = input.osType || null;
    if (input.osVersion !== undefined) updateData.osVersion = input.osVersion || null;
    if (input.appVersion !== undefined) updateData.appVersion = input.appVersion || null;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.lastSeen !== undefined) updateData.lastSeen = input.lastSeen;

    await this.db.update(licenseActivations).set(updateData).where(eq(licenseActivations.id, id));

    const updated = await this.findById(id);
    if (!updated) throw new Error('License activation not found after update');
    return updated;
  }

  /**
   * Update last seen timestamp (heartbeat)
   * @param id - License activation ID
   */
  async updateLastSeen(id: string): Promise<schema.LicenseActivation> {
    return this.update(id, { lastSeen: new Date() });
  }

  /**
   * Deactivate license activation
   * @param id - License activation ID
   */
  async deactivate(id: string): Promise<schema.LicenseActivation> {
    return this.update(id, { isActive: false });
  }

  /**
   * Delete license activation
   * @param id - License activation ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(licenseActivations).where(eq(licenseActivations.id, id));
  }
}
