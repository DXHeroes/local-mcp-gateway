/**
 * ActiveOrgId Decorator
 *
 * Extracts the active organization ID from the session data on the request.
 */

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const ActiveOrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.sessionData?.activeOrganizationId ?? null;
});
