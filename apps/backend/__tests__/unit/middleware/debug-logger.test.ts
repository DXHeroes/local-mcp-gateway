/**
 * Unit tests for debug-logger middleware
 */

import type { DebugLogRepository } from '@local-mcp/database';
import { Request, Response, NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDebugLoggerMiddleware,
  sanitizePayload,
} from '../../../src/middleware/debug-logger.js';

describe('Debug Logger Middleware Unit Tests', () => {
  describe('sanitizePayload', () => {
    it('should sanitize sensitive keys', () => {
      const payload = {
        token: 'secret-token-123',
        access_token: 'access-token-456',
        api_key: 'api-key-789',
        password: 'password123',
        client_secret: 'secret-123',
        normalField: 'normal-value',
      };

      const sanitized = JSON.parse(sanitizePayload(payload));

      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.access_token).toBe('[REDACTED]');
      expect(sanitized.api_key).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.client_secret).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('normal-value');
    });

    it('should sanitize nested objects', () => {
      const payload = {
        user: {
          token: 'secret-token',
          name: 'John Doe',
        },
        config: {
          api_key: 'api-key-123',
          url: 'https://example.com',
        },
      };

      const sanitized = JSON.parse(sanitizePayload(payload));

      expect(sanitized.user.token).toBe('[REDACTED]');
      expect(sanitized.user.name).toBe('John Doe');
      expect(sanitized.config.api_key).toBe('[REDACTED]');
      expect(sanitized.config.url).toBe('https://example.com');
    });

    it('should sanitize arrays', () => {
      const payload = {
        items: [
          { token: 'token-1', name: 'Item 1' },
          { api_key: 'key-2', name: 'Item 2' },
        ],
      };

      const sanitized = JSON.parse(sanitizePayload(payload));

      expect(sanitized.items[0].token).toBe('[REDACTED]');
      expect(sanitized.items[0].name).toBe('Item 1');
      expect(sanitized.items[1].api_key).toBe('[REDACTED]');
      expect(sanitized.items[1].name).toBe('Item 2');
    });

    it('should handle non-object values', () => {
      expect(sanitizePayload('string')).toBe('"string"');
      expect(sanitizePayload(123)).toBe('123');
      expect(sanitizePayload(null)).toBe('null');
    });
  });

  describe('createDebugLoggerMiddleware', () => {
    let mockDebugLogRepository: DebugLogRepository;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
      mockDebugLogRepository = {
        create: vi.fn(),
        update: vi.fn(),
      } as unknown as DebugLogRepository;

      mockReq = {
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        },
      };

      mockRes = {
        statusCode: 200,
        json: vi.fn(),
      };

      mockNext = vi.fn();
    });

    it('should create log entry and update on response', async () => {
      const log = {
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: undefined,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      };

      mockRes.statusCode = 200;
      mockRes.json = vi.fn().mockReturnValue(mockRes);
      mockRes.send = vi.fn().mockReturnValue(mockRes);

      vi.mocked(mockDebugLogRepository.create).mockResolvedValue(log as never);
      vi.mocked(mockDebugLogRepository.update).mockResolvedValue(undefined);

      const middleware = createDebugLoggerMiddleware(mockDebugLogRepository, 'profile-1');

      // Call middleware
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      // Verify log was created
      expect(mockDebugLogRepository.create).toHaveBeenCalledWith({
        profileId: 'profile-1',
        mcpServerId: undefined,
        requestType: 'tools/list',
        requestPayload: expect.any(String),
        status: 'pending',
      });

      // Call res.json to trigger update
      const responseBody = { result: { tools: [] } };
      mockRes.json!(responseBody);

      // Wait a bit for async update
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify log was updated
      expect(mockDebugLogRepository.update).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          responsePayload: expect.any(String),
          status: 'success',
          durationMs: expect.any(Number),
        })
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should update log with error status on error response', async () => {
      const log = {
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: undefined,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      };

      mockRes.statusCode = 500;
      mockRes.json = vi.fn().mockReturnValue(mockRes);
      mockRes.send = vi.fn().mockReturnValue(mockRes);

      vi.mocked(mockDebugLogRepository.create).mockResolvedValue(log as never);
      vi.mocked(mockDebugLogRepository.update).mockResolvedValue(undefined);

      const middleware = createDebugLoggerMiddleware(mockDebugLogRepository, 'profile-1');

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      const responseBody = { error: 'Internal error' };
      mockRes.json!(responseBody);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDebugLogRepository.update).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          status: 'error',
          errorMessage: expect.any(String),
        })
      );
    });

    it('should handle res.send for non-JSON responses', async () => {
      const log = {
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: undefined,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      };

      mockRes.statusCode = 200;
      mockRes.json = vi.fn().mockReturnValue(mockRes);
      mockRes.send = vi.fn().mockReturnValue(mockRes);

      vi.mocked(mockDebugLogRepository.create).mockResolvedValue(log as never);
      vi.mocked(mockDebugLogRepository.update).mockResolvedValue(undefined);

      const middleware = createDebugLoggerMiddleware(mockDebugLogRepository, 'profile-1');

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      mockRes.send!('text response');

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockDebugLogRepository.update).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          responsePayload: 'text response',
          status: 'success',
        })
      );
    });

    it('should handle errors during middleware execution', async () => {
      const log = {
        id: 'log-1',
        profileId: 'profile-1',
        mcpServerId: undefined,
        requestType: 'tools/list',
        requestPayload: JSON.stringify({}),
        status: 'pending',
        createdAt: Date.now(),
      };

      mockRes.statusCode = 200;
      mockRes.json = vi.fn().mockReturnValue(mockRes);
      mockRes.send = vi.fn().mockReturnValue(mockRes);

      vi.mocked(mockDebugLogRepository.create).mockResolvedValue(log as never);
      vi.mocked(mockDebugLogRepository.update).mockResolvedValue(undefined);

      const middleware = createDebugLoggerMiddleware(mockDebugLogRepository, 'profile-1');

      // Simulate error thrown during middleware execution
      const error = new Error('Test error');
      vi.mocked(mockDebugLogRepository.create).mockRejectedValueOnce(error);

      await middleware(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Error should be passed to next()
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});

