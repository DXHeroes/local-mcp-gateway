/**
 * API Key Manager
 *
 * Manages API keys for MCP servers with secure storage and header injection
 */

import type { ApiKeyConfig } from '../types/mcp.js';

/**
 * API key repository interface
 * Implemented by database layer
 */
export interface ApiKeyRepository {
  store(mcpServerId: string, config: ApiKeyConfig): Promise<void>;
  get(mcpServerId: string): Promise<ApiKeyConfig | null>;
  delete(mcpServerId: string): Promise<void>;
}

/**
 * API Key Manager
 *
 * Provides secure API key management with header injection support
 */
export class ApiKeyManager {
  constructor(private repository: ApiKeyRepository) {}

  /**
   * Store API key for an MCP server
   * @param mcpServerId - MCP server ID
   * @param config - API key configuration
   */
  async store(mcpServerId: string, config: ApiKeyConfig): Promise<void> {
    // Validate API key is not empty
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    // Validate header name
    if (!config.headerName || config.headerName.trim().length === 0) {
      throw new Error('Header name cannot be empty');
    }

    // Store API key (should be encrypted in repository)
    await this.repository.store(mcpServerId, config);
  }

  /**
   * Get API key configuration for an MCP server
   * @param mcpServerId - MCP server ID
   * @returns API key configuration or null if not found
   */
  async get(mcpServerId: string): Promise<ApiKeyConfig | null> {
    return await this.repository.get(mcpServerId);
  }

  /**
   * Delete API key for an MCP server
   * @param mcpServerId - MCP server ID
   */
  async delete(mcpServerId: string): Promise<void> {
    await this.repository.delete(mcpServerId);
  }

  /**
   * Generate header value from template
   * Replaces {apiKey} placeholder with actual API key
   * @param template - Header value template (e.g., "Bearer {apiKey}" or "{apiKey}")
   * @param apiKey - API key value
   * @returns Formatted header value
   */
  formatHeaderValue(template: string, apiKey: string): string {
    return template.replace(/{apiKey}/g, apiKey);
  }

  /**
   * Inject API key into headers
   * @param mcpServerId - MCP server ID
   * @param headers - Existing headers object
   * @returns Headers with API key injected
   */
  async injectHeaders(
    mcpServerId: string,
    headers: Record<string, string>
  ): Promise<Record<string, string>> {
    const config = await this.get(mcpServerId);
    if (!config) {
      return headers;
    }

    const headerValue = this.formatHeaderValue(config.headerValue, config.apiKey);
    return {
      ...headers,
      [config.headerName]: headerValue,
    };
  }
}
