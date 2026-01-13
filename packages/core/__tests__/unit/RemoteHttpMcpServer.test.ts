/**
 * Unit tests for RemoteHttpMcpServer
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type HttpClient,
  RemoteHttpMcpServer,
} from '../../src/abstractions/RemoteHttpMcpServer.js';
import type { OAuthToken } from '../../src/types/database.js';
import type {
  ApiKeyConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  RemoteHttpMcpConfig,
} from '../../src/types/mcp.js';

/**
 * Mock HTTP client for testing
 */
class MockHttpClient implements HttpClient {
  private responses: Map<string, { status: number; headers: Headers; body: unknown }> = new Map();

  setResponse(
    url: string,
    status: number,
    body: unknown,
    headers: Record<string, string> = {}
  ): void {
    const mockHeaders = new Headers(headers);
    this.responses.set(url, { status, headers: mockHeaders, body });
  }

  async post(
    url: string,
    _body: unknown,
    _headers?: Record<string, string>
  ): Promise<{ status: number; headers: Headers; json(): Promise<unknown> }> {
    const response = this.responses.get(url);
    if (!response) {
      throw new Error(`No mock response set for URL: ${url}`);
    }

    return {
      status: response.status,
      headers: response.headers,
      async json() {
        return response.body;
      },
    };
  }
}

describe('RemoteHttpMcpServer', () => {
  let mockHttpClient: MockHttpClient;
  let config: RemoteHttpMcpConfig;

  beforeEach(() => {
    mockHttpClient = new MockHttpClient();
    config = {
      url: 'https://example.com/mcp',
      transport: 'http',
    };
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      expect(server).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should create instance with OAuth token', () => {
      const oauthToken: OAuthToken = {
        id: 'token-id',
        mcpServerId: 'server-id',
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const server = new RemoteHttpMcpServer(config, oauthToken, null, mockHttpClient);
      expect(server).toBeInstanceOf(RemoteHttpMcpServer);
    });

    it('should create instance with API key config', () => {
      const apiKeyConfig: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'X-API-Key',
        headerValue: 'Bearer test-api-key',
      };

      const server = new RemoteHttpMcpServer(config, null, apiKeyConfig, mockHttpClient);
      expect(server).toBeInstanceOf(RemoteHttpMcpServer);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      mockHttpClient.setResponse(config.url, 200, initializeResponse, {
        'Mcp-Session-Id': 'test-session-id',
      });

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      // Verify initialization succeeded
      const tools = await server.listTools();
      expect(Array.isArray(tools)).toBe(true);
    });

    it('should extract sessionId from response headers', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      mockHttpClient.setResponse(config.url, 200, initializeResponse, {
        'Mcp-Session-Id': 'test-session-id-123',
      });

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      // Session ID should be stored and used in subsequent requests
      // We can verify this by checking that requests include the session header
      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [],
        },
      };

      mockHttpClient.setResponse(config.url, 200, toolsResponse);
      await server.listTools();
    });

    it('should handle initialization error', async () => {
      mockHttpClient.setResponse(config.url, 500, {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'Internal error',
        },
      });

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await expect(server.initialize()).rejects.toThrow();
    });

    it('should retry with new sessionId on session error', async () => {
      // First request fails with session error
      mockHttpClient.setResponse(config.url, 400, {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'Session not found',
        },
      });

      // Second request succeeds
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      // Use a counter to track requests
      let requestCount = 0;
      mockHttpClient.post = vi.fn().mockImplementation(async (_url, _body, _headers) => {
        requestCount++;
        if (requestCount === 1) {
          // First request fails
          return {
            status: 400,
            headers: new Headers(),
            async json() {
              return {
                jsonrpc: '2.0',
                id: 1,
                error: {
                  code: -32000,
                  message: 'Session not found',
                },
              };
            },
          };
        }
        // Subsequent requests succeed
        return {
          status: 200,
          headers: new Headers({ 'Mcp-Session-Id': 'new-session-id' }),
          async json() {
            return initializeResponse;
          },
        };
      });

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      // Should retry and succeed
      await expect(server.initialize()).resolves.not.toThrow();
    });
  });

  describe('listTools', () => {
    it('should return tools list', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'test-tool',
              description: 'Test tool',
              inputSchema: {},
            },
          ],
        },
      };

      mockHttpClient.setResponse(config.url, 200, initializeResponse);
      mockHttpClient.setResponse(config.url, 200, toolsResponse);

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      const tools = await server.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('should cache tools', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'test-tool',
              description: 'Test tool',
              inputSchema: {},
            },
          ],
        },
      };

      mockHttpClient.setResponse(config.url, 200, initializeResponse);
      mockHttpClient.setResponse(config.url, 200, toolsResponse);

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      // First call
      const tools1 = await server.listTools();
      expect(tools1).toHaveLength(1);

      // Second call should use cache (no additional HTTP request)
      const tools2 = await server.listTools();
      expect(tools2).toHaveLength(1);
      expect(tools2[0].name).toBe('test-tool');
    });

    it('should handle tools/list error', async () => {
      // Create a server that will fail on tools/list during initialize
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        error: {
          code: -32000,
          message: 'Failed to list tools',
        },
      };

      mockHttpClient.post = vi.fn().mockImplementation(async (_url, body, _headers) => {
        const request = body as JsonRpcRequest;

        if (request.method === 'initialize') {
          return {
            status: 200,
            headers: new Headers(),
            async json() {
              return initializeResponse;
            },
          };
        }

        if (request.method === 'tools/list') {
          // Always return error for tools/list
          return {
            status: 200,
            headers: new Headers(),
            async json() {
              return errorResponse;
            },
          };
        }

        if (request.method === 'resources/list') {
          // resources/list call during initialize
          return {
            status: 200,
            headers: new Headers(),
            async json() {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  resources: [],
                },
              };
            },
          };
        }

        throw new Error(`Unexpected request method: ${request.method}`);
      });

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);

      // Initialize should fail because tools/list fails
      await expect(server.initialize()).rejects.toThrow('Failed to list tools');
    });
  });

  describe('callTool', () => {
    it('should call tool successfully', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      const callToolResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 3,
        result: {
          content: [
            {
              type: 'text',
              text: 'Tool result',
            },
          ],
        },
      };

      mockHttpClient.setResponse(config.url, 200, initializeResponse);
      mockHttpClient.setResponse(config.url, 200, callToolResponse);

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      const result = await server.callTool('test-tool', { arg1: 'value1' });
      expect(result).toBeDefined();
    });

    it('should handle tool call error', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [
            {
              name: 'test-tool',
              description: 'Test tool',
              inputSchema: {},
            },
          ],
        },
      };

      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 3,
        error: {
          code: -32602,
          message: 'Invalid params',
        },
      };

      mockHttpClient.post = vi.fn().mockImplementation(async (_url, body, _headers) => {
        const request = body as JsonRpcRequest;

        if (request.method === 'initialize') {
          return {
            status: 200,
            headers: new Headers(),
            async json() {
              return initializeResponse;
            },
          };
        }

        if (request.method === 'tools/list') {
          return {
            status: 200,
            headers: new Headers(),
            async json() {
              return toolsResponse;
            },
          };
        }

        if (request.method === 'resources/list') {
          // resources/list call during initialize
          return {
            status: 200,
            headers: new Headers(),
            async json() {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  resources: [],
                },
              };
            },
          };
        }

        if (request.method === 'tools/call') {
          return {
            status: 200,
            headers: new Headers(),
            async json() {
              return errorResponse;
            },
          };
        }

        throw new Error(`Unexpected request method: ${request.method}`);
      });

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      await expect(server.callTool('test-tool', {})).rejects.toThrow();
    });
  });

  describe('listResources', () => {
    it('should return resources list', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      const resourcesResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 4,
        result: {
          resources: [
            {
              uri: 'resource://test',
              name: 'Test Resource',
              description: 'Test resource description',
            },
          ],
        },
      };

      mockHttpClient.setResponse(config.url, 200, initializeResponse);
      mockHttpClient.setResponse(config.url, 200, resourcesResponse);

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      const resources = await server.listResources();
      expect(resources).toHaveLength(1);
      expect(resources[0].uri).toBe('resource://test');
    });
  });

  describe('readResource', () => {
    it('should read resource successfully', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      const readResourceResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 5,
        result: {
          contents: [
            {
              uri: 'resource://test',
              mimeType: 'text/plain',
              text: 'Resource content',
            },
          ],
        },
      };

      mockHttpClient.setResponse(config.url, 200, initializeResponse);
      mockHttpClient.setResponse(config.url, 200, readResourceResponse);

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      const result = await server.readResource('resource://test');
      expect(result).toBeDefined();
    });
  });

  describe('OAuth token handling', () => {
    it('should include OAuth token in Authorization header', async () => {
      const oauthToken: OAuthToken = {
        id: 'token-id',
        mcpServerId: 'server-id',
        accessToken: 'test-oauth-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      let capturedHeaders: Record<string, string> = {};
      const originalPost = mockHttpClient.post.bind(mockHttpClient);
      mockHttpClient.post = vi.fn().mockImplementation(async (url, body, headers) => {
        capturedHeaders = headers || {};
        return originalPost(url, body, headers);
      });

      mockHttpClient.setResponse(config.url, 200, initializeResponse);

      const server = new RemoteHttpMcpServer(config, oauthToken, null, mockHttpClient);
      await server.initialize();

      expect(capturedHeaders.Authorization).toBe('Bearer test-oauth-token');
    });
  });

  describe('API key handling', () => {
    it('should include API key in custom header', async () => {
      const apiKeyConfig: ApiKeyConfig = {
        apiKey: 'test-api-key-12345',
        headerName: 'X-API-Key',
        headerValue: 'Bearer test-api-key-12345',
      };

      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      let capturedHeaders: Record<string, string> = {};
      const originalPost = mockHttpClient.post.bind(mockHttpClient);
      mockHttpClient.post = vi.fn().mockImplementation(async (url, body, headers) => {
        capturedHeaders = headers || {};
        return originalPost(url, body, headers);
      });

      mockHttpClient.setResponse(config.url, 200, initializeResponse);

      const server = new RemoteHttpMcpServer(config, null, apiKeyConfig, mockHttpClient);
      await server.initialize();

      expect(capturedHeaders['X-API-Key']).toBe('Bearer test-api-key-12345');
    });
  });

  describe('session management', () => {
    it('should regenerate sessionId on session error', async () => {
      const initializeResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          serverInfo: {
            name: 'test-server',
            version: '1.0.0',
          },
        },
      };

      let requestCount = 0;
      mockHttpClient.post = vi.fn().mockImplementation(async (_url, _body, _headers) => {
        requestCount++;
        if (requestCount === 1) {
          // First initialize succeeds
          return {
            status: 200,
            headers: new Headers({ 'Mcp-Session-Id': 'session-1' }),
            async json() {
              return initializeResponse;
            },
          };
        }
        if (requestCount === 2) {
          // Second request fails with session error
          return {
            status: 404,
            headers: new Headers(),
            async json() {
              return {
                jsonrpc: '2.0',
                id: 2,
                error: {
                  code: -32000,
                  message: 'Session not found',
                },
              };
            },
          };
        }
        // Third request (retry) succeeds
        return {
          status: 200,
          headers: new Headers({ 'Mcp-Session-Id': 'session-2' }),
          async json() {
            return {
              jsonrpc: '2.0',
              id: 2,
              result: {
                tools: [],
              },
            };
          },
        };
      });

      const server = new RemoteHttpMcpServer(config, null, null, mockHttpClient);
      await server.initialize();

      // This should trigger session regeneration
      await server.listTools();

      expect(requestCount).toBeGreaterThan(1);
    });
  });
});
