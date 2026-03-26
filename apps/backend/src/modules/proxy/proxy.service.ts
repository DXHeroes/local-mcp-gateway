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
import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { appLogger } from '../../common/logging/app-logger.js';
import { stringifyRedacted } from '../../common/logging/redact-sensitive-fields.js';
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

interface ProfileToolCustomization {
  toolName: string;
  isEnabled: boolean;
  customName: string | null;
  customDescription?: string | null;
}

interface ProfileServerEntry {
  mcpServer: {
    id: string;
    name: string;
    type: string;
    config: unknown;
    apiKeyConfig: unknown;
    toolConfigs?: Array<{ toolName: string; isEnabled: boolean }>;
  };
  tools: ProfileToolCustomization[];
}

interface ResolvedProfile {
  id: string;
  name: string;
  mcpServers: ProfileServerEntry[];
}

interface RequestExecutionResult {
  response: McpResponse;
  event: string;
  status: 'success' | 'error';
  mcpServerId?: string;
  toolName?: string;
  toolCount?: number;
  serverCount?: number;
}

interface ListedTool {
  name: string;
  description: string;
  inputSchema: unknown;
}

interface ListedResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface ServerToolsContext {
  connected: boolean;
  instance: McpServer | null;
  tools: ListedTool[];
}

export const MCP_SERVER_CHANGED = 'mcp.server.changed';

@Injectable()
export class ProxyService {
  private readonly serverInstances = new Map<string, McpServer>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: McpRegistry,
    private readonly debugService: DebugService
  ) {}

  /**
   * Handle MCP server config/apiKey changes.
   * Evicts the stale cached instance and re-initializes with fresh config.
   */
  @OnEvent(MCP_SERVER_CHANGED)
  async handleServerChanged(payload: { serverId: string }) {
    this.serverInstances.delete(payload.serverId);

    const server = await this.prisma.mcpServer.findUnique({
      where: { id: payload.serverId },
    });

    if (!server) return;

    try {
      await this.getServerInstance(server);
      appLogger.info(
        { event: 'mcp.server.reinitialized', serverId: payload.serverId },
        'MCP server reinitialized after config change'
      );
    } catch (error) {
      appLogger.warn(
        {
          event: 'mcp.server.reinitialize.failed',
          serverId: payload.serverId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to reinitialize MCP server after config change'
      );
    }
  }

  /**
   * Handle MCP JSON-RPC request for a profile
   */
  async handleRequest(
    profileName: string,
    request: McpRequest,
    userId: string
  ): Promise<McpResponse> {
    const profile = await this.findProfileByName(profileName, userId);

    if (!profile) {
      throw new NotFoundException(`Profile "${profileName}" not found`);
    }

    return this.executeRequest(profile as ResolvedProfile, request);
  }

  private async createDebugLog(profileId: string, request: McpRequest) {
    try {
      const log = await this.debugService.createLog({
        profileId,
        requestType: request.method,
        requestPayload: stringifyRedacted(request),
        status: 'pending',
      });

      return log.id;
    } catch (error) {
      appLogger.warn(
        {
          event: 'mcp.audit.create.failed',
          profileId,
          method: request.method,
          mcpRequestId: String(request.id),
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to create MCP debug audit log'
      );
      return null;
    }
  }

  private async updateDebugLog(
    logId: string | null,
    data: {
      responsePayload?: unknown;
      status?: 'pending' | 'success' | 'error';
      errorMessage?: string;
      durationMs?: number;
      mcpServerId?: string;
    }
  ) {
    if (!logId) {
      return;
    }

    try {
      await this.debugService.updateLog(logId, {
        responsePayload:
          data.responsePayload === undefined ? undefined : stringifyRedacted(data.responsePayload),
        status: data.status,
        errorMessage: data.errorMessage,
        durationMs: data.durationMs,
        mcpServerId: data.mcpServerId,
      });
    } catch (error) {
      appLogger.warn(
        {
          event: 'mcp.audit.update.failed',
          logId,
          status: data.status,
          mcpServerId: data.mcpServerId,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to update MCP debug audit log'
      );
    }
  }

  private async executeRequest(
    profile: ResolvedProfile,
    request: McpRequest
  ): Promise<McpResponse> {
    const mcpRequestId = String(request.id);
    const startTime = Date.now();
    const shouldLog = request.method !== 'initialize';
    const requestedToolName =
      request.method === 'tools/call'
        ? ((request.params as McpToolCall | undefined)?.name ?? undefined)
        : undefined;

    let logId: string | null = null;
    if (shouldLog) {
      appLogger.info(
        {
          event: 'mcp.request.started',
          mcpRequestId,
          method: request.method,
          profileId: profile.id,
        },
        'MCP request started'
      );

      if (requestedToolName) {
        appLogger.info(
          {
            event: 'mcp.tool.call.started',
            mcpRequestId,
            method: request.method,
            profileId: profile.id,
            toolName: requestedToolName,
          },
          'MCP tool call started'
        );
      }

      logId = await this.createDebugLog(profile.id, request);
    }

    try {
      const executionResult = await this.dispatchRequest(profile, request, logId);
      const durationMs = Date.now() - startTime;

      if (shouldLog) {
        await this.updateDebugLog(logId, {
          responsePayload: executionResult.response,
          status: executionResult.status,
          errorMessage: executionResult.response.error?.message,
          durationMs,
          mcpServerId: executionResult.mcpServerId,
        });

        appLogger.info(
          {
            event: 'mcp.request.completed',
            mcpRequestId,
            method: request.method,
            profileId: profile.id,
            mcpServerId: executionResult.mcpServerId,
            toolName: executionResult.toolName,
            durationMs,
            status: executionResult.status,
          },
          'MCP request completed'
        );

        appLogger.info(
          {
            event: executionResult.event,
            mcpRequestId,
            method: request.method,
            profileId: profile.id,
            mcpServerId: executionResult.mcpServerId,
            toolName: executionResult.toolName,
            toolCount: executionResult.toolCount,
            serverCount: executionResult.serverCount,
            durationMs,
            status: executionResult.status,
          },
          executionResult.event === 'mcp.tool.call.completed'
            ? 'MCP tool call completed'
            : executionResult.event === 'mcp.tools.list.completed'
              ? 'MCP tools list completed'
              : 'MCP request method completed'
        );
      }

      return executionResult.response;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Internal error';

      if (shouldLog) {
        await this.updateDebugLog(logId, {
          status: 'error',
          errorMessage,
          durationMs,
        });

        appLogger.error(
          {
            event: 'mcp.request.failed',
            mcpRequestId,
            method: request.method,
            profileId: profile.id,
            toolName: requestedToolName,
            durationMs,
            error: errorMessage,
          },
          'MCP request failed'
        );
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: errorMessage,
        },
      };
    }
  }

  private async dispatchRequest(
    profile: ResolvedProfile,
    request: McpRequest,
    logId: string | null
  ): Promise<RequestExecutionResult> {
    const requestId = request.id;

    switch (request.method) {
      case 'initialize':
        return {
          response: await this.handleInitialize(requestId, profile),
          event: 'mcp.initialize.completed',
          status: 'success',
        };
      case 'tools/list':
        return this.handleToolsList(requestId, profile);
      case 'tools/call':
        return this.handleToolsCall(requestId, profile, request.params as McpToolCall, logId);
      case 'resources/list':
        return {
          response: await this.handleResourcesList(requestId, profile),
          event: 'mcp.resources.list.completed',
          status: 'success',
        };
      case 'resources/read':
        return {
          response: await this.handleResourcesRead(
            requestId,
            profile,
            request.params as { uri: string }
          ),
          event: 'mcp.resources.read.completed',
          status: 'success',
        };
      default: {
        const response = {
          jsonrpc: '2.0' as const,
          id: requestId,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };

        return {
          response,
          event: 'mcp.request.method_not_found',
          status: 'error',
        };
      }
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

  /**
   * Check if a tool is allowed by the server-level allowlist.
   * If no tool configs exist, all tools are allowed (backwards compat).
   * If configs exist, only explicitly enabled tools pass.
   */
  private isToolAllowedByServer(
    toolName: string,
    toolConfigs?: Array<{ toolName: string; isEnabled: boolean }>
  ): boolean {
    if (!toolConfigs || toolConfigs.length === 0) return true;
    const config = toolConfigs.find((c) => c.toolName === toolName);
    return config?.isEnabled ?? false;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Internal error';
  }

  private isOAuthRequiredError(error: unknown): boolean {
    return this.getErrorMessage(error).includes('OAUTH_REQUIRED');
  }

  private logSkippedProfileServer(
    server: { id: string; type: string },
    operation: string,
    phase: string,
    error: unknown
  ) {
    appLogger.warn(
      {
        event: 'mcp.profile.server.skipped',
        operation,
        phase,
        mcpServerId: server.id,
        serverType: server.type,
        oauthRequired: this.isOAuthRequiredError(error),
        error: this.getErrorMessage(error),
      },
      'Skipping unavailable MCP server during profile aggregation'
    );
  }

  private async getServerInstanceSafe(
    server: {
      id: string;
      type: string;
      config: unknown;
      apiKeyConfig: unknown;
    },
    operation: string
  ): Promise<McpServer | null> {
    try {
      return await this.getServerInstance(server);
    } catch (error) {
      this.logSkippedProfileServer(server, operation, 'initialize', error);
      return null;
    }
  }

  private async getServerToolsContext(
    server: {
      id: string;
      type: string;
      config: unknown;
      apiKeyConfig: unknown;
    },
    operation: string
  ): Promise<ServerToolsContext> {
    const instance = await this.getServerInstanceSafe(server, operation);

    if (!instance) {
      return {
        connected: false,
        instance: null,
        tools: [],
      };
    }

    try {
      return {
        connected: true,
        instance,
        tools: await instance.listTools(),
      };
    } catch (error) {
      this.logSkippedProfileServer(server, operation, 'listTools', error);
      return {
        connected: false,
        instance: null,
        tools: [],
      };
    }
  }

  private async getServerResources(
    server: {
      id: string;
      type: string;
      config: unknown;
      apiKeyConfig: unknown;
    },
    operation: string
  ): Promise<ListedResource[]> {
    const instance = await this.getServerInstanceSafe(server, operation);

    if (!instance) {
      return [];
    }

    try {
      return await instance.listResources();
    } catch (error) {
      this.logSkippedProfileServer(server, operation, 'listResources', error);
      return [];
    }
  }

  private async handleToolsList(
    requestId: string | number,
    profile: ResolvedProfile
  ): Promise<RequestExecutionResult> {
    const allTools: Array<{
      name: string;
      description: string;
      inputSchema: unknown;
    }> = [];

    const serverResults = await Promise.all(
      profile.mcpServers.map(async (profileServer) => ({
        profileServer,
        context: await this.getServerToolsContext(profileServer.mcpServer, 'tools/list'),
      }))
    );

    for (const { profileServer, context } of serverResults) {
      if (!context.connected) {
        continue;
      }

      for (const tool of context.tools) {
        // Server-level allowlist filter
        if (!this.isToolAllowedByServer(tool.name, profileServer.mcpServer.toolConfigs)) {
          continue;
        }

        // Profile-level customization filter
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

    return {
      response: {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          tools: allTools,
        },
      },
      event: 'mcp.tools.list.completed',
      status: 'success',
      toolCount: allTools.length,
      serverCount: profile.mcpServers.length,
    };
  }

  private async handleToolsCall(
    requestId: string | number,
    profile: ResolvedProfile,
    params: McpToolCall,
    logId: string | null
  ): Promise<RequestExecutionResult> {
    // Find which server has this tool
    for (const profileServer of profile.mcpServers) {
      const server = profileServer.mcpServer;
      const { connected, instance, tools } = await this.getServerToolsContext(server, 'tools/call');

      if (!connected || !instance) {
        continue;
      }

      // Check if this server has the requested tool (by name or custom name)
      const customization = profileServer.tools.find(
        (t) => t.customName === params.name || t.toolName === params.name
      );

      // Skip if tool is disabled at profile level
      if (customization && !customization.isEnabled) {
        continue;
      }

      // Skip if tool is disabled at server level (allowlist)
      const resolvedToolName = customization?.toolName || params.name;
      if (!this.isToolAllowedByServer(resolvedToolName, server.toolConfigs)) {
        continue;
      }

      const toolName = customization?.toolName || params.name;
      const toolDef = tools.find((t) => t.name === toolName);

      if (toolDef) {
        // Update log with the server that handled this tool call
        await this.updateDebugLog(logId, {
          mcpServerId: server.id,
        });

        // Coerce string arguments to expected types based on tool's input schema
        const coercedArgs = this.coerceToolArguments(params.arguments || {}, toolDef.inputSchema);

        const result = await instance.callTool(toolName, coercedArgs);

        return {
          response: {
            jsonrpc: '2.0',
            id: requestId,
            result,
          },
          event: 'mcp.tool.call.completed',
          status: 'success',
          mcpServerId: server.id,
          toolName,
        };
      }
    }

    return {
      response: {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32602,
          message: `Tool not found: ${params.name}`,
        },
      },
      event: 'mcp.tool.call.completed',
      status: 'error',
      toolName: params.name,
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
    const allResources: ListedResource[] = [];

    const resourceResults = await Promise.all(
      profile.mcpServers.map(async (profileServer) =>
        this.getServerResources(profileServer.mcpServer, 'resources/list')
      )
    );

    for (const resources of resourceResults) {
      allResources.push(...resources);
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
      const instance = await this.getServerInstanceSafe(server, 'resources/read');

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
   * Build the include shape used for profile tool aggregation.
   */
  private getProfileInfoInclude() {
    return {
      mcpServers: {
        where: { isActive: true },
        include: {
          mcpServer: {
            include: { toolConfigs: true },
          },
          tools: true,
        },
        orderBy: { order: 'asc' as const },
      },
    };
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
   * Find a profile by name within an organization for the authenticated user.
   * Public org-scoped MCP routes must resolve through the caller's profile identity,
   * because profile names are not unique across the whole organization.
   */
  private async findProfileByNameAndOrg(profileName: string, orgId: string, userId: string) {
    return this.prisma.profile.findUnique({
      where: {
        userId_organizationId_name: {
          userId,
          organizationId: orgId,
          name: profileName,
        },
      },
      include: this.getProfileInfoInclude(),
    });
  }

  /**
   * Find a profile by name, scoped to the user's organizations.
   */
  private async findProfileByName(profileName: string, userId: string) {
    // Look up user's memberships and search in their orgs
    const memberships = await this.prisma.member.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    if (orgIds.length === 0) return null;

    return this.prisma.profile.findFirst({
      where: { name: profileName, organizationId: { in: orgIds } },
      include: this.getProfileInfoInclude(),
    });
  }

  /**
   * Find a profile by ID for internal app lookups.
   */
  private async findProfileById(profileId: string) {
    return this.prisma.profile.findUnique({
      where: { id: profileId },
      include: this.getProfileInfoInclude(),
    });
  }

  /**
   * Resolve an org-scoped public profile for the authenticated user.
   */
  private async resolveOrgScopedProfile(profileName: string, orgSlug: string, userId: string) {
    const orgId = await this.resolveOrgBySlug(orgSlug);
    const profile = await this.findProfileByNameAndOrg(profileName, orgId, userId);

    if (!profile) {
      throw new NotFoundException(
        `Profile "${profileName}" not found in organization "${orgSlug}"`
      );
    }

    return profile;
  }

  /**
   * Handle MCP request using org slug to resolve the profile.
   */
  async handleRequestByOrgSlug(
    profileName: string,
    orgSlug: string,
    request: McpRequest,
    userId: string
  ): Promise<McpResponse> {
    const profile = await this.resolveOrgScopedProfile(profileName, orgSlug, userId);
    return this.executeRequest(profile as ResolvedProfile, request);
  }

  /**
   * Get profile info using org slug.
   */
  async getProfileInfoByOrgSlug(profileName: string, orgSlug: string, userId: string) {
    const profile = await this.resolveOrgScopedProfile(profileName, orgSlug, userId);
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
   * Get profile info with aggregated tools and server status by profile ID.
   */
  async getProfileInfoById(profileId: string) {
    const profile = await this.findProfileById(profileId);

    if (!profile) {
      throw new NotFoundException(`Profile ${profileId} not found`);
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
        toolConfigs?: Array<{ toolName: string; isEnabled: boolean }>;
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

    const results = await Promise.all(
      profile.mcpServers.map(async (ps) => ({
        ps,
        context: await this.getServerToolsContext(ps.mcpServer, 'profile/info'),
      }))
    );

    for (const { ps, context } of results) {
      serverStatus[ps.mcpServer.id] = {
        connected: context.connected,
        toolCount: context.tools.length,
      };

      if (!context.connected) {
        continue;
      }

      for (const tool of context.tools) {
        // Server-level allowlist filter
        if (!this.isToolAllowedByServer(tool.name, ps.mcpServer.toolConfigs)) {
          continue;
        }

        const customization = ps.tools.find((t) => t.toolName === tool.name);
        if (!customization || customization.isEnabled) {
          tools.push({
            name: customization?.customName || tool.name,
            description: customization?.customDescription || tool.description,
          });
        }
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

  /**
   * Coerce tool arguments from strings to their expected types based on the tool's input schema.
   * MCP clients (e.g. Claude) sometimes send numbers as strings and arrays as stringified JSON.
   */
  private coerceToolArguments(
    args: Record<string, unknown>,
    schema: unknown
  ): Record<string, unknown> {
    const jsonSchema = this.extractJsonSchemaProperties(schema);
    if (!jsonSchema) return args;

    const result = { ...args };
    for (const [key, propSchema] of Object.entries(jsonSchema)) {
      if (result[key] === undefined) continue;
      result[key] = this.coerceValue(result[key], propSchema as Record<string, unknown>);
    }
    return result;
  }

  /**
   * Extract JSON Schema properties from either a Zod schema or a plain JSON Schema object.
   */
  private extractJsonSchemaProperties(schema: unknown): Record<string, unknown> | null {
    if (!schema || typeof schema !== 'object') return null;

    const s = schema as Record<string, unknown>;

    // Plain JSON Schema with properties
    if (s.properties && typeof s.properties === 'object') {
      return s.properties as Record<string, unknown>;
    }

    // Zod schema — extract shape from _def
    if ('_def' in s) {
      return this.extractZodProperties(s);
    }

    return null;
  }

  /**
   * Extract property type info from a Zod schema's internal structure.
   */
  private extractZodProperties(schema: Record<string, unknown>): Record<string, unknown> | null {
    const def = schema._def as Record<string, unknown> | undefined;
    if (!def) return null;

    // ZodObject has shape() or _def.shape
    const shape =
      typeof (schema as Record<string, (...a: unknown[]) => unknown>).shape === 'function'
        ? (schema as Record<string, () => Record<string, unknown>>).shape()
        : (def.shape as Record<string, unknown> | undefined);

    if (!shape || typeof shape !== 'object') return null;

    const properties: Record<string, unknown> = {};
    for (const [key, zodField] of Object.entries(shape)) {
      properties[key] = this.zodFieldToJsonSchemaType(zodField);
    }
    return properties;
  }

  /**
   * Convert a Zod field to a simplified JSON Schema type descriptor.
   */
  private zodFieldToJsonSchemaType(field: unknown): Record<string, unknown> {
    if (!field || typeof field !== 'object') return {};

    let current = field as Record<string, unknown>;

    // Unwrap Zod 3/4 wrappers such as optional/default/effects.
    while (current._def && typeof current._def === 'object') {
      const def = current._def as Record<string, unknown>;
      const typeName = def.typeName as string | undefined;
      const type = def.type as string | undefined;

      if (
        typeName === 'ZodOptional' ||
        typeName === 'ZodNullable' ||
        typeName === 'ZodDefault' ||
        type === 'optional' ||
        type === 'nullable' ||
        type === 'default'
      ) {
        current = def.innerType as Record<string, unknown>;
        continue;
      }
      if (typeName === 'ZodEffects' || type === 'pipe' || type === 'transform') {
        current = (def.schema ?? def.innerType) as Record<string, unknown>;
        continue;
      }
      break;
    }

    const def = current._def as Record<string, unknown> | undefined;
    const typeName = def?.typeName as string | undefined;
    const type = def?.type as string | undefined;

    switch (typeName ?? type) {
      case 'ZodNumber':
      case 'number':
        return { type: 'number' };
      case 'ZodBoolean':
      case 'boolean':
        return { type: 'boolean' };
      case 'ZodArray':
      case 'array':
        return { type: 'array' };
      case 'ZodObject':
      case 'object':
        return { type: 'object' };
      case 'ZodEnum':
      case 'ZodString':
      case 'enum':
      case 'string':
        return { type: 'string' };
      default:
        return {};
    }
  }

  /**
   * Coerce a single value from string to its expected type based on JSON Schema.
   */
  private coerceValue(value: unknown, schema: Record<string, unknown>): unknown {
    if (typeof value !== 'string') return value;

    const type = schema.type as string | undefined;
    if (!type) return value;

    switch (type) {
      case 'number':
      case 'integer': {
        const num = Number(value);
        return Number.isNaN(num) ? value : num;
      }
      case 'boolean':
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
      case 'array':
      case 'object':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }
}
