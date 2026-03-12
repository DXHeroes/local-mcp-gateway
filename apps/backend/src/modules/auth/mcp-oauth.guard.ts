/**
 * MCP OAuth Guard
 *
 * Enforces OAuth 2.1 Bearer token authentication on MCP proxy endpoints.
 * When MCP_AUTH_REQUIRED=false, passes through for backward compatibility.
 * When enabled, validates Bearer tokens and returns RFC 9728-compliant
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
import { AuthService } from './auth.service.js';
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
    const mcpAuthRequired = this.configService.get<boolean>('app.mcpAuthRequired');

    if (!mcpAuthRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw this.createUnauthorizedError('Bearer token required');
    }

    const user = await this.authService.validateMcpToken(token);
    if (!user) {
      throw this.createUnauthorizedError('Invalid or expired MCP OAuth token');
    }

    request.user = user;
    return true;
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
