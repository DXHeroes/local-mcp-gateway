/**
 * Debug Logs routes
 *
 * Provides API endpoints for querying debug logs
 */

import type { DebugLogRepository } from '@dxheroes/local-mcp-database';
import { Router } from 'express';
import { z } from 'zod';

const debugLogsQuerySchema = z.object({
  profileId: z.string().optional(),
  mcpServerId: z.string().optional(),
  requestType: z.string().optional(),
  status: z.enum(['pending', 'success', 'error']).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export function createDebugRoutes(debugLogRepository: DebugLogRepository): Router {
  const router = Router();

  // Get debug logs with filtering
  router.get('/logs', async (req, res) => {
    try {
      const validated = debugLogsQuerySchema.parse(req.query);

      const logs = await debugLogRepository.findMany({
        profileId: validated.profileId,
        mcpServerId: validated.mcpServerId,
        requestType: validated.requestType,
        status: validated.status,
        limit: validated.limit,
        offset: validated.offset,
      });

      res.json(logs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      res.status(500).json({
        error: 'Failed to fetch debug logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get debug log by ID
  router.get('/logs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const log = await debugLogRepository.findById(id);

      if (!log) {
        res.status(404).json({ error: 'Debug log not found' });
        return;
      }

      res.json(log);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch debug log',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
