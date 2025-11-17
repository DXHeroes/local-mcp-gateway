/**
 * Profile and MCP server configuration types
 */

import type { ApiKeyConfig, McpServerConfig, McpServerType, OAuthConfig } from './mcp.js';

/**
 * Profile entity
 */
export interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * MCP server entity (database representation)
 */
export interface McpServerEntity {
  id: string;
  name: string;
  type: McpServerType;
  config: McpServerConfig;
  oauthConfig?: OAuthConfig;
  apiKeyConfig?: ApiKeyConfig;
  createdAt: number;
  updatedAt: number;
}

/**
 * @deprecated Use McpServerEntity instead to avoid conflict with McpServer class
 */
export type McpServer = McpServerEntity;

/**
 * Profile-MCP server relationship
 */
export interface ProfileMcpServer {
  profileId: string;
  mcpServerId: string;
  order: number; // Order in which MCP servers are queried
}

/**
 * Profile with MCP servers
 */
export interface ProfileWithMcpServers extends Profile {
  mcpServers: McpServerEntity[];
}
