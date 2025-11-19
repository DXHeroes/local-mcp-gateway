/**
 * OAuth routes
 *
 * Handles OAuth 2.1 flows for MCP servers
 */

import type { OAuthManager } from '@dxheroes/local-mcp-core';
import type { McpServerRepository } from '@dxheroes/local-mcp-database';
import { Router } from 'express';

export function createOAuthRoutes(
  oauthManager: OAuthManager,
  mcpServerRepository: McpServerRepository
): Router {
  const router = Router();

  // Initiate OAuth flow
  router.get('/authorize/:mcpServerId', async (req, res) => {
    try {
      const { mcpServerId } = req.params;
      const server = await mcpServerRepository.findById(mcpServerId);

      if (!server) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }

      if (!server.oauthConfig) {
        res.status(400).json({ error: 'MCP server does not have OAuth configuration' });
        return;
      }

      // Debug: Log oauthConfig to see what's actually stored
      console.log('OAuth config from DB:', JSON.stringify(server.oauthConfig, null, 2));
      console.log('clientId:', server.oauthConfig.clientId);
      console.log('clientSecret:', server.oauthConfig.clientSecret ? '***' : 'NOT SET');

      // Check if clientId is present
      if (!server.oauthConfig.clientId) {
        res.status(400).json({
          error: 'OAuth client ID is missing',
          message: 'Please configure OAuth client ID for this MCP server',
        });
        return;
      }

      // Generate PKCE and state
      const { codeVerifier, codeChallenge } = oauthManager.generatePKCE();
      const randomState = oauthManager.generateState();

      // Encode mcp_server_id and code_verifier into state parameter
      // OAuth server will return this state parameter, so we can decode it in callback
      const stateData = {
        mcpServerId,
        codeVerifier,
        randomState, // Include random state for CSRF protection
      };
      const state = Buffer.from(JSON.stringify(stateData)).toString('base64url');

      // Build callback URL (OAuth server will add 'code' and 'state' parameters)
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const baseCallbackUrl = server.oauthConfig.callbackUrl || `${appUrl}/api/oauth/callback`;

      // Build authorization URL
      const authUrl = oauthManager.buildAuthorizationUrl(
        { ...server.oauthConfig, callbackUrl: baseCallbackUrl },
        state,
        codeChallenge
      );

      // Redirect to authorization server
      res.redirect(authUrl);
    } catch (error) {
      console.error('OAuth authorization error:', error);
      res.status(500).json({
        error: 'Failed to initiate OAuth flow',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // OAuth callback
  router.get('/callback', async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        res.status(400).json({ error: 'OAuth authorization failed', details: oauthError });
        return;
      }

      if (!code) {
        res.status(400).json({
          error: 'Missing required OAuth parameters',
          message: 'Authorization code is missing',
          receivedParams: Object.keys(req.query),
        });
        return;
      }

      if (!state) {
        res.status(400).json({
          error: 'Missing required OAuth parameters',
          message: 'State parameter is missing',
          receivedParams: Object.keys(req.query),
        });
        return;
      }

      // Decode state parameter to get mcpServerId and codeVerifier
      let stateData: { mcpServerId: string; codeVerifier: string; randomState: string };
      try {
        const decodedState = Buffer.from(state as string, 'base64url').toString('utf-8');
        stateData = JSON.parse(decodedState);
      } catch (_decodeError) {
        res.status(400).json({
          error: 'Invalid state parameter',
          message: 'Failed to decode state parameter',
        });
        return;
      }

      const mcpServerId = stateData.mcpServerId;
      const codeVerifierParam = stateData.codeVerifier;

      // Debug: Log mcpServerId to verify it's correct
      console.log('[OAuth Callback] Decoded mcpServerId from state:', mcpServerId);

      const server = await mcpServerRepository.findById(mcpServerId);

      if (!server || !server.oauthConfig) {
        console.error('[OAuth Callback] Server not found or OAuth not configured:', {
          mcpServerId,
          serverFound: !!server,
          hasOAuthConfig: !!server?.oauthConfig,
        });
        res.status(404).json({ error: 'MCP server not found or OAuth not configured' });
        return;
      }

      // Debug: Log server details
      console.log('[OAuth Callback] Server found:', {
        id: server.id,
        name: server.name,
        type: server.type,
        hasClientId: !!server.oauthConfig.clientId,
      });

      const authorizationCode = code as string;

      // Use token endpoint from config, or derive from authorization server URL
      // Try API subdomain variant first (e.g., api.linear.app if authorization server is linear.app)
      let tokenEndpoint = server.oauthConfig.tokenEndpoint;
      if (!tokenEndpoint) {
        const authUrl = server.oauthConfig.authorizationServerUrl;
        // Try API subdomain variant (common pattern: token endpoint on api.* subdomain)
        if (!authUrl.includes('api.')) {
          const apiTokenUrl = authUrl
            .replace(/^https?:\/\/([^/]+)/, 'https://api.$1')
            .replace(/\/authorize.*$/, '/token');
          tokenEndpoint = apiTokenUrl;
        } else {
          // Default: replace /authorize with /token
          tokenEndpoint = authUrl.replace(/\/authorize.*$/, '/token');
        }
      }

      // Get client ID and secret (from config or DCR)
      const clientId = server.oauthConfig.clientId || '';
      const clientSecret = server.oauthConfig.clientSecret;

      if (!clientId) {
        res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>OAuth Error</title>
              <script>
                window.opener.postMessage({
                  type: 'oauth-callback',
                  success: false,
                  error: 'Client ID not configured'
                }, '*');
                window.close();
              </script>
            </head>
            <body>
              <p>OAuth configuration error: Client ID not configured.</p>
            </body>
          </html>
        `);
        return;
      }

      // Build redirect URI
      const redirectUri = (() => {
        const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        return server.oauthConfig.callbackUrl || `${appUrl}/api/oauth/callback`;
      })();

      // Debug: Log token exchange parameters (without sensitive data)
      console.log('Token exchange parameters:', {
        tokenEndpoint,
        redirectUri,
        clientId: clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET',
        clientSecret: clientSecret ? 'SET' : 'NOT SET',
        hasCodeVerifier: !!codeVerifierParam,
        hasResource: !!server.oauthConfig.resource,
        authorizationCodeLength: authorizationCode.length,
      });

      try {
        // Exchange authorization code for token
        const tokenData = await oauthManager.exchangeAuthorizationCode(
          authorizationCode,
          codeVerifierParam,
          redirectUri,
          tokenEndpoint,
          clientId,
          clientSecret,
          server.oauthConfig.resource
        );

        // Calculate expiration timestamp
        const expiresAt = tokenData.expiresIn
          ? Math.floor(Date.now() / 1000) + tokenData.expiresIn
          : undefined;

        // Store token
        console.log('[OAuth Callback] Storing token for mcpServerId:', mcpServerId);
        await oauthManager.storeToken(mcpServerId, {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenType: tokenData.tokenType,
          expiresAt,
          scope: tokenData.scope,
        });
        console.log('[OAuth Callback] Token stored successfully for mcpServerId:', mcpServerId);

        // Return success page
        res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>OAuth Success</title>
              <script>
                window.opener.postMessage({
                  type: 'oauth-callback',
                  success: true,
                  mcpServerId: '${mcpServerId}'
                }, '*');
                window.close();
              </script>
            </head>
            <body>
              <p>Authorization successful! You can close this window.</p>
            </body>
          </html>
        `);
      } catch (tokenError) {
        const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
        const errorDetails = tokenError instanceof Error ? tokenError.stack : String(tokenError);

        console.error('Token exchange failed:', {
          error: errorMessage,
          details: errorDetails,
          tokenEndpoint,
          redirectUri,
          clientId: clientId ? `${clientId.substring(0, 8)}...` : 'NOT SET',
          hasCodeVerifier: !!codeVerifierParam,
        });

        res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>OAuth Error</title>
              <script>
                window.opener.postMessage({
                  type: 'oauth-callback',
                  success: false,
                  error: ${JSON.stringify(errorMessage)}
                }, '*');
                window.close();
              </script>
            </head>
            <body>
              <p>Token exchange failed: ${errorMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              <p>Please check the server logs for more details.</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
          </head>
          <body>
            <p>Authorization failed. Please try again.</p>
          </body>
        </html>
      `);
    }
  });

  // Refresh token endpoint
  router.post('/refresh/:mcpServerId', async (req, res) => {
    try {
      const { mcpServerId } = req.params;
      const server = await mcpServerRepository.findById(mcpServerId);

      if (!server || !server.oauthConfig) {
        res.status(404).json({ error: 'MCP server not found or OAuth not configured' });
        return;
      }

      // Get current token
      const currentToken = await oauthManager.getToken(mcpServerId);
      if (!currentToken || !currentToken.refreshToken) {
        res.status(400).json({ error: 'No refresh token available' });
        return;
      }

      // Use token endpoint from config, or derive from authorization server URL
      // Try API subdomain variant first (e.g., api.linear.app if authorization server is linear.app)
      let tokenEndpoint = server.oauthConfig.tokenEndpoint;
      if (!tokenEndpoint) {
        const authUrl = server.oauthConfig.authorizationServerUrl;
        // Try API subdomain variant (common pattern: token endpoint on api.* subdomain)
        if (!authUrl.includes('api.')) {
          const apiTokenUrl = authUrl
            .replace(/^https?:\/\/([^/]+)/, 'https://api.$1')
            .replace(/\/authorize.*$/, '/token');
          tokenEndpoint = apiTokenUrl;
        } else {
          // Default: replace /authorize with /token
          tokenEndpoint = authUrl.replace(/\/authorize.*$/, '/token');
        }
      }

      // Get client ID and secret
      const clientId = server.oauthConfig.clientId || '';
      const clientSecret = server.oauthConfig.clientSecret;

      if (!clientId) {
        res.status(400).json({ error: 'Client ID not configured' });
        return;
      }

      // Refresh token
      const newToken = await oauthManager.refreshToken(
        mcpServerId,
        currentToken.refreshToken,
        tokenEndpoint,
        clientId,
        clientSecret,
        server.oauthConfig.resource
      );

      res.json({
        success: true,
        token: {
          accessToken: newToken.accessToken,
          tokenType: newToken.tokenType,
          expiresAt: newToken.expiresAt,
          scope: newToken.scope,
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Failed to refresh token',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
