/**
 * Unit tests for request-id middleware
 */

import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestIdMiddleware } from '../../../src/middleware/request-id.js';

describe('Request ID Middleware Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    mockRes = {
      setHeader: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it('should generate new request ID if not present', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.headers['x-request-id']).toBeDefined();
    expect(typeof mockReq.headers['x-request-id']).toBe('string');
    expect(mockReq.headers['x-request-id']?.length).toBeGreaterThan(0);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.headers['x-request-id']);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing request ID if present', () => {
    const existingId = 'existing-request-id-123';
    mockReq.headers = {
      'x-request-id': existingId,
    };

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.headers['x-request-id']).toBe(existingId);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', existingId);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set response header with request ID', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
  });

  it('should call next()', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
