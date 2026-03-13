/**
 * MCP OAuth Guard
 *
 * Enforces OAuth 2.1 Bearer token authentication on MCP proxy endpoints.
 * Validates Bearer tokens and returns RFC 9728-compliant
 * WWW-Authenticate headers to guide MCP clients through OAuth discovery.
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { type AuthUser, AuthService } from './auth.service.js';
import { createMcpWwwAuthenticateHeader } from './mcp-oauth.utils.js';

type McpUnauthorizedException = UnauthorizedException & {
  wwwAuthenticate?: string;
};

@Injectable()
export class McpOAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    // 1. Try Bearer token (MCP clients like Claude Desktop, Cursor, etc.)
    if (token) {
      const user = await this.authService.validateMcpToken(token);
      if (user) {
        request.user = user;
        return true;
      }
      throw this.createUnauthorizedError('Invalid or expired MCP OAuth token');
    }

    // 2. Try session cookie (browser UI calling /info endpoints)
    const session = await this.validateSessionCookie(request);
    if (session) {
      request.user = session;
      return true;
    }

    // 3. Neither worked — require Bearer token (for MCP client discovery)
    throw this.createUnauthorizedError('Bearer token required');
  }

  /**
   * Attempt to validate session cookie from the request.
   * Returns the user if a valid session exists, null otherwise.
   */
  private async validateSessionCookie(request: Request): Promise<AuthUser | null> {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }
      const result = await this.authService.getSession(headers);
      return result?.user ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Extract Bearer token from Authorization header or access_token query param (SSE fallback).
   */
  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // SSE connections may pass token as query parameter
    const queryToken = request.query.access_token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    return null;
  }

  /**
   * Create UnauthorizedException with RFC 9728 WWW-Authenticate header
   * pointing MCP clients to the protected resource metadata.
   */
  private createUnauthorizedError(message: string): UnauthorizedException {
    const error = new UnauthorizedException(message) as McpUnauthorizedException;
    error.wwwAuthenticate = createMcpWwwAuthenticateHeader(this.configService);
    return error;
  }
}
