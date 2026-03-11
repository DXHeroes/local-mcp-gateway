/**
 * MCP (Model Context Protocol) types and interfaces
 */

import type { z } from 'zod';

/**
 * MCP server transport type
 */
export type McpTransport = 'http' | 'sse' | 'stdio';

/**
 * MCP server type
 */
export type McpServerType = 'external' | 'custom' | 'remote_http' | 'remote_sse' | 'builtin';

/**
 * JSON-RPC 2.0 request
 * Notifications don't have an id field (it's omitted, not null)
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null; // Optional - omitted for notifications
  method: string;
  params?: unknown;
}

/**
 * JSON-RPC 2.0 response
 */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * JSON Schema type for tool input schemas from MCP protocol
 */
export interface JsonSchema {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * MCP tool definition
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: z.ZodType | JsonSchema;
}

/**
 * MCP resource definition
 */
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP server configuration for external MCP (spawned process)
 */
export interface ExternalMcpConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;
  autoRestart?: boolean;
  maxRestartAttempts?: number;
  startupTimeout?: number;
  shutdownTimeout?: number;
}

/**
 * External process state
 */
export type ExternalProcessState =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'restarting'
  | 'crashed'
  | 'stopping';

/**
 * External process information
 */
export interface ExternalProcessInfo {
  state: ExternalProcessState;
  pid?: number;
  startedAt?: Date;
  restartCount: number;
  lastError?: string;
}

/**
 * MCP server configuration for custom MCP (TypeScript module)
 */
export interface CustomMcpConfig {
  modulePath: string;
}

/**
 * MCP server configuration for remote HTTP MCP
 */
export interface RemoteHttpMcpConfig {
  url: string;
  transport: 'http';
  headers?: Record<string, string>;
}

/**
 * MCP server configuration for remote SSE MCP
 */
export interface RemoteSseMcpConfig {
  url: string;
  transport: 'sse';
  headers?: Record<string, string>;
}

/**
 * MCP server configuration for builtin MCP
 */
export interface BuiltinMcpConfig {
  builtinId: string; // e.g., 'gemini-deep-research'
}

/**
 * Union type for all MCP server configurations
 */
export type McpServerConfig =
  | ExternalMcpConfig
  | CustomMcpConfig
  | RemoteHttpMcpConfig
  | RemoteSseMcpConfig
  | BuiltinMcpConfig;

/**
 * OAuth 2.1 configuration
 */
export interface OAuthConfig {
  authorizationServerUrl: string;
  tokenEndpoint?: string; // If not provided, will be derived from authorizationServerUrl
  resource?: string;
  scopes: string[];
  requiresOAuth: boolean;
  callbackUrl?: string;
  clientId?: string; // Client ID (from DCR or manual configuration)
  clientSecret?: string; // Client secret (for confidential clients)
}

/**
 * API key configuration
 */
export interface ApiKeyConfig {
  apiKey: string;
  headerName: 'Authorization' | 'X-API-Key' | string;
  headerValue: string; // Template: 'Bearer {apiKey}' or '{apiKey}'
}
