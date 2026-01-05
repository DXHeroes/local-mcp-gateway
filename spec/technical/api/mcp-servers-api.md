# MCP Servers API

REST API for managing MCP servers.

## Overview

MCP servers are the backend services that provide tools and resources. The gateway supports multiple server types.

---

## Server Types

| Type | Transport | Description |
|------|-----------|-------------|
| `remote_http` | HTTP | Remote HTTP MCP servers |
| `remote_sse` | SSE | Remote SSE MCP servers |
| `external` | Stdio | Local processes |
| `custom` | In-process | TypeScript modules |

---

## Endpoints

### List Servers

```http
GET /api/mcp-servers
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "GitHub",
      "type": "remote_http",
      "config": {
        "url": "https://mcp.github.com"
      },
      "status": "connected",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get Server

```http
GET /api/mcp-servers/:id
```

**Response:**
```json
{
  "id": "uuid-1",
  "name": "GitHub",
  "type": "remote_http",
  "config": {
    "url": "https://mcp.github.com"
  },
  "oauthConfig": {
    "authorizationUrl": "https://github.com/login/oauth/authorize",
    "tokenUrl": "https://github.com/login/oauth/access_token",
    "scopes": "repo user"
  },
  "status": "connected",
  "hasOAuthToken": true,
  "tools": [
    {
      "name": "create_issue",
      "description": "Create a GitHub issue"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### Create Server

```http
POST /api/mcp-servers
```

**Request Body (Remote HTTP):**
```json
{
  "name": "GitHub",
  "type": "remote_http",
  "config": {
    "url": "https://mcp.github.com"
  },
  "oauthConfig": {
    "authorizationUrl": "https://github.com/login/oauth/authorize",
    "tokenUrl": "https://github.com/login/oauth/access_token",
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "scopes": "repo user"
  }
}
```

**Request Body (Remote SSE):**
```json
{
  "name": "Linear",
  "type": "remote_sse",
  "config": {
    "url": "https://mcp.linear.app/sse"
  },
  "oauthConfig": {
    "authorizationUrl": "https://linear.app/oauth/authorize",
    "tokenUrl": "https://linear.app/oauth/token",
    "scopes": "read write"
  }
}
```

**Request Body (External Stdio):**
```json
{
  "name": "Local Files",
  "type": "external",
  "config": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
    "cwd": "/working/directory",
    "env": {
      "DEBUG": "true"
    }
  }
}
```

**Request Body (Custom TypeScript):**
```json
{
  "name": "Custom Tool",
  "type": "custom",
  "config": {
    "modulePath": "./custom-mcps/my-server"
  }
}
```

---

## Configuration Schemas

### Remote HTTP Config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | Server URL |
| headers | object | No | Additional headers |

### Remote SSE Config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | SSE endpoint URL |
| headers | object | No | Additional headers |

### External Config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| command | string | Yes | Executable command |
| args | string[] | No | Command arguments |
| cwd | string | No | Working directory |
| env | object | No | Environment variables |

### Custom Config

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| modulePath | string | Yes | Path to TypeScript module |

---

## OAuth Configuration

### OAuth Config Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| authorizationUrl | string | Yes | Authorization endpoint |
| tokenUrl | string | Yes | Token endpoint |
| clientId | string | No* | OAuth client ID |
| clientSecret | string | No* | OAuth client secret |
| scopes | string | No | Space-separated scopes |

*If not provided, DCR (Dynamic Client Registration) will be attempted.

---

### API Key Configuration

```json
{
  "name": "API Service",
  "type": "remote_http",
  "config": {
    "url": "https://api.example.com/mcp"
  },
  "apiKeyConfig": {
    "key": "your-api-key",
    "headerName": "X-Api-Key"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | Yes | API key value |
| headerName | string | No | Header name (default: `Authorization`) |
| prefix | string | No | Key prefix (default: `Bearer `) |

---

### Update Server

```http
PUT /api/mcp-servers/:id
```

**Request Body:** Same as create, all fields optional.

---

### Delete Server

```http
DELETE /api/mcp-servers/:id
```

**Response:**
```json
{
  "success": true
}
```

**Note:** Deleting a server also removes it from all profiles.

---

## Server Status

### Get Server Status

```http
GET /api/mcp-servers/:id/status
```

**Response:**
```json
{
  "status": "connected",
  "lastConnected": "2024-01-01T00:00:00Z",
  "error": null
}
```

**Status values:**

| Status | Description |
|--------|-------------|
| `connected` | Successfully connected |
| `disconnected` | Not connected |
| `connecting` | Connection in progress |
| `error` | Connection error |
| `auth_required` | OAuth authorization needed |

---

### Refresh Server Connection

```http
POST /api/mcp-servers/:id/refresh
```

Forces reconnection and re-fetches tools.

**Response:**
```json
{
  "success": true,
  "status": "connected",
  "tools": [...]
}
```

---

## Tools

### List Server Tools

```http
GET /api/mcp-servers/:id/tools
```

**Response:**
```json
{
  "tools": [
    {
      "name": "create_issue",
      "description": "Create a GitHub issue",
      "inputSchema": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "body": { "type": "string" }
        },
        "required": ["title"]
      }
    }
  ]
}
```

---

## Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_TYPE | Unknown server type |
| 400 | INVALID_CONFIG | Invalid configuration |
| 404 | SERVER_NOT_FOUND | Server doesn't exist |
| 409 | SERVER_IN_USE | Server is in profiles |

---

## See Also

- [Profiles API](./profiles-api.md) - Adding servers to profiles
- [OAuth API](./oauth-api.md) - OAuth operations
- [Server Types](../../user-guide/mcp-servers/README.md) - User guide
