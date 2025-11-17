/**
 * Request ID middleware for tracing
 */

import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Add request ID to request and response headers
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Add to request
  req.headers['x-request-id'] = requestId;

  // Add to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
}
