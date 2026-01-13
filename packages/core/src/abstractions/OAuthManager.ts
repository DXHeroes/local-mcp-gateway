/**
 * OAuth Manager
 *
 * Manages OAuth 2.1 flows for MCP servers according to MCP standard
 * Supports: DCR (RFC 7591), PKCE, Resource Indicators (RFC 8707), etc.
 */

import { createHash, randomBytes } from 'node:crypto';
import type { OAuthToken } from '../types/database.js';
import type { OAuthConfig } from '../types/mcp.js';

/**
 * OAuth token repository interface
 * Implemented by database layer
 */
export interface OAuthTokenRepository {
  store(
    mcpServerId: string,
    token: Omit<OAuthToken, 'id' | 'mcpServerId' | 'createdAt' | 'updatedAt'>
  ): Promise<OAuthToken>;
  get(mcpServerId: string): Promise<OAuthToken | null>;
  update(
    mcpServerId: string,
    token: Partial<Omit<OAuthToken, 'id' | 'mcpServerId' | 'createdAt'>>
  ): Promise<OAuthToken>;
  delete(mcpServerId: string): Promise<void>;
}

/**
 * OAuth client registration repository interface
 */
export interface OAuthClientRegistrationRepository {
  store(registration: {
    mcpServerId: string;
    authorizationServerUrl: string;
    clientId: string;
    clientSecret?: string;
    registrationAccessToken?: string;
  }): Promise<void>;
  get(
    mcpServerId: string,
    authorizationServerUrl: string
  ): Promise<{
    clientId: string;
    clientSecret?: string;
    registrationAccessToken?: string;
  } | null>;
}

/**
 * OAuth Manager
 *
 * Handles OAuth 2.1 flows according to MCP standard
 */
export class OAuthManager {
  constructor(
    private tokenRepository: OAuthTokenRepository,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private _clientRegistrationRepository: OAuthClientRegistrationRepository // Reserved for future DCR implementation
  ) {}

  /**
   * Generate PKCE code verifier and challenge
   * @returns Object with code_verifier and code_challenge
   */
  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    // Generate code verifier (43-128 characters, URL-safe base64)
    const codeVerifier = randomBytes(32).toString('base64url');

    // Generate code challenge (SHA256 hash of verifier, base64url encoded)
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate OAuth state parameter for CSRF protection
   * @returns Random state string
   */
  generateState(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Build authorization URL
   * @param config - OAuth configuration
   * @param state - State parameter for CSRF protection
   * @param codeChallenge - PKCE code challenge (optional)
   * @returns Authorization URL
   */
  buildAuthorizationUrl(config: OAuthConfig, state: string, codeChallenge?: string): string {
    if (!config.clientId) {
      throw new Error('OAuth client ID is required to build authorization URL');
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.callbackUrl || '',
      state,
      scope: config.scopes.join(' '),
    });

    if (config.resource) {
      params.append('resource', config.resource);
    }

    if (codeChallenge) {
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return `${config.authorizationServerUrl}?${params.toString()}`;
  }

  /**
   * Store OAuth token
   * @param mcpServerId - MCP server ID
   * @param tokenData - Token data
   * @returns Stored token
   */
  async storeToken(
    mcpServerId: string,
    tokenData: {
      accessToken: string;
      refreshToken?: string;
      tokenType?: string;
      expiresAt?: number;
      scope?: string;
    }
  ): Promise<OAuthToken> {
    return await this.tokenRepository.store(mcpServerId, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenType: tokenData.tokenType || 'Bearer',
      expiresAt: tokenData.expiresAt,
      scope: tokenData.scope,
    });
  }

  /**
   * Get OAuth token for MCP server
   * @param mcpServerId - MCP server ID
   * @returns OAuth token or null if not found
   */
  async getToken(mcpServerId: string): Promise<OAuthToken | null> {
    return await this.tokenRepository.get(mcpServerId);
  }

  /**
   * Check if token is expired
   * @param token - OAuth token
   * @returns True if token is expired
   */
  isTokenExpired(token: OAuthToken): boolean {
    if (!token.expiresAt) {
      return false; // Token doesn't expire
    }
    return Date.now() >= token.expiresAt * 1000;
  }

  /**
   * Exchange authorization code for access token
   * @param authorizationCode - Authorization code from callback
   * @param codeVerifier - PKCE code verifier
   * @param redirectUri - Redirect URI used in authorization request
   * @param tokenEndpoint - Token endpoint URL
   * @param clientId - OAuth client ID
   * @param clientSecret - OAuth client secret (optional for public clients)
   * @param resource - Resource indicator (optional, RFC 8707)
   * @returns Token data
   */
  async exchangeAuthorizationCode(
    authorizationCode: string,
    codeVerifier: string,
    redirectUri: string,
    tokenEndpoint: string,
    clientId: string,
    clientSecret?: string,
    resource?: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresIn?: number;
    scope?: string;
  }> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    if (resource) {
      body.append('resource', resource);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Add client credentials if provided (for confidential clients)
    if (clientSecret) {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${credentials}`;
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    if (!response.ok) {
      // Try to parse as JSON if possible, otherwise return raw text
      let errorMessage: string;
      if (contentType.includes('application/json')) {
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.error_description || errorJson.error || responseText;
        } catch {
          errorMessage = responseText;
        }
      } else {
        // HTML or other format - try to extract error from HTML if possible
        if (contentType.includes('text/html')) {
          // Try to extract error message from HTML
          const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
          const h1Match = responseText.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          const pMatch = responseText.match(/<p[^>]*>([^<]+)<\/p>/i);
          const errorMatch = titleMatch || h1Match || pMatch;
          errorMessage =
            errorMatch?.[1] || `Server returned HTML instead of JSON (HTTP ${response.status})`;
        } else {
          errorMessage = `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
        }
      }
      throw new Error(`Token exchange failed: ${response.status} ${errorMessage}`);
    }

    // Parse response as JSON
    let tokenData: {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
    };

    if (!contentType.includes('application/json')) {
      throw new Error(
        `Token endpoint returned ${contentType} instead of JSON. Response: ${responseText.substring(0, 200)}`
      );
    }

    try {
      tokenData = JSON.parse(responseText) as {
        access_token: string;
        refresh_token?: string;
        token_type?: string;
        expires_in?: number;
        scope?: string;
      };
    } catch (parseError) {
      throw new Error(
        `Failed to parse token response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Response: ${responseText.substring(0, 200)}`
      );
    }

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type || 'Bearer',
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
    };
  }

  /**
   * Refresh access token
   * @param mcpServerId - MCP server ID
   * @param refreshToken - Refresh token
   * @param tokenEndpoint - Token endpoint URL
   * @param clientId - OAuth client ID
   * @param clientSecret - OAuth client secret (optional for public clients)
   * @param resource - Resource indicator (optional, RFC 8707)
   * @returns New token data
   */
  async refreshToken(
    mcpServerId: string,
    refreshToken: string,
    tokenEndpoint: string,
    clientId: string,
    clientSecret?: string,
    resource?: string
  ): Promise<OAuthToken> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });

    if (resource) {
      body.append('resource', resource);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    // Add client credentials if provided (for confidential clients)
    if (clientSecret) {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      headers.Authorization = `Basic ${credentials}`;
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
      scope?: string;
    };

    // Calculate expiration timestamp
    const expiresAt = tokenData.expires_in
      ? Math.floor(Date.now() / 1000) + tokenData.expires_in
      : undefined;

    // Store new token
    return await this.storeToken(mcpServerId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token or keep old one
      tokenType: tokenData.token_type || 'Bearer',
      expiresAt,
      scope: tokenData.scope,
    });
  }

  /**
   * Revoke token
   * @param mcpServerId - MCP server ID
   */
  async revokeToken(mcpServerId: string): Promise<void> {
    await this.tokenRepository.delete(mcpServerId);
  }

  /**
   * Get client registration (for future DCR implementation)
   * @param mcpServerId - MCP server ID
   * @param authorizationServerUrl - Authorization server URL
   * @returns Client registration or null
   */
  async getClientRegistration(
    mcpServerId: string,
    authorizationServerUrl: string
  ): Promise<{ clientId: string; clientSecret?: string; registrationAccessToken?: string } | null> {
    return await this._clientRegistrationRepository.get(mcpServerId, authorizationServerUrl);
  }

  /**
   * Inject OAuth token into headers
   * @param mcpServerId - MCP server ID
   * @param headers - Existing headers object
   * @returns Headers with Authorization header added
   */
  async injectHeaders(
    mcpServerId: string,
    headers: Record<string, string>
  ): Promise<Record<string, string>> {
    const token = await this.getToken(mcpServerId);
    if (!token) {
      return headers;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      // Token expired - would need refresh, but for now just return headers
      // In production, this should trigger token refresh
      return headers;
    }

    return {
      ...headers,
      Authorization: `${token.tokenType} ${token.accessToken}`,
    };
  }
}
