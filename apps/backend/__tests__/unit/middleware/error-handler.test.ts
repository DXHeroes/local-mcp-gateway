/**
 * Unit tests for error-handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../../src/middleware/error-handler.js';
import * as loggerModule from '../../../src/lib/logger.js';

describe('Error Handler Middleware Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      headers: {},
    };

    mockRes = {
      statusCode: 200,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    // Mock logger
    vi.spyOn(loggerModule, 'logger', 'get').mockReturnValue({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    } as never);
  });

  it('should handle error and return 500 response', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    errorHandler(error as Error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      requestId: undefined,
      message: 'Test error',
      stack: 'Error stack trace',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should include request ID in response if present', () => {
    mockReq.headers = {
      'x-request-id': 'req-123',
    };

    const error = new Error('Test error');

    errorHandler(error as Error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-123',
      })
    );
  });

  it('should not include stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    errorHandler(error as Error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      requestId: undefined,
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should log error with request details', () => {
    const mockLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    vi.spyOn(loggerModule, 'logger', 'get').mockReturnValue(mockLogger as never);

    mockReq.headers = {
      'x-request-id': 'req-123',
    };
    mockRes.statusCode = 500;

    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    errorHandler(error as Error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.error).toHaveBeenCalledWith('Request error', {
      error: 'Test error',
      stack: 'Error stack trace',
      requestId: 'req-123',
      method: 'GET',
      path: '/api/test',
      statusCode: 500,
    });
  });

  it('should handle errors without stack trace', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Test error');
    delete error.stack;

    errorHandler(error as Error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal server error',
        message: 'Test error',
      })
    );

    process.env.NODE_ENV = originalEnv;
  });
});

