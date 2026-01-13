/**
 * MCP Package types for auto-discoverable MCP server packages
 *
 * Each MCP package in mcp-servers/ must export an McpPackage object
 * with metadata, factory function, and optional seed configuration.
 */

import type { McpServer } from '../abstractions/McpServer.js';
import type { ApiKeyConfig } from './mcp.js';

/**
 * Metadata for MCP package
 */
export interface McpPackageMetadata {
  /** Unique identifier (e.g., 'gemini-deep-research') */
  id: string;

  /** Display name */
  name: string;

  /** Description of functionality */
  description: string;

  /** Version (semver) */
  version: string;

  /** Author */
  author?: string;

  /** License */
  license?: string;

  /** Requires API key? */
  requiresApiKey: boolean;

  /** Hint for obtaining API key */
  apiKeyHint?: string;

  /** Default API key configuration */
  apiKeyDefaults?: {
    headerName: string;
    headerValueTemplate: string; // 'Bearer {apiKey}' or '{apiKey}'
  };

  /** Requires OAuth? */
  requiresOAuth?: boolean;

  /** Default OAuth configuration */
  oauthDefaults?: {
    scopes: string[];
    authorizationServerUrl?: string;
  };

  /** Tags for categorization */
  tags?: string[];

  /** Icon (emoji or URL) */
  icon?: string;

  /** Documentation URL */
  docsUrl?: string;
}

/**
 * Seed configuration for MCP package
 */
export interface McpSeedConfig {
  /** Profile to add to (null = don't add) */
  defaultProfile?: string | null;

  /** Order in profile (lower = higher priority) */
  defaultOrder?: number;

  /** Active by default? */
  defaultActive?: boolean;

  /** Additional seed data */
  additionalData?: Record<string, unknown>;
}

/**
 * Factory function for creating MCP server instance
 */
export type McpServerFactory = (apiKeyConfig: ApiKeyConfig | null) => McpServer;

/**
 * Complete MCP package definition
 *
 * This must be exported by every package in mcp-servers/
 */
export interface McpPackage {
  /** Package metadata */
  metadata: McpPackageMetadata;

  /** Factory function */
  createServer: McpServerFactory;

  /** Seed configuration (optional) */
  seed?: McpSeedConfig;
}

/**
 * Result of discovering an MCP package
 */
export interface DiscoveredMcpPackage {
  /** npm package name */
  packageName: string;

  /** Path to package */
  packagePath: string;

  /** Loaded package */
  package: McpPackage;
}
