/**
 * MCP Proxy routes
 *
 * Provides MCP proxy endpoints per profile
 */

import type {
  JsonRpcRequest,
  JsonRpcResponse,
  McpResource,
  McpServer,
  McpTool,
  OAuthToken,
} from '@local-mcp/core';
import { McpServerFactory, ProxyHandler } from '@local-mcp/core';
import type {
  DebugLogRepository,
  McpServerRepository,
  OAuthTokenRepository,
  ProfileMcpServerRepository,
  ProfileRepository,
} from '@local-mcp/database';
import { Router } from 'express';
import { z } from 'zod';
import { sanitizePayload } from '../middleware/debug-logger.js';

const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]).optional(), // Optional for notifications
  method: z.string(),
  params: z.unknown().optional(),
});

/**
 * ProxyHandler wrapper that logs each individual server call
 * Note: serverId from ProxyHandler.servers.keys() is already the database ID
 * (McpServerFactory.createMultipleAsync uses entity.id as key)
 */
class ProxyHandlerWithLogging extends ProxyHandler {
  constructor(
    private debugLogRepository: DebugLogRepository,
    private profileId: string
  ) {
    super();
  }

  /**
   * List all tools from all registered servers with logging
   */
  override async listTools(): Promise<McpTool[]> {
    const allTools: McpTool[] = [];
    const toolNames = new Set<string>();

    // Access private servers property via type assertion
    const servers = (this as unknown as { servers: Map<string, McpServer> }).servers;
    for (const [serverId, server] of servers.entries()) {
      // serverId is already the database ID (from entity.id)
      const startTime = Date.now();
      let logId: string | null = null;

      try {
        // Create debug log for this server call
        logId = await this.createServerLog(serverId, 'tools/list', {});

        const tools = await server.listTools();

        // Update log with success
        await this.updateServerLog(logId, { tools }, startTime, 'success');

        // Handle name conflicts and add tools
        for (const tool of tools) {
          if (toolNames.has(tool.name)) {
            tool.name = `${serverId}:${tool.name}`;
          }
          toolNames.add(tool.name);
          allTools.push(tool);
        }
      } catch (error) {
        // Update log with error
        if (logId) {
          await this.updateServerLog(logId, null, startTime, 'error', error);
        }
        // Log error but continue with other servers
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error listing tools from server ${serverId}:`, errorMessage);
      }
    }

    return allTools;
  }

  /**
   * List all resources from all registered servers with logging
   */
  override async listResources(): Promise<McpResource[]> {
    const allResources: McpResource[] = [];

    const servers = (this as unknown as { servers: Map<string, McpServer> }).servers;
    for (const [serverId, server] of servers.entries()) {
      const startTime = Date.now();
      let logId: string | null = null;

      try {
        // Create debug log for this server call
        logId = await this.createServerLog(serverId, 'resources/list', {});

        const resources = await server.listResources();

        // Update log with success
        await this.updateServerLog(logId, { resources }, startTime, 'success');

        allResources.push(...resources);
      } catch (error) {
        // Update log with error
        if (logId) {
          await this.updateServerLog(logId, null, startTime, 'error', error);
        }
        // Log error but continue with other servers
        console.error(`Error listing resources from server ${serverId}:`, error);
      }
    }

    return allResources;
  }

  /**
   * Call a tool by name with logging
   */
  override async callTool(toolName: string, args: unknown): Promise<unknown> {
    // Check if tool name includes server ID prefix
    const parts = toolName.split(':');
    if (parts.length === 2) {
      const [serverId, actualToolName] = parts;
      if (serverId && actualToolName) {
        const servers = (this as unknown as { servers: Map<string, McpServer> }).servers;
        const server = servers.get(serverId);
        if (server) {
          const startTime = Date.now();
          let logId: string | null = null;

          try {
            logId = await this.createServerLog(serverId, 'tools/call', {
              name: actualToolName,
              arguments: args,
            });

            const result = await server.callTool(actualToolName, args);

            await this.updateServerLog(logId, result, startTime, 'success');

            return result;
          } catch (error) {
            if (logId) {
              await this.updateServerLog(logId, null, startTime, 'error', error);
            }
            throw error;
          }
        }
      }
    }

    // Try all servers until one handles the tool
    const servers = (this as unknown as { servers: Map<string, McpServer> }).servers;
    for (const [serverId, server] of servers.entries()) {
      try {
        const tools = await server.listTools();
        const tool = tools.find((t) => t.name === toolName);
        if (tool) {
          const startTime = Date.now();
          let logId: string | null = null;

          try {
            logId = await this.createServerLog(serverId, 'tools/call', {
              name: toolName,
              arguments: args,
            });

            const result = await server.callTool(toolName, args);

            await this.updateServerLog(logId, result, startTime, 'success');

            return result;
          } catch (error) {
            if (logId) {
              await this.updateServerLog(logId, null, startTime, 'error', error);
            }
            throw error;
          }
        }
      } catch (error) {
        // Continue to next server
        console.error(`Error checking tool in server:`, error);
      }
    }

    throw new Error(`Tool "${toolName}" not found in any registered server`);
  }

  /**
   * Read a resource by URI with logging
   */
  override async readResource(uri: string): Promise<unknown> {
    const servers = (this as unknown as { servers: Map<string, McpServer> }).servers;
    for (const [serverId, server] of servers.entries()) {
      try {
        const resources = await server.listResources();
        const resource = resources.find((r) => r.uri === uri);
        if (resource) {
          const startTime = Date.now();
          let logId: string | null = null;

          try {
            logId = await this.createServerLog(serverId, 'resources/read', { uri });

            const result = await server.readResource(uri);

            await this.updateServerLog(logId, result, startTime, 'success');

            return result;
          } catch (error) {
            if (logId) {
              await this.updateServerLog(logId, null, startTime, 'error', error);
            }
            throw error;
          }
        }
      } catch (error) {
        // Continue to next server
        console.error(`Error checking resource in server:`, error);
      }
    }

    throw new Error(`Resource "${uri}" not found in any registered server`);
  }

  /**
   * Handle a JSON-RPC request with logging for initialize method
   */
  override async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
    const isNotification = request.id === undefined;

    // For initialize method, log each server call separately
    if (request.method === 'initialize') {
      const initializeResults: Array<{
        serverId: string;
        result: {
          protocolVersion?: string;
          capabilities?: {
            tools?: unknown;
            resources?: unknown;
            prompts?: unknown;
            logging?: unknown;
          };
          serverInfo?: { name?: string; version?: string };
        };
      }> = [];
      const errors: Array<{ serverId: string; error: unknown }> = [];

      const servers = (this as unknown as { servers: Map<string, McpServer> }).servers;
      for (const [serverId, server] of servers.entries()) {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
          logId = await this.createServerLog(serverId, 'initialize', request.params);

          // Check if server has handleRequest method (for remote servers)
          if (
            typeof (server as unknown as { handleRequest?: unknown }).handleRequest === 'function'
          ) {
            const serverResponse = await (
              server as unknown as {
                handleRequest: (req: JsonRpcRequest) => Promise<JsonRpcResponse | undefined>;
              }
            ).handleRequest(request);

            if (serverResponse?.error) {
              errors.push({ serverId, error: serverResponse.error });
              await this.updateServerLog(logId, serverResponse.error, startTime, 'error');
            } else if (serverResponse?.result) {
              initializeResults.push({
                serverId,
                result: serverResponse.result as {
                  protocolVersion?: string;
                  capabilities?: {
                    tools?: unknown;
                    resources?: unknown;
                    prompts?: unknown;
                    logging?: unknown;
                  };
                  serverInfo?: { name?: string; version?: string };
                },
              });
              await this.updateServerLog(logId, serverResponse.result, startTime, 'success');
            }
          } else {
            // For servers without handleRequest, return proxy capabilities
            const result = {
              protocolVersion: '2025-06-18',
              capabilities: {
                tools: { listChanged: false },
                resources: { subscribe: false, listChanged: false },
              },
              serverInfo: {
                name: `proxy-server-${serverId}`,
                version: '1.0.0',
              },
            };
            initializeResults.push({ serverId, result });
            await this.updateServerLog(logId, result, startTime, 'success');
          }
        } catch (error) {
          errors.push({ serverId, error });
          if (logId) {
            await this.updateServerLog(logId, null, startTime, 'error', error);
          }
        }
      }

      // If all servers failed, return error
      if (initializeResults.length === 0 && errors.length > 0) {
        throw new Error(
          `Failed to initialize servers: ${errors.map((e) => e.serverId).join(', ')}`
        );
      }

      // Aggregate capabilities from all servers
      const protocolVersions = initializeResults
        .map((r) => r.result.protocolVersion)
        .filter((v): v is string => typeof v === 'string');
      const maxProtocolVersion =
        protocolVersions.length > 0 ? protocolVersions.sort().reverse()[0] : '2025-06-18';

      const hasTools = initializeResults.some((r) => r.result.capabilities?.tools !== undefined);
      const hasResources = initializeResults.some(
        (r) => r.result.capabilities?.resources !== undefined
      );
      const hasPrompts = initializeResults.some(
        (r) => r.result.capabilities?.prompts !== undefined
      );
      const hasLogging = initializeResults.some(
        (r) => r.result.capabilities?.logging !== undefined
      );

      const result = {
        protocolVersion: maxProtocolVersion,
        capabilities: {
          ...(hasTools && { tools: { listChanged: false } }),
          ...(hasResources && { resources: { subscribe: false, listChanged: false } }),
          ...(hasPrompts && { prompts: {} }),
          ...(hasLogging && { logging: {} }),
        },
        serverInfo: {
          name: 'local-mcp-proxy',
          version: '1.0.0',
        },
      };

      if (isNotification) {
        return;
      }

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result,
      };
    }

    // For other methods, use parent implementation
    return super.handleRequest(request);
  }

  /**
   * Create a debug log entry for a server call
   */
  private async createServerLog(
    mcpServerId: string, // Always string - serverId from ProxyHandler is database ID
    requestType: string,
    requestPayload: unknown
  ): Promise<string | null> {
    try {
      const log = await this.debugLogRepository.create({
        profileId: this.profileId,
        mcpServerId, // Always set - we always have the server ID
        requestType,
        requestPayload: sanitizePayload(requestPayload),
        status: 'pending',
      });
      return log.id;
    } catch {
      return null;
    }
  }

  /**
   * Update a debug log entry with response
   */
  private async updateServerLog(
    logId: string | null,
    responsePayload: unknown,
    startTime: number,
    status: 'success' | 'error',
    error?: unknown
  ): Promise<void> {
    if (!logId) return;
    const durationMs = Date.now() - startTime;
    try {
      await this.debugLogRepository.update(logId, {
        responsePayload: responsePayload ? sanitizePayload(responsePayload) : undefined,
        status,
        durationMs,
        errorMessage: error ? (error instanceof Error ? error.message : String(error)) : undefined,
      });
    } catch {
      // Ignore update errors
    }
  }
}

interface ServerStatus {
  total: number;
  connected: number;
  status: Record<string, boolean>;
}

/**
 * Create proxy handler for a profile
 * Loads profile, MCP servers, OAuth tokens, and API keys
 * @param profileIdentifier - Profile ID or name
 * @returns ProxyHandler, Map of server instances, and server status
 */
async function createProxyHandlerForProfile(
  profileIdentifier: string,
  profileRepository: ProfileRepository,
  mcpServerRepository: McpServerRepository,
  oauthTokenRepository: OAuthTokenRepository,
  profileMcpServerRepository: ProfileMcpServerRepository
): Promise<{
  proxyHandler: ProxyHandler;
  servers: Map<string, McpServer>;
  serverStatus: ServerStatus;
}> {
  // Try to find profile by ID first, then by name
  let profile = await profileRepository.findById(profileIdentifier);
  if (!profile) {
    profile = await profileRepository.findByName(profileIdentifier);
  }
  if (!profile) {
    throw new Error(`Profile "${profileIdentifier}" not found`);
  }

  // Get MCP server IDs for this profile
  const serverIds = await profileMcpServerRepository.getServerIdsForProfile(profile.id);
  
  // If no servers, return empty handler
  if (serverIds.length === 0) {
    return {
      proxyHandler: new ProxyHandler(),
      servers: new Map(),
      serverStatus: { total: 0, connected: 0, status: {} },
    };
  }

  // Load MCP server entities
  const mcpServerEntities = await Promise.all(
    serverIds.map((serverId) => mcpServerRepository.findById(serverId))
  );

  // Filter out null values (servers that were deleted)
  const validServers = mcpServerEntities.filter(
    (server): server is NonNullable<typeof server> => server !== null
  );

  if (validServers.length === 0) {
    return {
      proxyHandler: new ProxyHandler(),
      servers: new Map(),
      serverStatus: { total: 0, connected: 0, status: {} },
    };
  }

  // Load OAuth tokens for all MCP servers
  const oauthTokens = new Map<string, OAuthToken>();
  for (const server of validServers) {
    const token = await oauthTokenRepository.get(server.id);
    if (token) {
      oauthTokens.set(server.id, token);
    }
  }

  // Extract API key configs from entities
  const apiKeyConfigs = new Map<string, NonNullable<(typeof validServers)[0]['apiKeyConfig']>>();
  for (const server of validServers) {
    if (server.apiKeyConfig) {
      apiKeyConfigs.set(server.id, server.apiKeyConfig);
    }
  }

  // Create MCP server instances (use async version to support custom servers)
  const servers = await McpServerFactory.createMultipleAsync(
    validServers,
    oauthTokens,
    apiKeyConfigs
  );

  // Initialize all servers and track status
  const status: Record<string, boolean> = {};
  let connected = 0;

  for (const [serverId, server] of servers.entries()) {
    try {
      await server.initialize();
      status[serverId] = true;
      connected++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to initialize MCP server ${serverId}:`, errorMessage);
      status[serverId] = false;
      // Continue with other servers - but log the error for debugging
      // In production, we might want to fail fast or mark server as unavailable
    }
  }

  // Create proxy handler and register servers
  const proxyHandler = new ProxyHandler();
  for (const [serverId, server] of servers.entries()) {
    proxyHandler.registerServer(serverId, server);
  }

  return {
    proxyHandler,
    servers,
    serverStatus: {
      total: servers.size,
      connected,
      status,
    },
  };
}

export function createProxyRoutes(
  profileRepository: ProfileRepository,
  mcpServerRepository: McpServerRepository,
  oauthTokenRepository: OAuthTokenRepository,
  debugLogRepository: DebugLogRepository,
  profileMcpServerRepository: ProfileMcpServerRepository
): Router {
  const router = Router();

  // HTTP MCP endpoint per profile (supports both ID and name)
  router.post('/:profileId', async (req, res) => {
    try {
      const { profileId } = req.params; // Can be ID or name

      // Find profile to get actual ID
      let profile = await profileRepository.findById(profileId);
      if (!profile) {
        profile = await profileRepository.findByName(profileId);
      }
      if (!profile) {
        res.status(404).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32603,
            message: `Profile "${profileId}" not found`,
          },
        });
        return;
      }

      // Note: Individual server calls are logged by ProxyHandlerWithLogging
      // We no longer need to log the aggregated proxy request separately

      // Create proxy handler with servers for this profile
      const { servers } = await createProxyHandlerForProfile(
        profileId,
        profileRepository,
        mcpServerRepository,
        oauthTokenRepository,
        profileMcpServerRepository
      );

      // Create wrapper with logging
      const proxyHandler = new ProxyHandlerWithLogging(debugLogRepository, profile.id);

      // Register servers to logging wrapper
      // Note: serverId is already the database ID (from entity.id)
      for (const [serverId, server] of servers.entries()) {
        proxyHandler.registerServer(serverId, server);
      }

      // Validate request
      const validated = jsonRpcRequestSchema.parse(req.body);
      const request: JsonRpcRequest = validated as JsonRpcRequest;

      // Handle request
      const response = await proxyHandler.handleRequest(request);

      // If response is undefined, this was a notification (no id) - send 204 No Content
      if (response === undefined) {
        res.status(204).send();
        return;
      }

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: error.issues,
          },
        });
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Internal error';
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: errorMessage,
        },
      });
    }
  });

  // SSE MCP endpoint per profile (supports both ID and name)
  router.get('/:profileId/sse', async (req, res) => {
    try {
      const { profileId } = req.params; // Can be ID or name

      // Create proxy handler for this profile
      await createProxyHandlerForProfile(
        profileId,
        profileRepository,
        mcpServerRepository,
        oauthTokenRepository,
        profileMcpServerRepository
      ).then(({ proxyHandler }) => proxyHandler);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial connection message
      res.write('data: {"type":"connection","status":"connected"}\n\n');

      // For now, just keep connection open
      // In full implementation, this would handle SSE streaming with actual MCP server SSE connections
      req.on('close', () => {
        res.end();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal error';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Metadata endpoint (tools and resources) - supports both ID and name
  router.get('/:profileId/info', async (req, res) => {
    try {
      const { profileId } = req.params; // Can be ID or name

      // Create proxy handler for this profile
      const { proxyHandler, serverStatus } = await createProxyHandlerForProfile(
        profileId,
        profileRepository,
        mcpServerRepository,
        oauthTokenRepository,
        profileMcpServerRepository
      );

      const tools = await proxyHandler.listTools();
      const resources = await proxyHandler.listResources();

      res.json({
        tools,
        resources,
        serverStatus,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Internal error';
      res.status(500).json({ error: errorMessage });
    }
  });

  return router;
}
