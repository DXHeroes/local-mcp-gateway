/**
 * Auth Module
 *
 * Global module providing authentication via Better Auth.
 */

import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { McpOAuthGuard } from './mcp-oauth.guard.js';

@Global()
@Module({
  providers: [AuthService, AuthGuard, McpOAuthGuard],
  exports: [AuthService, AuthGuard, McpOAuthGuard],
})
export class AuthModule {}
