/**
 * Debug Logging Middleware
 *
 * Logs all MCP proxy requests and responses to the database
 * Sanitizes sensitive data (tokens, API keys) before storing
 */

import type { DebugLogRepository } from '@dxheroes/local-mcp-database';
import type { NextFunction, Request, Response } from 'express';

/**
 * Sanitize sensitive data from JSON payload
 * Removes tokens, API keys, and other sensitive information
 */
export function sanitizePayload(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) {
    return JSON.stringify(payload);
  }

  const sanitized = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

  // Recursively sanitize object
  function sanitizeObject(obj: Record<string, unknown>): void {
    for (const key in obj) {
      const value = obj[key];

      // Check for sensitive keys
      const sensitiveKeys = [
        'token',
        'access_token',
        'refresh_token',
        'api_key',
        'apikey',
        'authorization',
        'password',
        'secret',
        'client_secret',
      ];

      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        obj[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitizeObject(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            sanitizeObject(item as Record<string, unknown>);
          }
        });
      }
    }
  }

  sanitizeObject(sanitized);
  return JSON.stringify(sanitized);
}

/**
 * Create debug logging middleware
 * @param debugLogRepository - Debug log repository
 * @param profileId - Profile ID from route params
 * @returns Express middleware
 */
export function createDebugLoggerMiddleware(
  debugLogRepository: DebugLogRepository,
  profileId: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    let logId: string | null = null;

    try {
      // Extract request type from JSON-RPC method
      const requestBody = req.body as { method?: string; params?: unknown } | undefined;
      const requestType = requestBody?.method || 'unknown';

      // Create initial log entry (pending)
      const log = await debugLogRepository.create({
        profileId,
        mcpServerId: undefined, // Will be updated if we can determine it
        requestType,
        requestPayload: sanitizePayload(req.body),
        status: 'pending',
      });

      logId = log.id;

      // Override res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        const durationMs = Date.now() - startTime;
        const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';

        // Update log entry with response
        if (logId) {
          debugLogRepository
            .update(logId, {
              responsePayload: sanitizePayload(body),
              status,
              durationMs,
              errorMessage: status === 'error' ? JSON.stringify(body) : undefined,
            })
            .catch((err: unknown) => {
              console.error('Failed to update debug log:', err);
            });
        }

        return originalJson(body);
      };

      // Also handle res.send for non-JSON responses
      const originalSend = res.send.bind(res);
      res.send = (body: unknown) => {
        const durationMs = Date.now() - startTime;
        const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error';

        // Update log entry with response
        if (logId) {
          debugLogRepository
            .update(logId, {
              responsePayload: typeof body === 'string' ? body : sanitizePayload(body),
              status,
              durationMs,
              errorMessage:
                status === 'error'
                  ? typeof body === 'string'
                    ? body
                    : JSON.stringify(body)
                  : undefined,
            })
            .catch((err: unknown) => {
              console.error('Failed to update debug log:', err);
            });
        }

        return originalSend(body);
      };

      next();
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;

      // Update log entry with error
      if (logId) {
        debugLogRepository
          .update(logId, {
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error),
            durationMs,
          })
          .catch((err: unknown) => {
            console.error('Failed to update debug log:', err);
          });
      }

      next(error);
    }
  };
}
