/**
 * Profile routes
 */

import type { ProfileManager } from '@dxheroes/local-mcp-core';
import type { ProfileMcpServerRepository } from '@dxheroes/local-mcp-database';
import { Router } from 'express';
import { z } from 'zod';

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

const addServerToProfileSchema = z.object({
  mcpServerId: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

export function createProfileRoutes(
  profileManager: ProfileManager,
  profileMcpServerRepository: ProfileMcpServerRepository
): Router {
  const router = Router();

  // List all profiles
  router.get('/', async (_req, res) => {
    try {
      const profiles = await profileManager.listAll();
      res.json(profiles);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch profiles' });
    }
  });

  // Create profile
  router.post('/', async (req, res) => {
    try {
      const validated = profileCreateSchema.parse(req.body);
      const profile = await profileManager.create(validated);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create profile' });
    }
  });

  // Get profile by ID
  router.get('/:id', async (req, res) => {
    try {
      const profile = await profileManager.getById(req.params.id);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }
      res.json(profile);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Update profile
  router.put('/:id', async (req, res) => {
    try {
      const validated = profileUpdateSchema.parse(req.body);
      const profile = await profileManager.update(req.params.id, validated);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Delete profile
  router.delete('/:id', async (req, res) => {
    try {
      await profileManager.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  });

  // Add MCP server to profile
  router.post('/:id/servers', async (req, res) => {
    try {
      const validated = addServerToProfileSchema.parse(req.body);
      const profile = await profileManager.getById(req.params.id);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      await profileMcpServerRepository.addServerToProfile({
        profileId: profile.id,
        mcpServerId: validated.mcpServerId,
        order: validated.order,
      });

      res.status(201).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to add server to profile' });
    }
  });

  // Get MCP servers for profile
  router.get('/:id/servers', async (req, res) => {
    try {
      const profile = await profileManager.getById(req.params.id);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const servers = await profileMcpServerRepository.getServersForProfile(profile.id);
      res.json({ servers });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch profile servers' });
    }
  });

  // Toggle MCP server active state in profile
  router.put('/:id/servers/:serverId/toggle', async (req, res) => {
    try {
      const profile = await profileManager.getById(req.params.id);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        res.status(400).json({ error: 'isActive must be a boolean' });
        return;
      }

      await profileMcpServerRepository.updateServerInProfile(
        profile.id,
        req.params.serverId,
        { isActive }
      );

      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to toggle server' });
    }
  });

  // Remove MCP server from profile
  router.delete('/:id/servers/:serverId', async (req, res) => {
    try {
      const profile = await profileManager.getById(req.params.id);
      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      await profileMcpServerRepository.removeServerFromProfile(profile.id, req.params.serverId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to remove server from profile' });
    }
  });

  return router;
}
