/**
 * Error handling middleware
 */

import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string | undefined;

  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    requestId,
    method: req.method,
    path: req.path,
    statusCode: res.statusCode || 500,
  });

  // Don't send stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal server error',
    requestId,
    ...(isDevelopment && { message: error.message, stack: error.stack }),
  });
}
