# Remote HTTP Servers

Remote HTTP servers communicate via HTTP POST requests with JSON-RPC 2.0 payloads. This is the most common MCP server type.

## Overview

| Aspect | Details |
|--------|---------|
| Transport | HTTP POST |
| Protocol | JSON-RPC 2.0 |
| Authentication | OAuth, API Key, None |
| Use Case | Cloud-hosted MCP servers |

---

## Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| url | string | Server endpoint URL |

### Example

```json
{
  "name": "GitHub MCP",
  "type": "remote_http",
  "config": {
    "url": "https://api.github.com/mcp"
  }
}
```

---

## Setting Up via Web UI

### Step 1: Add Server

1. Go to **MCP Servers** → **"Add MCP Server"**
2. Enter a name (e.g., "GitHub")
3. Select **Remote HTTP** type

### Step 2: Configure URL

Enter the MCP server's HTTP endpoint:
- Must be a valid URL
- Should end with the MCP endpoint path
- HTTPS recommended for production

### Step 3: Configure Authentication

Choose authentication method:

**None**: For public/local servers

**OAuth**: For OAuth-protected servers
- See [OAuth Setup](../authentication/oauth-setup.md)

**API Key**: For API key authentication
- See [API Key Setup](../authentication/api-key-setup.md)

### Step 4: Create

Click **"Create"** to save the server.

---

## Request Flow

### Tool List Request

```http
POST https://api.example.com/mcp HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Tool Call Request

```http
POST https://api.example.com/mcp HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_issue",
    "arguments": {
      "title": "Bug report",
      "body": "Description here"
    }
  }
}
```

---

## Headers

### Default Headers

The gateway sends:

```http
Content-Type: application/json
Accept: application/json
```

### Authentication Headers

**OAuth**:
```http
Authorization: Bearer <access_token>
```

**API Key** (configurable):
```http
Authorization: Bearer <api_key>
X-API-Key: <api_key>
```

### Session Headers

```http
Mcp-Session-Id: <session_id>
```

---

## Response Handling

### Success Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

### Error Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Tool not found"
  }
}
```

---

## Retry Logic

### Automatic Retries

The gateway retries failed requests:

| Attempt | Delay |
|---------|-------|
| 1 | 100ms |
| 2 | 200ms |
| 3 | 400ms |

### Retry Conditions

Retries on:
- Network errors
- Timeout
- 5xx server errors

No retry on:
- 4xx client errors
- Successful response
- Max retries reached

---

## Caching

### Tool List Caching

Tool lists are cached after initialization:
- Reduces server load
- Faster tool discovery
- Refreshed on reconnect

### Session Caching

Session state is maintained:
- Session ID tracked
- Reconnects use existing session when possible

---

## Common Servers

### Examples

| Server | URL Pattern |
|--------|-------------|
| GitHub MCP | `https://api.github.com/mcp` |
| Custom Server | `https://your-server.com/mcp` |
| Local Server | `http://localhost:8080/mcp` |

---

## Troubleshooting

### "Connection refused"

- Server not running
- Wrong URL
- Firewall blocking

**Fix**: Verify URL and server status

### "401 Unauthorized"

- Invalid credentials
- Expired token
- Wrong auth type

**Fix**: Check authentication configuration

### "404 Not Found"

- Wrong endpoint path
- Server misconfigured

**Fix**: Verify the exact MCP endpoint URL

### "Timeout"

- Server too slow
- Network issues
- Large response

**Fix**: Check server performance, network

### "Invalid JSON response"

- Server returning non-JSON
- HTML error page
- Proxy interference

**Fix**: Check server returns proper JSON-RPC

---

## Advanced Configuration

### Custom Headers

Currently, custom headers are added via authentication config. For arbitrary headers, use API key config with custom header name.

### Timeout Configuration

Default timeout: 30 seconds

Future: Configurable per-server timeout

### Proxy Support

The gateway uses system proxy settings. Configure via environment:
- `HTTP_PROXY`
- `HTTPS_PROXY`
- `NO_PROXY`

---

## See Also

- [Remote SSE](./remote-sse.md) - SSE transport
- [OAuth Setup](../authentication/oauth-setup.md) - OAuth configuration
- [API Key Setup](../authentication/api-key-setup.md) - API key configuration
