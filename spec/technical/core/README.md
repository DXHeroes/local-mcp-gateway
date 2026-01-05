# Core Package Documentation

Technical documentation for the `@local-mcp/core` package.

## Overview

The core package contains the fundamental abstractions and business logic for MCP server management and protocol handling.

---

## Package Location

```
packages/core/
├── src/
│   ├── index.ts                    # Package exports
│   ├── abstractions/
│   │   ├── McpServer.ts            # Base MCP server class
│   │   ├── RemoteHttpMcpServer.ts  # HTTP transport
│   │   ├── RemoteSseMcpServer.ts   # SSE transport
│   │   ├── ExternalMcpServer.ts    # Stdio transport
│   │   ├── ProxyHandler.ts         # Profile aggregator
│   │   ├── OAuthManager.ts         # OAuth handling
│   │   └── OAuthDiscoveryService.ts # OAuth discovery
│   ├── factories/
│   │   └── McpServerFactory.ts     # Server instantiation
│   └── types/
│       └── index.ts                # Type definitions
└── package.json
```

---

## Core Abstractions

### McpServer

Base class for all MCP server implementations.

```typescript
abstract class McpServer {
  abstract initialize(): Promise<void>;
  abstract listTools(): Promise<McpTool[]>;
  abstract callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
  abstract listResources(): Promise<McpResource[]>;
  abstract readResource(uri: string): Promise<unknown>;
  abstract disconnect(): Promise<void>;
}
```

### RemoteHttpMcpServer

HTTP-based MCP server connection.

```typescript
class RemoteHttpMcpServer extends McpServer {
  constructor(config: {
    url: string;
    headers?: Record<string, string>;
    oauthManager?: OAuthManager;
  });
}
```

**Features:**
- Stateless HTTP requests
- Automatic authorization header injection
- Token refresh on 401
- Request/response logging

### RemoteSseMcpServer

SSE-based MCP server connection.

```typescript
class RemoteSseMcpServer extends McpServer {
  constructor(config: {
    url: string;
    headers?: Record<string, string>;
    oauthManager?: OAuthManager;
  });
}
```

**Features:**
- Persistent SSE connection
- Bidirectional communication
- Automatic reconnection
- Connection state management

### ExternalMcpServer

Stdio-based local process connection.

```typescript
class ExternalMcpServer extends McpServer {
  constructor(config: {
    command: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
  });
}
```

**Features:**
- Child process management
- Stdin/stdout communication
- Process lifecycle handling
- Environment variable injection

### ProxyHandler

Central orchestrator for profile-based MCP aggregation.

```typescript
class ProxyHandler {
  constructor(profileId: string, servers: McpServer[]);

  async initialize(): Promise<void>;
  async listTools(): Promise<McpTool[]>;
  async callTool(name: string, args: unknown): Promise<unknown>;
  async disconnect(): Promise<void>;
}
```

**Features:**
- Multi-server aggregation
- Tool name prefixing
- Request routing
- Error isolation

### OAuthManager

OAuth token management.

```typescript
class OAuthManager {
  constructor(config: {
    serverId: string;
    oauthConfig: OAuthConfig;
    encryptionKey: string;
  });

  async getAccessToken(): Promise<string>;
  async refreshToken(): Promise<void>;
  async storeTokens(tokens: OAuthTokens): Promise<void>;
}
```

**Features:**
- Token storage/retrieval
- Automatic refresh
- AES-256 encryption
- PKCE support

### OAuthDiscoveryService

OAuth metadata discovery.

```typescript
class OAuthDiscoveryService {
  async discover(serverUrl: string): Promise<OAuthMetadata>;
  async registerClient(metadata: OAuthMetadata): Promise<ClientCredentials>;
}
```

**Features:**
- Well-known endpoint discovery
- Protected resource metadata
- Dynamic Client Registration

---

## McpServerFactory

Creates appropriate MCP server instances.

```typescript
class McpServerFactory {
  static create(config: McpServerConfig): McpServer {
    switch (config.type) {
      case 'remote_http':
        return new RemoteHttpMcpServer(config);
      case 'remote_sse':
        return new RemoteSseMcpServer(config);
      case 'external':
        return new ExternalMcpServer(config);
      case 'custom':
        return new CustomMcpServer(config);
    }
  }
}
```

---

## Type Definitions

### McpServerConfig

```typescript
interface McpServerConfig {
  id: string;
  name: string;
  type: 'remote_http' | 'remote_sse' | 'external' | 'custom';
  config: RemoteConfig | ExternalConfig | CustomConfig;
  oauthConfig?: OAuthConfig;
  apiKeyConfig?: ApiKeyConfig;
}
```

### McpTool

```typescript
interface McpTool {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}
```

### McpResource

```typescript
interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}
```

### OAuthConfig

```typescript
interface OAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string;
}
```

---

## Usage Examples

### Creating a Remote HTTP Server

```typescript
import { RemoteHttpMcpServer, OAuthManager } from '@local-mcp/core';

const oauthManager = new OAuthManager({
  serverId: 'github-id',
  oauthConfig: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    clientId: 'xxx',
    clientSecret: 'xxx',
    scopes: 'repo user'
  },
  encryptionKey: process.env.OAUTH_ENCRYPTION_KEY
});

const server = new RemoteHttpMcpServer({
  url: 'https://mcp.github.com',
  oauthManager
});

await server.initialize();
const tools = await server.listTools();
```

### Creating a Profile Proxy

```typescript
import { ProxyHandler, McpServerFactory } from '@local-mcp/core';

const servers = serverConfigs.map(config =>
  McpServerFactory.create(config)
);

const proxy = new ProxyHandler('profile-id', servers);
await proxy.initialize();

// Tools are automatically prefixed
const tools = await proxy.listTools();
// ['github__create_issue', 'linear__create_task', ...]

// Calls routed to correct server
const result = await proxy.callTool('github__create_issue', {
  title: 'Bug report'
});
```

---

## Error Handling

### Connection Errors

```typescript
try {
  await server.initialize();
} catch (error) {
  if (error instanceof ConnectionError) {
    // Handle connection failure
  } else if (error instanceof AuthenticationError) {
    // Handle auth failure - redirect to OAuth
  }
}
```

### Tool Errors

```typescript
try {
  const result = await server.callTool('tool_name', args);
} catch (error) {
  if (error instanceof ToolNotFoundError) {
    // Tool doesn't exist
  } else if (error instanceof ToolExecutionError) {
    // Tool failed to execute
  }
}
```

---

## See Also

- [Architecture Overview](../architecture/system-overview.md) - System architecture
- [API Reference](../api/README.md) - API documentation
- [Database Schema](../database/schema.md) - Data model
