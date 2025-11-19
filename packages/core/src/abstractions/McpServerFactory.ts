/**
 * MCP Server Factory
 *
 * Creates MCP server instances based on configuration
 */

import type { OAuthToken } from '../types/database.js';
import type { ApiKeyConfig, RemoteHttpMcpConfig, RemoteSseMcpConfig } from '../types/mcp.js';
import type { McpServerEntity } from '../types/profile.js';
import type { McpServer } from './McpServer.js';
import { RemoteHttpMcpServer } from './RemoteHttpMcpServer.js';
import { RemoteSseMcpServer } from './RemoteSseMcpServer.js';

// Dynamic import for custom MCP loader (to avoid circular dependencies)
// Using string literal to prevent TypeScript from analyzing the module at compile time
let loadCustomMcpModule: ((modulePath: string) => Promise<McpServer>) | null = null;

async function getCustomMcpLoader(): Promise<(modulePath: string) => Promise<McpServer>> {
  if (!loadCustomMcpModule) {
    // Use dynamic import with string literal to prevent TypeScript from analyzing at compile time
    // This is a runtime import, so TypeScript should not analyze the module
    const loaderModuleName = '@dxheroes/local-mcp-custom-mcp-loader';
    const loaderModule = await import(loaderModuleName);
    loadCustomMcpModule = loaderModule.loadCustomMcpModule as (
      modulePath: string
    ) => Promise<McpServer>;
  }
  return loadCustomMcpModule;
}

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
      case 'custom': {
        // Custom MCP loader - config should contain modulePath
        const config = entity.config as { modulePath: string };
        if (!config.modulePath) {
          throw new Error('Custom MCP server config must contain modulePath');
        }
        // Note: This is async but we're in a sync context
        // In practice, custom MCP servers should be loaded asynchronously
        // For now, we'll throw an error indicating async loading is needed
        throw new Error(
          'Custom MCP server loading requires async initialization. ' +
            'Use McpServerFactory.createAsync() for custom servers.'
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
   * Create MCP server instance asynchronously (required for custom servers)
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
    switch (entity.type) {
      case 'remote_http': {
        const config = entity.config as RemoteHttpMcpConfig;
        return new RemoteHttpMcpServer(config, oauthToken, apiKeyConfig);
      }
      case 'remote_sse': {
        const config = entity.config as RemoteSseMcpConfig;
        return new RemoteSseMcpServer(config, oauthToken, apiKeyConfig);
      }
      case 'custom': {
        // Custom MCP loader - config should contain modulePath
        const config = entity.config as { modulePath: string };
        if (!config.modulePath) {
          throw new Error('Custom MCP server config must contain modulePath');
        }
        const loader = await getCustomMcpLoader();
        return await loader(config.modulePath);
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
   * Create multiple MCP server instances asynchronously (required for custom servers)
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
    const servers = new Map<string, McpServer>();

    for (const entity of entities) {
      const oauthToken = oauthTokens.get(entity.id) || null;
      const apiKeyConfig = apiKeyConfigs.get(entity.id) || null;

      try {
        const server = await McpServerFactory.createAsync(entity, oauthToken, apiKeyConfig);
        servers.set(entity.id, server);
      } catch (error) {
        console.error(`Failed to create MCP server ${entity.id}:`, error);
        // Continue with other servers
      }
    }

    return servers;
  }
}
