/**
 * OAuth Controller
 *
 * REST API endpoints for OAuth token management.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SkipOrgCheck } from '../auth/decorators/skip-org-check.decorator.js';
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

@SkipOrgCheck()
@Controller('oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Start OAuth auto-discovery flow for an MCP server.
   * Discovers OAuth endpoints via RFC 9728/8414, performs DCR if needed,
   * and redirects the browser to the authorization server.
   */
  @Get('authorize/:serverId')
  async authorize(
    @Param('serverId') serverId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/oauth/callback`;
      const authorizationUrl = await this.oauthService.discoverAndAuthorize(serverId, callbackUrl);
      res.redirect(authorizationUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`OAuth authorize failed for ${serverId}: ${message}`);
      res.status(400).send(this.renderCallbackPage(false, message));
    }
  }

  /**
   * OAuth callback endpoint. Receives authorization code, exchanges for tokens,
   * and returns an HTML page that notifies the opener window.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (!code || !state) {
      res.status(400).send(this.renderCallbackPage(false, 'Missing code or state parameter'));
      return;
    }

    const serverId = state;
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/oauth/callback`;

    const result = await this.oauthService.handleCallback(serverId, code, callbackUrl);
    res.status(200).send(this.renderCallbackPage(result.success, result.error));
  }

  /**
   * Render an HTML page that posts a message to the opener window and closes itself.
   */
  private renderCallbackPage(success: boolean, error?: string): string {
    const message = JSON.stringify({
      type: 'oauth-callback',
      success,
      error: error || null,
    });
    return `<!DOCTYPE html>
<html><head><title>OAuth ${success ? 'Success' : 'Error'}</title></head>
<body>
<p>${success ? 'Authorization successful! This window will close.' : `Error: ${error}`}</p>
<script>
  if (window.opener) {
    window.opener.postMessage(${message}, '*');
  }
  setTimeout(function() { window.close(); }, 2000);
</script>
</body></html>`;
  }

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
