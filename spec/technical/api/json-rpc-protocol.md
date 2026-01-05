# JSON-RPC Protocol

MCP protocol specification and JSON-RPC details.

## Overview

MCP (Model Context Protocol) uses JSON-RPC 2.0 for communication between clients, gateway, and servers.

---

## JSON-RPC 2.0 Basics

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method/name",
  "params": { ... }
}
```

### Response Format (Success)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

### Response Format (Error)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": { ... }
  }
}
```

### Notification Format

```json
{
  "jsonrpc": "2.0",
  "method": "notification/name",
  "params": { ... }
}
```

Notifications have no `id` and expect no response.

---

## MCP Methods

### Lifecycle Methods

#### initialize

Initializes connection with server.

**Request:**
```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "clientInfo": {
      "name": "Claude Desktop",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": {}
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "MCP Server",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": {},
      "resources": {}
    }
  }
}
```

#### initialized

Notification sent after successful initialization.

```json
{
  "method": "notifications/initialized"
}
```

---

### Tool Methods

#### tools/list

Lists available tools.

**Request:**
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
        "name": "tool_name",
        "description": "Tool description",
        "inputSchema": {
          "type": "object",
          "properties": {
            "param1": {
              "type": "string",
              "description": "Parameter description"
            }
          },
          "required": ["param1"]
        }
      }
    ]
  }
}
```

#### tools/call

Executes a tool.

**Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1"
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
        "text": "Tool output text"
      }
    ],
    "isError": false
  }
}
```

---

### Resource Methods

#### resources/list

Lists available resources.

**Request:**
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
        "uri": "resource://type/path",
        "name": "Resource Name",
        "description": "Resource description",
        "mimeType": "application/json"
      }
    ]
  }
}
```

#### resources/read

Reads a resource.

**Request:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "resource://type/path"
  }
}
```

**Response:**
```json
{
  "result": {
    "contents": [
      {
        "uri": "resource://type/path",
        "mimeType": "application/json",
        "text": "{ ... }"
      }
    ]
  }
}
```

---

### Prompt Methods

#### prompts/list

Lists available prompts.

**Request:**
```json
{
  "method": "prompts/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "prompts": [
      {
        "name": "prompt_name",
        "description": "Prompt description",
        "arguments": [
          {
            "name": "arg1",
            "description": "Argument description",
            "required": true
          }
        ]
      }
    ]
  }
}
```

#### prompts/get

Gets a prompt template.

**Request:**
```json
{
  "method": "prompts/get",
  "params": {
    "name": "prompt_name",
    "arguments": {
      "arg1": "value1"
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Prompt text with value1"
        }
      }
    ]
  }
}
```

---

## Content Types

### Text Content

```json
{
  "type": "text",
  "text": "Plain text content"
}
```

### Image Content

```json
{
  "type": "image",
  "data": "base64-encoded-data",
  "mimeType": "image/png"
}
```

### Resource Content

```json
{
  "type": "resource",
  "resource": {
    "uri": "resource://type/path",
    "mimeType": "application/json",
    "text": "{ ... }"
  }
}
```

---

## Error Codes

### Standard JSON-RPC Errors

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Invalid JSON-RPC |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Invalid parameters |
| -32603 | Internal error | Server error |

### MCP-Specific Errors

| Code | Message | Description |
|------|---------|-------------|
| -32000 | Server error | Generic server error |
| -32001 | Resource not found | Resource doesn't exist |
| -32002 | Tool error | Tool execution failed |
| -32003 | Authorization error | Auth required |

---

## Protocol Versions

| Version | Date | Changes |
|---------|------|---------|
| 2024-11-05 | Nov 2024 | Current stable version |
| 2024-10-07 | Oct 2024 | Initial release |

### Version Negotiation

Client requests version, server responds with supported version:

```json
// Client request
{
  "params": {
    "protocolVersion": "2024-11-05"
  }
}

// Server response
{
  "result": {
    "protocolVersion": "2024-11-05"
  }
}
```

---

## Gateway Protocol Handling

### Request Routing

Gateway routes requests based on tool prefix:

```
Client request: tools/call "github__create_issue"
                    │
                    ▼
Gateway parses:  server="github", tool="create_issue"
                    │
                    ▼
Forward to:      GitHub server → tools/call "create_issue"
```

### Tool Aggregation

Gateway aggregates tools from multiple servers:

```
Server A: [tool_1, tool_2]
Server B: [tool_3]
                │
                ▼
Profile response: [serverA__tool_1, serverA__tool_2, serverB__tool_3]
```

### Error Forwarding

Server errors forwarded with context:

```json
{
  "error": {
    "code": -32001,
    "message": "Tool error",
    "data": {
      "server": "github",
      "originalError": { ... }
    }
  }
}
```

---

## Transport Handling

### HTTP Transport

Single request/response:

```http
POST /mcp/profile-slug HTTP/1.1
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

### SSE Transport

Bidirectional via SSE + POST:

```
1. GET /mcp/profile-slug (SSE connection)
2. Receive endpoint event
3. POST to endpoint (requests)
4. Receive responses via SSE
```

---

## Notifications

### Client Notifications

```json
// Tool progress
{
  "method": "notifications/progress",
  "params": {
    "progressToken": "token",
    "progress": 50,
    "total": 100
  }
}
```

### Server Notifications

```json
// Resource changed
{
  "method": "notifications/resources/updated",
  "params": {
    "uri": "resource://path"
  }
}
```

---

## See Also

- [Proxy API](./proxy-api.md) - Gateway proxy endpoints
- [MCP Specification](https://modelcontextprotocol.io/spec) - Official spec
- [Tool Name Conflicts](../../user-guide/mcp-servers/tool-name-conflicts.md) - Naming
