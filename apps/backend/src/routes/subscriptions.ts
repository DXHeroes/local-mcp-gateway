/**
 * Subscription routes
 */

import type { SubscriptionRepository } from '@dxheroes/local-mcp-database';
import { Router } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/requireAuth.js';

const subscriptionCreateSchema = z.object({
  organizationId: z.string().optional(),
  tier: z.enum(['free', 'pro', 'team', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
  currentPeriodStart: z.number(),
  currentPeriodEnd: z.number(),
  trialEnd: z.number().optional(),
});

const subscriptionUpdateSchema = z.object({
  tier: z.enum(['free', 'pro', 'team', 'enterprise']).optional(),
  status: z.enum(['active', 'past_due', 'canceled', 'paused']).optional(),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export function createSubscriptionRoutes(
  subscriptionRepository: SubscriptionRepository
): Router {
  const router = Router();

  // All routes require authentication (middleware applied in index.ts)

  // GET /api/subscriptions - Get current user's subscriptions
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const subscriptions = await subscriptionRepository.findByUserId(userId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  });

  // GET /api/subscriptions/active - Get active subscription for current user
  router.get('/active', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const subscription = await subscriptionRepository.findActiveByUserId(userId);
      if (!subscription) {
        res.status(404).json({ error: 'No active subscription found' });
        return;
      }

      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  });

  // POST /api/subscriptions - Create subscription
  router.post('/', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validated = subscriptionCreateSchema.parse(req.body);

      const subscription = await subscriptionRepository.create({
        userId,
        ...validated,
      });

      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  // GET /api/subscriptions/:id - Get subscription by ID
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'Subscription ID is required' });
        return;
      }

      const subscription = await subscriptionRepository.findById(id);
      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      // Verify ownership
      if (subscription.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  });

  // PUT /api/subscriptions/:id - Update subscription
  router.put('/:id', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'Subscription ID is required' });
        return;
      }

      const subscription = await subscriptionRepository.findById(id);
      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      // Verify ownership
      if (subscription.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const validated = subscriptionUpdateSchema.parse(req.body);
      const updated = await subscriptionRepository.update(id, validated);

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  });

  // POST /api/subscriptions/:id/cancel - Cancel subscription
  router.post('/:id/cancel', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'Subscription ID is required' });
        return;
      }

      const subscription = await subscriptionRepository.findById(id);
      if (!subscription) {
        res.status(404).json({ error: 'Subscription not found' });
        return;
      }

      // Verify ownership
      if (subscription.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const cancelAtPeriodEnd = req.body.cancelAtPeriodEnd !== false; // Default to true
      const updated = await subscriptionRepository.cancel(id, cancelAtPeriodEnd);

      res.json(updated);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  return router;
}
