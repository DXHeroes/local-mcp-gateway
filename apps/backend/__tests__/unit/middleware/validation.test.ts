/**
 * Unit tests for validation middleware
 */

import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validateRequest } from '../../../src/middleware/validation.js';

describe('Validation Middleware Unit Tests', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it('should call next() for valid request body', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    mockReq.body = {
      name: 'John',
      age: 30,
    };

    const middleware = validateRequest(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid request body', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    mockReq.body = {
      name: 'John',
      age: 'not-a-number',
    };

    const middleware = validateRequest(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Validation error',
      details: expect.arrayContaining([
        expect.objectContaining({
          path: ['age'],
        }),
      ]),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 400 with validation details for missing required fields', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    mockReq.body = {
      name: 'John',
    };

    const middleware = validateRequest(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Validation error',
      details: expect.arrayContaining([
        expect.objectContaining({
          path: ['email'],
        }),
      ]),
    });
  });

  it('should call next() with error for non-ZodError', () => {
    const schema = z.object({
      name: z.string(),
    });

    // Mock schema.parse to throw non-ZodError
    const originalParse = schema.parse;
    vi.spyOn(schema, 'parse').mockImplementation(() => {
      throw new Error('Non-ZodError');
    });

    const middleware = validateRequest(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockRes.status).not.toHaveBeenCalled();

    schema.parse = originalParse;
  });

  it('should handle nested object validation', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    mockReq.body = {
      user: {
        name: 'John',
        email: 'john@example.com',
      },
    };

    const middleware = validateRequest(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle array validation', () => {
    const schema = z.object({
      items: z.array(z.string()),
    });

    mockReq.body = {
      items: ['item1', 'item2'],
    };

    const middleware = validateRequest(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
