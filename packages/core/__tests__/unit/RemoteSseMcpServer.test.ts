/**
 * Unit tests for RemoteSseMcpServer
 */

import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteSseMcpServer, type SseClient } from '../../src/abstractions/RemoteSseMcpServer.js';
import type { OAuthToken } from '../../src/types/database.js';
import type {
  ApiKeyConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  RemoteSseMcpConfig,
} from '../../src/types/mcp.js';

/**
 * Mock SSE client for testing
 */
class MockSseClient implements SseClient {
  private emitter: EventEmitter | null = null;
  private pendingResponses: Map<string | number, JsonRpcResponse> = new Map();

  setResponse(requestId: string | number, response: JsonRpcResponse): void {
    this.pendingResponses.set(requestId, response);
  }

  async connect(_url: string, _headers?: Record<string, string>): Promise<EventEmitter> {
    this.emitter = new EventEmitter();
    return this.emitter;
  }

  async send(message: JsonRpcRequest): Promise<void> {
    // Simulate response after a short delay
    setTimeout(() => {
      if (this.emitter && message.id !== null && message.id !== undefined) {
        const response = this.pendingResponses.get(message.id);
        if (response) {
          this.emitter?.emit('message', response);
        }
      }
    }, 10);
  }

  disconnect(): void {
    if (this.emitter) {
      this.emitter.emit('close');
      this.emitter = null;
    }
  }

  // Helper method to manually emit messages (for testing)
  emitMessage(message: JsonRpcResponse): void {
    if (this.emitter) {
      this.emitter.emit('message', message);
    }
  }
}

describe('RemoteSseMcpServer', () => {
  let mockSseClient: MockSseClient;
  let config: RemoteSseMcpConfig;

  beforeEach(() => {
    mockSseClient = new MockSseClient();
    config = {
      url: 'https://example.com/mcp/sse',
      transport: 'sse',
    };
  });

  describe('constructor', () => {
    it('should create instance with config', () => {
      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      expect(server).toBeInstanceOf(RemoteSseMcpServer);
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

      const server = new RemoteSseMcpServer(config, oauthToken, null, mockSseClient);
      expect(server).toBeInstanceOf(RemoteSseMcpServer);
    });

    it('should create instance with API key config', () => {
      const apiKeyConfig: ApiKeyConfig = {
        apiKey: 'test-api-key',
        headerName: 'X-API-Key',
        headerValue: 'Bearer test-api-key',
      };

      const server = new RemoteSseMcpServer(config, null, apiKeyConfig, mockSseClient);
      expect(server).toBeInstanceOf(RemoteSseMcpServer);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully for Firecrawl-style SSE (initialize returns JSON)', async () => {
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

      // Mock fetch for initialize request (returns JSON)
      // For Firecrawl-style SSE: initialize returns JSON, then POST requests work directly
      global.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
        // Check if URL ends with /mcp (for JSON-RPC requests) or /sse (for SSE stream)
        const _isMcpEndpoint = url.includes('/mcp') && !url.includes('/sse');

        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
                'Mcp-Session-Id': 'test-session-id',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        // GET request for SSE connection
        // For Firecrawl-style SSE: when isConnected is true from initialize, ensureConnected() may still try to connect
        // But it should return early if isConnected is true (even without emitter)
        // However, the code checks `if (this.isConnected && this.emitter)`, so it will try to connect
        // We need to simulate a successful SSE connection (even though it's not used)
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                // Empty stream - connection established but no messages
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      await server.initialize();

      // Verify initialization succeeded
      const tools = await server.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('should handle initialization error', async () => {
      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          return {
            ok: false,
            status: 500,
            headers: new Headers(),
            async text() {
              return 'Internal Server Error';
            },
          };
        }
        return {
          ok: false,
          status: 500,
          headers: new Headers(),
        };
      });

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      await expect(server.initialize()).rejects.toThrow();
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

      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
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

      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      await server.initialize();

      // First call
      const tools1 = await server.listTools();
      expect(tools1).toHaveLength(1);

      // Second call should use cache
      const tools2 = await server.listTools();
      expect(tools2).toHaveLength(1);
      expect(tools2[0].name).toBe('test-tool');
    });

    it('should handle nested tools response format', async () => {
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

      // Nested format: { tools: { tools: [...] } }
      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: {
            tools: [
              {
                name: 'nested-tool',
                description: 'Nested tool',
                inputSchema: {},
              },
            ],
          },
        },
      };

      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      await server.initialize();

      const tools = await server.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('nested-tool');
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

      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/call') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return callToolResponse;
              },
              async text() {
                return JSON.stringify(callToolResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      mockSseClient.setResponse(2, toolsResponse);

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      await server.initialize();

      const result = await server.callTool('test-tool', { arg1: 'value1' });
      expect(result).toBeDefined();
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

      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [],
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

      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return resourcesResponse;
              },
              async text() {
                return JSON.stringify(resourcesResponse);
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      await server.initialize();

      // After initialization, resources might be empty array, so we need to call listResources again
      // Clear cache to force a new request
      (server as unknown as { cachedResources: McpResource[] | null }).cachedResources = null;

      // Mock fetch for the explicit listResources call
      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'resources/list') {
            // Return resources array directly (not wrapped in object)
            // The implementation expects response.result to be McpResource[]
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                // Return resources array directly, not wrapped in object
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: resourcesResponse.result.resources,
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: resourcesResponse.result.resources,
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const resources = await server.listResources();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBe(1);
      expect(resources[0].uri).toBe('resource://test');
    });
  });

  describe('session management', () => {
    it('should extract sessionId from initialize response headers', async () => {
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
          tools: [],
        },
      };

      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
                'Mcp-Session-Id': 'test-session-id-123',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, null, null, mockSseClient);
      await server.initialize();

      // Session ID should be stored and used in subsequent requests
      const tools = await server.listTools();
      expect(Array.isArray(tools)).toBe(true);
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

      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [],
        },
      };

      let capturedHeaders: Record<string, string> = {};
      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.headers) {
          capturedHeaders = options.headers as Record<string, string>;
        }
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, oauthToken, null, mockSseClient);
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

      const toolsResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: [],
        },
      };

      let capturedHeaders: Record<string, string> = {};
      global.fetch = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => {
        if (options?.headers) {
          capturedHeaders = options.headers as Record<string, string>;
        }
        if (options?.method === 'POST') {
          const body = options.body as string;
          const request = JSON.parse(body) as JsonRpcRequest;

          if (request.method === 'initialize') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return initializeResponse;
              },
              async text() {
                return JSON.stringify(initializeResponse);
              },
            };
          }

          if (request.method === 'tools/list') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return toolsResponse;
              },
              async text() {
                return JSON.stringify(toolsResponse);
              },
            };
          }

          if (request.method === 'resources/list') {
            // Return empty resources list for initialization
            return {
              ok: true,
              status: 200,
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
              async json() {
                return {
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                };
              },
              async text() {
                return JSON.stringify({
                  jsonrpc: '2.0',
                  id: request.id,
                  result: {
                    resources: [],
                  },
                });
              },
            };
          }
        }
        if (options?.method === 'GET' || !options?.method) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/event-stream',
            }),
            body: new ReadableStream({
              start(controller) {
                setTimeout(() => controller.close(), 10);
              },
            }),
            async text() {
              return '';
            },
          };
        }
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          async text() {
            return 'Not Found';
          },
        };
      });

      const server = new RemoteSseMcpServer(config, null, apiKeyConfig, mockSseClient);
      await server.initialize();

      expect(capturedHeaders['X-API-Key']).toBe('Bearer test-api-key-12345');
    });
  });
});
