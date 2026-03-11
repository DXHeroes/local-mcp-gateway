/**
 * OAuth Service
 *
 * Manages OAuth tokens for MCP servers.
 */

import { OAuthDiscoveryService } from '@dxheroes/local-mcp-core';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

interface StartOAuthFlowDto {
  mcpServerId: string;
  authorizationServerUrl: string;
  clientId: string;
  scopes?: string[];
  redirectUri: string;
}

interface CompleteOAuthFlowDto {
  mcpServerId: string;
  code: string;
  codeVerifier: string;
  tokenEndpoint: string;
  clientId: string;
  redirectUri: string;
}

interface StoreTokenDto {
  mcpServerId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  scope?: string | null;
  expiresAt?: Date | null;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  // In-memory storage for PKCE verifiers (in production, use Redis or similar)
  private pkceVerifiers = new Map<string, { verifier: string; expiresAt: number }>();
  private readonly discoveryService = new OAuthDiscoveryService();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate PKCE challenge and store verifier
   */
  async startOAuthFlow(dto: StartOAuthFlowDto) {
    // Check server exists
    const server = await this.prisma.mcpServer.findUnique({ where: { id: dto.mcpServerId } });
    if (!server) {
      throw new NotFoundException(`MCP server ${dto.mcpServerId} not found`);
    }

    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store verifier temporarily (expires in 10 minutes)
    const expiresAt = Date.now() + 10 * 60 * 1000;
    this.pkceVerifiers.set(dto.mcpServerId, { verifier: codeVerifier, expiresAt });

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: dto.clientId,
      redirect_uri: dto.redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    if (dto.scopes?.length) {
      params.set('scope', dto.scopes.join(' '));
    }

    const authorizationUrl = `${dto.authorizationServerUrl}?${params.toString()}`;

    return {
      authorizationUrl,
      codeVerifier, // Return for client-side storage if needed
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async completeOAuthFlow(dto: CompleteOAuthFlowDto) {
    // Check server exists
    const server = await this.prisma.mcpServer.findUnique({ where: { id: dto.mcpServerId } });
    if (!server) {
      throw new NotFoundException(`MCP server ${dto.mcpServerId} not found`);
    }

    // Exchange code for token
    const response = await fetch(dto.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: dto.code,
        redirect_uri: dto.redirectUri,
        client_id: dto.clientId,
        code_verifier: dto.codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Token exchange failed: ${error}`);
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      scope?: string;
      expires_in?: number;
    };

    // Calculate expiry
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null;

    // Store token
    return this.storeToken({
      mcpServerId: dto.mcpServerId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type || 'Bearer',
      scope: tokenData.scope,
      expiresAt,
    });
  }

  /**
   * Store OAuth token for an MCP server
   */
  async storeToken(dto: StoreTokenDto) {
    return this.prisma.oAuthToken.upsert({
      where: { mcpServerId: dto.mcpServerId },
      update: {
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        tokenType: dto.tokenType || 'Bearer',
        scope: dto.scope,
        expiresAt: dto.expiresAt,
      },
      create: {
        mcpServerId: dto.mcpServerId,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        tokenType: dto.tokenType || 'Bearer',
        scope: dto.scope,
        expiresAt: dto.expiresAt,
      },
    });
  }

  /**
   * Get OAuth token for an MCP server
   */
  async getToken(mcpServerId: string) {
    return this.prisma.oAuthToken.findUnique({
      where: { mcpServerId },
    });
  }

  /**
   * Delete OAuth token for an MCP server
   */
  async deleteToken(mcpServerId: string) {
    const token = await this.prisma.oAuthToken.findUnique({
      where: { mcpServerId },
    });

    if (!token) {
      throw new NotFoundException('OAuth token not found');
    }

    await this.prisma.oAuthToken.delete({
      where: { mcpServerId },
    });
  }

  /**
   * Discover OAuth configuration and build an authorization URL for a server.
   * Uses RFC 9728 / 8414 / 7591 auto-discovery and optional DCR.
   * Returns an authorization URL the browser should be redirected to.
   */
  async discoverAndAuthorize(serverId: string, callbackUrl: string): Promise<string> {
    const server = await this.prisma.mcpServer.findUnique({ where: { id: serverId } });
    if (!server) {
      throw new NotFoundException(`MCP server ${serverId} not found`);
    }

    // Parse server URL from config
    const config = typeof server.config === 'string' ? JSON.parse(server.config) : server.config;
    const serverUrl = config?.url as string | undefined;
    if (!serverUrl) {
      throw new BadRequestException('Server has no URL configured');
    }

    // Parse existing oauthConfig if any (may have manual clientId)
    const existingOAuthConfig = server.oauthConfig
      ? typeof server.oauthConfig === 'string'
        ? JSON.parse(server.oauthConfig)
        : server.oauthConfig
      : null;

    // Step 1: Discover OAuth endpoints via RFC 9728 + 8414
    this.logger.log(`Discovering OAuth for server ${serverId} at ${serverUrl}`);
    const discovery = await this.discoveryService.discoverFromServerUrl(serverUrl);

    // Step 2: Get or register client
    let clientId: string;

    if (existingOAuthConfig?.clientId) {
      // Use manually configured clientId
      clientId = existingOAuthConfig.clientId;
    } else {
      // Check for existing DCR registration
      const existingReg = await this.prisma.oAuthClientRegistration.findUnique({
        where: {
          mcpServerId_authorizationServerUrl: {
            mcpServerId: serverId,
            authorizationServerUrl: discovery.authorizationServerUrl,
          },
        },
      });

      if (existingReg) {
        clientId = existingReg.clientId;
      } else if (discovery.registrationEndpoint) {
        // Perform Dynamic Client Registration (RFC 7591)
        this.logger.log(`Performing DCR at ${discovery.registrationEndpoint}`);
        const registration = await this.discoveryService.registerClient(
          discovery.registrationEndpoint,
          callbackUrl,
          discovery.scopes
        );
        clientId = registration.clientId;

        // Store registration
        await this.prisma.oAuthClientRegistration.create({
          data: {
            mcpServerId: serverId,
            authorizationServerUrl: discovery.authorizationServerUrl,
            clientId: registration.clientId,
            clientSecret: registration.clientSecret,
            registrationAccessToken: registration.registrationAccessToken,
          },
        });
      } else {
        throw new BadRequestException(
          'No clientId configured and server does not support Dynamic Client Registration. ' +
            'Please configure a clientId manually in the OAuth settings.'
        );
      }
    }

    // Step 3: Store discovery result in oauthConfig on the server
    await this.prisma.mcpServer.update({
      where: { id: serverId },
      data: {
        oauthConfig: JSON.stringify({
          authorizationServerUrl: discovery.authorizationServerUrl,
          authorizationEndpoint: discovery.authorizationEndpoint,
          tokenEndpoint: discovery.tokenEndpoint,
          registrationEndpoint: discovery.registrationEndpoint,
          resource: discovery.resource,
          scopes: discovery.scopes,
          clientId,
          requiresOAuth: true,
        }),
      },
    });

    // Step 4: Generate PKCE
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store verifier (expires in 10 minutes)
    this.pkceVerifiers.set(serverId, {
      verifier: codeVerifier,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Step 5: Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: callbackUrl,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: serverId, // Use serverId as state for callback routing
    });

    if (discovery.scopes.length > 0) {
      params.set('scope', discovery.scopes.join(' '));
    }

    if (discovery.resource) {
      params.set('resource', discovery.resource);
    }

    return `${discovery.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback: exchange authorization code for tokens.
   */
  async handleCallback(
    serverId: string,
    code: string,
    callbackUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const server = await this.prisma.mcpServer.findUnique({ where: { id: serverId } });
    if (!server) {
      return { success: false, error: `MCP server ${serverId} not found` };
    }

    // Retrieve PKCE verifier
    const pkceEntry = this.pkceVerifiers.get(serverId);
    if (!pkceEntry) {
      return { success: false, error: 'PKCE verifier not found or expired' };
    }
    if (pkceEntry.expiresAt < Date.now()) {
      this.pkceVerifiers.delete(serverId);
      return { success: false, error: 'PKCE verifier expired' };
    }
    const codeVerifier = pkceEntry.verifier;
    this.pkceVerifiers.delete(serverId);

    // Get oauthConfig for token endpoint and clientId
    const oauthConfig = server.oauthConfig
      ? typeof server.oauthConfig === 'string'
        ? JSON.parse(server.oauthConfig)
        : server.oauthConfig
      : null;

    if (!oauthConfig?.tokenEndpoint || !oauthConfig?.clientId) {
      return { success: false, error: 'OAuth configuration incomplete (missing tokenEndpoint or clientId)' };
    }

    try {
      // Exchange code for tokens
      const response = await fetch(oauthConfig.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
          client_id: oauthConfig.clientId,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Token exchange failed: ${errorText}` };
      }

      const tokenData = (await response.json()) as {
        access_token: string;
        refresh_token?: string;
        token_type?: string;
        scope?: string;
        expires_in?: number;
      };

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : null;

      // Store token
      await this.storeToken({
        mcpServerId: serverId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type || 'Bearer',
        scope: tokenData.scope,
        expiresAt,
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Generate a random code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  /**
   * Generate code challenge from verifier using SHA-256
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(hash));
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(buffer: Uint8Array): string {
    const base64 = Buffer.from(buffer).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
