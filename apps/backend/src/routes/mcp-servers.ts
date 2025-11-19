/**
 * MCP Server routes
 */

import type {
  ApiKeyConfig,
  McpServerConfig,
  McpServerType,
  OAuthConfig,
} from '@dxheroes/local-mcp-core';
import { McpServerFactory, OAuthDiscoveryService } from '@dxheroes/local-mcp-core';
import type {
  DebugLogRepository,
  McpServerRepository,
  OAuthTokenRepository,
  ProfileRepository,
} from '@dxheroes/local-mcp-database';
import { Router } from 'express';
import { z } from 'zod';
import { sanitizePayload } from '../middleware/debug-logger';

const mcpServerCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['external', 'custom', 'remote_http', 'remote_sse']),
  config: z.record(z.string(), z.unknown()),
  oauthConfig: z
    .object({
      authorizationServerUrl: z.string().url(),
      tokenEndpoint: z.string().url().optional(),
      resource: z.string().url().optional(),
      scopes: z.array(z.string()),
      requiresOAuth: z.boolean(),
      callbackUrl: z.string().url().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    })
    .optional(),
  apiKeyConfig: z
    .object({
      apiKey: z.string().min(1),
      headerName: z.string().min(1),
      headerValue: z.string(),
    })
    .optional(),
});

const mcpServerUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['external', 'custom', 'remote_http', 'remote_sse']).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  oauthConfig: z
    .object({
      authorizationServerUrl: z.string().url(),
      tokenEndpoint: z.string().url().optional(),
      resource: z.string().url().optional(),
      scopes: z.array(z.string()),
      requiresOAuth: z.boolean(),
      callbackUrl: z.string().url().optional(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    })
    .nullable()
    .optional(),
  apiKeyConfig: z
    .object({
      apiKey: z.string().min(1),
      headerName: z.string().min(1),
      headerValue: z.string(),
    })
    .nullable()
    .optional(),
});

const apiKeyUpdateSchema = z.object({
  apiKey: z.string().min(1),
  headerName: z.string().min(1),
  headerValue: z.string(),
});

export function createMcpServerRoutes(
  mcpServerRepository: McpServerRepository,
  oauthTokenRepository: OAuthTokenRepository,
  debugLogRepository: DebugLogRepository,
  profileRepository: ProfileRepository
): Router {
  const router = Router();
  const oauthDiscoveryService = new OAuthDiscoveryService();

  // Helper function to get or create system profile for logging
  const getSystemProfileId = async (): Promise<string | null> => {
    try {
      // Try to find system profile
      const systemProfile = await profileRepository.findByName('__system__');
      if (systemProfile) {
        return systemProfile.id;
      }

      // Try to find any existing profile as fallback
      const allProfiles = await profileRepository.findAll();
      if (allProfiles.length > 0 && allProfiles[0]) {
        return allProfiles[0].id;
      }

      // Create system profile if no profiles exist
      const newProfile = await profileRepository.create({
        name: '__system__',
        description: 'System profile for debug logging',
      });
      return newProfile.id;
    } catch {
      // If all fails, return null (logging will be skipped)
      return null;
    }
  };

  // List all MCP servers
  router.get('/', async (_req, res) => {
    try {
      const servers = await mcpServerRepository.findAll();
      res.json(servers);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch MCP servers' });
    }
  });

  // Create MCP server
  router.post('/', async (req, res) => {
    try {
      const validated = mcpServerCreateSchema.parse(req.body);
      const server = await mcpServerRepository.create({
        name: validated.name,
        type: validated.type as McpServerType,
        config: validated.config as unknown as McpServerConfig,
        oauthConfig: validated.oauthConfig as OAuthConfig | undefined,
        apiKeyConfig: validated.apiKeyConfig as ApiKeyConfig | undefined,
      });
      res.status(201).json(server);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to create MCP server' });
    }
  });

  // Get MCP server by ID
  router.get('/:id', async (req, res) => {
    try {
      const server = await mcpServerRepository.findById(req.params.id);
      if (!server) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }
      res.json(server);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch MCP server' });
    }
  });

  // Update MCP server
  router.put('/:id', async (req, res) => {
    try {
      const validated = mcpServerUpdateSchema.parse(req.body);

      // Get existing server to merge oauthConfig if needed
      const existingServer = await mcpServerRepository.findById(req.params.id);
      if (!existingServer) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }

      // Merge oauthConfig with existing one to preserve clientId/clientSecret if not provided
      let oauthConfig: OAuthConfig | null | undefined = validated.oauthConfig;
      if (validated.oauthConfig && existingServer.oauthConfig) {
        // Merge: use new values but preserve clientId/clientSecret if not provided
        oauthConfig = {
          ...existingServer.oauthConfig,
          ...validated.oauthConfig,
          // Only update clientId/clientSecret if explicitly provided (not empty string)
          clientId: validated.oauthConfig.clientId || existingServer.oauthConfig.clientId,
          clientSecret:
            validated.oauthConfig.clientSecret || existingServer.oauthConfig.clientSecret,
        };
      }

      const server = await mcpServerRepository.update(req.params.id, {
        name: validated.name,
        type: validated.type,
        config: validated.config as unknown as McpServerConfig | undefined,
        oauthConfig: oauthConfig as OAuthConfig | null | undefined,
        apiKeyConfig: validated.apiKeyConfig as ApiKeyConfig | null | undefined,
      });
      res.json(server);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to update MCP server' });
    }
  });

  // Delete MCP server
  router.delete('/:id', async (req, res) => {
    try {
      await mcpServerRepository.delete(req.params.id);
      res.status(204).send();
    } catch (_error) {
      res.status(500).json({ error: 'Failed to delete MCP server' });
    }
  });

  // Set API key for MCP server
  router.post('/:id/api-key', async (req, res) => {
    try {
      const validated = apiKeyUpdateSchema.parse(req.body);
      const server = await mcpServerRepository.update(req.params.id, {
        apiKeyConfig: validated as ApiKeyConfig,
      });
      res.json(server);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.issues });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Failed to set API key' });
    }
  });

  // Get tools for a specific MCP server
  router.get('/:id/tools', async (req, res) => {
    const startTime = Date.now();
    let logId: string | null = null;

    try {
      const server = await mcpServerRepository.findById(req.params.id);
      if (!server) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }

      // Create debug log entry
      try {
        const systemProfileId = await getSystemProfileId();
        if (systemProfileId) {
          const log = await debugLogRepository.create({
            profileId: systemProfileId,
            mcpServerId: server.id,
            requestType: 'tools/list',
            requestPayload: sanitizePayload({ serverId: server.id }),
            status: 'pending',
          });
          logId = log.id;
        }
      } catch (logError) {
        console.error('Failed to create debug log:', logError);
        // Continue even if logging fails
      }

      // Load OAuth token if available
      const oauthToken = await oauthTokenRepository.get(server.id);
      console.log('[mcp-servers] Tools check for server:', {
        serverId: server.id,
        serverName: server.name,
        serverType: server.type,
        hasOAuthToken: !!oauthToken,
        oauthTokenType: oauthToken?.tokenType,
        oauthTokenPreview: oauthToken?.accessToken
          ? `${oauthToken.accessToken.substring(0, 10)}...`
          : 'none',
        hasApiKeyConfig: !!server.apiKeyConfig,
      });

      // Extract API key config from entity
      const apiKeyConfig = server.apiKeyConfig || null;

      // Create server instance and get tools
      try {
        const serverInstance = await McpServerFactory.createAsync(server, oauthToken, apiKeyConfig);
        console.log('[mcp-servers] Server instance created successfully');

        await serverInstance.initialize();
        const tools = await serverInstance.listTools();

        // Update log with success
        if (logId) {
          const durationMs = Date.now() - startTime;
          await debugLogRepository.update(logId, {
            responsePayload: sanitizePayload({ tools }),
            status: 'success',
            durationMs,
          });
        }

        res.json({ tools });
      } catch (error) {
        // Server failed to initialize - log error and return empty tools with error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check if OAuth is required
        if (errorMessage.includes('OAUTH_REQUIRED')) {
          // Extract resource metadata URL if present
          const resourceMetadataMatch = errorMessage.match(/OAUTH_REQUIRED:(.+)/);

          let oauthConfig = server.oauthConfig;

          // If resource metadata URL provided, discover OAuth config
          if (resourceMetadataMatch?.[1] && !oauthConfig) {
            try {
              const discoveryResult = await oauthDiscoveryService.discoverFromResourceMetadata(
                resourceMetadataMatch[1]
              );

              // Perform DCR if registration endpoint available
              let clientId: string | undefined;
              let clientSecret: string | undefined;

              if (discoveryResult.registrationEndpoint) {
                const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
                const callbackUrl = `${appUrl}/api/oauth/callback`;
                const registration = await oauthDiscoveryService.registerClient(
                  discoveryResult.registrationEndpoint,
                  callbackUrl,
                  discoveryResult.scopes
                );

                clientId = registration.clientId;
                clientSecret = registration.clientSecret;

                // Store client registration in database
                // TODO: Implement OAuthClientRegistrationRepository.store()
              }

              // Create OAuth config from discovery
              oauthConfig = {
                authorizationServerUrl: discoveryResult.authorizationServerUrl,
                tokenEndpoint: discoveryResult.tokenEndpoint,
                scopes: discoveryResult.scopes,
                requiresOAuth: true,
                callbackUrl: `${req.protocol}://${req.get('host')}/api/oauth/callback`,
                clientId,
                clientSecret,
                resource: discoveryResult.resource,
              };

              // Update server with discovered OAuth config
              await mcpServerRepository.update(server.id, { oauthConfig });
            } catch (discoveryError) {
              console.error('OAuth discovery failed:', discoveryError);
            }
          }

          // If still no oauthConfig, try RFC9728 Protected Resource Metadata discovery from server URL
          if (!oauthConfig) {
            const serverUrl = (server.config as { url?: string })?.url;
            if (serverUrl) {
              try {
                // Try to discover OAuth config using RFC9728 well-known URIs
                const discoveryResult =
                  await oauthDiscoveryService.discoverFromServerUrl(serverUrl);

                // Perform DCR if registration endpoint available
                let clientId: string | undefined;
                let clientSecret: string | undefined;

                if (discoveryResult.registrationEndpoint) {
                  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
                  const callbackUrl = `${appUrl}/api/oauth/callback`;
                  try {
                    const registration = await oauthDiscoveryService.registerClient(
                      discoveryResult.registrationEndpoint,
                      callbackUrl,
                      discoveryResult.scopes
                    );
                    clientId = registration.clientId;
                    clientSecret = registration.clientSecret;

                    // Store client registration in database
                    // TODO: Implement OAuthClientRegistrationRepository.store()
                  } catch (dcrError) {
                    console.error('DCR failed:', dcrError);
                    // Continue without clientId - user may need to configure manually
                  }
                }

                // Create OAuth config from discovery
                oauthConfig = {
                  authorizationServerUrl: discoveryResult.authorizationServerUrl,
                  tokenEndpoint: discoveryResult.tokenEndpoint,
                  scopes: discoveryResult.scopes,
                  requiresOAuth: true,
                  callbackUrl: (() => {
                    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
                    return `${appUrl}/api/oauth/callback`;
                  })(),
                  clientId,
                  clientSecret,
                  ...(discoveryResult.resource && { resource: discoveryResult.resource }),
                };

                // Update server with discovered OAuth config
                await mcpServerRepository.update(server.id, { oauthConfig });
                console.log(
                  `OAuth config updated for server ${server.id}, clientId: ${clientId || 'NOT SET'}`
                );
              } catch (discoveryError) {
                console.error('OAuth discovery from server URL failed:', discoveryError);
                // Continue without oauthConfig - user will need to configure manually
              }
            }
          }

          // Return OAuth authorization URL (even if oauthConfig is incomplete)
          // User can manually configure OAuth if needed
          const authUrl = `/api/oauth/authorize/${server.id}`;
          res.status(401).json({
            error: 'OAuth authentication required',
            oauthUrl: authUrl,
            message: oauthConfig
              ? 'Please authorize this MCP server to continue'
              : 'OAuth configuration needed. Please configure OAuth settings for this server.',
            needsConfiguration: !oauthConfig,
          });
          return;
        }

        // Update log with error
        if (logId) {
          const durationMs = Date.now() - startTime;
          await debugLogRepository.update(logId, {
            responsePayload: sanitizePayload({ tools: [], error: errorMessage }),
            status: 'error',
            durationMs,
            errorMessage,
          });
        }

        res.json({
          tools: [],
          error: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update log with error if it exists
      if (logId) {
        const durationMs = Date.now() - startTime;
        await debugLogRepository
          .update(logId, {
            status: 'error',
            durationMs,
            errorMessage,
          })
          .catch(() => {
            // Ignore update errors
          });
      }

      res.status(500).json({ error: `Failed to fetch tools: ${errorMessage}` });
    }
  });

  // Get connection status for a specific MCP server
  router.get('/:id/status', async (req, res) => {
    const startTime = Date.now();
    let logId: string | null = null;

    try {
      const server = await mcpServerRepository.findById(req.params.id);
      if (!server) {
        res.status(404).json({ error: 'MCP server not found' });
        return;
      }

      // Create debug log entry
      try {
        const systemProfileId = await getSystemProfileId();
        if (systemProfileId) {
          const log = await debugLogRepository.create({
            profileId: systemProfileId,
            mcpServerId: server.id,
            requestType: 'status/check',
            requestPayload: sanitizePayload({ serverId: server.id }),
            status: 'pending',
          });
          logId = log.id;
        }
      } catch (logError) {
        console.error('Failed to create debug log:', logError);
        // Continue even if logging fails
      }

      // Load OAuth token if available
      const oauthToken = await oauthTokenRepository.get(server.id);
      console.log('[mcp-servers] Status check for server:', {
        serverId: server.id,
        serverName: server.name,
        serverType: server.type,
        hasOAuthToken: !!oauthToken,
        oauthTokenType: oauthToken?.tokenType,
        oauthTokenPreview: oauthToken?.accessToken
          ? `${oauthToken.accessToken.substring(0, 10)}...`
          : 'none',
        hasApiKeyConfig: !!server.apiKeyConfig,
      });

      // Extract API key config from entity
      const apiKeyConfig = server.apiKeyConfig || null;

      // Try to create and initialize server
      try {
        const serverInstance = await McpServerFactory.createAsync(server, oauthToken, apiKeyConfig);
        console.log('[mcp-servers] Server instance created successfully');

        await serverInstance.initialize();
        await serverInstance.listTools(); // Test if we can list tools

        // Update log with success
        if (logId) {
          const durationMs = Date.now() - startTime;
          await debugLogRepository.update(logId, {
            responsePayload: sanitizePayload({ status: 'connected', error: null }),
            status: 'success',
            durationMs,
          });
        }

        res.json({ status: 'connected', error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check if OAuth is required
        if (errorMessage.includes('OAUTH_REQUIRED')) {
          // Extract resource metadata URL if present
          const resourceMetadataMatch = errorMessage.match(/OAUTH_REQUIRED:(.+)/);

          let oauthConfig = server.oauthConfig;

          // If resource metadata URL provided, discover OAuth config
          if (resourceMetadataMatch?.[1] && !oauthConfig) {
            try {
              const discoveryResult = await oauthDiscoveryService.discoverFromResourceMetadata(
                resourceMetadataMatch[1]
              );

              // Perform DCR if registration endpoint available
              let clientId: string | undefined;
              let clientSecret: string | undefined;

              if (discoveryResult.registrationEndpoint) {
                const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
                const callbackUrl = `${appUrl}/api/oauth/callback`;
                const registration = await oauthDiscoveryService.registerClient(
                  discoveryResult.registrationEndpoint,
                  callbackUrl,
                  discoveryResult.scopes
                );

                clientId = registration.clientId;
                clientSecret = registration.clientSecret;

                // Store client registration in database
                // TODO: Implement OAuthClientRegistrationRepository.store()
              }

              // Create OAuth config from discovery
              oauthConfig = {
                authorizationServerUrl: discoveryResult.authorizationServerUrl,
                tokenEndpoint: discoveryResult.tokenEndpoint,
                scopes: discoveryResult.scopes,
                requiresOAuth: true,
                callbackUrl: `${req.protocol}://${req.get('host')}/api/oauth/callback`,
                clientId,
                clientSecret,
                resource: discoveryResult.resource,
              };

              // Update server with discovered OAuth config
              await mcpServerRepository.update(server.id, { oauthConfig });
            } catch (discoveryError) {
              console.error('OAuth discovery failed:', discoveryError);
            }
          }

          // If still no oauthConfig, try RFC9728 Protected Resource Metadata discovery from server URL
          if (!oauthConfig) {
            const serverUrl = (server.config as { url?: string })?.url;
            if (serverUrl) {
              try {
                // Try to discover OAuth config using RFC9728 well-known URIs
                const discoveryResult =
                  await oauthDiscoveryService.discoverFromServerUrl(serverUrl);

                // Perform DCR if registration endpoint available
                let clientId: string | undefined;
                let clientSecret: string | undefined;

                if (discoveryResult.registrationEndpoint) {
                  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
                  const callbackUrl = `${appUrl}/api/oauth/callback`;
                  try {
                    const registration = await oauthDiscoveryService.registerClient(
                      discoveryResult.registrationEndpoint,
                      callbackUrl,
                      discoveryResult.scopes
                    );
                    clientId = registration.clientId;
                    clientSecret = registration.clientSecret;

                    // Store client registration in database
                    // TODO: Implement OAuthClientRegistrationRepository.store()
                  } catch (dcrError) {
                    console.error('DCR failed:', dcrError);
                    // Continue without clientId - user may need to configure manually
                  }
                }

                // Create OAuth config from discovery
                oauthConfig = {
                  authorizationServerUrl: discoveryResult.authorizationServerUrl,
                  tokenEndpoint: discoveryResult.tokenEndpoint,
                  scopes: discoveryResult.scopes,
                  requiresOAuth: true,
                  callbackUrl: (() => {
                    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
                    return `${appUrl}/api/oauth/callback`;
                  })(),
                  clientId,
                  clientSecret,
                  ...(discoveryResult.resource && { resource: discoveryResult.resource }),
                };

                // Update server with discovered OAuth config
                await mcpServerRepository.update(server.id, { oauthConfig });
                console.log(
                  `OAuth config updated for server ${server.id}, clientId: ${clientId || 'NOT SET'}`
                );
              } catch (discoveryError) {
                console.error('OAuth discovery from server URL failed:', discoveryError);
                // Continue without oauthConfig - user will need to configure manually
              }
            }
          }

          // Return OAuth authorization URL (even if oauthConfig is incomplete)
          // User can manually configure OAuth if needed
          const authUrl = `/api/oauth/authorize/${server.id}`;
          res.status(401).json({
            status: 'error',
            error: 'OAuth authentication required',
            oauthUrl: authUrl,
            message: oauthConfig
              ? 'Please authorize this MCP server to continue'
              : 'OAuth configuration needed. Please configure OAuth settings for this server.',
            needsConfiguration: !oauthConfig,
          });
          return;
        }

        // Extract response body from error message if available
        // Error message format: "Failed to connect to SSE endpoint: 400. Response: {...}"
        let responseBody: unknown = null;
        if (errorMessage.includes('Response:')) {
          try {
            const responseMatch = errorMessage.match(/Response:\s*(.+)$/);
            if (responseMatch?.[1]) {
              const responseText = responseMatch[1].trim();
              // Try to parse as JSON if it looks like JSON
              if (responseText.startsWith('{') || responseText.startsWith('[')) {
                responseBody = JSON.parse(responseText);
              } else {
                responseBody = responseText;
              }
            }
          } catch {
            // If parsing fails, include raw error message
            responseBody = errorMessage;
          }
        }

        // Update log with error and response body
        if (logId) {
          const durationMs = Date.now() - startTime;
          await debugLogRepository.update(logId, {
            responsePayload: sanitizePayload({
              status: 'error',
              error: errorMessage,
              responseBody: responseBody || undefined,
            }),
            status: 'error',
            durationMs,
            errorMessage,
          });
        }

        res.json({
          status: 'error',
          error: errorMessage,
          responseBody: responseBody || undefined,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update log with error if it exists
      if (logId) {
        const durationMs = Date.now() - startTime;
        await debugLogRepository
          .update(logId, {
            responsePayload: sanitizePayload({
              status: 'unknown',
              error: `Failed to check status: ${errorMessage}`,
            }),
            status: 'error',
            durationMs,
            errorMessage: `Failed to check status: ${errorMessage}`,
          })
          .catch(() => {
            // Ignore update errors
          });
      }

      res.status(500).json({
        status: 'unknown',
        error: `Failed to check status: ${errorMessage}`,
      });
    }
  });

  return router;
}
