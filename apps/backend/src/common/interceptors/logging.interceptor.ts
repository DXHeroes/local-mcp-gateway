/**
 * Logging Interceptor
 *
 * Logs incoming requests and outgoing responses with timing.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

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

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(`${method} ${url} ${response.statusCode} - ${duration}ms`);
        },
        error: () => {
          const duration = Date.now() - startTime;
          this.logger.warn(`${method} ${url} ERROR - ${duration}ms`);
        },
      })
    );
  }
}
