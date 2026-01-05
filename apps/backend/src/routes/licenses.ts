/**
 * License routes
 */

import type { LicenseKeyService } from '@dxheroes/local-mcp-core';
import type {
  LicenseActivationRepository,
  LicenseKeyRepository,
  LicenseKey,
  LicenseActivation,
} from '@dxheroes/local-mcp-database';
import { Router } from 'express';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/requireAuth.js';

const licenseCreateSchema = z.object({
  organizationId: z.string().optional(),
  tier: z.enum(['startup', 'business', 'enterprise']),
  maxUsers: z.number().int().positive().optional(),
  maxProfiles: z.number().int().positive().optional(),
  maxServers: z.number().int().positive().optional(),
  maxActivations: z.number().int().positive().default(1),
  features: z.array(z.string()).default([]),
  validFrom: z.number(),
  validUntil: z.number().optional(),
  notes: z.string().max(1000).optional(),
});

const licenseValidateSchema = z.object({
  key: z.string().min(1),
  instanceId: z.string().min(1),
  metadata: z
    .object({
      instanceName: z.string().optional(),
      hostname: z.string().optional(),
      osType: z.string().optional(),
      osVersion: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
});

const licenseActivationHeartbeatSchema = z.object({
  instanceId: z.string().min(1),
});

export function createLicenseRoutes(
  licenseKeyRepository: LicenseKeyRepository,
  licenseActivationRepository: LicenseActivationRepository,
  licenseKeyService: LicenseKeyService
): Router {
  const router = Router();

  // POST /api/licenses - Generate new license key (requires auth)
  router.post('/', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validated = licenseCreateSchema.parse(req.body);

      // Create license payload
      const payload = {
        v: 1,
        lid: crypto.randomUUID(),
        tid: validated.tier,
        oid: validated.organizationId,
        lim: {
          u: validated.maxUsers,
          p: validated.maxProfiles,
          s: validated.maxServers,
          a: validated.maxActivations,
        },
        fea: validated.features,
        iat: Math.floor(Date.now() / 1000),
        exp: validated.validUntil ? Math.floor(validated.validUntil / 1000) : undefined,
      };

      // Generate license key
      const { displayKey, keyHash, keyPrefix } =
        await licenseKeyService.generateLicenseKey(payload);

      // Store in database
      const license = await licenseKeyRepository.create({
        userId,
        organizationId: validated.organizationId,
        keyPrefix,
        keyHash,
        tier: validated.tier,
        maxUsers: validated.maxUsers,
        maxProfiles: validated.maxProfiles,
        maxServers: validated.maxServers,
        maxActivations: validated.maxActivations,
        features: validated.features,
        validFrom: validated.validFrom,
        validUntil: validated.validUntil,
        notes: validated.notes,
      });

      res.status(201).json({
        id: license.id,
        displayKey, // Only returned on creation
        tier: license.tier,
        maxActivations: license.maxActivations,
        validFrom: license.validFrom,
        validUntil: license.validUntil,
        status: license.status,
        createdAt: license.createdAt,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create license' });
    }
  });

  // POST /api/licenses/validate - Validate license key (no auth required)
  router.post('/validate', async (req, res) => {
    try {
      const validated = licenseValidateSchema.parse(req.body);

      // Validate license key cryptographically
      const validation = await licenseKeyService.validateLicenseKey(validated.key);

      if (!validation.valid || !validation.payload) {
        res.status(400).json({
          valid: false,
          reason: validation.reason || 'invalid_key',
        });
        return;
      }

      // Hash the key and find in database
      const keyHash = licenseKeyService.hashKey(validated.key);
      const license = await licenseKeyRepository.findByHash(keyHash);

      if (!license) {
        res.status(404).json({
          valid: false,
          reason: 'license_not_found',
        });
        return;
      }

      // Check license status
      if (license.status !== 'active') {
        res.status(403).json({
          valid: false,
          reason: license.status === 'revoked' ? 'license_revoked' : 'license_expired',
        });
        return;
      }

      // Check activation limit
      const activeCount = await licenseActivationRepository.countActiveByLicenseKeyId(
        license.id
      );

      // Check if this instance is already activated
      const existingActivation =
        await licenseActivationRepository.findByLicenseAndInstance(
          license.id,
          validated.instanceId
        );

      if (!existingActivation && activeCount >= license.maxActivations) {
        res.status(403).json({
          valid: false,
          reason: 'max_activations_reached',
          maxActivations: license.maxActivations,
          activeCount,
        });
        return;
      }

      // Create or update activation
      let activation;
      if (existingActivation) {
        activation = await licenseActivationRepository.updateLastSeen(existingActivation.id);
      } else {
        activation = await licenseActivationRepository.create({
          licenseKeyId: license.id,
          instanceId: validated.instanceId,
          instanceName: validated.metadata?.instanceName,
          hostname: validated.metadata?.hostname,
          osType: validated.metadata?.osType,
          osVersion: validated.metadata?.osVersion,
          appVersion: validated.metadata?.appVersion,
        });
      }

      res.json({
        valid: true,
        license: {
          id: license.id,
          tier: license.tier,
          status: license.status,
          validFrom: license.validFrom,
          validUntil: license.validUntil,
        },
        limits: {
          maxUsers: license.maxUsers,
          maxProfiles: license.maxProfiles,
          maxServers: license.maxServers,
          maxActivations: license.maxActivations,
        },
        features: JSON.parse(license.features as string),
        activation: {
          id: activation.id,
          instanceId: activation.instanceId,
          firstActivated: activation.firstActivated,
          lastSeen: activation.lastSeen,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to validate license' });
    }
  });

  // POST /api/licenses/heartbeat - Update activation heartbeat (no auth required)
  router.post('/heartbeat', async (req, res) => {
    try {
      const validated = licenseActivationHeartbeatSchema.parse(req.body);

      const activation = await licenseActivationRepository.findByInstanceId(
        validated.instanceId
      );

      if (!activation) {
        res.status(404).json({ error: 'Activation not found' });
        return;
      }

      if (!activation.isActive) {
        res.status(403).json({ error: 'Activation is deactivated' });
        return;
      }

      await licenseActivationRepository.updateLastSeen(activation.id);

      res.json({ success: true, lastSeen: Date.now() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      res.status(500).json({ error: 'Failed to update heartbeat' });
    }
  });

  // GET /api/licenses - Get user's licenses (requires auth)
  router.get('/', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const licenses = await licenseKeyRepository.findByUserId(userId);

      res.json(
        licenses.map((license: LicenseKey) => ({
          id: license.id,
          tier: license.tier,
          keyPrefix: license.keyPrefix,
          maxActivations: license.maxActivations,
          validFrom: license.validFrom,
          validUntil: license.validUntil,
          status: license.status,
          createdAt: license.createdAt,
        }))
      );
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch licenses' });
    }
  });

  // GET /api/licenses/:id - Get license details (requires auth)
  router.get('/:id', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'License ID is required' });
        return;
      }

      const license = await licenseKeyRepository.findById(id);
      if (!license) {
        res.status(404).json({ error: 'License not found' });
        return;
      }

      // Verify ownership
      if (license.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Get activations
      const activations = await licenseActivationRepository.findByLicenseKeyId(license.id);

      res.json({
        id: license.id,
        tier: license.tier,
        keyPrefix: license.keyPrefix,
        maxUsers: license.maxUsers,
        maxProfiles: license.maxProfiles,
        maxServers: license.maxServers,
        maxActivations: license.maxActivations,
        features: JSON.parse(license.features as string),
        validFrom: license.validFrom,
        validUntil: license.validUntil,
        status: license.status,
        notes: license.notes,
        createdAt: license.createdAt,
        updatedAt: license.updatedAt,
        activations: activations.map((a: LicenseActivation) => ({
          id: a.id,
          instanceId: a.instanceId,
          instanceName: a.instanceName,
          hostname: a.hostname,
          osType: a.osType,
          osVersion: a.osVersion,
          appVersion: a.appVersion,
          isActive: a.isActive,
          firstActivated: a.firstActivated,
          lastSeen: a.lastSeen,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch license' });
    }
  });

  // POST /api/licenses/:id/revoke - Revoke license (requires auth)
  router.post('/:id/revoke', async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'License ID is required' });
        return;
      }

      const license = await licenseKeyRepository.findById(id);
      if (!license) {
        res.status(404).json({ error: 'License not found' });
        return;
      }

      // Verify ownership
      if (license.userId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const updated = await licenseKeyRepository.revoke(id);

      res.json({
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to revoke license' });
    }
  });

  return router;
}
