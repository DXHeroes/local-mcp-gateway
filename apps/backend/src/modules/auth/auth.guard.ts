/**
 * Auth Guard
 *
 * Global guard that validates session cookies on all routes.
 * Routes marked with @Public() are skipped.
 * After validating session, enforces activeOrganizationId unless @SkipOrgCheck().
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService, type AuthUser } from './auth.service.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';
import { SKIP_ORG_CHECK_KEY } from './decorators/skip-org-check.decorator.js';

// Extend Express Request to carry user info
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionData?: {
        id: string;
        userId: string;
        activeOrganizationId?: string | null;
      };
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Convert Express headers to Web API Headers for Better Auth
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const result = await this.authService.getSession(headers);

    if (!result) {
      throw new UnauthorizedException('Not authenticated');
    }

    // Attach user and session to request
    request.user = result.user;
    request.sessionData = result.session;

    // Check @SkipOrgCheck() decorator
    const skipOrgCheck = this.reflector.getAllAndOverride<boolean>(SKIP_ORG_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!skipOrgCheck && !result.session.activeOrganizationId) {
      throw new ForbiddenException(
        'No active organization. Please select an organization first.'
      );
    }

    return true;
  }
}
