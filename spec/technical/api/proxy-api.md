# Proxy API

MCP protocol proxy endpoints.

## Overview

The proxy API provides MCP protocol endpoints for each profile, allowing clients to connect to aggregated MCP servers.

---

## Endpoints

### SSE Connection

```http
GET /mcp/:slug
```

Establishes Server-Sent Events connection for MCP protocol.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Profile slug |

**Headers:**
```http
Accept: text/event-stream
```

**Response:** SSE stream with MCP messages

**Events:**

| Event | Description |
|-------|-------------|
| `endpoint` | Initial message with POST endpoint URL |
| `message` | JSON-RPC response messages |

**Example:**
```
event: endpoint
data: /mcp/development

event: message
data: {"jsonrpc":"2.0","id":1,"result":{"serverInfo":{"name":"Profile: development"}}}
```

---

### JSON-RPC Request

```http
POST /mcp/:slug
```

Sends JSON-RPC requests to the profile.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Profile slug |

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "github__create_issue",
        "description": "Create a GitHub issue"
      }
    ]
  }
}
```

---

## MCP Methods

### Initialize

```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "clientInfo": {
      "name": "Client Name",
      "version": "1.0.0"
    },
    "capabilities": {}
  }
}
```

**Response:**
```json
{
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "Profile: development",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": {}
    }
  }
}
```

---

### List Tools

```json
{
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "tools": [
      {
        "name": "github__create_issue",
        "description": "Create a GitHub issue",
        "inputSchema": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "body": { "type": "string" }
          },
          "required": ["title"]
        }
      },
      {
        "name": "linear__create_task",
        "description": "Create a Linear task",
        "inputSchema": { ... }
      }
    ]
  }
}
```

---

### Call Tool

```json
{
  "method": "tools/call",
  "params": {
    "name": "github__create_issue",
    "arguments": {
      "title": "Bug report",
      "body": "Description here"
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Created issue #123"
      }
    ]
  }
}
```

---

### List Resources

```json
{
  "method": "resources/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "resources": [
      {
        "uri": "github://repos",
        "name": "GitHub Repositories",
        "mimeType": "application/json"
      }
    ]
  }
}
```

---

### Read Resource

```json
{
  "method": "resources/read",
  "params": {
    "uri": "github://repos/user/repo"
  }
}
```

**Response:**
```json
{
  "result": {
    "contents": [
      {
        "uri": "github://repos/user/repo",
        "mimeType": "application/json",
        "text": "{\"name\":\"repo\",...}"
      }
    ]
  }
}
```

---

## Tool Name Prefixing

Tools from multiple servers are prefixed with server identifier:

| Server Name | Original Tool | Prefixed Tool |
|-------------|---------------|---------------|
| github | create_issue | github__create_issue |
| linear | create_task | linear__create_task |

### Prefix Format

```
{serverId}__{originalToolName}
```

- `serverId`: Lowercase, sanitized server name/ID
- `__`: Double underscore separator
- `originalToolName`: Original tool name from server

---

## Connection Lifecycle

### SSE Connection Flow

1. Client opens GET request to `/mcp/:slug`
2. Gateway establishes SSE stream
3. Gateway sends `endpoint` event
4. Client sends JSON-RPC requests to POST endpoint
5. Gateway forwards to appropriate servers
6. Results sent via SSE `message` events

### Connection Management

- Connections kept alive with heartbeat
- Automatic reconnection on disconnect
- Server connections cached per profile

---

## Error Handling

### Profile Not Found

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "Profile not found: unknown-slug"
  }
}
```

### Tool Not Found

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found: unknown__tool"
  }
}
```

### Server Unavailable

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32002,
    "message": "Server unavailable: github"
  }
}
```

### OAuth Required

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32003,
    "message": "OAuth authorization required",
    "data": {
      "serverId": "uuid",
      "authorizationUrl": "/api/oauth/start/uuid"
    }
  }
}
```

---

## JSON-RPC Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32000 | Profile not found |
| -32001 | Tool call failed |
| -32002 | Server unavailable |
| -32003 | Authorization required |

---

## See Also

- [JSON-RPC Protocol](./json-rpc-protocol.md) - Protocol details
- [Profiles API](./profiles-api.md) - Profile management
- [Tool Name Conflicts](../../user-guide/mcp-servers/tool-name-conflicts.md) - Conflict resolution
