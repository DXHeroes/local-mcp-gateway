# Profile Endpoints

Each profile exposes several HTTP endpoints for MCP communication.

## Endpoint Overview

For a profile named `my-profile`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mcp/my-profile` | POST | Main MCP endpoint (JSON-RPC) |
| `/api/mcp/my-profile/sse` | GET | Server-Sent Events endpoint |
| `/api/mcp/my-profile/info` | GET | Profile metadata |

Base URL: `http://localhost:3001`

---

## Main Endpoint (HTTP)

### URL

```
POST http://localhost:3001/api/mcp/{profile-name}
```

### Purpose

Handles all MCP JSON-RPC 2.0 requests:
- Tool discovery (`tools/list`)
- Tool execution (`tools/call`)
- Resource discovery (`resources/list`)
- Resource reading (`resources/read`)
- Initialization (`initialize`)

### Request Format

```http
POST /api/mcp/my-profile HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Response Format

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "github_create_issue",
        "description": "Create a GitHub issue",
        "inputSchema": {...}
      }
    ]
  }
}
```

### Supported Methods

| Method | Description |
|--------|-------------|
| `initialize` | Initialize the session |
| `tools/list` | Get available tools |
| `tools/call` | Execute a tool |
| `resources/list` | Get available resources |
| `resources/read` | Read a resource |

---

## SSE Endpoint

### URL

```
GET http://localhost:3001/api/mcp/{profile-name}/sse
```

### Purpose

Server-Sent Events endpoint for:
- Streaming responses
- Long-running operations
- Real-time updates

### Connection

```javascript
const eventSource = new EventSource(
  'http://localhost:3001/api/mcp/my-profile/sse'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Event Format

```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}

event: message
data: {"jsonrpc":"2.0","id":2,"result":{...}}
```

### When to Use SSE

- MCP servers that use SSE transport
- Streaming tool responses
- Real-time resource updates

Most clients use HTTP transport by default.

---

## Info Endpoint

### URL

```
GET http://localhost:3001/api/mcp/{profile-name}/info
```

### Purpose

Returns metadata about the profile:
- Available tools
- Available resources
- Server status

### Response

```json
{
  "profile": {
    "id": "uuid",
    "name": "my-profile",
    "description": "My tools"
  },
  "servers": {
    "total": 3,
    "connected": 3,
    "status": {
      "github-id": true,
      "linear-id": true,
      "database-id": true
    }
  },
  "tools": [
    {
      "name": "github_create_issue",
      "description": "Create a GitHub issue",
      "inputSchema": {...}
    },
    {
      "name": "linear_create_ticket",
      "description": "Create a Linear ticket",
      "inputSchema": {...}
    }
  ],
  "resources": []
}
```

### Use Cases

- Verify profile is working
- Check available tools
- Debug connection issues
- Generate tool documentation

### Quick Check

```bash
curl http://localhost:3001/api/mcp/my-profile/info | jq .
```

---

## Headers

### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes (POST) |
| `Accept` | `application/json` | Optional |
| `Mcp-Session-Id` | Session identifier | Auto-managed |

### Response Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | `application/json` |
| `Mcp-Session-Id` | Session identifier |

---

## Session Management

### Session ID

The gateway maintains MCP sessions via `Mcp-Session-Id` header:

1. First request creates session
2. Session ID returned in response header
3. Subsequent requests include session ID
4. Session tracks server state

### Session Lifecycle

```
Client                    Gateway                   MCP Server
  |                          |                          |
  |------ initialize ------->|                          |
  |                          |------ initialize ------->|
  |                          |<---- session created ----|
  |<---- Mcp-Session-Id -----|                          |
  |                          |                          |
  |------ tools/call ------->|                          |
  | (with Mcp-Session-Id)    |------ tools/call ------->|
  |                          |<---- response -----------|
  |<---- response -----------|                          |
```

### Session Expiration

- Sessions may expire after inactivity
- Gateway handles re-initialization automatically
- Clients should handle session errors gracefully

---

## Error Responses

### JSON-RPC Errors

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error (invalid JSON) |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32001 | Tool not found |
| -32002 | Resource not found |

### HTTP Errors

| Status | Meaning |
|--------|---------|
| 400 | Bad request |
| 404 | Profile not found |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Rate Limiting

### Default Limits

The gateway applies rate limiting to protect MCP servers:

| Endpoint | Limit |
|----------|-------|
| `/api/mcp/*` | Higher limit (MCP operations) |
| `/api/*` | Standard limit (management) |

### Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

### Handling Rate Limits

- Implement exponential backoff
- Cache results where possible
- Consider request batching

---

## Testing Endpoints

### Health Check

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

### List Tools

```bash
curl -X POST http://localhost:3001/api/mcp/my-profile \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Call Tool

```bash
curl -X POST http://localhost:3001/api/mcp/my-profile \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"github_list_issues",
      "arguments":{"repo":"owner/repo"}
    }
  }'
```

### Get Info

```bash
curl http://localhost:3001/api/mcp/my-profile/info | jq .
```

---

## Client Configuration

### Claude Desktop

```json
{
  "mcpServers": {
    "my-tools": {
      "url": "http://localhost:3001/api/mcp/my-profile"
    }
  }
}
```

### Generic Client

```javascript
const response = await fetch(
  'http://localhost:3001/api/mcp/my-profile',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    })
  }
);
```

---

## See Also

- [Integration Guides](../integration/README.md) - Client setup
- [API Reference](../../technical/api/proxy-api.md) - Full API docs
- [JSON-RPC Protocol](../../technical/api/json-rpc-protocol.md) - Protocol details
