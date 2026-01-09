/**
 * MCP Server Factory
 *
 * Creates MCP server instances based on configuration.
 *
 * NOTE: In the new architecture, builtin MCP servers are handled by the
 * NestJS backend's McpRegistry via auto-discovery from mcp-servers/ packages.
 * This factory is primarily used for remote HTTP/SSE servers.
 */

import type { OAuthToken } from '../types/database.js';
import type {
  ApiKeyConfig,
  RemoteHttpMcpConfig,
  RemoteSseMcpConfig,
} from '../types/mcp.js';
import type { McpServerEntity } from '../types/profile.js';
import type { McpServer } from './McpServer.js';
import { RemoteHttpMcpServer } from './RemoteHttpMcpServer.js';
import { RemoteSseMcpServer } from './RemoteSseMcpServer.js';

/**
 * Factory for creating MCP server instances
 */
export class McpServerFactory {
  /**
   * Create MCP server instance from entity
   * @param entity - MCP server entity from database
   * @param oauthToken - OAuth token (optional)
   * @param apiKeyConfig - API key config (optional)
   * @returns MCP server instance
   */
  static create(
    entity: McpServerEntity,
    oauthToken: OAuthToken | null = null,
    apiKeyConfig: ApiKeyConfig | null = null
  ): McpServer {
    switch (entity.type) {
      case 'remote_http': {
        const config = entity.config as RemoteHttpMcpConfig;
        return new RemoteHttpMcpServer(config, oauthToken, apiKeyConfig);
      }
      case 'remote_sse': {
        const config = entity.config as RemoteSseMcpConfig;
        return new RemoteSseMcpServer(config, oauthToken, apiKeyConfig);
      }
      case 'builtin': {
        // Builtin MCP servers are now handled by the NestJS backend's McpRegistry
        // They are auto-discovered from packages in mcp-servers/ folder
        throw new Error(
          'Builtin MCP servers are handled by the backend McpRegistry. ' +
            'Use the backend ProxyService to interact with builtin servers.'
        );
      }
      case 'custom': {
        // Custom MCP servers are now packages in mcp-servers/ folder
        throw new Error(
          'Custom MCP servers should be created as packages in mcp-servers/ folder. ' +
            'They will be auto-discovered by the backend.'
        );
      }
      case 'external': {
        // External MCP (spawned process) will be implemented later
        throw new Error('External MCP server loading not yet implemented');
      }
      default:
        throw new Error(`Unknown MCP server type: ${entity.type}`);
    }
  }

  /**
   * Create multiple MCP server instances from entities
   * @param entities - Array of MCP server entities
   * @param oauthTokens - Map of MCP server ID to OAuth token
   * @param apiKeyConfigs - Map of MCP server ID to API key config
   * @returns Map of server ID to MCP server instance
   */
  static createMultiple(
    entities: McpServerEntity[],
    oauthTokens: Map<string, OAuthToken> = new Map(),
    apiKeyConfigs: Map<string, ApiKeyConfig> = new Map()
  ): Map<string, McpServer> {
    const servers = new Map<string, McpServer>();

    for (const entity of entities) {
      const oauthToken = oauthTokens.get(entity.id) || null;
      const apiKeyConfig = apiKeyConfigs.get(entity.id) || null;

      try {
        const server = McpServerFactory.create(entity, oauthToken, apiKeyConfig);
        servers.set(entity.id, server);
      } catch (error) {
        console.error(`Failed to create MCP server ${entity.id}:`, error);
        // Continue with other servers
      }
    }

    return servers;
  }

  /**
   * Create MCP server instance asynchronously
   * @param entity - MCP server entity from database
   * @param oauthToken - OAuth token (optional)
   * @param apiKeyConfig - API key config (optional)
   * @returns MCP server instance
   */
  static async createAsync(
    entity: McpServerEntity,
    oauthToken: OAuthToken | null = null,
    apiKeyConfig: ApiKeyConfig | null = null
  ): Promise<McpServer> {
    // For remote servers, the async version just wraps the sync version
    // Builtin and custom servers are handled by the backend
    return McpServerFactory.create(entity, oauthToken, apiKeyConfig);
  }

  /**
   * Create multiple MCP server instances asynchronously
   * @param entities - Array of MCP server entities
   * @param oauthTokens - Map of MCP server ID to OAuth token
   * @param apiKeyConfigs - Map of MCP server ID to API key config
   * @returns Map of server ID to MCP server instance
   */
  static async createMultipleAsync(
    entities: McpServerEntity[],
    oauthTokens: Map<string, OAuthToken> = new Map(),
    apiKeyConfigs: Map<string, ApiKeyConfig> = new Map()
  ): Promise<Map<string, McpServer>> {
    return McpServerFactory.createMultiple(entities, oauthTokens, apiKeyConfigs);
  }
}
