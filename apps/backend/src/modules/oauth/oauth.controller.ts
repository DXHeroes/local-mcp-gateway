/**
 * OAuth Controller
 *
 * REST API endpoints for OAuth token management.
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OAuthService } from './oauth.service.js';

interface StartOAuthDto {
  mcpServerId: string;
  authorizationServerUrl: string;
  clientId: string;
  scopes?: string[];
  redirectUri: string;
}

interface CompleteOAuthDto {
  mcpServerId: string;
  code: string;
  codeVerifier: string;
  tokenEndpoint: string;
  clientId: string;
  redirectUri: string;
}

interface StoreTokenDto {
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  scope?: string | null;
  expiresIn?: number;
}

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Start OAuth flow for an MCP server
   */
  @Post('start')
  async startOAuthFlow(@Body() dto: StartOAuthDto) {
    return this.oauthService.startOAuthFlow(dto);
  }

  /**
   * Complete OAuth flow with authorization code
   */
  @Post('complete')
  async completeOAuthFlow(@Body() dto: CompleteOAuthDto) {
    return this.oauthService.completeOAuthFlow(dto);
  }

  /**
   * Manually store a token for an MCP server
   */
  @Post('servers/:serverId/token')
  @HttpCode(HttpStatus.CREATED)
  async storeToken(@Param('serverId') serverId: string, @Body() dto: StoreTokenDto) {
    const expiresAt = dto.expiresIn ? new Date(Date.now() + dto.expiresIn * 1000) : null;

    return this.oauthService.storeToken({
      mcpServerId: serverId,
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
      tokenType: dto.tokenType || 'Bearer',
      scope: dto.scope,
      expiresAt,
    });
  }

  /**
   * Get OAuth token for an MCP server
   */
  @Get('servers/:serverId/token')
  async getToken(@Param('serverId') serverId: string) {
    return this.oauthService.getToken(serverId);
  }

  /**
   * Delete OAuth token for an MCP server
   */
  @Delete('servers/:serverId/token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteToken(@Param('serverId') serverId: string) {
    await this.oauthService.deleteToken(serverId);
  }
}
