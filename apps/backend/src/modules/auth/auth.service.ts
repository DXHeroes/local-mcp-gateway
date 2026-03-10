/**
 * Auth Service
 *
 * Wraps Better Auth instance for use in NestJS services and guards.
 * Auth is always enabled with email+password as baseline.
 */

import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import { type AuthInstance, createAuth } from './auth.config.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface AuthSession {
  id: string;
  userId: string;
  activeOrganizationId?: string | null;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private auth!: AuthInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    if (!this.configService.get<string>('BETTER_AUTH_SECRET')) {
      const generated = randomUUID() + randomUUID();
      process.env.BETTER_AUTH_SECRET = generated;
      this.logger.warn(
        'BETTER_AUTH_SECRET not set — using auto-generated secret. ' +
          'Sessions will be invalidated on restart. Set BETTER_AUTH_SECRET in .env for persistence.'
      );
    }
    try {
      this.auth = createAuth(this.prisma);
      this.logger.log('Auth initialized (always enabled)');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Better Auth. Check database connectivity and migrations.',
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /** Get the raw Better Auth instance (for mounting handler). */
  getAuth(): AuthInstance {
    return this.auth;
  }

  /** Validate a session from request headers (cookie-based) */
  async getSession(headers: Headers): Promise<{ user: AuthUser; session: AuthSession } | null> {
    try {
      const result = await this.auth.api.getSession({ headers });
      if (!result) return null;
      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          image: result.user.image,
        },
        session: {
          id: result.session.id,
          userId: result.session.userId,
          activeOrganizationId: (result.session as Record<string, unknown>).activeOrganizationId as
            | string
            | null
            | undefined,
        },
      };
    } catch {
      return null;
    }
  }

  /** Get organizations a user belongs to */
  async getUserOrganizations(userId: string) {
    return this.prisma.member.findMany({
      where: { userId },
      include: { organization: true },
    });
  }

  /**
   * Validate an MCP OAuth Bearer token from the proxy endpoint.
   * Returns the user if the token is valid, null otherwise.
   */
  async validateMcpToken(bearerToken: string): Promise<AuthUser | null> {
    try {
      const tokenRecord = await this.prisma.oauthAccessToken.findFirst({
        where: { token: bearerToken },
      });

      if (!tokenRecord || !tokenRecord.userId) return null;

      // Check expiration
      if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
        return null;
      }

      // Resolve user
      const user = await this.prisma.user.findUnique({
        where: { id: tokenRecord.userId },
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    } catch {
      return null;
    }
  }
}
