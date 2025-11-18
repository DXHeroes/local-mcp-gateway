/**
 * Unit tests for debug routes
 */

import type { DebugLogRepository } from '@local-mcp/database';
import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebugRoutes } from '../../../src/routes/debug.js';

describe('Debug Routes Unit Tests', () => {
  let mockDebugLogRepository: DebugLogRepository;
  let router: ReturnType<typeof createDebugRoutes>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    // Mock DebugLogRepository
    mockDebugLogRepository = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as DebugLogRepository;

    // Create router
    router = createDebugRoutes(mockDebugLogRepository);

    // Mock Express request/response
    mockReq = {
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('GET /logs', () => {
    it('should return debug logs', async () => {
      const logs = [
        {
          id: 'log-1',
          profileId: 'profile-1',
          mcpServerId: 'server-1',
          requestType: 'tools/list',
          requestPayload: JSON.stringify({}),
          responsePayload: JSON.stringify({ tools: [] }),
          status: 'success',
          durationMs: 100,
          createdAt: Date.now(),
        },
        {
          id: 'log-2',
          profileId: 'profile-1',
          mcpServerId: 'server-2',
          requestType: 'tools/call',
          requestPayload: JSON.stringify({ name: 'test-tool' }),
          responsePayload: JSON.stringify({ result: 'success' }),
          status: 'success',
          durationMs: 200,
          createdAt: Date.now(),
        },
      ];

      vi.mocked(mockDebugLogRepository.findMany).mockResolvedValue(logs as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockDebugLogRepository.findMany).toHaveBeenCalledWith({});
        expect(mockRes.json).toHaveBeenCalledWith(logs);
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should filter logs by profileId', async () => {
      const logs = [
        {
          id: 'log-1',
          profileId: 'profile-1',
          mcpServerId: 'server-1',
          requestType: 'tools/list',
          requestPayload: JSON.stringify({}),
          responsePayload: JSON.stringify({ tools: [] }),
          status: 'success',
          durationMs: 100,
          createdAt: Date.now(),
        },
      ];

      mockReq.query = { profileId: 'profile-1' };
      vi.mocked(mockDebugLogRepository.findMany).mockResolvedValue(logs as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockDebugLogRepository.findMany).toHaveBeenCalledWith({
          profileId: 'profile-1',
        });
        expect(mockRes.json).toHaveBeenCalledWith(logs);
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should filter logs by mcpServerId', async () => {
      const logs = [
        {
          id: 'log-1',
          profileId: 'profile-1',
          mcpServerId: 'server-1',
          requestType: 'tools/list',
          requestPayload: JSON.stringify({}),
          responsePayload: JSON.stringify({ tools: [] }),
          status: 'success',
          durationMs: 100,
          createdAt: Date.now(),
        },
      ];

      mockReq.query = { mcpServerId: 'server-1' };
      vi.mocked(mockDebugLogRepository.findMany).mockResolvedValue(logs as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockDebugLogRepository.findMany).toHaveBeenCalledWith({
          mcpServerId: 'server-1',
        });
        expect(mockRes.json).toHaveBeenCalledWith(logs);
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should filter logs by status', async () => {
      const logs = [
        {
          id: 'log-1',
          profileId: 'profile-1',
          mcpServerId: 'server-1',
          requestType: 'tools/list',
          requestPayload: JSON.stringify({}),
          responsePayload: JSON.stringify({ error: 'Failed' }),
          status: 'error',
          durationMs: 100,
          errorMessage: 'Connection failed',
          createdAt: Date.now(),
        },
      ];

      mockReq.query = { status: 'error' };
      vi.mocked(mockDebugLogRepository.findMany).mockResolvedValue(logs as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockDebugLogRepository.findMany).toHaveBeenCalledWith({
          status: 'error',
        });
        expect(mockRes.json).toHaveBeenCalledWith(logs);
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 500 on error', async () => {
      vi.mocked(mockDebugLogRepository.findMany).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Failed to fetch debug logs',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 400 on validation error', async () => {
      mockReq.query = { status: 'invalid-status' }; // Invalid status value

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({ error: 'Validation error' })
        );
      } else {
        throw new Error('Handler not found');
      }
    });
  });

  describe('GET /logs/:id', () => {
    it('should return debug log by ID', async () => {
      const log = {
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: 'server-1',
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        responsePayload: JSON.stringify({ tools: [] }),
        status: 'success',
        durationMs: 100,
        createdAt: Date.now(),
      };

      mockReq.params = { id: 'log-1' };
      vi.mocked(mockDebugLogRepository.findById).mockResolvedValue(log as never);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs/:id' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockDebugLogRepository.findById).toHaveBeenCalledWith('log-1');
        expect(mockRes.json).toHaveBeenCalledWith(log);
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 404 when log not found', async () => {
      mockReq.params = { id: 'non-existent' };
      vi.mocked(mockDebugLogRepository.findById).mockResolvedValue(null);

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs/:id' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Debug log not found' });
      } else {
        throw new Error('Handler not found');
      }
    });

    it('should return 500 on error', async () => {
      mockReq.params = { id: 'log-1' };
      vi.mocked(mockDebugLogRepository.findById).mockRejectedValue(new Error('Database error'));

      const handler = router.stack.find(
        (layer) => layer.route?.path === '/logs/:id' && layer.route?.methods?.get
      )?.route?.stack?.[0]?.handle;

      if (handler) {
        await handler(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Failed to fetch debug log',
          })
        );
      } else {
        throw new Error('Handler not found');
      }
    });
  });
});

