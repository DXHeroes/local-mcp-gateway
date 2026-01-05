# Remote SSE Servers

Remote SSE (Server-Sent Events) servers use event streaming for real-time communication.

## Overview

| Aspect | Details |
|--------|---------|
| Transport | HTTP GET (SSE) + HTTP POST |
| Protocol | JSON-RPC 2.0 over SSE |
| Authentication | OAuth, API Key, None |
| Use Case | Streaming responses, real-time updates |

---

## How SSE Works

### Connection Flow

1. **GET request** establishes SSE connection
2. Server sends events as they occur
3. **POST requests** send commands to server
4. Responses arrive via SSE stream

### Event Format

```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}

event: message
data: {"jsonrpc":"2.0","id":2,"result":{...}}
```

---

## Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| url | string | Server base URL |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| sseEndpoint | string | SSE endpoint path (default: `/sse`) |
| postEndpoint | string | POST endpoint path (default: `/message`) |

### Example

```json
{
  "name": "Linear MCP",
  "type": "remote_sse",
  "config": {
    "url": "https://api.linear.app/mcp"
  }
}
```

---

## Setting Up via Web UI

### Step 1: Add Server

1. Go to **MCP Servers** → **"Add MCP Server"**
2. Enter a name (e.g., "Linear")
3. Select **Remote SSE** type

### Step 2: Configure URL

Enter the SSE server's base URL:
- The gateway will append `/sse` for the event stream
- POST requests go to `/message` or `/mcp`

### Step 3: Configure Authentication

Choose authentication method:
- **OAuth** - For OAuth-protected servers
- **API Key** - For API key authentication
- **None** - For public servers

### Step 4: Create

Click **"Create"** to save the server.

---

## Request Flow

### Establishing SSE Connection

```http
GET https://api.example.com/mcp/sse HTTP/1.1
Accept: text/event-stream
Authorization: Bearer <token>
```

### Sending Commands (POST)

```http
POST https://api.example.com/mcp/message HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {...}
}
```

### Receiving Responses (SSE)

```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"content":[...]}}
```

---

## SSE vs HTTP

| Aspect | HTTP | SSE |
|--------|------|-----|
| Connection | Per-request | Persistent |
| Streaming | No | Yes |
| Real-time | No | Yes |
| Complexity | Lower | Higher |
| Reconnection | N/A | Required |

### When to Use SSE

- Server uses SSE transport
- Long-running operations
- Streaming responses needed
- Real-time updates required

### When to Use HTTP

- Simple request/response
- Server supports HTTP
- No streaming needed
- Simpler error handling

---

## Connection Management

### Initial Connection

When server is first used:
1. Gateway opens SSE connection
2. Sends `initialize` via POST
3. Receives capabilities via SSE
4. Connection ready

### Reconnection

On disconnect:
1. Gateway detects connection loss
2. Waits with exponential backoff
3. Reopens SSE connection
4. Re-initializes session

### Keep-Alive

SSE connections may receive:
- Heartbeat events
- Empty comments (`: \n\n`)
- Keep-alive data

---

## Known SSE Servers

### Linear

```json
{
  "name": "Linear",
  "type": "remote_sse",
  "config": {
    "url": "https://api.linear.app/mcp"
  },
  "apiKeyConfig": {
    "apiKey": "your-linear-api-key",
    "headerName": "Authorization",
    "headerValueTemplate": "Bearer {key}"
  }
}
```

### Firecrawl

```json
{
  "name": "Firecrawl",
  "type": "remote_sse",
  "config": {
    "url": "https://api.firecrawl.dev/v1/mcp"
  },
  "apiKeyConfig": {
    "apiKey": "your-api-key",
    "headerName": "Authorization",
    "headerValueTemplate": "Bearer {key}"
  }
}
```

---

## Troubleshooting

### "SSE connection failed"

- Server doesn't support SSE
- Wrong endpoint URL
- Firewall blocking

**Fix**: Verify server supports SSE, check URL

### "Connection keeps dropping"

- Server timeout
- Network instability
- Proxy interference

**Fix**: Check server timeout settings, network

### "No events received"

- Wrong SSE endpoint
- Server not sending events
- Connection not established

**Fix**: Verify SSE endpoint path

### "POST requests fail"

- Wrong POST endpoint
- Missing session ID
- Auth not forwarded

**Fix**: Check POST endpoint configuration

### "Timeout waiting for response"

- Server slow
- Event not sent
- Message lost

**Fix**: Check server logs, increase timeout

---

## Advanced Configuration

### Custom Endpoints

If server uses non-standard endpoints:

```json
{
  "config": {
    "url": "https://api.example.com",
    "sseEndpoint": "/events",
    "postEndpoint": "/api/mcp"
  }
}
```

### Session Management

SSE servers often require session tracking:
- Gateway handles `Mcp-Session-Id`
- Re-sends on reconnection
- Refreshes on 404

---

## See Also

- [Remote HTTP](./remote-http.md) - HTTP transport
- [Authentication](../authentication/README.md) - Auth configuration
- [Troubleshooting](../../reference/troubleshooting.md) - Common issues
