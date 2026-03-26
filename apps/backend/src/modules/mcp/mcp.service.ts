/**
 * MCP Service
 *
 * Business logic for MCP server management.
 * All queries are scoped to the individual user (per-user ownership).
 * Shared servers are visible via the SharingService.
 */

import {
  ExternalMcpServer,
  RemoteHttpMcpServer,
  RemoteSseMcpServer,
} from '@dxheroes/local-mcp-core';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MCP_SERVER_CHANGED } from '../proxy/proxy.service.js';

/** Sentinel value for unauthenticated MCP access */
const UNAUTHENTICATED_ID = '__unauthenticated__';

import { PrismaService } from '../database/prisma.service.js';
import { DebugService } from '../debug/debug.service.js';
import { SharingService } from '../sharing/sharing.service.js';
import type { CreateMcpServerDto } from './dto/create-mcp-server.dto.js';
import type { UpdateMcpServerDto } from './dto/update-mcp-server.dto.js';
import { MCP_PRESETS } from './mcp-presets.js';
import { McpRegistry } from './mcp-registry.js';

@Injectable()
export class McpService {
  private static readonly BATCH_CACHE_TTL = 30_000; // 30 seconds
  private batchStatusCache = new Map<
    string,
    {
      data: Record<
        string,
        {
          status: string;
          toolsCount?: number;
          enabledToolsCount?: number;
          error?: string;
          details?: string;
          validatedAt?: string;
          oauthRequired?: boolean;
        }
      >;
      timestamp: number;
    }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: McpRegistry,
    private readonly debugService: DebugService,
    private readonly sharingService: SharingService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  private invalidateBatchCache(userId: string, orgId?: string) {
    this.batchStatusCache.delete(`${userId}:${orgId ?? ''}`);
  }

  private isAnonymous(userId: string): boolean {
    return userId === UNAUTHENTICATED_ID;
  }

  /**
   * Get the user's organization IDs for sharing lookups
   */
  private async getUserOrgIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.member.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    return memberships.map((m) => m.organizationId);
  }

  /**
   * Assert the user can read this server (owner or shared with any permission)
   */
  private async assertAccess(serverId: string, userId: string): Promise<void> {
    if (this.isAnonymous(userId)) return;

    const server = await this.prisma.mcpServer.findUnique({
      where: { id: serverId },
      select: { userId: true },
    });
    if (!server) throw new NotFoundException(`MCP server ${serverId} not found`);

    // Owner — always allowed
    if (server.userId === userId) return;

    // Check sharing
    const orgIds = await this.getUserOrgIds(userId);
    const shared = await this.sharingService.isSharedWith('mcp_server', serverId, userId, orgIds);
    if (shared) return;

    throw new ForbiddenException('You do not have access to this MCP server');
  }

  /**
   * Assert the user can mutate this server (owner or shared with "admin" permission)
   */
  private async assertOwnership(serverId: string, userId: string): Promise<void> {
    if (this.isAnonymous(userId)) return;

    const server = await this.prisma.mcpServer.findUnique({
      where: { id: serverId },
      select: { userId: true },
    });
    if (!server) throw new NotFoundException(`MCP server ${serverId} not found`);

    // Owner — always allowed
    if (server.userId === userId) return;

    // Check for admin sharing permission
    const orgIds = await this.getUserOrgIds(userId);
    const permission = await this.sharingService.getPermission(
      'mcp_server',
      serverId,
      userId,
      orgIds
    );
    if (permission === 'admin') return;

    throw new ForbiddenException('You do not own this MCP server');
  }

  /**
   * Get all MCP servers owned by or shared with the user
   */
  async findAll(userId: string, orgId?: string) {
    const include = { profiles: { include: { profile: true as const } } };
    const orderBy = { name: 'asc' as const };

    if (this.isAnonymous(userId)) {
      // Unauthenticated users see nothing (no system servers anymore)
      return [];
    }

    // Get shared server IDs
    const orgIds = orgId ? [orgId] : await this.getUserOrgIds(userId);
    const sharedIds = await this.sharingService.getSharedResourceIds('mcp_server', userId, orgIds);

    // Own servers + shared servers
    const servers = await this.prisma.mcpServer.findMany({
      where: {
        OR: [{ userId }, ...(sharedIds.length > 0 ? [{ id: { in: sharedIds } }] : [])],
      },
      include,
      orderBy,
    });

    // Enrich with metadata from registry for builtin servers
    return servers.map((server) => {
      const builtinId = this.getBuiltinId(server.config);
      return builtinId && this.registry.has(builtinId)
        ? { ...server, metadata: this.registry.get(builtinId)?.metadata }
        : server;
    });
  }

  /**
   * Get a specific MCP server
   */
  async findById(id: string, userId?: string, _orgId?: string) {
    if (userId) {
      await this.assertAccess(id, userId);
    }

    const server = await this.prisma.mcpServer.findUnique({
      where: { id },
      include: {
        profiles: {
          include: {
            profile: true,
            tools: true,
          },
        },
        oauthToken: true,
        toolsCache: true,
      },
    });

    if (!server) {
      throw new NotFoundException(`MCP server ${id} not found`);
    }

    // Enrich with metadata from registry for builtin servers
    const builtinId = this.getBuiltinId(server.config);

    return builtinId && this.registry.has(builtinId)
      ? { ...server, metadata: this.registry.get(builtinId)?.metadata }
      : server;
  }

  /**
   * Create a new MCP server owned by the user
   */
  async create(dto: CreateMcpServerDto, userId: string, _orgId?: string) {
    if (this.isAnonymous(userId)) {
      throw new ForbiddenException('Authentication required to create MCP servers');
    }

    const result = await this.prisma.mcpServer.create({
      data: {
        name: dto.name,
        type: dto.type,
        config: JSON.stringify(dto.config || {}),
        apiKeyConfig: dto.apiKeyConfig ? JSON.stringify(dto.apiKeyConfig) : null,
        oauthConfig: dto.oauthConfig ? JSON.stringify(dto.oauthConfig) : null,
        userId,
      },
    });
    this.invalidateBatchCache(userId, _orgId);
    return result;
  }

  /**
   * Update an MCP server
   */
  async update(id: string, dto: UpdateMcpServerDto, userId: string, _orgId?: string) {
    await this.assertOwnership(id, userId);

    const server = await this.prisma.mcpServer.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException(`MCP server ${id} not found`);
    }

    const result = await this.prisma.mcpServer.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        config:
          dto.config !== undefined
            ? typeof dto.config === 'string'
              ? dto.config
              : JSON.stringify(dto.config)
            : undefined,
        apiKeyConfig: dto.apiKeyConfig !== undefined ? JSON.stringify(dto.apiKeyConfig) : undefined,
        oauthConfig: dto.oauthConfig !== undefined ? JSON.stringify(dto.oauthConfig) : undefined,
      },
    });
    this.invalidateBatchCache(userId, _orgId);
    this.eventEmitter.emit(MCP_SERVER_CHANGED, { serverId: id });
    return result;
  }

  /**
   * Delete an MCP server
   */
  async delete(id: string, userId: string, _orgId?: string) {
    await this.assertOwnership(id, userId);

    const server = await this.prisma.mcpServer.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException(`MCP server ${id} not found`);
    }

    await this.prisma.mcpServer.delete({ where: { id } });
    this.invalidateBatchCache(userId, _orgId);
    this.eventEmitter.emit(MCP_SERVER_CHANGED, { serverId: id });
  }

  /**
   * Get tools from an MCP server
   */
  async getTools(id: string, userId?: string, _orgId?: string) {
    if (userId) {
      await this.assertAccess(id, userId);
    }

    const startTime = Date.now();

    // Create debug log entry
    const log = await this.debugService.createLog({
      mcpServerId: id,
      requestType: 'tools/list',
      requestPayload: JSON.stringify({ method: 'tools/list', serverId: id }),
      status: 'pending',
    });

    try {
      const result = await this.getToolsInternal(id);

      // Update debug log with success
      await this.debugService.updateLog(log.id, {
        responsePayload: JSON.stringify(result),
        status: 'success',
        durationMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      // Update debug log with error
      await this.debugService.updateLog(log.id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Internal method to get tools from an MCP server
   */
  private async getToolsInternal(id: string) {
    const server = await this.findById(id);
    const builtinId = this.getBuiltinId(server.config);

    // For builtin servers, get tools from the registry
    if (builtinId && this.registry.has(builtinId)) {
      const pkg = this.registry.get(builtinId);
      if (pkg) {
        // Get API key config if set
        const apiKeyConfig = server.apiKeyConfig ? JSON.parse(server.apiKeyConfig as string) : null;

        // Create server instance and list tools
        const instance = pkg.createServer(apiKeyConfig);
        await instance.initialize();
        const tools = await instance.listTools();
        return { tools };
      }
    }

    // For remote_http servers, connect and fetch tools
    if (server.type === 'remote_http') {
      const config = this.parseConfig(server.config) as {
        url: string;
        headers?: Record<string, string>;
      };
      const apiKeyConfig = server.apiKeyConfig ? JSON.parse(server.apiKeyConfig as string) : null;

      const remoteServer = new RemoteHttpMcpServer(
        { url: config.url, transport: 'http', headers: config.headers },
        null,
        apiKeyConfig
      );
      await remoteServer.initialize();
      const tools = await remoteServer.listTools();
      return { tools };
    }

    // For remote_sse servers, connect and fetch tools
    if (server.type === 'remote_sse') {
      const config = this.parseConfig(server.config) as {
        url: string;
        headers?: Record<string, string>;
      };
      const apiKeyConfig = server.apiKeyConfig ? JSON.parse(server.apiKeyConfig as string) : null;

      const remoteServer = new RemoteSseMcpServer(
        { url: config.url, transport: 'sse', headers: config.headers },
        null,
        apiKeyConfig
      );
      await remoteServer.initialize();
      const tools = await remoteServer.listTools();
      return { tools };
    }

    // For external (NPX/stdio) servers, spawn and fetch tools
    if (server.type === 'external') {
      const config = this.parseConfig(server.config) as {
        command: string;
        args?: string[];
        env?: Record<string, string>;
        workingDirectory?: string;
        autoRestart?: boolean;
        maxRestartAttempts?: number;
        startupTimeout?: number;
        shutdownTimeout?: number;
      };

      const externalServer = new ExternalMcpServer(config);
      try {
        await externalServer.initialize();
        const tools = await externalServer.listTools();
        return { tools };
      } finally {
        // Shutdown after fetching tools
        await externalServer.shutdown();
      }
    }

    // For cached tools from external servers (fallback)
    const tools = await this.prisma.mcpServerToolsCache.findMany({
      where: { mcpServerId: id },
    });
    return { tools };
  }

  /**
   * Get MCP server status with real validation
   */
  async getStatus(id: string, userId?: string, _orgId?: string) {
    if (userId) {
      await this.assertAccess(id, userId);
    }

    const startTime = Date.now();

    // Create debug log entry
    const log = await this.debugService.createLog({
      mcpServerId: id,
      requestType: 'status/check',
      requestPayload: JSON.stringify({ method: 'status/check', serverId: id }),
      status: 'pending',
    });

    try {
      const result = await this.getStatusInternal(id);

      // Update debug log with success or error based on status
      await this.debugService.updateLog(log.id, {
        responsePayload: JSON.stringify(result),
        status: result.status === 'error' ? 'error' : 'success',
        errorMessage: result.error,
        durationMs: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      // Update debug log with error
      await this.debugService.updateLog(log.id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Internal method to get MCP server status with real validation
   */
  private async getStatusInternal(id: string) {
    const server = await this.findById(id);
    const builtinId = this.getBuiltinId(server.config);

    // Check if it's a builtin server
    const isBuiltin = builtinId && this.registry.has(builtinId);

    // Check API key config
    const hasApiKey = !!server.apiKeyConfig;

    // Check OAuth token
    const hasOAuth = !!server.oauthToken;

    // Get metadata
    const metadata = isBuiltin ? this.registry.get(builtinId)?.metadata : null;
    const requiresApiKey = metadata?.requiresApiKey ?? false;
    const requiresOAuth = metadata?.requiresOAuth ?? false;

    // Default status
    let status: 'connected' | 'error' | 'unknown' = 'unknown';
    let validationError: string | undefined;
    let validationDetails: string | undefined;
    let toolsCount: number | undefined;

    // For builtin servers with API key, actually validate
    if (isBuiltin && hasApiKey) {
      const pkg = this.registry.get(builtinId);
      if (pkg) {
        const apiKeyConfig = server.apiKeyConfig ? JSON.parse(server.apiKeyConfig as string) : null;

        try {
          const instance = pkg.createServer(apiKeyConfig);
          const validation = await instance.validate();
          status = validation.valid ? 'connected' : 'error';
          validationError = validation.error;
          if (validation.valid) {
            await instance.initialize();
            const tools = await instance.listTools();
            toolsCount = tools.length;
            validationDetails = `API key validated successfully. ${tools.length} tools available.`;
          } else {
            validationDetails = `Validation failed: ${validation.error}`;
          }
        } catch (error) {
          status = 'error';
          validationError = error instanceof Error ? error.message : 'Unknown error';
          validationDetails = `Connection test failed: ${validationError}`;
        }
      }
    } else if (!hasApiKey && requiresApiKey) {
      status = 'error';
      validationError = 'API key required';
      validationDetails = 'This server requires an API key to function';
    } else if (isBuiltin && !requiresApiKey) {
      status = 'connected';
      try {
        const pkg = this.registry.get(builtinId);
        if (pkg) {
          const instance = pkg.createServer(null);
          await instance.initialize();
          const tools = await instance.listTools();
          toolsCount = tools.length;
        }
      } catch {
        // Ignore — tools count will remain undefined
      }
      validationDetails = 'Server ready (no API key required)';
    }

    // For remote_http servers, validate by connecting
    let oauthRequired = false;
    if (server.type === 'remote_http' && status === 'unknown') {
      const config = this.parseConfig(server.config) as {
        url: string;
        headers?: Record<string, string>;
      };
      const apiKeyConfig = server.apiKeyConfig ? JSON.parse(server.apiKeyConfig as string) : null;

      // Get OAuth token if available, mapping Prisma types to core OAuthToken
      const oauthToken = server.oauthToken
        ? {
            id: server.oauthToken.id,
            mcpServerId: server.oauthToken.mcpServerId,
            accessToken: server.oauthToken.accessToken,
            tokenType: server.oauthToken.tokenType,
            refreshToken: server.oauthToken.refreshToken ?? undefined,
            scope: server.oauthToken.scope ?? undefined,
            expiresAt: server.oauthToken.expiresAt?.getTime(),
            createdAt: server.oauthToken.createdAt.getTime(),
            updatedAt: server.oauthToken.updatedAt.getTime(),
          }
        : null;

      try {
        const remoteServer = new RemoteHttpMcpServer(
          { url: config.url, transport: 'http', headers: config.headers },
          oauthToken,
          apiKeyConfig
        );
        await remoteServer.initialize();
        const tools = await remoteServer.listTools();
        status = 'connected';
        toolsCount = tools.length;
        validationDetails = `Connected successfully. ${tools.length} tools available.`;
      } catch (error) {
        status = 'error';
        validationError = error instanceof Error ? error.message : 'Unknown error';
        if (validationError.includes('OAUTH_REQUIRED')) {
          oauthRequired = true;
          validationDetails =
            'OAuth authentication required. Click "Login with OAuth" to authorize.';
        } else {
          validationDetails = `Connection failed: ${validationError}`;
        }
      }
    }

    // For remote_sse servers, validate by connecting
    if (server.type === 'remote_sse' && status === 'unknown') {
      const config = this.parseConfig(server.config) as {
        url: string;
        headers?: Record<string, string>;
      };
      const apiKeyConfig = server.apiKeyConfig ? JSON.parse(server.apiKeyConfig as string) : null;

      // Get OAuth token if available, mapping Prisma types to core OAuthToken
      const oauthToken = server.oauthToken
        ? {
            id: server.oauthToken.id,
            mcpServerId: server.oauthToken.mcpServerId,
            accessToken: server.oauthToken.accessToken,
            tokenType: server.oauthToken.tokenType,
            refreshToken: server.oauthToken.refreshToken ?? undefined,
            scope: server.oauthToken.scope ?? undefined,
            expiresAt: server.oauthToken.expiresAt?.getTime(),
            createdAt: server.oauthToken.createdAt.getTime(),
            updatedAt: server.oauthToken.updatedAt.getTime(),
          }
        : null;

      try {
        const remoteServer = new RemoteSseMcpServer(
          { url: config.url, transport: 'sse', headers: config.headers },
          oauthToken,
          apiKeyConfig
        );
        await remoteServer.initialize();
        const tools = await remoteServer.listTools();
        status = 'connected';
        toolsCount = tools.length;
        validationDetails = `Connected successfully (SSE). ${tools.length} tools available.`;
      } catch (error) {
        status = 'error';
        validationError = error instanceof Error ? error.message : 'Unknown error';
        if (validationError.includes('OAUTH_REQUIRED')) {
          oauthRequired = true;
          validationDetails =
            'OAuth authentication required. Click "Login with OAuth" to authorize.';
        } else {
          validationDetails = `Connection failed: ${validationError}`;
        }
      }
    }

    // For external (NPX/stdio) servers, validate by spawning and checking
    if (server.type === 'external' && status === 'unknown') {
      const config = this.parseConfig(server.config) as {
        command: string;
        args?: string[];
        env?: Record<string, string>;
        workingDirectory?: string;
      };

      if (!config.command) {
        status = 'error';
        validationError = 'Command is required for external MCP servers';
        validationDetails = 'Missing command configuration';
      } else {
        try {
          const externalServer = new ExternalMcpServer(config);
          await externalServer.initialize();
          const tools = await externalServer.listTools();
          status = 'connected';
          toolsCount = tools.length;
          validationDetails = `Connected successfully (stdio). ${tools.length} tools available.`;
          await externalServer.shutdown();
        } catch (error) {
          status = 'error';
          validationError = error instanceof Error ? error.message : 'Unknown error';
          validationDetails = `Connection failed: ${validationError}`;
        }
      }
    }

    const isReady = status === 'connected';

    // Get enabled tools count from server-level allowlist
    let enabledToolsCount = toolsCount;
    try {
      const toolConfigs = await this.prisma.mcpServerToolConfig.findMany({
        where: { mcpServerId: id },
        select: { isEnabled: true },
      });
      if (toolConfigs.length > 0) {
        enabledToolsCount = toolConfigs.filter((c) => c.isEnabled).length;
      }
    } catch {
      // Table may not exist yet
    }

    return {
      id: server.id,
      name: server.name,
      type: server.type,
      isBuiltin,
      hasApiKey,
      hasOAuth,
      requiresApiKey,
      requiresOAuth,
      oauthRequired,
      isReady,
      status,
      toolsCount,
      enabledToolsCount,
      error: validationError,
      details: validationDetails,
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get batch status for all MCP servers (parallel)
   */
  async getBatchStatus(userId: string, orgId?: string) {
    const cacheKey = `${userId}:${orgId ?? ''}`;
    const cached = this.batchStatusCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < McpService.BATCH_CACHE_TTL) {
      return cached.data;
    }

    const servers = await this.findAll(userId, orgId);

    // Pre-fetch tool configs for all servers in one query
    const serverIds = servers.map((s) => s.id);
    let allToolConfigs: Array<{ mcpServerId: string; isEnabled: boolean }> = [];
    try {
      allToolConfigs = await this.prisma.mcpServerToolConfig.findMany({
        where: { mcpServerId: { in: serverIds } },
        select: { mcpServerId: true, isEnabled: true },
      });
    } catch {
      // Table may not exist yet
    }

    const results = await Promise.allSettled(
      servers.map(async (server) => {
        const status = await this.getStatusInternal(server.id);
        return { serverId: server.id, ...status };
      })
    );

    const batchStatus: Record<
      string,
      {
        status: string;
        toolsCount?: number;
        enabledToolsCount?: number;
        error?: string;
        details?: string;
        validatedAt?: string;
        oauthRequired?: boolean;
      }
    > = {};

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { serverId, ...rest } = result.value;
        const serverConfigs = allToolConfigs.filter((c) => c.mcpServerId === serverId);
        const hasConfigs = serverConfigs.length > 0;
        batchStatus[serverId] = {
          status: rest.status,
          toolsCount: rest.toolsCount,
          enabledToolsCount: hasConfigs
            ? serverConfigs.filter((c) => c.isEnabled).length
            : rest.toolsCount,
          error: rest.error,
          details: rest.details,
          validatedAt: rest.validatedAt,
          oauthRequired: rest.oauthRequired,
        };
      } else {
        // For rejected promises, we don't have the server ID easily,
        // but Promise.allSettled preserves order
      }
    }

    // Handle rejected promises by mapping back using the original servers array
    servers.forEach((server, index) => {
      const result = results[index];
      if (result.status === 'rejected') {
        batchStatus[server.id] = {
          status: 'error',
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
          validatedAt: new Date().toISOString(),
        };
      }
    });

    this.batchStatusCache.set(cacheKey, { data: batchStatus, timestamp: Date.now() });
    return batchStatus;
  }

  /**
   * Get unified presets: hardcoded external presets + discovered builtin packages
   */
  getUnifiedPresets() {
    const externalPresets = MCP_PRESETS.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type as string,
      config: p.config,
      source: 'preset' as const,
      requiresApiKey: p.requiresApiKey,
      apiKeyDefaults: p.apiKeyDefaults,
      icon: p.icon,
      docsUrl: p.docsUrl,
    }));

    const builtinPresets = this.registry.getAllMetadata().map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      type: 'builtin' as const,
      config: { builtinId: m.id },
      source: 'builtin' as const,
      requiresApiKey: m.requiresApiKey,
      icon: m.icon,
      docsUrl: m.docsUrl,
    }));

    return [...builtinPresets, ...externalPresets];
  }

  /**
   * Add a preset MCP server to the user's servers
   * Allows duplicate presets with different names/API keys.
   */
  async addPreset(
    presetId: string,
    userId: string,
    _orgId?: string,
    options?: {
      name?: string;
      apiKeyConfig?: { apiKey: string; headerName?: string; headerValueTemplate?: string };
    }
  ) {
    if (this.isAnonymous(userId)) {
      throw new ForbiddenException('Authentication required to add presets');
    }

    const preset = this.getUnifiedPresets().find((p) => p.id === presetId);
    if (!preset) {
      throw new NotFoundException(`Preset "${presetId}" not found`);
    }

    const created = await this.prisma.mcpServer.create({
      data: {
        name: options?.name || preset.name,
        type: preset.type,
        config: JSON.stringify(preset.config),
        apiKeyConfig: options?.apiKeyConfig ? JSON.stringify(options.apiKeyConfig) : null,
        userId,
        presetId,
      },
    });
    this.invalidateBatchCache(userId, _orgId);

    // Enrich with metadata from registry for builtin servers
    const builtinId = this.getBuiltinId(created.config);
    const metadata = builtinId ? this.registry.get(builtinId)?.metadata : undefined;

    return { ...created, metadata };
  }

  /**
   * Get server-level tool configurations (allowlist)
   * Tools without a config record are treated as disabled (new tools default off).
   */
  async getServerToolConfigs(serverId: string, userId: string, _orgId?: string) {
    await this.assertAccess(serverId, userId);

    // Fetch live tools from the server
    const { tools: liveTools } = await this.getToolsInternal(serverId);

    // Fetch existing configs (graceful fallback if table doesn't exist yet)
    let configs: Array<{ toolName: string; isEnabled: boolean }> = [];
    try {
      configs = await this.prisma.mcpServerToolConfig.findMany({
        where: { mcpServerId: serverId },
      });
    } catch {
      // Table may not exist yet — treat as unconfigured
    }

    const hasConfigs = configs.length > 0;

    // Normalize tools (getToolsInternal may return different shapes)
    const normalizedTools = liveTools.map((tool) => ({
      name:
        'name' in tool ? (tool as { name: string }).name : (tool as { toolName: string }).toolName,
      description: (tool as { description?: string }).description ?? undefined,
      inputSchema: (tool as { inputSchema?: unknown }).inputSchema ?? undefined,
    }));

    // Merge: live tools + config records
    const tools = normalizedTools.map((tool) => {
      const config = configs.find((c) => c.toolName === tool.name);
      return {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        // If no configs exist at all, treat all tools as enabled (unconfigured server)
        // If configs exist, tools without a record are disabled (new tools default off)
        isEnabled: hasConfigs ? (config?.isEnabled ?? false) : true,
        hasConfig: !!config,
      };
    });

    return { tools, hasConfigs };
  }

  /**
   * Update server-level tool configurations (allowlist)
   * Creates records for ALL tools — enabled and disabled.
   */
  async updateServerToolConfigs(
    serverId: string,
    tools: Array<{ toolName: string; isEnabled: boolean }>,
    userId: string,
    _orgId?: string
  ) {
    await this.assertOwnership(serverId, userId);

    await this.prisma.$transaction(async (tx) => {
      // Delete all existing configs
      await tx.mcpServerToolConfig.deleteMany({
        where: { mcpServerId: serverId },
      });

      // Create records for all tools
      if (tools.length > 0) {
        await tx.mcpServerToolConfig.createMany({
          data: tools.map((tool) => ({
            mcpServerId: serverId,
            toolName: tool.toolName,
            isEnabled: tool.isEnabled,
          })),
        });
      }
    });

    return this.getServerToolConfigs(serverId, userId, _orgId);
  }

  /**
   * Extract builtinId from config (handles JSON string parsing)
   */
  private getBuiltinId(config: unknown): string | null {
    const parsed = this.parseConfig(config);
    const builtinId = parsed?.builtinId;

    if (typeof builtinId === 'string') {
      return builtinId;
    }
    return null;
  }

  private parseConfig(config: unknown): Record<string, unknown> | null {
    if (typeof config === 'string') {
      try {
        return JSON.parse(config);
      } catch {
        return null;
      }
    }
    return config as Record<string, unknown> | null;
  }
}
