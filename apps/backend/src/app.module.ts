/**
 * Root Application Module
 *
 * Configures all NestJS modules for the Local MCP Gateway.
 * Auth is globally applied via AuthGuard with @Public() bypass.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config.js';
import databaseConfig from './config/database.config.js';
import { AuthGuard } from './modules/auth/auth.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { DebugModule } from './modules/debug/debug.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { McpModule } from './modules/mcp/mcp.module.js';
import { OAuthModule } from './modules/oauth/oauth.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { ProxyModule } from './modules/proxy/proxy.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { OrganizationDomainsModule } from './modules/organization-domains/organization-domains.module.js';
import { SharingModule } from './modules/sharing/sharing.module.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['../../.env', '.env.local', '.env'],
    }),

    // Event emitter for SSE notifications
    EventEmitterModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),

    // Core modules
    DatabaseModule,
    AuthModule,
    McpModule,
    ProfilesModule,
    OAuthModule,
    SettingsModule,
    ProxyModule,
    HealthModule,
    DebugModule,
    OrganizationDomainsModule,
    SharingModule,
  ],
  providers: [
    // Global auth guard — all routes require auth unless marked @Public()
    {
      provide: APP_GUARD,
      useExisting: AuthGuard,
    },
  ],
})
export class AppModule {}
