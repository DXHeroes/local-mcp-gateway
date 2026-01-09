/**
 * MCP Service
 *
 * Business logic for MCP server management.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { RemoteHttpMcpServer, RemoteSseMcpServer } from '@dxheroes/local-mcp-core';
import { PrismaService } from '../database/prisma.service.js';
import { McpRegistry } from './mcp-registry.js';
import type { CreateMcpServerDto } from './dto/create-mcp-server.dto.js';
import type { UpdateMcpServerDto } from './dto/update-mcp-server.dto.js';

@Injectable()
export class McpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: McpRegistry
  ) {}

  /**
   * Get all MCP servers
   */
  async findAll() {
    const servers = await this.prisma.mcpServer.findMany({
      include: {
        profiles: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Enrich with metadata from registry for builtin servers
    return servers.map((server) => {
      const builtinId = this.getBuiltinId(server.config);

      if (builtinId && this.registry.has(builtinId)) {
        const metadata = this.registry.get(builtinId)?.metadata;
        return {
          ...server,
          metadata,
        };
      }

      return server;
    });
  }

  /**
   * Get a specific MCP server
   */
  async findById(id: string) {
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

    if (builtinId && this.registry.has(builtinId)) {
      const metadata = this.registry.get(builtinId)?.metadata;
      return {
        ...server,
        metadata,
      };
    }

    return server;
  }

  /**
   * Create a new MCP server
   */
  async create(dto: CreateMcpServerDto) {
    return this.prisma.mcpServer.create({
      data: {
        name: dto.name,
        type: dto.type,
        config: JSON.stringify(dto.config || {}),
        apiKeyConfig: dto.apiKeyConfig ? JSON.stringify(dto.apiKeyConfig) : null,
        oauthConfig: dto.oauthConfig ? JSON.stringify(dto.oauthConfig) : null,
      },
    });
  }

  /**
   * Update an MCP server
   */
  async update(id: string, dto: UpdateMcpServerDto) {
    const server = await this.prisma.mcpServer.findUnique({ where: { id } });

    if (!server) {
      throw new NotFoundException(`MCP server ${id} not found`);
    }

    return this.prisma.mcpServer.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        config: dto.config !== undefined
          ? (typeof dto.config === 'string' ? dto.config : JSON.stringify(dto.config))
          : undefined,
        apiKeyConfig: dto.apiKeyConfig !== undefined ? JSON.stringify(dto.apiKeyConfig) : undefined,
        oauthConfig: dto.oauthConfig !== undefined ? JSON.stringify(dto.oauthConfig) : undefined,
      },
    });
  }

  /**
   * Delete an MCP server
   */
  async delete(id: string) {
    const server = await this.prisma.mcpServer.findUnique({ where: { id } });

    if (!server) {
      throw new NotFoundException(`MCP server ${id} not found`);
    }

    await this.prisma.mcpServer.delete({ where: { id } });
  }

  /**
   * Get tools from an MCP server
   */
  async getTools(id: string) {
    const server = await this.findById(id);
    const builtinId = this.getBuiltinId(server.config);

    // For builtin servers, get tools from the registry
    if (builtinId && this.registry.has(builtinId)) {
      const pkg = this.registry.get(builtinId);
      if (pkg) {
        // Get API key config if set
        const apiKeyConfig = server.apiKeyConfig
          ? JSON.parse(server.apiKeyConfig as string)
          : null;

        // Create server instance and list tools
        const instance = pkg.createServer(apiKeyConfig);
        await instance.initialize();
        const tools = await instance.listTools();
        return { tools };
      }
    }

    // For remote_http servers, connect and fetch tools
    if (server.type === 'remote_http') {
      const config = this.parseConfig(server.config) as { url: string };
      const apiKeyConfig = server.apiKeyConfig
        ? JSON.parse(server.apiKeyConfig as string)
        : null;

      const remoteServer = new RemoteHttpMcpServer(
        { url: config.url, transport: 'http' },
        null,
        apiKeyConfig
      );
      await remoteServer.initialize();
      const tools = await remoteServer.listTools();
      return { tools };
    }

    // For remote_sse servers, connect and fetch tools
    if (server.type === 'remote_sse') {
      const config = this.parseConfig(server.config) as { url: string };
      const apiKeyConfig = server.apiKeyConfig
        ? JSON.parse(server.apiKeyConfig as string)
        : null;

      const remoteServer = new RemoteSseMcpServer(
        { url: config.url, transport: 'sse' },
        null,
        apiKeyConfig
      );
      await remoteServer.initialize();
      const tools = await remoteServer.listTools();
      return { tools };
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
  async getStatus(id: string) {
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

    // For builtin servers with API key, actually validate
    if (isBuiltin && hasApiKey) {
      const pkg = this.registry.get(builtinId);
      if (pkg) {
        const apiKeyConfig = server.apiKeyConfig
          ? JSON.parse(server.apiKeyConfig as string)
          : null;

        try {
          const instance = pkg.createServer(apiKeyConfig);
          // Call validate() method
          const validation = await instance.validate();
          status = validation.valid ? 'connected' : 'error';
          validationError = validation.error;
          validationDetails = validation.valid
            ? 'API key validated successfully'
            : `Validation failed: ${validation.error}`;
          console.log(`[McpService] Validation result for ${server.name}:`, validation);
        } catch (error) {
          status = 'error';
          validationError = error instanceof Error ? error.message : 'Unknown error';
          validationDetails = `Connection test failed: ${validationError}`;
          console.error(`[McpService] Validation error for ${server.name}:`, error);
        }
      }
    } else if (!hasApiKey && requiresApiKey) {
      status = 'error';
      validationError = 'API key required';
      validationDetails = 'This server requires an API key to function';
    } else if (isBuiltin && !requiresApiKey) {
      status = 'connected';
      validationDetails = 'Server ready (no API key required)';
    }

    // For remote_http servers, validate by connecting
    if (server.type === 'remote_http' && status === 'unknown') {
      const config = this.parseConfig(server.config) as { url: string };
      const apiKeyConfig = server.apiKeyConfig
        ? JSON.parse(server.apiKeyConfig as string)
        : null;

      try {
        const remoteServer = new RemoteHttpMcpServer(
          { url: config.url, transport: 'http' },
          null,
          apiKeyConfig
        );
        await remoteServer.initialize();
        const tools = await remoteServer.listTools();
        status = 'connected';
        validationDetails = `Connected successfully. ${tools.length} tools available.`;
        console.log(`[McpService] Remote HTTP validation for ${server.name}: ${tools.length} tools`);
      } catch (error) {
        status = 'error';
        validationError = error instanceof Error ? error.message : 'Unknown error';
        validationDetails = `Connection failed: ${validationError}`;
        console.error(`[McpService] Remote HTTP validation error for ${server.name}:`, error);
      }
    }

    // For remote_sse servers, validate by connecting
    if (server.type === 'remote_sse' && status === 'unknown') {
      const config = this.parseConfig(server.config) as { url: string };
      const apiKeyConfig = server.apiKeyConfig
        ? JSON.parse(server.apiKeyConfig as string)
        : null;

      try {
        const remoteServer = new RemoteSseMcpServer(
          { url: config.url, transport: 'sse' },
          null,
          apiKeyConfig
        );
        await remoteServer.initialize();
        const tools = await remoteServer.listTools();
        status = 'connected';
        validationDetails = `Connected successfully (SSE). ${tools.length} tools available.`;
        console.log(`[McpService] Remote SSE validation for ${server.name}: ${tools.length} tools`);
      } catch (error) {
        status = 'error';
        validationError = error instanceof Error ? error.message : 'Unknown error';
        validationDetails = `Connection failed: ${validationError}`;
        console.error(`[McpService] Remote SSE validation error for ${server.name}:`, error);
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
      isReady,
      status,
      error: validationError,
      details: validationDetails,
      validatedAt: new Date().toISOString(),
    };
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
