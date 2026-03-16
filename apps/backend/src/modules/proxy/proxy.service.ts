/**
 * Proxy Service
 *
 * Handles MCP protocol proxying for profiles.
 */

import type { ApiKeyConfig as CoreApiKeyConfig, McpServer } from '@dxheroes/local-mcp-core';
import {
  ExternalMcpServer,
  RemoteHttpMcpServer,
  RemoteSseMcpServer,
} from '@dxheroes/local-mcp-core';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { DebugService } from '../debug/debug.service.js';
import { McpRegistry } from '../mcp/mcp-registry.js';

interface McpToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: unknown;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface ServerConfig {
  builtinId?: string;
  url?: string;
  headers?: Record<string, string>;
  // External server config
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;
  autoRestart?: boolean;
  maxRestartAttempts?: number;
  startupTimeout?: number;
  shutdownTimeout?: number;
}

interface StoredApiKeyConfig {
  apiKey: string;
  headerName?: string;
  headerValueTemplate?: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly serverInstances = new Map<string, McpServer>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: McpRegistry,
    private readonly debugService: DebugService
  ) {}

  /**
   * Handle MCP JSON-RPC request for a profile
   */
  async handleRequest(
    profileName: string,
    request: McpRequest,
    userId: string
  ): Promise<McpResponse> {
    const requestId = request.id;
    const startTime = Date.now();

    // Get profile with servers
    const profile = await this.findProfileByName(profileName, userId);

    if (!profile) {
      throw new NotFoundException(`Profile "${profileName}" not found`);
    }

    // Skip logging for initialize (just handshaking)
    const shouldLog = request.method !== 'initialize';

    // Create debug log entry
    let logId: string | null = null;
    if (shouldLog) {
      try {
        const log = await this.debugService.createLog({
          profileId: profile.id,
          requestType: request.method,
          requestPayload: JSON.stringify(request),
          status: 'pending',
        });
        logId = log.id;
      } catch (logError) {
        this.logger.warn(`Failed to create debug log: ${logError}`);
      }
    }

    try {
      // Handle different MCP methods
      let response: McpResponse;

      switch (request.method) {
        case 'initialize':
          response = await this.handleInitialize(requestId, profile);
          break;

        case 'tools/list':
          response = await this.handleToolsList(requestId, profile);
          break;

        case 'tools/call':
          response = await this.handleToolsCall(
            requestId,
            profile,
            request.params as McpToolCall,
            logId
          );
          break;

        case 'resources/list':
          response = await this.handleResourcesList(requestId, profile);
          break;

        case 'resources/read':
          response = await this.handleResourcesRead(
            requestId,
            profile,
            request.params as { uri: string }
          );
          break;

        default:
          response = {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }

      // Update debug log with success
      if (logId) {
        const durationMs = Date.now() - startTime;
        try {
          await this.debugService.updateLog(logId, {
            responsePayload: JSON.stringify(response),
            status: response.error ? 'error' : 'success',
            errorMessage: response.error?.message,
            durationMs,
          });
        } catch (logError) {
          this.logger.warn(`Failed to update debug log: ${logError}`);
        }
      }

      return response;
    } catch (error) {
      this.logger.error(`MCP request error: ${error}`);

      const errorMessage = error instanceof Error ? error.message : 'Internal error';

      // Update debug log with error
      if (logId) {
        const durationMs = Date.now() - startTime;
        try {
          await this.debugService.updateLog(logId, {
            status: 'error',
            errorMessage,
            durationMs,
          });
        } catch (logError) {
          this.logger.warn(`Failed to update debug log: ${logError}`);
        }
      }

      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: errorMessage,
        },
      };
    }
  }

  private async handleInitialize(
    requestId: string | number,
    _profile: { name: string }
  ): Promise<McpResponse> {
    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: 'Local MCP Gateway',
          version: '0.1.0',
        },
      },
    };
  }

  private async handleToolsList(
    requestId: string | number,
    profile: {
      mcpServers: Array<{
        mcpServer: {
          id: string;
          name: string;
          type: string;
          config: unknown;
          apiKeyConfig: unknown;
        };
        tools: Array<{
          toolName: string;
          isEnabled: boolean;
          customName: string | null;
          customDescription: string | null;
        }>;
      }>;
    }
  ): Promise<McpResponse> {
    const allTools: Array<{
      name: string;
      description: string;
      inputSchema: unknown;
    }> = [];

    for (const profileServer of profile.mcpServers) {
      const server = profileServer.mcpServer;
      const instance = await this.getServerInstance(server);

      if (instance) {
        const tools = await instance.listTools();

        // Apply tool customizations
        for (const tool of tools) {
          const customization = profileServer.tools.find((t) => t.toolName === tool.name);

          if (!customization || customization.isEnabled) {
            allTools.push({
              name: customization?.customName || tool.name,
              description: customization?.customDescription || tool.description,
              inputSchema: tool.inputSchema,
            });
          }
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        tools: allTools,
      },
    };
  }

  private async handleToolsCall(
    requestId: string | number,
    profile: {
      mcpServers: Array<{
        mcpServer: {
          id: string;
          name: string;
          type: string;
          config: unknown;
          apiKeyConfig: unknown;
        };
        tools: Array<{
          toolName: string;
          isEnabled: boolean;
          customName: string | null;
        }>;
      }>;
    },
    params: McpToolCall,
    logId: string | null
  ): Promise<McpResponse> {
    // Find which server has this tool
    for (const profileServer of profile.mcpServers) {
      const server = profileServer.mcpServer;
      const instance = await this.getServerInstance(server);

      if (instance) {
        const tools = await instance.listTools();

        // Check if this server has the requested tool (by name or custom name)
        const customization = profileServer.tools.find(
          (t) => t.customName === params.name || t.toolName === params.name
        );

        // Skip if tool is disabled
        if (customization && !customization.isEnabled) {
          continue;
        }

        const toolName = customization?.toolName || params.name;
        const hasTool = tools.some((t) => t.name === toolName);

        if (hasTool) {
          // Update log with the server that handled this tool call
          if (logId) {
            try {
              await this.debugService.updateLog(logId, {
                mcpServerId: server.id,
              });
            } catch (logError) {
              this.logger.warn(`Failed to update debug log with server info: ${logError}`);
            }
          }

          const result = await instance.callTool(toolName, params.arguments || {});

          return {
            jsonrpc: '2.0',
            id: requestId,
            result,
          };
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32602,
        message: `Tool not found: ${params.name}`,
      },
    };
  }

  private async handleResourcesList(
    requestId: string | number,
    profile: {
      mcpServers: Array<{
        mcpServer: {
          id: string;
          name: string;
          type: string;
          config: unknown;
          apiKeyConfig: unknown;
        };
      }>;
    }
  ): Promise<McpResponse> {
    const allResources: Array<{
      uri: string;
      name: string;
      description?: string;
      mimeType?: string;
    }> = [];

    for (const profileServer of profile.mcpServers) {
      const server = profileServer.mcpServer;
      const instance = await this.getServerInstance(server);

      if (instance) {
        const resources = await instance.listResources();
        allResources.push(...resources);
      }
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      result: {
        resources: allResources,
      },
    };
  }

  private async handleResourcesRead(
    requestId: string | number,
    profile: {
      mcpServers: Array<{
        mcpServer: {
          id: string;
          name: string;
          type: string;
          config: unknown;
          apiKeyConfig: unknown;
        };
      }>;
    },
    params: { uri: string }
  ): Promise<McpResponse> {
    // Try each server until we find one that has this resource
    for (const profileServer of profile.mcpServers) {
      const server = profileServer.mcpServer;
      const instance = await this.getServerInstance(server);

      if (instance) {
        try {
          const content = await instance.readResource(params.uri);
          return {
            jsonrpc: '2.0',
            id: requestId,
            result: content,
          };
        } catch {
          // Resource not found on this server, try next
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32602,
        message: `Resource not found: ${params.uri}`,
      },
    };
  }

  /**
   * Get tools for a specific server by ID
   */
  async getToolsForServer(serverId: string) {
    const server = await this.prisma.mcpServer.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`MCP server ${serverId} not found`);
    }

    const instance = await this.getServerInstance(server);
    if (!instance) {
      return [];
    }

    return instance.listTools();
  }

  /**
   * Get or create a server instance
   */
  private async getServerInstance(server: {
    id: string;
    type: string;
    config: unknown;
    apiKeyConfig: unknown;
  }): Promise<McpServer | null> {
    // Check cache
    const cached = this.serverInstances.get(server.id);
    if (cached) {
      return cached;
    }

    // Parse config
    const config = this.parseJson<ServerConfig>(server.config);
    const builtinId = config?.builtinId;

    // Get API key config and convert to CoreApiKeyConfig format
    const storedConfig = this.parseJson<StoredApiKeyConfig>(server.apiKeyConfig);
    const apiKeyConfig = this.convertApiKeyConfig(storedConfig);

    // For builtin servers, get from registry
    if (builtinId && this.registry.has(builtinId)) {
      const pkg = this.registry.get(builtinId);
      if (pkg) {
        const instance = pkg.createServer(apiKeyConfig);
        await instance.initialize();
        this.serverInstances.set(server.id, instance);
        return instance;
      }
    }

    // For remote_http and remote_sse servers, look up OAuth token
    let oauthToken = null;
    if (server.type === 'remote_http' || server.type === 'remote_sse') {
      const tokenRecord = await this.prisma.oAuthToken.findUnique({
        where: { mcpServerId: server.id },
      });
      if (tokenRecord) {
        oauthToken = {
          id: tokenRecord.id,
          mcpServerId: tokenRecord.mcpServerId,
          accessToken: tokenRecord.accessToken,
          tokenType: tokenRecord.tokenType,
          refreshToken: tokenRecord.refreshToken ?? undefined,
          scope: tokenRecord.scope ?? undefined,
          expiresAt: tokenRecord.expiresAt?.getTime(),
          createdAt: tokenRecord.createdAt.getTime(),
          updatedAt: tokenRecord.updatedAt.getTime(),
        };
      }
    }

    // For remote_http servers, create RemoteHttpMcpServer
    if (server.type === 'remote_http' && config?.url) {
      const remoteServer = new RemoteHttpMcpServer(
        { url: config.url, transport: 'http', headers: config.headers as Record<string, string> },
        oauthToken,
        apiKeyConfig
      );
      await remoteServer.initialize();
      this.serverInstances.set(server.id, remoteServer);
      return remoteServer;
    }

    // For remote_sse servers, create RemoteSseMcpServer
    if (server.type === 'remote_sse' && config?.url) {
      const remoteServer = new RemoteSseMcpServer(
        { url: config.url, transport: 'sse', headers: config.headers as Record<string, string> },
        oauthToken,
        apiKeyConfig
      );
      await remoteServer.initialize();
      this.serverInstances.set(server.id, remoteServer);
      return remoteServer;
    }

    // For external servers (NPX/stdio), create ExternalMcpServer
    if (server.type === 'external' && config?.command) {
      const externalServer = new ExternalMcpServer({
        command: config.command,
        args: config.args,
        env: config.env,
        workingDirectory: config.workingDirectory,
        autoRestart: config.autoRestart,
        maxRestartAttempts: config.maxRestartAttempts,
        startupTimeout: config.startupTimeout,
        shutdownTimeout: config.shutdownTimeout,
      });
      await externalServer.initialize();
      this.serverInstances.set(server.id, externalServer);
      return externalServer;
    }

    return null;
  }

  /**
   * Convert stored API key config to CoreApiKeyConfig format
   */
  private convertApiKeyConfig(stored: StoredApiKeyConfig | null): CoreApiKeyConfig | null {
    if (!stored?.apiKey) return null;

    const headerName = stored.headerName || 'Authorization';
    const template = stored.headerValueTemplate || 'Bearer {apiKey}';
    const headerValue = template.replace('{apiKey}', stored.apiKey);

    return {
      apiKey: stored.apiKey,
      headerName,
      headerValue,
    };
  }

  private parseJson<T>(value: unknown): T | null {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return value as T | null;
  }

  /**
   * Resolve an org slug to an organization ID.
   */
  private async resolveOrgBySlug(orgSlug: string): Promise<string> {
    const org = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!org) {
      throw new NotFoundException(`Organization "${orgSlug}" not found`);
    }
    return org.id;
  }

  /**
   * Find a profile by name within an organization.
   */
  private async findProfileByNameAndOrg(profileName: string, orgId: string) {
    const include = {
      mcpServers: {
        where: { isActive: true },
        include: {
          mcpServer: true,
          tools: true,
        },
        orderBy: { order: 'asc' as const },
      },
    };

    return this.prisma.profile.findFirst({
      where: { name: profileName, organizationId: orgId },
      include,
    });
  }

  /**
   * Find a profile by name, scoped to the user's organizations.
   */
  private async findProfileByName(profileName: string, userId: string) {
    const include = {
      mcpServers: {
        where: { isActive: true },
        include: {
          mcpServer: true,
          tools: true,
        },
        orderBy: { order: 'asc' as const },
      },
    };

    // Look up user's memberships and search in their orgs
    const memberships = await this.prisma.member.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) return null;

    return this.prisma.profile.findFirst({
      where: { name: profileName, organizationId: { in: orgIds } },
      include,
    });
  }

  /**
   * Handle MCP request using org slug to resolve the profile.
   */
  async handleRequestByOrgSlug(
    profileName: string,
    orgSlug: string,
    request: McpRequest,
    userId?: string
  ): Promise<McpResponse> {
    const orgId = await this.resolveOrgBySlug(orgSlug);
    const profile = await this.findProfileByNameAndOrg(profileName, orgId);

    if (!profile) {
      throw new NotFoundException(`Profile "${profileName}" not found in organization "${orgSlug}"`);
    }

    const requestId = request.id;
    const startTime = Date.now();

    const shouldLog = request.method !== 'initialize';
    let logId: string | null = null;
    if (shouldLog) {
      try {
        const log = await this.debugService.createLog({
          profileId: profile.id,
          requestType: request.method,
          requestPayload: JSON.stringify(request),
          status: 'pending',
        });
        logId = log.id;
      } catch (logError) {
        this.logger.warn(`Failed to create debug log: ${logError}`);
      }
    }

    try {
      let response: McpResponse;

      switch (request.method) {
        case 'initialize':
          response = await this.handleInitialize(requestId, profile);
          break;
        case 'tools/list':
          response = await this.handleToolsList(requestId, profile);
          break;
        case 'tools/call':
          response = await this.handleToolsCall(
            requestId,
            profile,
            request.params as McpToolCall,
            logId
          );
          break;
        case 'resources/list':
          response = await this.handleResourcesList(requestId, profile);
          break;
        case 'resources/read':
          response = await this.handleResourcesRead(
            requestId,
            profile,
            request.params as { uri: string }
          );
          break;
        default:
          response = {
            jsonrpc: '2.0',
            id: requestId,
            error: { code: -32601, message: `Method not found: ${request.method}` },
          };
      }

      if (logId) {
        try {
          await this.debugService.updateLog(logId, {
            responsePayload: JSON.stringify(response),
            status: response.error ? 'error' : 'success',
            errorMessage: response.error?.message,
            durationMs: Date.now() - startTime,
          });
        } catch (logError) {
          this.logger.warn(`Failed to update debug log: ${logError}`);
        }
      }

      return response;
    } catch (error) {
      this.logger.error(`MCP request error: ${error}`);
      const errorMessage = error instanceof Error ? error.message : 'Internal error';
      if (logId) {
        try {
          await this.debugService.updateLog(logId, {
            status: 'error',
            errorMessage,
            durationMs: Date.now() - startTime,
          });
        } catch (logError) {
          this.logger.warn(`Failed to update debug log: ${logError}`);
        }
      }
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: { code: -32603, message: errorMessage },
      };
    }
  }

  /**
   * Get profile info using org slug.
   */
  async getProfileInfoByOrgSlug(profileName: string, orgSlug: string) {
    const orgId = await this.resolveOrgBySlug(orgSlug);
    const profile = await this.findProfileByNameAndOrg(profileName, orgId);

    if (!profile) {
      throw new NotFoundException(`Profile "${profileName}" not found in organization "${orgSlug}"`);
    }

    return this.aggregateProfileInfo(profile);
  }

  /**
   * Get profile info with aggregated tools and server status
   */
  async getProfileInfo(profileName: string, userId: string) {
    const profile = await this.findProfileByName(profileName, userId);

    if (!profile) {
      throw new NotFoundException(`Profile "${profileName}" not found`);
    }

    return this.aggregateProfileInfo(profile);
  }

  /**
   * Aggregate tools and server status from a profile.
   */
  private async aggregateProfileInfo(profile: {
    mcpServers: Array<{
      mcpServer: {
        id: string;
        name: string;
        type: string;
        config: unknown;
        apiKeyConfig: unknown;
      };
      tools: Array<{
        toolName: string;
        isEnabled: boolean;
        customName: string | null;
        customDescription: string | null;
      }>;
    }>;
  }) {
    const tools: Array<{ name: string; description: string }> = [];
    const serverStatus: Record<string, { connected: boolean; toolCount: number }> = {};

    const results = await Promise.allSettled(
      profile.mcpServers.map(async (ps) => {
        const server = ps.mcpServer;
        const instance = await this.getServerInstance(server);

        if (instance) {
          const serverTools = await instance.listTools();
          return { ps, serverTools, connected: true };
        }
        return { ps, serverTools: [] as Array<{ name: string; description: string; inputSchema: unknown }>, connected: false };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { ps, serverTools, connected } = result.value;
        serverStatus[ps.mcpServer.id] = { connected, toolCount: serverTools.length };

        if (connected) {
          for (const tool of serverTools) {
            const customization = ps.tools.find((t) => t.toolName === tool.name);
            if (!customization || customization.isEnabled) {
              tools.push({
                name: customization?.customName || tool.name,
                description: customization?.customDescription || tool.description,
              });
            }
          }
        }
      } else {
        // Failed — find the corresponding ps from the original array by index
        const index = results.indexOf(result);
        const ps = profile.mcpServers[index];
        serverStatus[ps.mcpServer.id] = { connected: false, toolCount: 0 };
      }
    }

    return {
      tools,
      serverStatus: {
        total: profile.mcpServers.length,
        connected: Object.values(serverStatus).filter((s) => s.connected).length,
        servers: serverStatus,
      },
    };
  }
}
