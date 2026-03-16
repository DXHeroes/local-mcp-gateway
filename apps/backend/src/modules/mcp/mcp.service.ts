/**
 * MCP Service
 *
 * Business logic for MCP server management.
 * All queries are scoped to the user's active organization.
 * System records (organizationId=null, including builtin) are visible to all.
 */

import {
  ExternalMcpServer,
  RemoteHttpMcpServer,
  RemoteSseMcpServer,
} from '@dxheroes/local-mcp-core';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

/** Sentinel value for unauthenticated MCP access — can only see system servers */
const UNAUTHENTICATED_ID = '__unauthenticated__';

import { PrismaService } from '../database/prisma.service.js';
import { DebugService } from '../debug/debug.service.js';
import type { CreateMcpServerDto } from './dto/create-mcp-server.dto.js';
import type { UpdateMcpServerDto } from './dto/update-mcp-server.dto.js';
import { MCP_PRESETS } from './mcp-presets.js';
import { McpRegistry } from './mcp-registry.js';

@Injectable()
export class McpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: McpRegistry,
    private readonly debugService: DebugService
  ) {}

  private isAnonymous(userId: string): boolean {
    return userId === UNAUTHENTICATED_ID;
  }

  private async assertAccess(serverId: string, userId: string, orgId?: string): Promise<void> {
    if (this.isAnonymous(userId)) return;

    const server = await this.prisma.mcpServer.findUnique({
      where: { id: serverId },
      select: { userId: true, organizationId: true },
    });
    if (!server) throw new NotFoundException(`MCP server ${serverId} not found`);

    // System record (no org) — accessible to all
    if (!server.organizationId) return;

    // Must belong to the active org
    if (orgId && server.organizationId === orgId) return;

    throw new ForbiddenException('You do not have access to this MCP server');
  }

  private async assertOwnership(serverId: string, userId: string, orgId?: string): Promise<void> {
    if (this.isAnonymous(userId)) return;

    const server = await this.prisma.mcpServer.findUnique({
      where: { id: serverId },
      select: { userId: true, organizationId: true },
    });
    if (!server) throw new NotFoundException(`MCP server ${serverId} not found`);
    if (!server.organizationId) return; // system record

    if (orgId && server.organizationId === orgId) return;

    throw new ForbiddenException('You do not own this MCP server');
  }

  /**
   * Get all MCP servers visible in the active org (org servers + system servers)
   */
  async findAll(userId: string, orgId?: string) {
    const include = { profiles: { include: { profile: true as const } } };
    const orderBy = { name: 'asc' as const };

    const servers = this.isAnonymous(userId)
      ? await this.prisma.mcpServer.findMany({ include, orderBy })
      : await this.prisma.mcpServer.findMany({
          where: {
            OR: [
              { organizationId: orgId }, // org servers
              { organizationId: null }, // system servers
            ],
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
  async findById(id: string, userId?: string, orgId?: string) {
    if (userId) {
      await this.assertAccess(id, userId, orgId);
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
   * Create a new MCP server in the active org
   */
  async create(dto: CreateMcpServerDto, userId: string, orgId?: string) {
    return this.prisma.mcpServer.create({
      data: {
        name: dto.name,
        type: dto.type,
        config: JSON.stringify(dto.config || {}),
        apiKeyConfig: dto.apiKeyConfig ? JSON.stringify(dto.apiKeyConfig) : null,
        oauthConfig: dto.oauthConfig ? JSON.stringify(dto.oauthConfig) : null,
        userId: this.isAnonymous(userId) ? null : userId,
        organizationId: orgId ?? null,
      },
    });
  }

  /**
   * Update an MCP server
   */
  async update(id: string, dto: UpdateMcpServerDto, userId: string, orgId?: string) {
    await this.assertOwnership(id, userId, orgId);

    const server = await this.prisma.mcpServer.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException(`MCP server ${id} not found`);
    }

    return this.prisma.mcpServer.update({
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
  }

  /**
   * Delete an MCP server
   */
  async delete(id: string, userId: string, orgId?: string) {
    await this.assertOwnership(id, userId, orgId);

    const server = await this.prisma.mcpServer.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException(`MCP server ${id} not found`);
    }

    await this.prisma.mcpServer.delete({ where: { id } });
  }

  /**
   * Get tools from an MCP server
   */
  async getTools(id: string, userId?: string, orgId?: string) {
    if (userId) {
      await this.assertAccess(id, userId, orgId);
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
      const config = this.parseConfig(server.config) as { url: string; headers?: Record<string, string> };
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
      const config = this.parseConfig(server.config) as { url: string; headers?: Record<string, string> };
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
  async getStatus(id: string, userId?: string, orgId?: string) {
    if (userId) {
      await this.assertAccess(id, userId, orgId);
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
      const config = this.parseConfig(server.config) as { url: string; headers?: Record<string, string> };
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
          validationDetails = 'OAuth authentication required. Click "Login with OAuth" to authorize.';
        } else {
          validationDetails = `Connection failed: ${validationError}`;
        }
      }
    }

    // For remote_sse servers, validate by connecting
    if (server.type === 'remote_sse' && status === 'unknown') {
      const config = this.parseConfig(server.config) as { url: string; headers?: Record<string, string> };
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
          validationDetails = 'OAuth authentication required. Click "Login with OAuth" to authorize.';
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
      error: validationError,
      details: validationDetails,
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get batch status for all MCP servers (parallel)
   */
  async getBatchStatus(userId: string, orgId?: string) {
    const servers = await this.findAll(userId, orgId);

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
        error?: string;
        details?: string;
        validatedAt?: string;
        oauthRequired?: boolean;
      }
    > = {};

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { serverId, ...rest } = result.value;
        batchStatus[serverId] = {
          status: rest.status,
          toolsCount: rest.toolsCount,
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

    return batchStatus;
  }

  /**
   * Add a preset MCP server to the user's organization
   */
  async addPreset(presetId: string, userId: string, orgId: string) {
    const preset = MCP_PRESETS.find((p) => p.id === presetId);
    if (!preset) {
      throw new NotFoundException(`Preset "${presetId}" not found`);
    }

    // Check if a server with this name already exists in the org
    const existing = await this.prisma.mcpServer.findFirst({
      where: {
        name: preset.name,
        organizationId: orgId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `MCP server "${preset.name}" already exists in your organization`
      );
    }

    return this.prisma.mcpServer.create({
      data: {
        name: preset.name,
        type: preset.type,
        config: JSON.stringify(preset.config),
        userId,
        organizationId: orgId,
      },
    });
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
