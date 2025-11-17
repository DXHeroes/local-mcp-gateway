/**
 * Proxy Handler
 *
 * Handles routing and aggregation of MCP requests across multiple MCP servers
 */

import type { JsonRpcRequest, JsonRpcResponse, McpResource, McpTool } from '../types/mcp.js';
import type { McpServer } from './McpServer.js';

/**
 * Proxy Handler
 *
 * Aggregates tools and resources from multiple MCP servers and routes requests
 */
export class ProxyHandler {
  private servers: Map<string, McpServer> = new Map();

  /**
   * Register an MCP server
   * @param id - Server ID
   * @param server - MCP server instance
   */
  registerServer(id: string, server: McpServer): void {
    this.servers.set(id, server);
  }

  /**
   * Unregister an MCP server
   * @param id - Server ID
   */
  unregisterServer(id: string): void {
    this.servers.delete(id);
  }

  /**
   * Get all registered server IDs
   * @returns Array of server IDs
   */
  getServerIds(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * List all tools from all registered servers
   * Merges tools from all servers, handling name conflicts
   * @returns Array of all tools
   */
  async listTools(): Promise<McpTool[]> {
    const allTools: McpTool[] = [];
    const toolNames = new Set<string>();

    for (const [serverId, server] of this.servers.entries()) {
      try {
        const tools = await server.listTools();
        for (const tool of tools) {
          // Handle name conflicts by prefixing with server ID
          if (toolNames.has(tool.name)) {
            tool.name = `${serverId}:${tool.name}`;
          }
          toolNames.add(tool.name);
          allTools.push(tool);
        }
      } catch (error) {
        // Log error but continue with other servers
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error listing tools from server ${serverId}:`, errorMessage);
      }
    }

    return allTools;
  }

  /**
   * List all resources from all registered servers
   * @returns Array of all resources
   */
  async listResources(): Promise<McpResource[]> {
    const allResources: McpResource[] = [];

    for (const [serverId, server] of this.servers.entries()) {
      try {
        const resources = await server.listResources();
        allResources.push(...resources);
      } catch (error) {
        // Log error but continue with other servers
        console.error(`Error listing resources from server ${serverId}:`, error);
      }
    }

    return allResources;
  }

  /**
   * Call a tool by name
   * Routes to the appropriate server based on tool name
   * @param toolName - Tool name (may include server ID prefix)
   * @param args - Tool arguments
   * @returns Tool result
   */
  async callTool(toolName: string, args: unknown): Promise<unknown> {
    // Check if tool name includes server ID prefix
    const parts = toolName.split(':');
    if (parts.length === 2) {
      const [serverId, actualToolName] = parts;
      if (serverId && actualToolName) {
        const server = this.servers.get(serverId);
        if (server) {
          return await server.callTool(actualToolName, args);
        }
      }
    }

    // Try all servers until one handles the tool
    for (const server of this.servers.values()) {
      try {
        const tools = await server.listTools();
        const tool = tools.find((t) => t.name === toolName);
        if (tool) {
          return await server.callTool(toolName, args);
        }
      } catch (error) {
        // Continue to next server
        console.error(`Error checking tool in server:`, error);
      }
    }

    throw new Error(`Tool "${toolName}" not found in any registered server`);
  }

  /**
   * Read a resource by URI
   * Tries all servers until one provides the resource
   * @param uri - Resource URI
   * @returns Resource content
   */
  async readResource(uri: string): Promise<unknown> {
    for (const server of this.servers.values()) {
      try {
        const resources = await server.listResources();
        const resource = resources.find((r) => r.uri === uri);
        if (resource) {
          return await server.readResource(uri);
        }
      } catch (error) {
        // Continue to next server
        console.error(`Error checking resource in server:`, error);
      }
    }

    throw new Error(`Resource "${uri}" not found in any registered server`);
  }

  /**
   * Handle a JSON-RPC request
   * Routes to appropriate handler based on method
   * @param request - JSON-RPC request
   * @returns JSON-RPC response, or void for notifications (requests without id)
   */
  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
    // If this is a notification (no id), perform the action but don't return a response
    const isNotification = request.id === undefined;

    try {
      let result: unknown;

      switch (request.method) {
        case 'initialize': {
          // Forward initialize request to all servers and aggregate capabilities
          const initializeResults: Array<{
            serverId: string;
            result: {
              protocolVersion?: string;
              capabilities?: {
                tools?: unknown;
                resources?: unknown;
                prompts?: unknown;
                logging?: unknown;
              };
              serverInfo?: { name?: string; version?: string };
            };
          }> = [];
          const errors: Array<{ serverId: string; error: unknown }> = [];

          for (const [serverId, server] of this.servers.entries()) {
            try {
              // Check if server has handleRequest method (for remote servers)
              if (
                typeof (server as unknown as { handleRequest?: unknown }).handleRequest ===
                'function'
              ) {
                const serverResponse = await (
                  server as unknown as {
                    handleRequest: (req: JsonRpcRequest) => Promise<JsonRpcResponse>;
                  }
                ).handleRequest(request);
                if (serverResponse.error) {
                  errors.push({ serverId, error: serverResponse.error });
                } else if (serverResponse.result) {
                  initializeResults.push({
                    serverId,
                    result: serverResponse.result as {
                      protocolVersion?: string;
                      capabilities?: {
                        tools?: unknown;
                        resources?: unknown;
                        prompts?: unknown;
                        logging?: unknown;
                      };
                      serverInfo?: { name?: string; version?: string };
                    },
                  });
                }
              } else {
                // For servers without handleRequest, return proxy capabilities
                initializeResults.push({
                  serverId,
                  result: {
                    protocolVersion: '2025-06-18',
                    capabilities: {
                      tools: { listChanged: false },
                      resources: { subscribe: false, listChanged: false },
                    },
                    serverInfo: {
                      name: `proxy-server-${serverId}`,
                      version: '1.0.0',
                    },
                  },
                });
              }
            } catch (error) {
              errors.push({ serverId, error });
            }
          }

          // If all servers failed, return error
          if (initializeResults.length === 0 && errors.length > 0) {
            throw new Error(
              `Failed to initialize servers: ${errors.map((e) => e.serverId).join(', ')}`
            );
          }

          // Aggregate capabilities from all servers
          // Use the highest protocol version, merge capabilities
          const protocolVersions = initializeResults
            .map((r) => r.result.protocolVersion)
            .filter((v): v is string => typeof v === 'string');
          const maxProtocolVersion =
            protocolVersions.length > 0 ? protocolVersions.sort().reverse()[0] : '2025-06-18';

          // Merge capabilities - if any server supports something, proxy supports it
          const hasTools = initializeResults.some(
            (r) => r.result.capabilities?.tools !== undefined
          );
          const hasResources = initializeResults.some(
            (r) => r.result.capabilities?.resources !== undefined
          );
          const hasPrompts = initializeResults.some(
            (r) => r.result.capabilities?.prompts !== undefined
          );
          const hasLogging = initializeResults.some(
            (r) => r.result.capabilities?.logging !== undefined
          );

          result = {
            protocolVersion: maxProtocolVersion,
            capabilities: {
              ...(hasTools && { tools: { listChanged: false } }),
              ...(hasResources && { resources: { subscribe: false, listChanged: false } }),
              ...(hasPrompts && { prompts: {} }),
              ...(hasLogging && { logging: {} }),
            },
            serverInfo: {
              name: 'local-mcp-proxy',
              version: '1.0.0',
            },
          };
          break;
        }
        case 'tools/list': {
          // MCP spec requires tools/list to return { tools: [...] } not just [...]
          const tools = await this.listTools();
          result = { tools };
          break;
        }
        case 'tools/call': {
          if (!request.params || typeof request.params !== 'object') {
            throw new Error('Invalid params for tools/call');
          }
          const callParams = request.params as { name: string; arguments?: unknown };
          result = await this.callTool(callParams.name, callParams.arguments);
          break;
        }
        case 'resources/list':
          result = await this.listResources();
          break;
        case 'resources/read': {
          if (!request.params || typeof request.params !== 'object') {
            throw new Error('Invalid params for resources/read');
          }
          const readParams = request.params as { uri: string };
          result = await this.readResource(readParams.uri);
          break;
        }
        default: {
          // For unknown methods, try forwarding to servers
          const serverResponses: Array<{ serverId: string; response: JsonRpcResponse }> = [];
          for (const [serverId, server] of this.servers.entries()) {
            try {
              if (
                typeof (server as unknown as { handleRequest?: unknown }).handleRequest ===
                'function'
              ) {
                const serverResponse = await (
                  server as unknown as {
                    handleRequest: (req: JsonRpcRequest) => Promise<JsonRpcResponse>;
                  }
                ).handleRequest(request);
                serverResponses.push({ serverId, response: serverResponse });
              }
            } catch {
              // Continue to next server
            }
          }

          // If any server handled it successfully, return first successful response
          const successfulResponse = serverResponses.find((sr) => !sr.response.error);
          if (successfulResponse) {
            return successfulResponse.response;
          }

          throw new Error(`Unknown method: ${request.method}`);
        }
      }

      // For notifications, don't return a response
      if (isNotification) {
        return;
      }

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result,
      };
    } catch (error) {
      // For notifications, don't return error responses either
      if (isNotification) {
        return;
      }

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
          data: error,
        },
      };
    }
  }
}
