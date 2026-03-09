/**
 * Unit tests for ExternalMcpServer
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExternalMcpConfig } from '../../src/types/mcp.js';

// Shared mock instances that persist across the module
const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  listTools: vi.fn().mockResolvedValue({
    tools: [
      {
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  }),
  callTool: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'result' }],
  }),
  listResources: vi.fn().mockResolvedValue({
    resources: [
      {
        uri: 'test://resource',
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'text/plain',
      },
    ],
  }),
  readResource: vi.fn().mockResolvedValue({
    contents: [{ uri: 'test://resource', text: 'content' }],
  }),
};

const mockTransport = {
  close: vi.fn().mockResolvedValue(undefined),
  onerror: null as ((error: Error) => void) | null,
  onclose: null as (() => void) | null,
};

// Mock the MCP SDK modules before importing ExternalMcpServer
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: class MockClient {
    connect = mockClient.connect;
    listTools = mockClient.listTools;
    callTool = mockClient.callTool;
    listResources = mockClient.listResources;
    readResource = mockClient.readResource;
  },
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: class MockStdioClientTransport {
    close = mockTransport.close;
    onerror = mockTransport.onerror;
    onclose = mockTransport.onclose;
  },
  getDefaultEnvironment: vi.fn().mockReturnValue({ PATH: '/usr/bin' }),
}));

// Import after mocks are set up
import { ExternalMcpServer } from '../../src/abstractions/ExternalMcpServer.js';

function getDefaultConfig(): ExternalMcpConfig {
  return {
    command: 'node',
    args: ['-e', 'console.log("hello")'],
  };
}

describe('ExternalMcpServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransport.onerror = null;
    mockTransport.onclose = null;
    mockClient.connect.mockResolvedValue(undefined);
    mockClient.listTools.mockResolvedValue({
      tools: [
        {
          name: 'test-tool',
          description: 'A test tool',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    });
    mockClient.callTool.mockResolvedValue({
      content: [{ type: 'text', text: 'result' }],
    });
    mockClient.listResources.mockResolvedValue({
      resources: [
        {
          uri: 'test://resource',
          name: 'Test Resource',
          description: 'A test resource',
          mimeType: 'text/plain',
        },
      ],
    });
    mockClient.readResource.mockResolvedValue({
      contents: [{ uri: 'test://resource', text: 'content' }],
    });
    mockTransport.close.mockResolvedValue(undefined);
  });

  describe('constructor', () => {
    it('should set default config values', () => {
      const server = new ExternalMcpServer({ command: 'npx', args: ['-y', 'some-package'] });
      const info = server.getProcessInfo();

      expect(info.state).toBe('stopped');
      expect(info.restartCount).toBe(0);
      expect(info.pid).toBeUndefined();
      expect(info.startedAt).toBeUndefined();
      expect(info.lastError).toBeUndefined();
    });

    it('should accept custom config', () => {
      const config: ExternalMcpConfig = {
        command: 'node',
        args: ['server.js'],
        autoRestart: false,
        maxRestartAttempts: 5,
        startupTimeout: 10000,
        shutdownTimeout: 3000,
        env: { MY_VAR: 'value' },
        workingDirectory: '/tmp',
      };

      const server = new ExternalMcpServer(config);
      expect(server.getProcessInfo().state).toBe('stopped');
    });
  });

  describe('getProcessInfo', () => {
    it('should return initial state', () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      const info = server.getProcessInfo();

      expect(info).toEqual({
        state: 'stopped',
        pid: undefined,
        startedAt: undefined,
        restartCount: 0,
        lastError: undefined,
      });
    });
  });

  describe('getStderr', () => {
    it('should return empty array initially', () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      expect(server.getStderr()).toEqual([]);
    });

    it('should return a copy of stderr buffer', () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      const stderr1 = server.getStderr();
      const stderr2 = server.getStderr();
      expect(stderr1).not.toBe(stderr2);
    });
  });

  describe('onStateChange', () => {
    it('should subscribe to state changes and return unsubscribe function', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      const states: string[] = [];

      const unsubscribe = server.onStateChange((state) => {
        states.push(state);
      });

      expect(typeof unsubscribe).toBe('function');

      await server.initialize();

      expect(states).toContain('starting');
      expect(states).toContain('running');

      unsubscribe();
    });

    it('should stop receiving events after unsubscribe', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      const states: string[] = [];

      const unsubscribe = server.onStateChange((state) => {
        states.push(state);
      });

      unsubscribe();

      await server.initialize();

      expect(states).toEqual([]);
    });
  });

  describe('initialize', () => {
    it('should start the process and transition to running', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());

      await server.initialize();

      const info = server.getProcessInfo();
      expect(info.state).toBe('running');
      expect(info.startedAt).toBeDefined();
    });

    it('should be idempotent when already running', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());

      await server.initialize();
      await server.initialize();

      expect(server.getProcessInfo().state).toBe('running');
    });

    it('should transition to crashed on startup failure', async () => {
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const server = new ExternalMcpServer(getDefaultConfig());

      await expect(server.initialize()).rejects.toThrow('Connection failed');

      expect(server.getProcessInfo().state).toBe('crashed');
      expect(server.getProcessInfo().lastError).toBe('Connection failed');
    });
  });

  describe('listTools', () => {
    it('should return tools from MCP client', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const tools = await server.listTools();

      expect(tools).toEqual([
        {
          name: 'test-tool',
          description: 'A test tool',
          inputSchema: { type: 'object', properties: {} },
        },
      ]);
    });

    it('should cache tools after first call', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      await server.listTools();
      await server.listTools();

      expect(mockClient.listTools).toHaveBeenCalledTimes(1);
    });

    it('should throw when not connected', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());

      await expect(server.listTools()).rejects.toThrow('External MCP server is not connected');
    });
  });

  describe('callTool', () => {
    it('should forward call to MCP client', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const result = await server.callTool('test-tool', { arg: 'value' });

      expect(mockClient.callTool).toHaveBeenCalledWith({
        name: 'test-tool',
        arguments: { arg: 'value' },
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: 'result' }],
      });
    });

    it('should throw when not connected', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());

      await expect(server.callTool('test-tool', {})).rejects.toThrow(
        'External MCP server is not connected'
      );
    });
  });

  describe('listResources', () => {
    it('should return resources from MCP client', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const resources = await server.listResources();

      expect(resources).toEqual([
        {
          uri: 'test://resource',
          name: 'Test Resource',
          description: 'A test resource',
          mimeType: 'text/plain',
        },
      ]);
    });

    it('should cache resources after first call', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      await server.listResources();
      await server.listResources();

      expect(mockClient.listResources).toHaveBeenCalledTimes(1);
    });

    it('should handle Method not found error gracefully', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      mockClient.listResources.mockRejectedValueOnce(new Error('Method not found (-32601)'));

      const resources = await server.listResources();
      expect(resources).toEqual([]);
    });

    it('should throw when not connected', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());

      await expect(server.listResources()).rejects.toThrow('External MCP server is not connected');
    });
  });

  describe('readResource', () => {
    it('should forward to MCP client', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const result = await server.readResource('test://resource');

      expect(mockClient.readResource).toHaveBeenCalledWith({ uri: 'test://resource' });
      expect(result).toEqual({
        contents: [{ uri: 'test://resource', text: 'content' }],
      });
    });
  });

  describe('clearToolsCache', () => {
    it('should clear both tool and resource caches', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      // Populate caches
      await server.listTools();
      await server.listResources();

      expect(mockClient.listTools).toHaveBeenCalledTimes(1);
      expect(mockClient.listResources).toHaveBeenCalledTimes(1);

      // Clear caches
      server.clearToolsCache();

      // Should fetch fresh data
      await server.listTools();
      await server.listResources();

      expect(mockClient.listTools).toHaveBeenCalledTimes(2);
      expect(mockClient.listResources).toHaveBeenCalledTimes(2);
    });
  });

  describe('shutdown', () => {
    it('should transition through stopping to stopped', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const states: string[] = [];
      server.onStateChange((state) => states.push(state));

      await server.shutdown();

      expect(states).toContain('stopping');
      expect(states).toContain('stopped');
      expect(server.getProcessInfo().state).toBe('stopped');
    });

    it('should be idempotent when already stopped', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());

      await server.shutdown();
      expect(server.getProcessInfo().state).toBe('stopped');
    });
  });

  describe('validate', () => {
    it('should return valid when tools can be listed', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());

      const result = await server.validate();

      expect(result).toEqual({ valid: true, error: undefined });
    });

    it('should return invalid with error on failure', async () => {
      mockClient.connect.mockRejectedValueOnce(new Error('Cannot connect'));

      const server = new ExternalMcpServer(getDefaultConfig());

      const result = await server.validate();

      expect(result).toEqual({ valid: false, error: 'Cannot connect' });
    });
  });

  describe('handleRequest', () => {
    it('should dispatch tools/list', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
      });

      expect(response).toEqual({
        jsonrpc: '2.0',
        id: 1,
        result: {
          tools: [
            {
              name: 'test-tool',
              description: 'A test tool',
              inputSchema: { type: 'object', properties: {} },
            },
          ],
        },
      });
    });

    it('should dispatch tools/call', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'test-tool', arguments: { key: 'val' } },
      });

      expect(response?.result).toEqual({
        content: [{ type: 'text', text: 'result' }],
      });
    });

    it('should return error for unknown method', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const response = await server.handleRequest({
        jsonrpc: '2.0',
        id: 3,
        method: 'unknown/method',
      });

      expect(response?.error).toBeDefined();
      expect(response?.error?.message).toBe('Unknown method: unknown/method');
    });

    it('should return undefined for notifications', async () => {
      const server = new ExternalMcpServer(getDefaultConfig());
      await server.initialize();

      const response = await server.handleRequest({
        jsonrpc: '2.0',
        method: 'tools/list',
      });

      expect(response).toBeUndefined();
    });
  });
});
