/**
 * OAuth Service
 *
 * Manages OAuth tokens for MCP servers.
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  // In-memory storage for PKCE verifiers (in production, use Redis or similar)
  private pkceVerifiers = new Map<string, { verifier: string; expiresAt: number }>();

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
