# MCP Server Configuration

This section covers how to configure different types of MCP servers in Local MCP Gateway.

## Server Types

The gateway supports four types of MCP servers:

| Type | Transport | Use Case |
|------|-----------|----------|
| **Remote HTTP** | HTTP POST | Cloud-hosted MCP servers |
| **Remote SSE** | Server-Sent Events | Streaming servers |
| **External Stdio** | stdin/stdout | Local command-line tools |
| **Custom TypeScript** | In-process | Custom integrations |

---

## Quick Comparison

| Feature | HTTP | SSE | Stdio | Custom |
|---------|------|-----|-------|--------|
| Remote servers | Yes | Yes | No | No |
| Local servers | Yes | Yes | Yes | Yes |
| Streaming | No | Yes | Yes | No |
| OAuth support | Yes | Yes | No | No |
| API key support | Yes | Yes | Yes | Yes |
| Hot reload | No | No | No | Yes |

---

## Guides

### [Remote HTTP](./remote-http.md)

Standard HTTP-based MCP servers. Most common type.

- RESTful communication
- JSON-RPC over HTTP POST
- Supports all authentication methods

### [Remote SSE](./remote-sse.md)

Server-Sent Events for streaming communication.

- Real-time updates
- Long-running operations
- Used by some services (Linear, etc.)

### [External Stdio](./external-stdio.md)

Local processes communicating via standard I/O.

- Run local CLI tools
- No network required
- Full filesystem access

### [Custom TypeScript](./custom-typescript.md)

Dynamic TypeScript modules loaded at runtime.

- Write custom logic
- Hot-reload support
- Full gateway integration

### [Tool Name Conflicts](./tool-name-conflicts.md)

How the gateway handles duplicate tool names.

- Automatic prefixing
- Priority order
- Best practices

---

## Common Configuration

All server types share these fields:

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Display name |
| type | Yes | Server type |
| config | Yes | Type-specific configuration |
| oauthConfig | No | OAuth settings |
| apiKeyConfig | No | API key settings |

---

## Adding a Server

### Via Web UI

1. Go to **MCP Servers** page
2. Click **"Add MCP Server"**
3. Select server type
4. Configure type-specific settings
5. Configure authentication (if needed)
6. Click **"Create"**

### Via API

```bash
POST /api/mcp-servers
Content-Type: application/json

{
  "name": "My Server",
  "type": "remote_http",
  "config": {
    "url": "https://api.example.com/mcp"
  }
}
```

---

## Server Lifecycle

### Initialization

When a server is first used:
1. Gateway creates connection
2. Sends `initialize` request
3. Receives server capabilities
4. Queries available tools
5. Caches tool list

### Tool Discovery

Tools are discovered via `tools/list`:
- Called during initialization
- Cached for performance
- Refreshed on reconnect

### Request Handling

When a tool is called:
1. Gateway receives request from client
2. Routes to appropriate server
3. Forwards request
4. Returns response to client

### Error Handling

On errors:
- Network errors → Retry with backoff
- Auth errors → Prompt for reauthorization
- Server errors → Return error to client

---

## Health Monitoring

### Status Checks

The gateway monitors server health:
- Connection status
- Response times
- Error rates

### Status Indicators

| Status | Meaning |
|--------|---------|
| Connected | Server responding |
| Disconnected | Cannot reach server |
| Error | Server returning errors |

### Automatic Recovery

On disconnection:
- Gateway attempts reconnection
- Exponential backoff
- Notifies when recovered

---

## Best Practices

### Server Naming

- Use descriptive names: `github`, `linear`, `dev-database`
- Include environment if relevant: `prod-db`, `staging-api`
- Avoid generic names: `server1`, `test`

### Authentication

- Use OAuth when available (more secure)
- Rotate API keys regularly
- Use minimal required scopes

### Monitoring

- Check Debug Logs regularly
- Watch for error patterns
- Monitor response times

---

## See Also

- [Getting Started](../getting-started/first-mcp-server.md) - First server setup
- [Authentication](../authentication/README.md) - Auth configuration
- [Profiles](../profiles/README.md) - Using servers in profiles
