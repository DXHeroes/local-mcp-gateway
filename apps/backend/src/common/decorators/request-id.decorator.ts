/**
 * Request ID Decorator
 *
 * Extracts request ID from the request headers.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const requestId = request.headers['x-request-id'];
    return typeof requestId === 'string' ? requestId : undefined;
  }
);
