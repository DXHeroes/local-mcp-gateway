/**
 * Subscription Repository
 *
 * Database operations for subscriptions using Drizzle ORM
 */

import { and, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type * as schema from '../schema.js';
import { subscriptions } from '../schema.js';

export interface SubscriptionCreateInput {
  userId?: string;
  organizationId?: string;
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  status?: 'active' | 'past_due' | 'canceled' | 'paused';
  billingCycle?: 'monthly' | 'annual';
  paddleSubscriptionId?: string;
  paddleCustomerId?: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: number;
}

export interface SubscriptionUpdateInput {
  tier?: 'free' | 'pro' | 'team' | 'enterprise';
  status?: 'active' | 'past_due' | 'canceled' | 'paused';
  billingCycle?: 'monthly' | 'annual';
  paddleSubscriptionId?: string;
  paddleCustomerId?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: number;
}

export class SubscriptionRepository {
  constructor(private db: BetterSQLite3Database<typeof schema>) {}

  /**
   * Create a new subscription
   * @param input - Subscription creation input
   * @returns Created subscription
   */
  async create(input: SubscriptionCreateInput): Promise<schema.Subscription> {
    const result = await this.db
      .insert(subscriptions)
      .values({
        userId: input.userId || null,
        organizationId: input.organizationId || null,
        tier: input.tier,
        status: input.status || 'active',
        billingCycle: input.billingCycle || null,
        paddleSubscriptionId: input.paddleSubscriptionId || null,
        paddleCustomerId: input.paddleCustomerId || null,
        currentPeriodStart: new Date(input.currentPeriodStart),
        currentPeriodEnd: new Date(input.currentPeriodEnd),
        cancelAtPeriodEnd: input.cancelAtPeriodEnd || false,
        trialEnd: input.trialEnd ? new Date(input.trialEnd) : null,
      })
      .returning();

    const subscription = result[0];
    if (!subscription) throw new Error('Failed to create subscription');
    return subscription;
  }

  /**
   * Find subscription by ID
   * @param id - Subscription ID
   * @returns Subscription or null if not found
   */
  async findById(id: string): Promise<schema.Subscription | null> {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find subscription by Paddle subscription ID
   * @param paddleSubscriptionId - Paddle subscription ID
   * @returns Subscription or null if not found
   */
  async findByPaddleSubscriptionId(
    paddleSubscriptionId: string
  ): Promise<schema.Subscription | null> {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paddleSubscriptionId, paddleSubscriptionId))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find active subscription for user
   * @param userId - User ID
   * @returns Active subscription or null
   */
  async findActiveByUserId(userId: string): Promise<schema.Subscription | null> {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find active subscription for organization
   * @param organizationId - Organization ID
   * @returns Active subscription or null
   */
  async findActiveByOrganizationId(organizationId: string): Promise<schema.Subscription | null> {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(eq(subscriptions.organizationId, organizationId), eq(subscriptions.status, 'active'))
      )
      .limit(1);
    return result[0] || null;
  }

  /**
   * Find all subscriptions for user
   * @param userId - User ID
   * @returns Array of subscriptions
   */
  async findByUserId(userId: string): Promise<schema.Subscription[]> {
    return this.db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
  }

  /**
   * Find all subscriptions for organization
   * @param organizationId - Organization ID
   * @returns Array of subscriptions
   */
  async findByOrganizationId(organizationId: string): Promise<schema.Subscription[]> {
    return this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId));
  }

  /**
   * Find all subscriptions
   * @returns Array of all subscriptions
   */
  async findAll(): Promise<schema.Subscription[]> {
    return this.db.select().from(subscriptions);
  }

  /**
   * Update subscription
   * @param id - Subscription ID
   * @param input - Subscription update input
   * @returns Updated subscription
   */
  async update(id: string, input: SubscriptionUpdateInput): Promise<schema.Subscription> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Subscription ${id} not found`);

    const updateData: Record<string, any> = {};

    if (input.tier !== undefined) updateData.tier = input.tier;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.billingCycle !== undefined) updateData.billingCycle = input.billingCycle || null;
    if (input.paddleSubscriptionId !== undefined)
      updateData.paddleSubscriptionId = input.paddleSubscriptionId || null;
    if (input.paddleCustomerId !== undefined)
      updateData.paddleCustomerId = input.paddleCustomerId || null;
    if (input.currentPeriodStart !== undefined)
      updateData.currentPeriodStart = new Date(input.currentPeriodStart);
    if (input.currentPeriodEnd !== undefined)
      updateData.currentPeriodEnd = new Date(input.currentPeriodEnd);
    if (input.cancelAtPeriodEnd !== undefined)
      updateData.cancelAtPeriodEnd = input.cancelAtPeriodEnd;
    if (input.trialEnd !== undefined)
      updateData.trialEnd = input.trialEnd ? new Date(input.trialEnd) : null;

    await this.db.update(subscriptions).set(updateData).where(eq(subscriptions.id, id));

    const updated = await this.findById(id);
    if (!updated) throw new Error('Subscription not found after update');
    return updated;
  }

  /**
   * Cancel subscription
   * @param id - Subscription ID
   * @param cancelAtPeriodEnd - Whether to cancel at period end or immediately
   */
  async cancel(id: string, cancelAtPeriodEnd: boolean = true): Promise<schema.Subscription> {
    return this.update(id, {
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      cancelAtPeriodEnd,
    });
  }

  /**
   * Delete subscription
   * @param id - Subscription ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(subscriptions).where(eq(subscriptions.id, id));
  }
}
