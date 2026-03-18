/**
 * Logging Interceptor
 *
 * Logs incoming requests and outgoing responses with timing.
 */

import { randomUUID } from 'node:crypto';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { appLogger } from '../logging/app-logger.js';
import { requestContext } from '../logging/request-context.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Add request ID if not present
    if (!request.headers['x-request-id']) {
      request.headers['x-request-id'] = randomUUID();
    }
    const requestId = request.headers['x-request-id'];
    response.setHeader('x-request-id', requestId);
    requestContext.enterWith({ requestId: String(requestId) });

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          appLogger.info(
            {
              event: 'http.request.completed',
              method,
              url,
              statusCode: response.statusCode,
              durationMs: duration,
            },
            'HTTP request completed'
          );
        },
        error: () => {
          const duration = Date.now() - startTime;
          appLogger.warn(
            {
              event: 'http.request.failed',
              method,
              url,
              statusCode: response.statusCode,
              durationMs: duration,
            },
            'HTTP request failed'
          );
        },
      })
    );
  }
}
