/**
 * Abstract base class for all MCP servers
 *
 * All MCP server implementations (external, custom, remote) must extend this class.
 */

import type { JsonRpcRequest, JsonRpcResponse, McpResource, McpTool } from '../types/mcp.js';

/**
 * Abstract base class for MCP servers
 */
export abstract class McpServer {
  /**
   * Initialize the MCP server
   * Called once when the server is first loaded
   */
  abstract initialize(): Promise<void>;

  /**
   * List all available tools
   * @returns Array of tool definitions
   */
  abstract listTools(): Promise<McpTool[]>;

  /**
   * Call a tool by name
   * @param name - Tool name
   * @param args - Tool arguments
   * @returns Tool result
   */
  abstract callTool(name: string, args: unknown): Promise<unknown>;

  /**
   * List all available resources
   * @returns Array of resource definitions
   */
  abstract listResources(): Promise<McpResource[]>;

  /**
   * Read a resource by URI
   * @param uri - Resource URI
   * @returns Resource content
   */
  abstract readResource(uri: string): Promise<unknown>;

  /**
   * Validate the server configuration (e.g., API key)
   * Optional method - override to implement actual validation
   * @returns Validation result with valid status and optional error message
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    // Default implementation: assume valid if no validation needed
    return { valid: true };
  }

  /**
   * Handle a raw JSON-RPC request
   * Override this for custom request handling
   * @param request - JSON-RPC request
   * @returns JSON-RPC response, or void for notifications (requests without id)
   */
  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
    // If this is a notification (no id), perform the action but don't return a response
    const isNotification = request.id === undefined;

    try {
      let result: unknown;

      switch (request.method) {
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
          const params = request.params as { name: string; arguments?: unknown };
          result = await this.callTool(params.name, params.arguments);
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
        default:
          throw new Error(`Unknown method: ${request.method}`);
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
