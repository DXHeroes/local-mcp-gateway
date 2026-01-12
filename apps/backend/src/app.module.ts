/**
 * Root Application Module
 *
 * Configures all NestJS modules for the Local MCP Gateway.
 * No authentication module - immediate access to all features.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import appConfig from './config/app.config.js';
import databaseConfig from './config/database.config.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { DebugModule } from './modules/debug/debug.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { McpModule } from './modules/mcp/mcp.module.js';
import { OAuthModule } from './modules/oauth/oauth.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { ProxyModule } from './modules/proxy/proxy.module.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['../../.env', '.env.local', '.env'],
    }),

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

    // Core modules (no authentication - immediate access)
    DatabaseModule,
    McpModule,
    ProfilesModule,
    OAuthModule, // For OAuth MCP servers, not user authentication
    ProxyModule,
    HealthModule,
    DebugModule,
  ],
})
export class AppModule {}
