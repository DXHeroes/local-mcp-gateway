/**
 * OAuth Module
 *
 * Handles OAuth flows for MCP servers that require OAuth authentication.
 * This is NOT for user authentication - the app has no user auth.
 */

import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller.js';
import { OAuthService } from './oauth.service.js';

@Module({
  controllers: [OAuthController],
  providers: [OAuthService],
  exports: [OAuthService],
})
export class OAuthModule {}
