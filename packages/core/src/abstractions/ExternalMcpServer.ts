/**
 * External MCP Server
 *
 * Implements McpServer interface for external/NPX-based MCP servers
 * that communicate via stdio (stdin/stdout).
 *
 * Uses the MCP SDK's StdioClientTransport for communication with spawned processes.
 */

import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  getDefaultEnvironment,
  StdioClientTransport,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  ExternalMcpConfig,
  ExternalProcessInfo,
  ExternalProcessState,
  JsonRpcRequest,
  JsonRpcResponse,
  McpResource,
  McpTool,
} from '../types/mcp.js';
import { McpServer } from './McpServer.js';

/**
 * Default configuration values
 */
const DEFAULT_STARTUP_TIMEOUT = 30000; // 30 seconds
const DEFAULT_SHUTDOWN_TIMEOUT = 5000; // 5 seconds
const DEFAULT_MAX_RESTART_ATTEMPTS = 3;
const RESTART_BACKOFF_BASE = 1000; // 1 second

/**
 * External MCP Server
 *
 * Spawns an external process (e.g., npx command) and communicates
 * with it via stdio using the MCP protocol.
 */
export class ExternalMcpServer extends McpServer {
  private config: ExternalMcpConfig;
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private state: ExternalProcessState = 'stopped';
  private restartCount = 0;
  private startedAt: Date | null = null;
  private lastError: string | null = null;
  private isShuttingDown = false;
  private eventEmitter = new EventEmitter();
  private cachedTools: McpTool[] | null = null;
  private cachedResources: McpResource[] | null = null;
  private stderrBuffer: string[] = [];

  constructor(config: ExternalMcpConfig) {
    super();
    this.config = {
      autoRestart: true,
      maxRestartAttempts: DEFAULT_MAX_RESTART_ATTEMPTS,
      startupTimeout: DEFAULT_STARTUP_TIMEOUT,
      shutdownTimeout: DEFAULT_SHUTDOWN_TIMEOUT,
      ...config,
    };
  }

  /**
   * Get current process information
   */
  getProcessInfo(): ExternalProcessInfo {
    return {
      state: this.state,
      pid: this.process?.pid,
      startedAt: this.startedAt ?? undefined,
      restartCount: this.restartCount,
      lastError: this.lastError ?? undefined,
    };
  }

  /**
   * Get stderr output buffer (useful for debugging)
   */
  getStderr(): string[] {
    return [...this.stderrBuffer];
  }

  /**
   * Subscribe to process state changes
   */
  onStateChange(callback: (state: ExternalProcessState) => void): () => void {
    this.eventEmitter.on('stateChange', callback);
    return () => this.eventEmitter.off('stateChange', callback);
  }

  /**
   * Initialize the external MCP server
   * Spawns the process and establishes stdio communication
   */
  async initialize(): Promise<void> {
    if (this.state === 'running') {
      return;
    }

    await this.startProcess();
  }

  /**
   * Start the external process
   */
  private async startProcess(): Promise<void> {
    this.setState('starting');
    this.lastError = null;

    try {
      // Build environment variables
      const env = {
        ...getDefaultEnvironment(),
        ...this.config.env,
      };

      // Create the stdio transport
      this.transport = new StdioClientTransport({
        command: this.config.command,
        args: this.config.args,
        env,
        cwd: this.config.workingDirectory,
        stderr: 'pipe', // Capture stderr for debugging
      });

      // Create the MCP client
      this.client = new Client(
        {
          name: 'local-mcp-gateway',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Start connection with timeout
      const startupTimeout = this.config.startupTimeout ?? DEFAULT_STARTUP_TIMEOUT;
      const connectPromise = this.client.connect(this.transport);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Startup timeout after ${startupTimeout}ms`));
        }, startupTimeout);
      });

      await Promise.race([connectPromise, timeoutPromise]);

      // Get the underlying process for state tracking
      // Note: StdioClientTransport doesn't expose the process directly,
      // but we can track state through the transport events
      this.startedAt = new Date();
      this.setState('running');

      // Setup error handling on transport
      this.transport.onerror = (error) => {
        console.error('[ExternalMcpServer] Transport error:', error);
        this.lastError = error.message;
        if (!this.isShuttingDown) {
          this.handleProcessExit(1);
        }
      };

      this.transport.onclose = () => {
        console.log('[ExternalMcpServer] Transport closed');
        if (!this.isShuttingDown) {
          this.handleProcessExit(0);
        }
      };

      console.log(
        `[ExternalMcpServer] Started: ${this.config.command} ${(this.config.args ?? []).join(' ')}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.lastError = errorMessage;
      this.setState('crashed');
      console.error('[ExternalMcpServer] Failed to start:', errorMessage);
      throw error;
    }
  }

  /**
   * Handle process exit
   */
  private async handleProcessExit(code: number): Promise<void> {
    if (this.isShuttingDown) {
      this.setState('stopped');
      return;
    }

    console.log(`[ExternalMcpServer] Process exited with code ${code}`);

    // Check if we should auto-restart
    if (
      this.config.autoRestart &&
      this.restartCount < (this.config.maxRestartAttempts ?? DEFAULT_MAX_RESTART_ATTEMPTS)
    ) {
      this.setState('restarting');
      this.restartCount++;

      // Exponential backoff
      const delay = RESTART_BACKOFF_BASE * 2 ** (this.restartCount - 1);
      console.log(
        `[ExternalMcpServer] Restarting in ${delay}ms (attempt ${this.restartCount}/${this.config.maxRestartAttempts})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      if (!this.isShuttingDown) {
        try {
          // Clear caches before restart
          this.cachedTools = null;
          this.cachedResources = null;
          await this.startProcess();
        } catch (error) {
          console.error('[ExternalMcpServer] Restart failed:', error);
        }
      }
    } else {
      this.setState('crashed');
      if (this.config.autoRestart) {
        this.lastError = `Max restart attempts (${this.config.maxRestartAttempts}) exceeded`;
      }
    }
  }

  /**
   * Set process state and emit event
   */
  private setState(state: ExternalProcessState): void {
    if (this.state !== state) {
      this.state = state;
      this.eventEmitter.emit('stateChange', state);
    }
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<McpTool[]> {
    if (this.cachedTools) {
      return this.cachedTools;
    }

    const client = this.ensureConnected();

    const result = await client.listTools();

    // Convert SDK tool format to our McpTool format
    this.cachedTools = (result.tools ?? []).map((tool) => ({
      name: tool.name,
      description: tool.description ?? '',
      inputSchema: tool.inputSchema as McpTool['inputSchema'],
    }));

    return this.cachedTools;
  }

  /**
   * Call a tool by name
   */
  async callTool(name: string, args: unknown): Promise<unknown> {
    const client = this.ensureConnected();

    const result = await client.callTool({
      name,
      arguments: args as Record<string, unknown>,
    });

    return result;
  }

  /**
   * List all available resources
   */
  async listResources(): Promise<McpResource[]> {
    if (this.cachedResources) {
      return this.cachedResources;
    }

    const client = this.ensureConnected();

    try {
      const result = await client.listResources();

      // Convert SDK resource format to our McpResource format
      this.cachedResources = (result.resources ?? []).map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));

      return this.cachedResources;
    } catch (error) {
      // Some MCP servers don't support resources/list
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Method not found') || errorMessage.includes('-32601')) {
        this.cachedResources = [];
        return this.cachedResources;
      }
      throw error;
    }
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<unknown> {
    const client = this.ensureConnected();

    const result = await client.readResource({ uri });

    return result;
  }

  /**
   * Validate the server configuration
   * For external servers, we validate by attempting to list tools
   */
  async validate(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (this.state !== 'running') {
        await this.initialize();
      }

      // Try to list tools as a validation
      await this.listTools();

      return {
        valid: true,
        error: undefined,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Ensure the client is connected and return it
   */
  private ensureConnected(): Client {
    if (!this.client || this.state !== 'running') {
      throw new Error('External MCP server is not connected');
    }
    return this.client;
  }

  /**
   * Clear cached tools and resources
   */
  override clearToolsCache(): void {
    this.cachedTools = null;
    this.cachedResources = null;
  }

  /**
   * Shutdown the external server
   */
  async shutdown(): Promise<void> {
    if (this.state === 'stopped') {
      return;
    }

    this.isShuttingDown = true;
    this.setState('stopping');

    const shutdownTimeout = this.config.shutdownTimeout ?? DEFAULT_SHUTDOWN_TIMEOUT;

    try {
      // Close the transport gracefully
      if (this.transport) {
        const closePromise = this.transport.close();
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('[ExternalMcpServer] Shutdown timeout, forcing close');
            resolve();
          }, shutdownTimeout);
        });

        await Promise.race([closePromise, timeoutPromise]);
      }
    } catch (error) {
      console.warn('[ExternalMcpServer] Error during shutdown:', error);
    } finally {
      this.client = null;
      this.transport = null;
      this.process = null;
      this.setState('stopped');
      this.isShuttingDown = false;
    }
  }

  /**
   * Handle a raw JSON-RPC request
   * Forwards requests to the external MCP server
   * @returns JSON-RPC response, or void for notifications (requests without id)
   */
  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
    const isNotification = request.id === undefined;

    try {
      let result: unknown;

      switch (request.method) {
        case 'tools/list': {
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

      if (isNotification) {
        return;
      }

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result,
      };
    } catch (error) {
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
