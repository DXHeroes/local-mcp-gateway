import { beforeEach, describe, expect, it } from 'vitest';
import { McpServer } from '../../src/abstractions/McpServer.js';
import { ProxyHandler } from '../../src/abstractions/ProxyHandler.js';
import type { JsonRpcRequest, McpResource, McpTool } from '../../src/types/mcp.js';

class MockMcpServer extends McpServer {
  private tools: McpTool[] = [];
  private resources: McpResource[] = [];

  constructor(_serverId: string, tools: McpTool[] = [], resources: McpResource[] = []) {
    super();
    this.tools = tools;
    this.resources = resources;
  }

  async initialize(): Promise<void> {
    // Mock implementation
  }

  async listTools(): Promise<McpTool[]> {
    return this.tools;
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    const tool = this.tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }
    return { result: `Called ${name} with args: ${JSON.stringify(args)}` };
  }

  async listResources(): Promise<McpResource[]> {
    return this.resources;
  }

  async readResource(uri: string): Promise<unknown> {
    const resource = this.resources.find((r) => r.uri === uri);
    if (!resource) {
      throw new Error(`Resource "${uri}" not found`);
    }
    return { content: `Content of ${uri}` };
  }
}

describe('ProxyHandler', () => {
  let handler: ProxyHandler;

  beforeEach(() => {
    handler = new ProxyHandler();
  });

  describe('registerServer', () => {
    it('should register a server', () => {
      const server = new MockMcpServer('server1');
      handler.registerServer('server1', server);

      expect(handler.getServerIds()).toContain('server1');
    });
  });

  describe('unregisterServer', () => {
    it('should unregister a server', () => {
      const server = new MockMcpServer('server1');
      handler.registerServer('server1', server);
      handler.unregisterServer('server1');

      expect(handler.getServerIds()).not.toContain('server1');
    });
  });

  describe('listTools', () => {
    it('should list tools from all servers', async () => {
      const server1 = new MockMcpServer('server1', [
        { name: 'tool1', description: 'Tool 1', inputSchema: {} as Record<string, unknown> },
      ]);
      const server2 = new MockMcpServer('server2', [
        { name: 'tool2', description: 'Tool 2', inputSchema: {} as Record<string, unknown> },
      ]);

      handler.registerServer('server1', server1);
      handler.registerServer('server2', server2);

      const tools = await handler.listTools();
      expect(tools.length).toBe(2);
    });

    it('should handle name conflicts by prefixing', async () => {
      const server1 = new MockMcpServer('server1', [
        { name: 'tool1', description: 'Tool 1', inputSchema: {} as Record<string, unknown> },
      ]);
      const server2 = new MockMcpServer('server2', [
        {
          name: 'tool1',
          description: 'Tool 1 duplicate',
          inputSchema: {} as Record<string, unknown>,
        },
      ]);

      handler.registerServer('server1', server1);
      handler.registerServer('server2', server2);

      const tools = await handler.listTools();
      expect(tools.length).toBe(2);
      expect(tools.some((t) => t.name.startsWith('server2:'))).toBe(true);
    });
  });

  describe('listResources', () => {
    it('should list resources from all servers', async () => {
      const server1 = new MockMcpServer('server1', [], [{ uri: 'resource1', name: 'Resource 1' }]);
      const server2 = new MockMcpServer('server2', [], [{ uri: 'resource2', name: 'Resource 2' }]);

      handler.registerServer('server1', server1);
      handler.registerServer('server2', server2);

      const resources = await handler.listResources();
      expect(resources.length).toBe(2);
    });
  });

  describe('callTool', () => {
    it('should call tool from correct server', async () => {
      const server1 = new MockMcpServer('server1', [
        { name: 'tool1', description: 'Tool 1', inputSchema: {} as Record<string, unknown> },
      ]);
      const server2 = new MockMcpServer('server2', [
        { name: 'tool2', description: 'Tool 2', inputSchema: {} as Record<string, unknown> },
      ]);

      handler.registerServer('server1', server1);
      handler.registerServer('server2', server2);

      const result = await handler.callTool('tool1', { arg: 'value' });
      expect(result).toBeDefined();
    });

    it('should handle prefixed tool names', async () => {
      const server1 = new MockMcpServer('server1', [
        { name: 'tool1', description: 'Tool 1', inputSchema: {} as Record<string, unknown> },
      ]);

      handler.registerServer('server1', server1);

      const result = await handler.callTool('server1:tool1', { arg: 'value' });
      expect(result).toBeDefined();
    });

    it('should throw error if tool not found', async () => {
      await expect(handler.callTool('non-existent', {})).rejects.toThrow('not found');
    });
  });

  describe('readResource', () => {
    it('should read resource from correct server', async () => {
      const server1 = new MockMcpServer('server1', [], [{ uri: 'resource1', name: 'Resource 1' }]);

      handler.registerServer('server1', server1);

      const result = await handler.readResource('resource1');
      expect(result).toBeDefined();
    });

    it('should throw error if resource not found', async () => {
      await expect(handler.readResource('non-existent')).rejects.toThrow('not found');
    });
  });

  describe('handleRequest', () => {
    it('should handle tools/list request', async () => {
      const server = new MockMcpServer('server1', [
        { name: 'tool1', description: 'Tool 1', inputSchema: {} as Record<string, unknown> },
      ]);
      handler.registerServer('server1', server);

      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'tools/list',
      };

      const response = await handler.handleRequest(request);
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('1');
      expect(response.result).toBeDefined();
    });

    it('should handle tools/call request', async () => {
      const server = new MockMcpServer('server1', [
        { name: 'tool1', description: 'Tool 1', inputSchema: {} as Record<string, unknown> },
      ]);
      handler.registerServer('server1', server);

      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'tools/call',
        params: { name: 'tool1', arguments: { arg: 'value' } },
      };

      const response = await handler.handleRequest(request);
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('1');
      expect(response.result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: '1',
        method: 'unknown-method',
      };

      const response = await handler.handleRequest(request);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32603);
    });
  });
});
