/**
 * Remote SSE MCP Server
 *
 * Implements McpServer interface for remote SSE MCP servers
 * Uses Server-Sent Events (SSE) for real-time communication
 */

import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { OAuthToken } from '../types/database';
import type {
  ApiKeyConfig,
  JsonRpcRequest,
  JsonRpcResponse,
  McpResource,
  McpTool,
  RemoteSseMcpConfig,
} from '../types/mcp.js';
import { McpServer } from './McpServer';

/**
 * SSE client interface for making requests
 * Allows dependency injection for testing
 */
export interface SseClient {
  connect(url: string, headers?: Record<string, string>): Promise<EventEmitter>;
  send(message: JsonRpcRequest): Promise<void>;
  disconnect(): void;
}

/**
 * Default SSE client implementation using fetch streaming
 * Note: SSE is typically one-way (server -> client), so requests are sent via HTTP POST
 */
class DefaultSseClient implements SseClient {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private abortController: AbortController | null = null;
  private pendingRequests: Map<
    string | number,
    { resolve: (value: JsonRpcResponse) => void; reject: (error: Error) => void }
  > = new Map();

  async connect(url: string, headers: Record<string, string> = {}): Promise<EventEmitter> {
    const emitter = new EventEmitter();

    // For Node.js environment, we'll use fetch with streaming
    this.abortController = new AbortController();

    // Linear SSE requires OAuth token in Authorization header and GET method
    // According to Linear MCP docs: SSE connection uses GET with Authorization: Bearer <token>
    const hasOAuthToken = headers.Authorization?.startsWith('Bearer ');

    console.log('[DefaultSseClient] Connecting to SSE endpoint:', url);
    console.log('[DefaultSseClient] Has OAuth token:', !!hasOAuthToken);
    console.log('[DefaultSseClient] Headers:', Object.keys(headers).join(', '));
    if (hasOAuthToken && headers.Authorization) {
      console.log(
        '[DefaultSseClient] Authorization header preview:',
        `${headers.Authorization.substring(0, 20)}...`
      );
    }

    // Linear SSE requires GET method with Authorization header
    // Standard SSE: always try GET first (Linear SSE uses GET with OAuth token)
    console.log('[DefaultSseClient] Trying GET method');
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...headers,
      },
      signal: this.abortController.signal,
    });

    console.log('[DefaultSseClient] GET response status:', response.status, response.statusText);
    console.log(
      '[DefaultSseClient] Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    // If GET fails with 404 and we have OAuth token, Linear SSE might need different handling
    // But according to docs, Linear SSE uses GET with Authorization header
    // If GET fails, try POST only as fallback for non-Linear servers
    if (!response.ok && response.status === 404 && !hasOAuthToken) {
      console.log('[DefaultSseClient] GET failed with 404 (no OAuth), trying POST...');
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: this.abortController.signal,
      });
      console.log('[DefaultSseClient] POST response status:', response.status, response.statusText);
    }

    if (!response.ok) {
      // Read response body to get error details
      let errorBody = '';
      try {
        const text = await response.text();
        errorBody = text.substring(0, 500); // Limit to 500 chars
        console.error('[DefaultSseClient] Error response body:', errorBody);
        console.error(
          '[DefaultSseClient] Response headers:',
          Object.fromEntries(response.headers.entries())
        );
      } catch (readError) {
        console.error('[DefaultSseClient] Failed to read error response body:', readError);
        // If we can't read body, continue with status code only
      }

      const errorMessage = errorBody
        ? `Failed to connect to SSE endpoint: ${response.status}. Response: ${errorBody}`
        : `Failed to connect to SSE endpoint: ${response.status}`;

      console.error('[DefaultSseClient] Throwing error:', errorMessage);
      throw new Error(errorMessage);
    }

    this.reader = response.body?.getReader() || null;
    const decoder = new TextDecoder();

    if (!this.reader) {
      throw new Error('Failed to get response body reader');
    }

    let buffer = '';

    const processStream = async () => {
      try {
        while (true) {
          if (!this.reader) break;
          const { done, value } = await this.reader.read();

          if (done) {
            emitter.emit('close');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                emitter.emit('message', data);
              } catch (_error) {
                // Ignore invalid JSON
              }
            }
          }
        }
      } catch (error) {
        // Ignore expected errors (stream closed, terminated, etc.)
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = error instanceof Error && 'code' in error ? String(error.code) : '';

        const isExpectedError =
          errorMessage.includes('terminated') ||
          errorMessage.includes('Body Timeout Error') ||
          errorMessage.includes('other side closed') ||
          errorCode === 'UND_ERR_SOCKET' ||
          errorCode === 'UND_ERR_BODY_TIMEOUT';

        if (!isExpectedError) {
          // Only emit unexpected errors
          emitter.emit('error', error);
        } else {
          // For expected errors, just emit close event
          emitter.emit('close');
        }
      }
    };

    processStream();

    emitter.on('message', (data: JsonRpcResponse) => {
      if (data.id !== null && data.id !== undefined) {
        const pending = this.pendingRequests.get(data.id);
        if (pending) {
          this.pendingRequests.delete(data.id);
          if (data.error) {
            pending.reject(new Error(data.error.message));
          } else {
            pending.resolve(data);
          }
        }
      }
    });

    return emitter;
  }

  async send(_message: JsonRpcRequest): Promise<void> {
    // SSE is one-way, so requests are sent via HTTP POST
    // This method is not used in the current implementation
    throw new Error('SSE client send not yet implemented - SSE is typically one-way');
  }

  disconnect(): void {
    // Close connection
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.reader) {
      this.reader.cancel();
      this.reader = null;
    }
  }
}

/**
 * Remote SSE MCP Server
 *
 * Connects to remote MCP servers via Server-Sent Events
 * Note: SSE is typically one-way (server -> client), so we may need
 * to use HTTP POST for requests and SSE for responses/streaming
 */
export class RemoteSseMcpServer extends McpServer {
  private sseClient: SseClient;
  private emitter: EventEmitter | null = null;
  private cachedTools: McpTool[] | null = null;
  private cachedResources: McpResource[] | null = null;
  private isConnected = false;
  private sessionId: string | null = null;
  private initializeResponseReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private initializeResponseEmitter: EventEmitter | null = null;

  constructor(
    private config: RemoteSseMcpConfig,
    private oauthToken: OAuthToken | null = null,
    private apiKeyConfig: ApiKeyConfig | null = null,
    sseClient?: SseClient
  ) {
    super();
    this.sseClient = sseClient || new DefaultSseClient();
  }

  /**
   * Initialize the remote SSE MCP server
   * Establishes SSE connection and fetches initial tools and resources
   * Extracts sessionId from Mcp-Session-Id header if provided by server
   * If resources/list is not supported, continues without error
   */
  async initialize(): Promise<void> {
    console.log('[RemoteSseMcpServer] Starting initialization...');
    console.log('[RemoteSseMcpServer] URL:', this.config.url);
    console.log('[RemoteSseMcpServer] Has OAuth token:', !!this.oauthToken);
    if (this.oauthToken) {
      console.log('[RemoteSseMcpServer] OAuth token type:', this.oauthToken.tokenType);
      console.log(
        '[RemoteSseMcpServer] OAuth token preview:',
        `${this.oauthToken.accessToken.substring(0, 20)}...`
      );
    }
    console.log('[RemoteSseMcpServer] Has API key:', !!this.apiKeyConfig);

    // Different SSE servers have different initialization flows:
    // 1. Linear SSE: Connect via GET with OAuth, then send initialize to /mcp endpoint
    // 2. Firecrawl SSE: Must send initialize request FIRST to create transport, then connect to SSE stream
    // 3. Other SSE servers: May vary

    const hasOAuthToken = !!this.oauthToken;
    const isLinearSse = hasOAuthToken && this.config.url.includes('linear');

    if (isLinearSse) {
      // Linear SSE: Connect to SSE stream first, then send initialize
      try {
        await this.ensureConnected();
        console.log('[RemoteSseMcpServer] SSE connection established (Linear SSE)');

        // Try sending initialize request (may be optional for Linear SSE)
        try {
          await this.sendInitializeRequest();
          console.log('[RemoteSseMcpServer] Initialize request sent successfully');
        } catch (initError) {
          const initErrorMessage =
            initError instanceof Error ? initError.message : String(initError);
          console.warn(
            '[RemoteSseMcpServer] Initialize request failed (may be optional for Linear SSE):',
            initErrorMessage
          );
          // For Linear SSE, initialize might not be needed if SSE stream is already active
          // Continue anyway if it's a 404 - SSE connection might be sufficient
          if (!initErrorMessage.includes('404') && !initErrorMessage.includes('Not Found')) {
            throw initError;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[RemoteSseMcpServer] Failed to establish SSE connection:', errorMessage);
        throw error;
      }
    } else {
      // Firecrawl and other SSE servers: Send initialize request FIRST to create transport
      // Firecrawl requires initialize request to establish the transport before connecting to SSE stream
      try {
        // First, try to send initialize request - this may create the transport
        // For firecrawl, initialize request must be sent to the same URL
        await this.sendInitializeRequest();
        console.log(
          '[RemoteSseMcpServer] Initialize request sent successfully (Firecrawl/other SSE)'
        );

        // If initialize response was SSE stream, we're already connected
        if (this.isConnected && this.initializeResponseEmitter) {
          console.log('[RemoteSseMcpServer] Using SSE transport from initialize response');
          this.setupEventHandlers();
          // Transport is active, we're done
        } else {
          // If initialize returned JSON (not SSE stream), transport is established via POST requests
          // For firecrawl: POST requests work directly after initialize, no separate SSE stream needed
          // Some servers may still need SSE stream for receiving updates, but requests work via POST
          console.log(
            '[RemoteSseMcpServer] Initialize returned JSON - using POST requests for transport'
          );
          // Mark as connected since POST requests will work
          this.isConnected = true;
          // Don't try to connect to separate SSE stream - it's not needed for firecrawl
        }
      } catch (initError) {
        const initErrorMessage = initError instanceof Error ? initError.message : String(initError);
        console.warn(
          '[RemoteSseMcpServer] Initialize request failed, trying direct SSE connection:',
          initErrorMessage
        );
        // If initialize fails, try direct SSE connection (fallback for servers that don't require initialize first)
        try {
          await this.ensureConnected();
          console.log('[RemoteSseMcpServer] SSE connection established (fallback)');
        } catch (connectError) {
          console.error(
            '[RemoteSseMcpServer] Both initialize and direct connection failed:',
            connectError
          );
          throw connectError;
        }
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
  }

  /**
   * Send InitializeRequest and extract sessionId from response header
   * Per MCP spec 2025-06-18: Server MAY assign sessionId in Mcp-Session-Id header
   * Handles both JSON and SSE stream responses
   * If server returns SSE stream, it creates an active transport that can be used for subsequent requests
   */
  private async sendInitializeRequest(): Promise<void> {
    const headers = this.buildHeaders();
    headers['Content-Type'] = 'application/json';
    // For firecrawl and similar servers: request SSE stream in response
    // For Linear SSE: accept both JSON and SSE stream
    const hasOAuth = !!this.oauthToken;
    const isLinear = hasOAuth && this.config.url.includes('linear');
    if (!isLinear) {
      // For firecrawl: prefer SSE stream response to establish transport
      headers.Accept = 'text/event-stream, application/json';
    } else {
      headers.Accept = 'application/json, text/event-stream';
    }

    // CRITICAL: Initialize request must NOT include Mcp-Session-Id header
    // Per MCP spec and Linear SSE: sessionId is assigned by server AFTER initialize
    // Remove sessionId header if present (it will be added by buildHeaders() if sessionId exists)
    delete headers['Mcp-Session-Id'];
    delete headers['mcp-session-id'];

    const initializeRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: {
          name: 'local-mcp-proxy',
          version: '1.0.0',
        },
      },
    };

    // For Linear SSE: if URL ends with /sse, try /mcp endpoint for initialize request
    // Linear SSE uses /sse for SSE stream, but /mcp for JSON-RPC requests
    // For Firecrawl and other SSE servers: use the same URL for initialize request
    let initializeUrl = this.config.url;
    const hasOAuthForLinear = this.oauthToken && this.config.url.includes('linear');
    if (initializeUrl.endsWith('/sse') && hasOAuthForLinear) {
      initializeUrl = initializeUrl.replace('/sse', '/mcp');
      console.log(
        '[RemoteSseMcpServer] Using /mcp endpoint for initialize request (Linear SSE):',
        initializeUrl
      );
    } else {
      console.log(
        '[RemoteSseMcpServer] Using same URL for initialize request (Firecrawl/other SSE):',
        initializeUrl
      );
    }

    console.log('[RemoteSseMcpServer] Sending initialize request to:', initializeUrl);
    console.log(
      '[RemoteSseMcpServer] Initialize request headers (without sessionId):',
      Object.keys(headers).join(', ')
    );

    const response = await fetch(initializeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(initializeRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to initialize: ${response.status} ${errorText}`);
    }

    // Extract Mcp-Session-Id header from response (case-insensitive per HTTP spec)
    const sessionIdHeader =
      response.headers.get('Mcp-Session-Id') || response.headers.get('mcp-session-id');
    if (sessionIdHeader) {
      this.sessionId = sessionIdHeader;
    }

    // Check Content-Type to determine if response is JSON or SSE stream
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // Server returned SSE stream - this creates an active transport
      // We can use this stream for subsequent communication
      // Parse SSE stream to find JSON-RPC response with id=1
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response body reader for SSE stream');
      }

      // Store reader to keep transport active
      this.initializeResponseReader = reader;
      this.isConnected = true; // Mark as connected since we have active transport

      const decoder = new TextDecoder();
      let buffer = '';
      let initializeResponse: JsonRpcResponse | null = null;
      const emitter = new EventEmitter();

      // Setup event handler for subsequent messages
      const processStream = async () => {
        try {
          while (true) {
            if (!this.initializeResponseReader) break;
            const { done, value } = await this.initializeResponseReader.read();

            if (done) {
              emitter.emit('close');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as JsonRpcResponse;
                  // Look for response with id=1 (our InitializeRequest id)
                  if (data.id === 1 && !initializeResponse) {
                    initializeResponse = data;
                  }
                  // Emit all messages for subsequent handling
                  emitter.emit('message', data);
                } catch {
                  // Ignore invalid JSON in SSE stream
                }
              }
            }

            if (initializeResponse) {
              // Don't break - keep reading stream for subsequent messages
            }
          }
        } catch (error) {
          // Ignore expected errors (stream closed, terminated, etc.)
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorCode = error instanceof Error && 'code' in error ? String(error.code) : '';

          const isExpectedError =
            errorMessage.includes('terminated') ||
            errorMessage.includes('Body Timeout Error') ||
            errorMessage.includes('other side closed') ||
            errorCode === 'UND_ERR_SOCKET' ||
            errorCode === 'UND_ERR_BODY_TIMEOUT';

          if (!isExpectedError) {
            // Only emit unexpected errors
            emitter.emit('error', error);
          } else {
            // For expected errors, just emit close event
            emitter.emit('close');
          }
        }
      };

      // Start processing stream
      processStream();

      // Setup message handler for JSON-RPC responses
      // Responses are handled by the Promise waiting for initializeResponse
      emitter.on('message', () => {
        // Responses are handled by the Promise waiting for initializeResponse
      });

      // Store emitter for this transport
      this.initializeResponseEmitter = emitter;
      this.emitter = emitter;
      this.isConnected = true;

      // Wait for initialize response
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for InitializeResult'));
        }, 10000);

        const checkResponse = (data?: JsonRpcResponse) => {
          // Check if we have the initialize response (id=1)
          if (data && data.id === 1) {
            clearTimeout(timeout);
            if (data.error) {
              reject(new Error(`Initialize failed: ${data.error.message}`));
            } else {
              resolve();
            }
          } else if (initializeResponse) {
            // Fallback: check local variable
            clearTimeout(timeout);
            if (initializeResponse.error) {
              reject(new Error(`Initialize failed: ${initializeResponse.error.message}`));
            } else {
              resolve();
            }
          }
        };

        // Listen for messages
        emitter.on('message', checkResponse);

        // Also check immediately in case response already arrived
        if (initializeResponse) {
          checkResponse();
        }
      });
    } else {
      // Parse JSON response
      const result = (await response.json()) as JsonRpcResponse;
      if (result.error) {
        throw new Error(`Initialize failed: ${result.error.message}`);
      }
      // For firecrawl and similar servers: JSON response means transport is established
      // We can use this transport for subsequent requests via POST
      // No need to connect to separate SSE stream - POST requests work directly
      console.log(
        '[RemoteSseMcpServer] Initialize returned JSON - transport established via POST requests'
      );
    }
  }

  /**
   * Build request headers with OAuth token or API key
   * Includes Mcp-Session-Id header if sessionId is available (per MCP spec 2025-06-18)
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

    // Add Mcp-Session-Id header if we have one (per MCP spec 2025-06-18)
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    return headers;
  }

  /**
   * Ensure SSE connection is established
   * Uses Mcp-Session-Id header from buildHeaders() (per MCP spec 2025-06-18)
   * If server returned SSE stream in InitializeRequest, uses that transport
   * Otherwise, connects to separate SSE stream via GET request
   */
  private async ensureConnected(): Promise<void> {
    // If we already have an active transport from InitializeRequest, use it
    if (this.isConnected && this.emitter && this.initializeResponseEmitter) {
      this.setupEventHandlers();
      return;
    }

    // If already connected via separate GET request, return
    if (this.isConnected && this.emitter) {
      return;
    }

    const headers = this.buildHeaders();
    let url = this.config.url;

    console.log('[RemoteSseMcpServer] ensureConnected - URL:', url);
    console.log('[RemoteSseMcpServer] ensureConnected - Headers:', Object.keys(headers).join(', '));
    console.log(
      '[RemoteSseMcpServer] ensureConnected - Has Authorization header:',
      !!headers.Authorization
    );

    // If server didn't provide sessionId in header, generate one and use it in header
    // Some servers require sessionId even if they don't send it in header
    if (!this.sessionId) {
      this.sessionId = randomUUID();
      headers['Mcp-Session-Id'] = this.sessionId;
      console.log(
        '[RemoteSseMcpServer] Generated sessionId:',
        `${this.sessionId.substring(0, 8)}...`
      );
    }

    // For Linear SSE with OAuth, don't add sessionId to query parameter
    // Linear SSE handles sessionId via header only
    // For other servers (like firecrawl), add sessionId to query parameter for GET requests
    const hasOAuthToken = headers.Authorization?.startsWith('Bearer ');
    if (this.sessionId && !hasOAuthToken) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('sessionId', this.sessionId);
      url = urlObj.toString();
      console.log('[RemoteSseMcpServer] Added sessionId to URL query:', url);
    } else {
      console.log(
        '[RemoteSseMcpServer] Not adding sessionId to query (OAuth token present or no sessionId)'
      );
    }

    try {
      this.emitter = await this.sseClient.connect(url, headers);
      this.isConnected = true;
      this.setupEventHandlers();
      console.log('[RemoteSseMcpServer] SSE connection successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[RemoteSseMcpServer] SSE connection failed:', errorMessage);
      console.error('[RemoteSseMcpServer] Connection URL:', url);
      console.error('[RemoteSseMcpServer] Connection headers:', JSON.stringify(headers, null, 2));
      throw error;
    }
  }

  /**
   * Setup event handlers for SSE connection
   */
  private setupEventHandlers(): void {
    if (!this.emitter) return;

    this.emitter.on('error', (error) => {
      // Ignore certain errors that are expected/normal:
      // - "terminated" - connection was closed (normal for SSE streams)
      // - "Body Timeout Error" - can happen with long-lived SSE streams
      // - Socket closed errors - server may close connection normally
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error && 'code' in error ? String(error.code) : '';

      const isExpectedError =
        errorMessage.includes('terminated') ||
        errorMessage.includes('Body Timeout Error') ||
        errorMessage.includes('other side closed') ||
        errorCode === 'UND_ERR_SOCKET' ||
        errorCode === 'UND_ERR_BODY_TIMEOUT';

      if (isExpectedError) {
        // These are expected - SSE streams can be closed by server or timeout
        // Just mark as disconnected, don't log as error
        this.isConnected = false;
        console.log(
          '[RemoteSseMcpServer] SSE stream closed (expected):',
          errorMessage.substring(0, 100)
        );
      } else {
        // Unexpected errors should be logged
        this.isConnected = false;
        console.error('[RemoteSseMcpServer] SSE connection error:', error);
      }
    });

    this.emitter.on('close', () => {
      this.isConnected = false;
      console.log('[RemoteSseMcpServer] SSE stream closed normally');
    });
  }

  /**
   * Make JSON-RPC request via HTTP POST (SSE is one-way)
   * For SSE transport, we typically use HTTP POST for requests
   * and SSE stream for responses/updates
   * Handles session expiration (404) per MCP spec 2025-06-18
   */
  private async makeRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    // For SSE transport, we need to use HTTP POST for requests
    // The SSE stream is for receiving updates/responses
    // Some SSE MCP servers require Accept: text/event-stream header even for POST requests

    const headers = this.buildHeaders();
    headers['Content-Type'] = 'application/json';
    headers.Accept = 'application/json, text/event-stream';

    // For Linear SSE: if URL ends with /sse, use /mcp endpoint for JSON-RPC requests
    // Linear SSE uses /sse for SSE stream (GET), but /mcp for JSON-RPC requests (POST)
    let requestUrl = this.config.url;
    if (requestUrl.endsWith('/sse')) {
      requestUrl = requestUrl.replace('/sse', '/mcp');
    }

    console.log('[RemoteSseMcpServer] Making JSON-RPC request to:', requestUrl);
    console.log('[RemoteSseMcpServer] Request method:', request.method);
    console.log('[RemoteSseMcpServer] Request id:', request.id);

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // Handle session expiration (per spec: 404 means session terminated)
    if (response.status === 404 && this.sessionId) {
      console.log('[RemoteSseMcpServer] Session expired (404), re-initializing...');
      // Clear sessionId and re-initialize
      this.sessionId = null;
      this.isConnected = false;
      await this.sendInitializeRequest();

      // Retry request with new sessionId
      const retryHeaders = this.buildHeaders();
      retryHeaders['Content-Type'] = 'application/json';
      retryHeaders.Accept = 'application/json, text/event-stream';

      console.log('[RemoteSseMcpServer] Retrying request after re-initialization');

      const retryResponse = await fetch(requestUrl, {
        method: 'POST',
        headers: retryHeaders,
        body: JSON.stringify(request),
      });

      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        throw new Error(`HTTP ${retryResponse.status}: ${errorText}`);
      }

      // Check Content-Type to determine if response is JSON or SSE stream
      const retryContentType = retryResponse.headers.get('content-type') || '';

      if (retryContentType.includes('text/event-stream')) {
        // Parse SSE stream to find JSON-RPC response
        const reader = retryResponse.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get response body reader for SSE stream');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let jsonRpcResponse: JsonRpcResponse | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as JsonRpcResponse;
                  // Look for response with matching id
                  if (data.id === request.id) {
                    jsonRpcResponse = data;
                    break;
                  }
                } catch {
                  // Ignore invalid JSON in SSE stream
                }
              }
            }

            if (jsonRpcResponse) break;
          }
        } finally {
          reader.cancel();
        }

        if (!jsonRpcResponse) {
          throw new Error('Failed to receive JSON-RPC response from SSE stream');
        }

        return jsonRpcResponse;
      }

      // Parse JSON response
      return (await retryResponse.json()) as JsonRpcResponse;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Check Content-Type to determine if response is JSON or SSE stream
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // Parse SSE stream to find JSON-RPC response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response body reader for SSE stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let jsonRpcResponse: JsonRpcResponse | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as JsonRpcResponse;
                // Look for response with matching id
                if (data.id === request.id) {
                  jsonRpcResponse = data;
                  break;
                }
              } catch {
                // Ignore invalid JSON in SSE stream
              }
            }
          }

          if (jsonRpcResponse) break;
        }
      } finally {
        reader.cancel();
      }

      if (!jsonRpcResponse) {
        throw new Error('Failed to receive JSON-RPC response from SSE stream');
      }

      return jsonRpcResponse;
    }

    // Parse JSON response
    return (await response.json()) as JsonRpcResponse;
  }

  /**
   * Extract tools array from response result, handling any nesting level
   * Recursively searches for the first array that looks like tools
   */
  private extractTools(result: unknown): McpTool[] {
    if (Array.isArray(result)) {
      return result;
    }
    if (result && typeof result === 'object' && 'tools' in result) {
      return this.extractTools((result as { tools: unknown }).tools);
    }
    return [];
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<McpTool[]> {
    if (this.cachedTools) {
      return this.cachedTools;
    }

    // Ensure connection is established before making requests
    await this.ensureConnected();

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/list',
    };

    const response = await this.makeRequest(request);

    if (response.error) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    this.cachedTools = this.extractTools(response.result);
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
      // Check if error is "Method not found" or "Unknown method"
      const errorMessage = response.error.message || '';
      if (
        errorMessage.includes('Method not found') ||
        errorMessage.includes('Unknown method') ||
        response.error.code === -32601
      ) {
        // Server doesn't support resources/list - return empty array
        this.cachedResources = [];
        return this.cachedResources;
      }
      throw new Error(`Failed to list resources: ${response.error.message}`);
    }

    this.cachedResources = (response.result as McpResource[]) || [];
    return this.cachedResources;
  }

  /**
   * Read a resource by URI
   */
  async readResource(uri: string): Promise<unknown> {
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
      throw new Error(`Resource read failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * Update OAuth token
   */
  updateOAuthToken(token: OAuthToken | null): void {
    this.oauthToken = token;
    // Reconnect with new token
    if (this.isConnected) {
      this.disconnect();
    }
    this.cachedTools = null;
    this.cachedResources = null;
  }

  /**
   * Update API key config
   */
  updateApiKeyConfig(config: ApiKeyConfig | null): void {
    this.apiKeyConfig = config;
    // Reconnect with new config
    if (this.isConnected) {
      this.disconnect();
    }
    this.cachedTools = null;
    this.cachedResources = null;
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.sseClient) {
      this.sseClient.disconnect();
    }
    this.isConnected = false;
    this.emitter = null;
  }

  /**
   * Handle a raw JSON-RPC request
   * Forwards requests to the remote MCP server
   * @returns JSON-RPC response, or void for notifications (requests without id)
   */
  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse | undefined> {
    // If this is a notification (no id), perform the action but don't return a response
    const isNotification = request.id === undefined;

    // For known methods, use optimized implementations
    switch (request.method) {
      case 'tools/list':
        try {
          const tools = await this.listTools();
          if (isNotification) {
            return;
          }
          // MCP spec requires tools/list to return { tools: [...] } not just [...]
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: { tools },
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
            },
          };
        }
      case 'resources/list':
        try {
          const resources = await this.listResources();
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: resources,
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
            },
          };
        }
      case 'tools/call': {
        if (!request.params || typeof request.params !== 'object') {
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            error: {
              code: -32602,
              message: 'Invalid params for tools/call',
            },
          };
        }
        try {
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
            },
          };
        }
      }
      case 'resources/read': {
        if (!request.params || typeof request.params !== 'object') {
          if (isNotification) {
            return;
          }
          return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            error: {
              code: -32602,
              message: 'Invalid params for resources/read',
            },
          };
        }
        try {
          const params = request.params as { uri: string };
          const result = await this.readResource(params.uri);
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
            },
          };
        }
      }
      default: {
        // For other methods (like initialize), forward directly to remote server
        const response = await this.makeRequest(request);
        // For notifications, don't return a response
        if (isNotification) {
          return;
        }
        return response;
      }
    }
  }
}
