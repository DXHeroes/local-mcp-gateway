/**
 * Remote HTTP MCP Server
 *
 * Implements McpServer interface for remote HTTP MCP servers
 * Makes HTTP POST requests with JSON-RPC 2.0 to remote MCP endpoints
 */

import { randomUUID } from 'node:crypto';
import type { OAuthToken } from '../types/database.js';
import type {
  ApiKeyConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  McpResource,
  McpTool,
  RemoteHttpMcpConfig,
} from '../types/mcp.js';
import { McpServer } from './McpServer.js';

/**
 * HTTP client interface for making requests
 * Allows dependency injection for testing
 */
export interface HttpClient {
  post(
    url: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<{ status: number; headers: Headers; json(): Promise<unknown> }>;
}

/**
 * Default HTTP client implementation using fetch
 */
class FetchHttpClient implements HttpClient {
  async post(
    url: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; headers: Headers; json(): Promise<unknown> }> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream', // Some MCP servers require this
        ...headers,
      },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      headers: response.headers,
      async json() {
        // Don't throw on non-ok status - let caller handle it
        const text = await response.text();

        // Check if response is SSE format (event: message data: {...})
        if (text.includes('event:') && text.includes('data:')) {
          // Parse SSE format
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                return JSON.parse(line.slice(6));
              } catch {
                // Continue to next line
              }
            }
          }
          // If no valid JSON found in SSE, throw error
          throw new Error(
            `Server returned SSE format but no valid JSON found. Consider configuring this server as type 'remote_sse'. Response: ${text.substring(0, 200)}`
          );
        }

        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
        }
      },
    };
  }
}

/**
 * Remote HTTP MCP Server
 *
 * Connects to remote MCP servers via HTTP POST requests
 */
export class RemoteHttpMcpServer extends McpServer {
  private httpClient: HttpClient;
  private cachedTools: McpTool[] | null = null;
  private cachedResources: McpResource[] | null = null;
  private sessionId: string | null = null;
  private isInitializing = false;

  constructor(
    private config: RemoteHttpMcpConfig,
    private oauthToken: OAuthToken | null = null,
    private apiKeyConfig: ApiKeyConfig | null = null,
    httpClient?: HttpClient
  ) {
    super();
    this.httpClient = httpClient || new FetchHttpClient();
  }

  /**
   * Initialize the remote MCP server
   * Fetches initial tools and resources
   * If resources/list is not supported, continues without error
   * Generates sessionId if server requires Mcp-Session-Id header
   */
  async initialize(): Promise<void> {
    // Prevent recursive initialization
    if (this.isInitializing) {
      console.warn('[RemoteHttpMcpServer] Already initializing, skipping...');
      return;
    }

    this.isInitializing = true;

    try {
      // Send explicit initialize request first (required by some servers like Apify)
      // Don't generate sessionId upfront - let server provide it via Mcp-Session-Id header
      const initializeRequest: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: {
            name: 'local-mcp-gateway',
            version: '1.0.0',
          },
        },
      };

      try {
        // Make initialize request WITHOUT Mcp-Session-Id header first
        // Server should provide sessionId in response header if it requires session management
        const headers = this.buildHeaders();
        // Remove Mcp-Session-Id header if it exists (we want server to assign it)
        delete headers['Mcp-Session-Id'];
        delete headers['mcp-session-id'];

        const response = await this.httpClient.post(this.config.url, initializeRequest, headers);

        // Extract sessionId from Mcp-Session-Id response header if provided by server
        // Per MCP spec 2025-06-18: Server MAY assign sessionId in Mcp-Session-Id header
        const sessionIdHeader =
          response.headers.get('mcp-session-id') || response.headers.get('Mcp-Session-Id');
        if (sessionIdHeader) {
          this.sessionId = sessionIdHeader;
          console.log(
            `[RemoteHttpMcpServer] Extracted sessionId from server: ${sessionIdHeader.substring(0, 8)}...`
          );
        } else {
          // Server didn't provide sessionId - check if it requires one by making a test request
          // If server requires sessionId, it will return error and we'll generate one
          console.log(
            '[RemoteHttpMcpServer] Server did not provide sessionId in initialize response'
          );
        }

        const initializeResponse = (await response.json()) as JsonRpcResponse;
        if (initializeResponse.error) {
          throw new Error(`Initialize failed: ${initializeResponse.error.message}`);
        }
      } catch (error) {
        // If initialize fails, check if it's due to missing sessionId
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Session') || errorMessage.includes('session')) {
          // Server requires sessionId - generate one and retry initialize with it
          this.sessionId = randomUUID();
          console.log(
            `[RemoteHttpMcpServer] Server requires sessionId, generated: ${this.sessionId.substring(0, 8)}...`
          );

          try {
            const retryHeaders = this.buildHeaders();
            const retryResponse = await this.httpClient.post(
              this.config.url,
              initializeRequest,
              retryHeaders
            );
            const retryInitializeResponse = (await retryResponse.json()) as JsonRpcResponse;
            if (retryInitializeResponse.error) {
              throw new Error(
                `Initialize failed after retry: ${retryInitializeResponse.error.message}`
              );
            }
            // Check if server returned different sessionId
            const retrySessionIdHeader =
              retryResponse.headers.get('mcp-session-id') ||
              retryResponse.headers.get('Mcp-Session-Id');
            if (retrySessionIdHeader && retrySessionIdHeader !== this.sessionId) {
              this.sessionId = retrySessionIdHeader;
              console.log(
                `[RemoteHttpMcpServer] Server assigned different sessionId: ${retrySessionIdHeader.substring(0, 8)}...`
              );
            }
          } catch (retryError) {
            console.warn(
              `Initialize request failed after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`
            );
            throw retryError;
          }
        } else {
          // Other error - log but continue - some servers don't require initialize
          console.warn(`Initialize request failed (continuing anyway): ${errorMessage}`);
        }
      }

      // Pre-fetch tools (required)
      await this.listTools();

      // Pre-fetch resources (optional - some servers don't support this)
      try {
        await this.listResources();
      } catch (error) {
        // Some MCP servers don't support resources/list - that's okay
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Method not found') || errorMessage.includes('Unknown method')) {
          // Server doesn't support resources - continue without error
          this.cachedResources = [];
          return;
        }
        // Re-throw other errors
        throw error;
      }
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Build request headers with OAuth token or API key
   * Includes Mcp-Session-Id header if sessionId is available (required by some servers)
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // OAuth token takes precedence
    if (this.oauthToken) {
      headers.Authorization = `${this.oauthToken.tokenType} ${this.oauthToken.accessToken}`;
    } else if (this.apiKeyConfig) {
      // API key fallback
      const headerValue = this.apiKeyConfig.headerValue.replace(
        '{apiKey}',
        this.apiKeyConfig.apiKey
      );
      headers[this.apiKeyConfig.headerName] = headerValue;
    }

    // Add Mcp-Session-Id header if sessionId is available (required by some HTTP servers)
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
      // Debug logging (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[RemoteHttpMcpServer] Including Mcp-Session-Id header: ${this.sessionId.substring(0, 8)}...`
        );
      }
    }

    return headers;
  }

  /**
   * Make JSON-RPC request to remote MCP server
   */
  private async makeRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const headers = this.buildHeaders();
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post(this.config.url, request, headers);

        // Check for OAuth requirement (401 with WWW-Authenticate header)
        if (response.status === 401) {
          const wwwAuthenticate = response.headers.get('www-authenticate');
          if (wwwAuthenticate) {
            // Extract resource metadata URL from WWW-Authenticate header
            // Format: Bearer realm="...", resource_metadata_uri="https://..."
            const resourceMetadataMatch = wwwAuthenticate.match(/resource_metadata_uri="([^"]+)"/);
            if (resourceMetadataMatch) {
              throw new Error(`OAUTH_REQUIRED:${resourceMetadataMatch[1]}`);
            }
            // Fallback: check if it's a Bearer challenge
            if (wwwAuthenticate.toLowerCase().startsWith('bearer')) {
              throw new Error('OAUTH_REQUIRED: Server requires OAuth authentication');
            }
          }
        }

        // Check for session-related errors (400/404 with error about missing/invalid session)
        if (response.status === 400 || response.status === 404) {
          let result: unknown;
          try {
            result = await response.json();
          } catch {
            // If JSON parsing fails, continue with normal error handling
            const result = await response.json();
            return result as JsonRpcResponse;
          }

          const errorMessage =
            typeof result === 'object' && result !== null && 'error' in result
              ? JSON.stringify(result.error)
              : JSON.stringify(result);
          if (
            errorMessage.includes('Mcp-Session-Id') ||
            errorMessage.includes('Session not found') ||
            errorMessage.includes('session') ||
            errorMessage.includes('Session')
          ) {
            // Server requires valid sessionId - re-initialize to get proper sessionId from server
            // But only if we're not already initializing (to prevent infinite loop)
            if (!this.isInitializing) {
              console.log('[RemoteHttpMcpServer] Session not found, re-initializing...');
              try {
                // Clear current sessionId and re-initialize
                this.sessionId = null;
                await this.initialize();
                // Retry original request with new sessionId
                const retryHeaders = this.buildHeaders();
                if (this.sessionId) {
                  const sessionIdStr: string = this.sessionId;
                  console.log(
                    `[RemoteHttpMcpServer] Retrying request with sessionId: ${sessionIdStr.substring(0, 8)}...`
                  );
                } else {
                  console.log('[RemoteHttpMcpServer] Retrying request with sessionId: none');
                }
                const retryResponse = await this.httpClient.post(
                  this.config.url,
                  request,
                  retryHeaders
                );
                const retryResult = await retryResponse.json();
                return retryResult as JsonRpcResponse;
              } catch (initError) {
                // If re-initialization fails, throw original error
                const initErrorMessage =
                  initError instanceof Error ? initError.message : String(initError);
                console.error(`[RemoteHttpMcpServer] Failed to re-initialize: ${initErrorMessage}`);
                throw new Error(`Session initialization failed: ${initErrorMessage}`);
              }
            } else {
              // Already initializing - this shouldn't happen, but if it does, throw error
              throw new Error(
                'Session not found and already initializing - possible infinite loop'
              );
            }
          }
        }

        const result = await response.json();
        return result as JsonRpcResponse;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check for OAuth required error - don't retry
        if (lastError.message.includes('OAUTH_REQUIRED')) {
          throw lastError;
        }

        // Don't retry on format errors (SSE vs JSON) - they won't succeed
        if (
          lastError.message.includes('SSE format') ||
          lastError.message.includes('parse JSON') ||
          lastError.message.includes('Consider configuring this server as type')
        ) {
          throw lastError;
        }

        // Retry on network errors or 5xx errors
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
        }
      }
    }

    throw lastError || new Error('Failed to make request to remote MCP server');
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<McpTool[]> {
    if (this.cachedTools) {
      return this.cachedTools;
    }

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/list',
    };

    const response = await this.makeRequest(request);

    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    // Handle different response formats:
    // 1. Direct array: response.result = [...]
    // 2. Object with tools property: response.result = { tools: [...] }
    let tools: McpTool[] = [];

    if (Array.isArray(response.result)) {
      // Direct array format
      tools = response.result as McpTool[];
    } else if (
      response.result &&
      typeof response.result === 'object' &&
      'tools' in response.result
    ) {
      // Object with tools property (e.g., Context7 MCP format)
      const resultObj = response.result as { tools?: McpTool[] };
      tools = Array.isArray(resultObj.tools) ? resultObj.tools : [];
    }

    this.cachedTools = tools;
    return this.cachedTools;
  }

  /**
   * Call a tool by name
   */
  async callTool(name: string, args: unknown): Promise<unknown> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    const response = await this.makeRequest(request);

    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * List all available resources
   * Returns empty array if server doesn't support resources/list
   */
  async listResources(): Promise<McpResource[]> {
    if (this.cachedResources) {
      return this.cachedResources;
    }

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'resources/list',
    };

    const response = await this.makeRequest(request);

    if (response.error) {
      throw new Error(`Failed to list resources: ${response.error.message}`);
    }

    // Handle different response formats
    let resources: McpResource[] = [];

    if (Array.isArray(response.result)) {
      resources = response.result as McpResource[];
    } else if (
      response.result &&
      typeof response.result === 'object' &&
      'resources' in response.result
    ) {
      const resultObj = response.result as { resources?: McpResource[] };
      resources = Array.isArray(resultObj.resources) ? resultObj.resources : [];
    }

    this.cachedResources = resources;
    return this.cachedResources;
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<McpResource> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'resources/read',
      params: {
        uri,
      },
    };

    const response = await this.makeRequest(request);

    if (response.error) {
      throw new Error(`Failed to read resource: ${response.error.message}`);
    }

    return response.result as McpResource;
  }

  /**
   * Handle JSON-RPC request (for proxy mode)
   */
  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
    const isNotification = request.id === undefined || request.id === null;

    try {
      switch (request.method) {
        case 'initialize': {
          await this.initialize();
          // For notifications, don't return a response
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              protocolVersion: '2025-06-18',
              capabilities: {},
              serverInfo: {
                name: 'local-mcp-gateway',
                version: '1.0.0',
              },
            },
          };
        }

        case 'tools/list': {
          const tools = await this.listTools();
          // For notifications, don't return a response
          if (isNotification) {
            return;
          }
          // MCP spec requires tools/list to return { tools: [...] } not just [...]
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              tools,
            },
          };
        }

        case 'tools/call': {
          const params = request.params as { name: string; arguments?: unknown };
          const result = await this.callTool(params.name, params.arguments);
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result,
          };
        }

        case 'resources/list': {
          const resources = await this.listResources();
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
              resources,
            },
          };
        }

        case 'resources/read': {
          const params = request.params as { uri: string };
          const resource = await this.readResource(params.uri);
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: resource,
          };
        }

        default:
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error) {
      if (isNotification) {
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        error: {
          code: -32603,
          message: errorMessage,
        },
      };
    }
  }
}
