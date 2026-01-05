# REST API Reference

Complete reference for the Local MCP Gateway REST API.

## Base URL

```
http://localhost:3001/api
```

---

## Endpoints Overview

### Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profiles` | List all profiles |
| POST | `/profiles` | Create profile |
| GET | `/profiles/:id` | Get profile by ID |
| PUT | `/profiles/:id` | Update profile |
| DELETE | `/profiles/:id` | Delete profile |
| GET | `/profiles/:id/servers` | Get profile's servers |
| POST | `/profiles/:id/servers` | Add server to profile |
| DELETE | `/profiles/:id/servers/:serverId` | Remove server from profile |

### MCP Servers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mcp-servers` | List all servers |
| POST | `/mcp-servers` | Create server |
| GET | `/mcp-servers/:id` | Get server by ID |
| PUT | `/mcp-servers/:id` | Update server |
| DELETE | `/mcp-servers/:id` | Delete server |
| GET | `/mcp-servers/:id/tools` | Get server's tools |
| GET | `/mcp-servers/:id/status` | Get connection status |
| POST | `/mcp-servers/:id/api-key` | Set API key |

### MCP Proxy

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mcp/:profileId` | JSON-RPC endpoint |
| GET | `/mcp/:profileId/sse` | SSE endpoint |
| GET | `/mcp/:profileId/info` | Profile info |

### OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oauth/authorize/:serverId` | Start OAuth flow |
| GET | `/oauth/callback` | OAuth callback |
| POST | `/oauth/refresh/:serverId` | Refresh token |

### Debug

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/debug/logs` | Get debug logs |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness check |

---

## Common Response Formats

### Success Response

```json
{
  "data": { ... }
}
```

### Error Response

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### List Response

```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

---

## Profiles API

### List Profiles

```http
GET /api/profiles
```

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "development",
    "description": "Dev tools",
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
]
```

### Create Profile

```http
POST /api/profiles
Content-Type: application/json

{
  "name": "development",
  "description": "Development tools"
}
```

**Response**: Created profile object

### Get Profile

```http
GET /api/profiles/:id
```

**Response**: Profile object

### Update Profile

```http
PUT /api/profiles/:id
Content-Type: application/json

{
  "description": "Updated description"
}
```

**Note**: Name cannot be changed.

### Delete Profile

```http
DELETE /api/profiles/:id
```

**Response**: 204 No Content

### Get Profile Servers

```http
GET /api/profiles/:id/servers
```

**Response**: Array of server objects

### Add Server to Profile

```http
POST /api/profiles/:id/servers
Content-Type: application/json

{
  "mcpServerId": "server-uuid",
  "order": 0
}
```

### Remove Server from Profile

```http
DELETE /api/profiles/:id/servers/:serverId
```

---

## MCP Servers API

### List Servers

```http
GET /api/mcp-servers
```

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "GitHub",
    "type": "remote_http",
    "config": { "url": "..." },
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
]
```

### Create Server

```http
POST /api/mcp-servers
Content-Type: application/json

{
  "name": "GitHub",
  "type": "remote_http",
  "config": {
    "url": "https://api.github.com/mcp"
  },
  "oauthConfig": {
    "authorizationUrl": "...",
    "tokenUrl": "...",
    "clientId": "...",
    "scopes": "repo"
  }
}
```

### Get Server

```http
GET /api/mcp-servers/:id
```

### Update Server

```http
PUT /api/mcp-servers/:id
Content-Type: application/json

{
  "name": "GitHub Updated",
  "config": { ... }
}
```

### Delete Server

```http
DELETE /api/mcp-servers/:id
```

### Get Server Tools

```http
GET /api/mcp-servers/:id/tools
```

**Response**:
```json
{
  "tools": [
    {
      "name": "create_issue",
      "description": "Create a GitHub issue",
      "inputSchema": { ... }
    }
  ]
}
```

### Get Server Status

```http
GET /api/mcp-servers/:id/status
```

**Response**:
```json
{
  "connected": true,
  "lastChecked": "2024-01-01T00:00:00Z",
  "error": null
}
```

---

## MCP Proxy API

### JSON-RPC Endpoint

```http
POST /api/mcp/:profileId
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

### SSE Endpoint

```http
GET /api/mcp/:profileId/sse
Accept: text/event-stream
```

**Response**: Server-Sent Events stream

### Profile Info

```http
GET /api/mcp/:profileId/info
```

**Response**:
```json
{
  "profile": { ... },
  "servers": {
    "total": 3,
    "connected": 3,
    "status": { ... }
  },
  "tools": [...],
  "resources": [...]
}
```

---

## OAuth API

### Start Authorization

```http
GET /api/oauth/authorize/:serverId
```

**Response**: Redirects to OAuth provider

### OAuth Callback

```http
GET /api/oauth/callback?code=...&state=...
```

**Response**: Closes window, stores token

### Refresh Token

```http
POST /api/oauth/refresh/:serverId
```

**Response**:
```json
{
  "success": true,
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

---

## Debug API

### Get Logs

```http
GET /api/debug/logs?profileId=...&mcpServerId=...&status=...&limit=100
```

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| profileId | string | Filter by profile |
| mcpServerId | string | Filter by server |
| requestType | string | Filter by type |
| status | string | Filter by status |
| limit | number | Max results |

**Response**:
```json
[
  {
    "id": "uuid",
    "profileId": "...",
    "mcpServerId": "...",
    "requestType": "tools/call",
    "requestPayload": "{}",
    "responsePayload": "{}",
    "status": "success",
    "durationMs": 234,
    "createdAt": 1234567890
  }
]
```

---

## Health API

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "ok"
}
```

### Readiness Check

```http
GET /health/ready
```

**Response**:
```json
{
  "status": "ready",
  "database": "connected"
}
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Internal error |

---

## Rate Limiting

| Endpoint Group | Limit |
|----------------|-------|
| `/api/*` | Standard |
| `/api/mcp/*` | Higher limit |

Rate limit headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## See Also

- [Profiles API](./profiles-api.md) - Detailed profiles docs
- [MCP Servers API](./mcp-servers-api.md) - Detailed servers docs
- [Proxy API](./proxy-api.md) - MCP proxy docs
